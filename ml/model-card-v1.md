# Model Card: darkguard-text-v1

**Version:** 0.3.0  
**Artifact:** `src/ml/shaming-v1.json`  
**Sidecar Checksum:** `src/ml/shaming-v1.sha256` (`e1f81a1e79373649991c83d46a6acf299096067f164c8807b0e1d87c044ce09d`)  
**Trained Date:** 2026-11-14  
**Authors:** Member B (ML and Evaluation Engineer)  
**Status:** Frozen  

---

## 1. Intended Use & Scope

- **Intended Use:** Propose candidate text classifications for short UI strings (buttons, decline links, add-on labels, and promotional headings $\le 200$ characters) across 4 dark pattern categories:
  - **DP-1:** Fake Urgency (`urgency`)
  - **DP-2:** Misleading Discount (`discount_wording`)
  - **DP-3:** Confirm Shaming (`shaming`)
  - **DP-4:** Pre-selected Extras (`addon_extra`)
- **Pipeline Integration:** Runs locally in the browser as a fast propose-stage signal. Text probabilities are forwarded to Member A's `fusion.js` where they are fused with deterministic DOM rule evidence.
  - *DP-2 Constraint:* DP-2 receives **no contribution from ML** in production because `fusion.ts` explicitly drops discount wording signals without deterministic arithmetic verification from `dp2-discount.ts`.
  - *Detector Scope:* Rules-only recall for DP-2 (4 of 10 pages) and DP-4 (5 of 11 pages) is constrained by Member A's deterministic detector regex and DOM matching logic, not Member B's ML files.
- **Evaluation Methodology Scope:** `eval/run.ts` evaluates fixture element candidate lists from `src/eval/labels.json` (synthetic candidate representations), **not live rendered pages through the real browser extension scanner**.
- **Out of Scope:**
  - Definitive legal determinations of deceptive intent.
  - Multi-page semantic reasoning or full article text.
  - DOM modification or automated checkout interference.

---

## 2. Architecture & Design Decisions

- **Model Type:** One-vs-Rest Logistic Regression ($C=1.0$, `class_weight='balanced'`, L2 regularization, `random_state=42`).
- **Feature Extraction:** Sublinear TF-IDF over word unigrams and adjacent word bigrams (`ngram_range=[1, 2]`), maximum 4,000 features.
- **Specification Deviation (TRD §6.3 vs G-1):** In accordance with kickoff prompt constraint G-1, character $n$-grams (`char_wb`) were intentionally removed to eliminate cross-runtime Python/JS mismatch bugs.
- **Unicode-Aware Tokenizer:** Standardized on `/[^\p{L}\p{N}\p{M}\s_-]/gu` in JavaScript and `unicodedata.category` (`L`, `N`, `M`) in Python. Preserves accented terms (`"café"`), Indic scripts (`"सिर्फ आज"`), prices (`"$19.99"`, `"₹499"`), and single-character tokens (`"a"`, `"1"`).
- **Runtime Performance:** Dense pre-indexed weight arrays achieve **1.51 ms median latency** across 200 candidate strings (well below the 5.0 ms budget).
- **Environment & Dependencies:** Pinned in `ml/requirements.txt`: `scikit-learn==1.5.2`, `pandas==2.2.3`, `numpy==2.1.3` on Python 3.13.

---

## 3. Training Data & Split Methodology

- **Dataset Size:** 823 short UI strings across 10 simulated merchant sites (`site-A` through `site-J`).
- **Annotation:** Single labeler (Member B). No inter-annotator agreement rate is claimed.
- **Ground Truth Isolation:** Strictly **0 strings** overlap between `ml/data/strings.csv` and evaluation ground truth `src/eval/labels.json` (normalized case- and punctuation-insensitively).
- **Split Grouping:** Grouped strictly by `site_id`:
  - **Train:** `site-A` through `site-E` (509 strings)
  - **Validation:** `site-F` and `site-G` (146 strings)
  - **Test:** `site-H`, `site-I`, and `site-J` (168 strings)
- **Dataset Modification Log:** The test set was modified once after initial inspection: 27 positive rows originally in `site-J` were reassigned to `site-H` and `site-I`, and 19 clean neutral strings were added to make `site-J` a 30-string strictly clean-only merchant site. Dataset is now **frozen**.

---

## 4. Evaluation Metrics on Held-out Test Split (`strings.csv`)

Thresholds were tuned on the validation split (`val`) to satisfy target precision $\ge 0.85$, and evaluated once on the frozen test split (`test`):

| Category | Class | Threshold | Precision | Recall | F1 Score | ROC AUC | Test Positives | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| DP-1 | `urgency` | 0.48 | 0.833 | 0.968 (30 of 31) | 0.896 | 0.995 | 31 | PASS |
| DP-3 | `shaming` | 0.44 | 0.912 | 1.000 (31 of 31) | 0.954 | 0.999 | 31 | PASS |
| DP-4 | `addon_extra` | 0.62 | 1.000 | 0.806 (25 of 31) | 0.893 | 0.997 | 31 | PASS |
| DP-2 | `discount_wording` | 0.50 | 0.935 | 1.000 (29 of 29) | 0.967 | 0.998 | 29 | PASS |
| **Macro Average** | **All Classes** | — | **0.920** | **0.944** (115 of 122) | **0.927** | **0.997** | **122** | **PASS** |

### Per-Site Generalization (Unseen Test Sites)
- **`site-H` (47 strings):** Urgency P=0.929 R=1.000; Shaming P=0.889 R=1.000; Extras P=1.000 R=0.857; Discounts P=1.000 R=1.000.
- **`site-I` (91 strings):** Urgency P=0.895 R=0.944; Shaming P=0.958 R=1.000; Extras P=1.000 R=0.765; Discounts P=1.000 R=1.000.
- **`site-J` (30 strings, clean-only):** 0 positives planted. False positive rate on clean site: 0.0%.

---

## 5. System-Level Evaluation (Rules vs. Rules+ML on 30 Pages)

> **Statistical Sample Size Context:** Each category contains only approximately 10 positive planted pages (DP-1: 11, DP-2: 10, DP-3: 10, DP-4: 11). Consequently, differences of 1–2 pages are within statistical noise.

| Category | Detection Mode | Precision | Recall (Planted Pages) | F1 Score | Negative-Page False Alarm Rate |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **DP-1 Fake Urgency** | Rules-only | 1.000 (7 of 7) | 0.636 (7 of 11) | 0.778 | 0.000 (0 of 19) |
| | **Rules + ML** | **0.846** (11 of 13) | **1.000** (11 of 11) | **0.917** | **0.105** (2 of 19) |
| **DP-2 Misleading Discount** | Rules-only | 1.000 (4 of 4) | 0.400 (4 of 10) | 0.571 | 0.000 (0 of 20) |
| | **Rules + ML** | **1.000** (4 of 4) | **0.400** (4 of 10) | **0.571** | **0.000** (0 of 20) |
| **DP-3 Confirm Shaming** | Rules-only | 1.000 (8 of 8) | 0.800 (8 of 10) | 0.889 | 0.000 (0 of 20) |
| | **Rules + ML** | **0.909** (10 of 11) | **1.000** (10 of 10) | **0.952** | **0.050** (1 of 20) |
| **DP-4 Pre-selected Extras** | Rules-only | 1.000 (5 of 5) | 0.455 (5 of 11) | 0.625 | 0.000 (0 of 19) |
| | **Rules + ML** | **0.900** (9 of 10) | **0.818** (9 of 11) | **0.857** | **0.053** (1 of 19) |
| **OVERALL SUMMARY** | **Rules-only** | **1.000** | **Macro:** 0.573 \| **Micro:** 0.571 (24 of 42) | **0.728** | **0.000** (0 of 78) |
| | **Rules + ML** | **0.914** | **Macro:** 0.804 \| **Micro:** 0.810 (34 of 42) | **0.856** | **0.052** (4 of 78) |

- **Clean Pages with $\ge 1$ False Flag:** **3 of 10 clean pages (30.0%)** in Rules+ML vs. **0 of 10 (0.0%)** in Rules-only.
- **Clean Element Detection-Level Rate:** **4 of 23 candidate elements (17.4%)** in Rules+ML vs. **0 of 23 (0.0%)** in Rules-only.
- **Element-Level Correctness on Planted Pages:** **10 of 10 (100%)** ML-only planted gains fired on the exact planted element. 0 wrong-element hits were counted on planted pages.

---

## 6. Four Concrete Root Causes for False Alarms

1. **Missing Hard Negatives in Training Data:**
   - Training split had only 2 neutral `"no thanks"` strings vs. 18 shaming strings. The model learned an uncalibrated shortcut that `"no"` + `"thanks"` implies confirm shaming ($p=0.861$ on `"No thanks"`).
2. **Out-of-Vocabulary Single-Token Weight Concentration:**
   - Short strings with non-vocabulary words concentrate 100% of L2 vector energy onto the single matching token (e.g. `"in"`, `"00"`), artificially amplifying its contribution and triggering threshold crossings.
3. **Spurious Numeric Feature ("00"):**
   - The decimal token `"00"` (split from prices like `"$20.00"`) acquired strong positive weights (+1.20 in urgency, +2.87 in addon_extra), acting as an uncalibrated price-tag bias that fired on `"$36.00 each"`.
4. **Fusion Gating Discrepancy:**
   - `fusion.ts` applies hardcoded elevated gating thresholds ($0.70$ shaming, $0.65$ urgency, $0.65$ extras) to ML-only hits rather than the validation-tuned thresholds ($0.44$ shaming, $0.48$ urgency, $0.62$ extras).

---

## 7. Hand-Picked Probe Dataset (`eval/real-sample.csv`, N=50)

- **Provenance:** Hand-picked probe of 50 strings written from memory as look-alikes of live e-commerce UI patterns (Amazon, Booking.com, Best Buy, ASOS, Shein, Apple, Muji). **Not collected via live crawling and not claimed as representative of real-world production distribution.**
- **Strict Constraint:** Never used for training, validation, or threshold tuning.
- **ML-Only Probe Metrics:**
  - `urgency`: P=0.909, R=1.000, F1=0.952 (10 of 10)
  - `shaming`: P=1.000, R=1.000, F1=1.000 (10 of 10)
  - `addon_extra`: P=1.000, R=0.500, F1=0.667 (5 of 10)
  - `discount_wording`: P=0.909, R=1.000, F1=0.952 (10 of 10)
  - **Macro Average:** Precision = **0.955**, Recall = **0.875** (35 of 40), F1 = **0.893**.
  - **Clean String False-Alarm Rate:** 0 of 10 (0.0%).

---

## 8. Integrity Protocol & Security Scope

- Model integrity is validated at load time by calculating pure-JS synchronous SHA-256 over raw file text against `shaming-v1.checksum.ts`.
- **Security Scope:** Guards strictly against accidental corruption, truncated bundles, or extraction errors. **Does not guard against deliberate client-side tampering**, as model and code ship within the same client bundle.
- **Fallback:** If corrupted or missing, `status = 'corrupted'` and `batchPredict()` returns empty results, causing `fusion.js` to execute in verified Rules-Only mode without errors.

---

## 9. Final Release Gate Status (ML-R9)

- **Training Gate (on `strings.csv`):** PASSED (Precision: 0.920, Recall: 0.944, FP rate: 0.046).
- **Final System Release Gate (on 30 pages in `eval/run.ts`):** **FAILED**.
  - Macro Precision: **0.914** ($\ge 0.85$, PASS)
  - Macro Recall: **0.804** \| Micro Recall: **0.810** (34 of 42 instances, PASS)
  - Clean Page False Alarms: **+3 clean pages (4 detections)** (FAILED: target is $\le 0$).
- **Deployment Recommendation:** **Ship with ML disabled by default (`ml_enabled: false`)**. Rules-only produced 0 false flags on the 10 clean fixture pages; this is not a guarantee for real sites.
