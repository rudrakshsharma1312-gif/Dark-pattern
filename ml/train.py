#!/usr/bin/env python3
"""
DarkGuard AI - Training Pipeline (ml/train.py)

Trains One-vs-Rest Logistic Regression on sublinear TF-IDF features.
- Vectorizer is fitted strictly on the train split.
- Thresholds are selected strictly on the val split (maximizing F1 subject to precision >= 0.85;
  or highest-precision threshold if precision target cannot be met, flagging the class as weak).
- Final evaluation is reported on the test split once.
- Parity rule: extract_unigrams_and_bigrams matches the JS tokenizer in content/features.js.
"""

import csv
import hashlib
import json
import math
import os
import re
from typing import Dict, List, Tuple
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import precision_recall_fscore_support, roc_auc_score

# -----------------------------------------------------------------------------
# Canonical Tokenizer (paritied with JS extractNgrams in features.ts)
# -----------------------------------------------------------------------------
def extract_unigrams_and_bigrams(text: str) -> List[str]:
    """
    Canonical tokenizer shared between Python training and JS inference.
    Rule:
    1. Lowercase and trim.
    2. Replace non-alphanumeric, non-whitespace, non-hyphen with space ([^\\w\\s-]).
       This preserves hyphenated words ("2-year", "pre-checked", "add-on"),
       handles prices ("$19.99" -> "19", "99"), and preserves single characters ("a").
    3. Split on whitespace into word tokens.
    4. Return word unigrams + adjacent word bigrams.
    """
    text = text.lower().strip()
    if not text:
        return []
    clean = re.sub(r'[^\w\s-]', ' ', text)
    words = [w for w in clean.split() if len(w) > 0]
    ngrams = list(words)
    for i in range(len(words) - 1):
        ngrams.append(f"{words[i]} {words[i+1]}")
    return ngrams


def compute_file_sha256(filepath: str) -> str:
    hasher = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def main():
    data_path = os.path.join(os.path.dirname(__file__), 'data', 'strings.csv')
    csv_sha256 = compute_file_sha256(data_path)
    print(f"Loaded dataset: {data_path}")
    print(f"Dataset SHA-256: {csv_sha256}")

    df = pd.read_csv(data_path)
    print(f"Total rows: {len(df)}")
    print(f"Splits: {dict(df['split'].value_counts())}")

    classes = ['urgency', 'shaming', 'addon_extra', 'discount_wording']

    # Create binary target columns
    for c in classes:
        df[c] = df['labels'].apply(lambda x: 1 if c in [lbl.strip() for lbl in str(x).split('|')] else 0)

    train_df = df[df['split'] == 'train'].copy().reset_index(drop=True)
    val_df = df[df['split'] == 'val'].copy().reset_index(drop=True)
    test_df = df[df['split'] == 'test'].copy().reset_index(drop=True)

    print(f"Train rows: {len(train_df)} | Val rows: {len(val_df)} | Test rows: {len(test_df)}")

    # 1. Fit Vectorizer on TRAIN only
    vectorizer = TfidfVectorizer(
        analyzer=extract_unigrams_and_bigrams,
        sublinear_tf=True,
        norm='l2',
        smooth_idf=True,
        max_features=4000
    )
    X_train = vectorizer.fit_transform(train_df['text'])
    X_val = vectorizer.transform(val_df['text'])
    X_test = vectorizer.transform(test_df['text'])

    vocab_size = len(vectorizer.vocabulary_)
    print(f"Vocabulary size (word unigrams + bigrams): {vocab_size}")

    models: Dict[str, LogisticRegression] = {}
    thresholds: Dict[str, float] = {}
    weak_classes: Dict[str, bool] = {}

    # 2. Train One-vs-Rest Logistic Regression per class, tune threshold on VAL only
    print("\n--- Tuning thresholds on validation set (target precision >= 0.85) ---")
    for c in classes:
        clf = LogisticRegression(
            class_weight='balanced',
            C=1.0,
            max_iter=1000,
            random_state=42
        )
        clf.fit(X_train, train_df[c])
        models[c] = clf

        val_probs = clf.predict_proba(X_val)[:, 1]
        y_val = val_df[c].values

        # Sweep thresholds from 0.30 to 0.90
        best_thresh = 0.50
        best_f1 = -1.0
        best_prec = 0.0
        highest_prec = -1.0
        highest_prec_thresh = 0.50

        for thresh in np.arange(0.30, 0.91, 0.02):
            preds = (val_probs >= thresh).astype(int)
            p, r, f1, _ = precision_recall_fscore_support(y_val, preds, average='binary', zero_division=0)
            if p > highest_prec:
                highest_prec = p
                highest_prec_thresh = thresh

            if p >= 0.85:
                if f1 > best_f1:
                    best_f1 = f1
                    best_thresh = thresh
                    best_prec = p

        # Check if precision >= 0.85 was reachable
        if best_f1 >= 0:
            thresholds[c] = round(float(best_thresh), 2)
            weak_classes[c] = False
            print(f"  {c:<18}: threshold = {thresholds[c]:.2f} (val prec = {best_prec:.3f}, val F1 = {best_f1:.3f})")
        else:
            thresholds[c] = round(float(highest_prec_thresh), 2)
            weak_classes[c] = True
            print(f"  {c:<18}: [WEAK] threshold = {thresholds[c]:.2f} (highest reachable val prec = {highest_prec:.3f})")

    # 3. Report final metrics on TEST only once
    print("\n=== FINAL TEST EVALUATION (Held-out Test Split) ===")
    test_metrics = {}
    for c in classes:
        clf = models[c]
        thresh = thresholds[c]
        test_probs = clf.predict_proba(X_test)[:, 1]
        y_test = test_df[c].values
        preds = (test_probs >= thresh).astype(int)

        prec, rec, f1, _ = precision_recall_fscore_support(y_test, preds, average='binary', zero_division=0)
        try:
            auc = roc_auc_score(y_test, test_probs)
        except Exception:
            auc = 0.0

        test_metrics[c] = {
            'precision': float(prec),
            'recall': float(rec),
            'f1': float(f1),
            'auc': float(auc),
            'threshold': thresh,
            'weak': weak_classes[c],
            'test_positives': int(y_test.sum())
        }

    header = f"{'Class':<18} {'Threshold':>10} {'Precision':>10} {'Recall':>10} {'F1':>10} {'AUC':>10} {'Positives':>10} {'Status':>8}"
    print(header)
    print("-" * len(header))
    for c in classes:
        m = test_metrics[c]
        status = "WEAK" if m['weak'] else "PASS"
        print(f"{c:<18} {m['threshold']:>10.2f} {m['precision']:>10.3f} {m['recall']:>10.3f} {m['f1']:>10.3f} {m['auc']:>10.3f} {m['test_positives']:>10d} {status:>8}")

    # Calculate macro-averages on test
    avg_prec = np.mean([test_metrics[c]['precision'] for c in classes])
    avg_rec = np.mean([test_metrics[c]['recall'] for c in classes])
    avg_f1 = np.mean([test_metrics[c]['f1'] for c in classes])
    avg_auc = np.mean([test_metrics[c]['auc'] for c in classes])
    print("-" * len(header))
    print(f"{'Macro Average':<18} {'-':>10} {avg_prec:>10.3f} {avg_rec:>10.3f} {avg_f1:>10.3f} {avg_auc:>10.3f}")

    # 4. Per-site test metrics
    print("\n=== PER-SITE TEST METRICS (Generalization across unseen sites) ===")
    test_sites = sorted(test_df['site_id'].unique())
    for site in test_sites:
        site_sub = test_df[test_df['site_id'] == site]
        X_site = vectorizer.transform(site_sub['text'])
        print(f"\nSite: {site} ({len(site_sub)} strings)")
        for c in classes:
            clf = models[c]
            thresh = thresholds[c]
            probs = clf.predict_proba(X_site)[:, 1]
            y_site = site_sub[c].values
            preds = (probs >= thresh).astype(int)
            p, r, f, _ = precision_recall_fscore_support(y_site, preds, average='binary', zero_division=0)
            print(f"  {c:<18}: P={p:.3f} | R={r:.3f} | F1={f:.3f} (n_pos={y_site.sum()})")

    # 5. Clean test strings false-positive rate
    # Clean strings = neutral == 1 (all 4 classes == 0)
    clean_test = test_df[(test_df['urgency'] == 0) & (test_df['shaming'] == 0) & 
                         (test_df['addon_extra'] == 0) & (test_df['discount_wording'] == 0)]
    X_clean = vectorizer.transform(clean_test['text'])
    clean_fps = 0
    for c in classes:
        probs = models[c].predict_proba(X_clean)[:, 1]
        preds = (probs >= thresholds[c]).astype(int)
        clean_fps += int(preds.sum())

    total_clean_predictions = len(clean_test) * len(classes)
    clean_fp_rate = clean_fps / total_clean_predictions if total_clean_predictions > 0 else 0.0

    print("\n=== RELEASE GATE CHECK (ML-R9) ===")
    p_check = avg_prec >= 0.85
    r_check = avg_rec >= 0.70
    fp_check = clean_fp_rate <= 0.10

    print(f"1. Precision on held-out test >= 0.85 : {'PASS' if p_check else 'FAIL'} (achieved {avg_prec:.3f})")
    print(f"2. Recall on held-out test    >= 0.70 : {'PASS' if r_check else 'FAIL'} (achieved {avg_rec:.3f})")
    print(f"3. False Positive Rate on clean <= 0.10: {'PASS' if fp_check else 'FAIL'} (achieved {clean_fp_rate:.3f})")

    gate_passed = p_check and r_check and fp_check
    print(f"Overall Release Gate Result           : {'PASSED' if gate_passed else 'FAILED'}")

    # 6. Save model export dict for export.py
    # Vocabulary & IDF
    # Note: sort vocab by index so idf matches
    vocab_sorted = sorted(vectorizer.vocabulary_.items(), key=lambda kv: kv[1])
    vocabulary = {k: int(v) for k, v in vocab_sorted}
    idf_list = [round(float(v), 5) for v in vectorizer.idf_]

    weights = {}
    intercepts = {}
    for c in classes:
        clf = models[c]
        coef = clf.coef_[0]
        # Store non-zero or significant weights (> 1e-4)
        non_zero_idx = np.where(np.abs(coef) > 1e-4)[0]
        weights[c] = {
            "indices": [int(idx) for idx in non_zero_idx],
            "values": [round(float(coef[idx]), 5) for idx in non_zero_idx]
        }
        intercepts[c] = round(float(clf.intercept_[0]), 5)

    export_payload = {
        "model_id": "darkguard-text-v1",
        "trained_at": "2026-11-13T12:00:00Z",
        "training_data_sha256": csv_sha256,
        "features": {
            "type": "tfidf",
            "ngram_range": [[1, 2]],
            "analyzer": ["word"],
            "lowercase": True,
            "sublinear_tf": True,
            "vocab_size": vocab_size
        },
        "vocabulary": vocabulary,
        "idf": idf_list,
        "classes": classes,
        "weights": weights,
        "intercepts": intercepts,
        "thresholds": thresholds,
        "metrics": test_metrics,
        "release_gate": {
            "passed": gate_passed,
            "macro_precision": round(float(avg_prec), 3),
            "macro_recall": round(float(avg_rec), 3),
            "clean_fp_rate": round(float(clean_fp_rate), 3)
        }
    }

    # Save to intermediate json for export.py
    os.makedirs(os.path.join(os.path.dirname(__file__), 'artifacts'), exist_ok=True)
    temp_path = os.path.join(os.path.dirname(__file__), 'artifacts', 'trained_model.json')
    with open(temp_path, 'w') as f:
        json.dump(export_payload, f, indent=2)
    print(f"\nSaved intermediate model artifact to {temp_path}")


if __name__ == '__main__':
    main()

