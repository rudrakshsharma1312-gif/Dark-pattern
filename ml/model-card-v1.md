# Model Card: darkguard-text-v1

**Version:** 0.3.0  
**Artifact:** `src/ml/shaming-v1.json`  
**Sidecar Checksum:** `src/ml/shaming-v1.sha256` (`af02136055fa3877ed1a43283c601046bb185c60eb4feb78569d98c485c75dcf`)  
**Trained Date:** 2026-11-13  
**Authors:** Member B (ML and Evaluation Engineer)  

---

## 1. Intended Use & Scope

- **Intended Use:** Flag short UI strings (buttons, decline links, add-on labels, and promotional headings $\le 200$ characters) that may exhibit deceptive or high-pressure dark-pattern phrasing. Operates as a fast, local propose-stage text classifier whose probabilities are fused with deterministic rule evidence in `fusion.js`.
- **Out of Scope:**
  - Legal findings or definitive statutory determinations of intent.
  - Multi-page semantic reasoning, article text, or full-page HTML scraping.
  - Non-English interfaces without localized tokenization.
  - Autonomous DOM modification or price changes.

---

## 2. Architecture & Design Decisions

- **Classifier:** One-vs-Rest Logistic Regression ($C=1.0$, `class_weight='balanced'`, L2 regularization, `random_state=42`).
- **Feature Extraction:** Sublinear TF-IDF over word unigrams and word bigrams (`ngram_range=[1, 2]`), maximum 4,000 features.
- **Specification Deviation (TRD §6.3 vs G-1):** In accordance with the kickoff prompt constraint, character $n$-grams (`char_wb`) were intentionally removed to prevent cross-runtime Python/JS mismatch bugs. The JS tokenizer (`features.ts`) and Python tokenizer (`train.py`) share an identical, verified tokenization rule (`extract_unigrams_and_bigrams`).
- **Runtime Performance:** Executes via sparse dot product with pre-indexed dense weight lookups in JavaScript, running 200 candidate strings in **3.25 ms** (well under the 5.0 ms budget).

---

## 3. Training Data & Split Methodology

- **Source:** 804 short UI strings curated across 10 distinct e-commerce merchant sites (`site-A` through `site-J`).
- **Labeling Protocol:** Labeled by a single annotator (Member B) across two review passes. No inter-annotator agreement rate is claimed.
- **Overlap with Evaluation Ground Truth:** Strictly **0 strings** overlap between `ml/data/strings.csv` and `src/eval/labels.json` (normalized case- and punctuation-insensitively).
- **Split Method:** Strictly grouped by `site_id` (site-level isolation). No merchant site appears in more than one split:
  - **Train:** `site-A` through `site-E` (509 strings)
  - **Validation:** `site-F` and `site-G` (146 strings)
  - **Test:** `site-H`, `site-I`, and `site-J` (149 strings)

---

## 4. Evaluation Metrics (Held-out Test Split)

Thresholds were tuned on the validation split (`val`) to satisfy target precision $\ge 0.85$, and evaluated once on the unseen test split (`test`):

| Category | Class | Threshold | Precision | Recall | F1 Score | ROC AUC | Test Positives | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| DP-1 | `urgency` | 0.48 | 0.857 | 0.968 | 0.909 | 0.995 | 31 | PASS |
| DP-3 | `shaming` | 0.44 | 0.912 | 1.000 | 0.954 | 0.999 | 31 | PASS |
| DP-4 | `addon_extra` | 0.62 | 1.000 | 0.806 | 0.893 | 0.997 | 31 | PASS |
| DP-2 | `discount_wording` | 0.50 | 0.966 | 0.966 | 0.966 | 0.999 | 29 | PASS |
| **Macro Average** | **All Classes** | — | **0.934** | **0.935** | **0.930** | **0.997** | **122** | **PASS** |

### Per-Site Generalization (Unseen Test Sites)

| Site | String Count | Class | Precision | Recall | F1 Score |
| :--- | :---: | :--- | :---: | :---: | :---: |
| `site-H` | 33 | `urgency` | 0.875 | 1.000 | 0.933 |
| | | `shaming` | 0.875 | 1.000 | 0.933 |
| | | `addon_extra` | 1.000 | 0.750 | 0.857 |
| | | `discount_wording` | 1.000 | 1.000 | 1.000 |
| `site-I` | 78 | `urgency` | 0.941 | 0.941 | 0.941 |
| | | `shaming` | 0.944 | 1.000 | 0.971 |
| | | `addon_extra` | 1.000 | 0.812 | 0.897 |
| | | `discount_wording` | 1.000 | 0.938 | 0.968 |
| `site-J` | 38 | `urgency` | 0.700 | 1.000 | 0.824 |
| | | `shaming` | 0.875 | 1.000 | 0.933 |
| | | `addon_extra` | 1.000 | 0.857 | 0.923 |
| | | `discount_wording` | 0.875 | 1.000 | 0.933 |

---

## 5. Release Gate Check (ML-R9)

| Gate Criterion | Target | Achieved | Result |
| :--- | :---: | :---: | :---: |
| Precision on held-out clean / test set | $\ge 0.85$ | **0.934** | **PASS** |
| Recall on held-out positive set | $\ge 0.70$ | **0.935** | **PASS** |
| False Positive Rate on clean strings | $\le 0.10$ | **0.058** | **PASS** |
| **Overall ML-R9 Release Gate** | All Pass | All Met | **PASSED** |

---

## 6. Known Weaknesses & Failure Cases

1. **Short Ambiguous Phrases:** Single words such as `"only"` or `"save"` without contextual terms can exhibit reduced confidence.
2. **Sarcasm and Humor:** Subversive or colloquial consumer phrasing (`"Because who needs a discount anyway?"`) can be misclassified as neutral.
3. **International Formats:** Copy containing non-Latin currency signs or untranslated idioms may receive baseline prior probability.
4. **Clean Site J Urgency:** `site-J` exhibited a lower precision ($0.70$) on urgency due to borderline promotional claims (`"doors closing soon"`).

---

## 7. Integrity & Fallback Protocol

- Integrity is verified via SHA-256 byte comparison against `shaming-v1.sha256`.
- If the model file is missing or corrupted, `classifier.ts` sets `status = 'corrupted'` and `batchPredict()` returns empty results, causing `fusion.js` to execute a pure rules-only scan without throwing runtime exceptions.
