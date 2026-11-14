# Evaluation Artifact Reconciliation Notes

> **Status:** Unconfirmed, needs Member B to reconcile.

---

## 1. Discrepancy Overview

There is a numerical difference in reported macro recall between the two primary evaluation artifacts:
- In [`ml/model-card-v1.md`](../ml/model-card-v1.md) (§5, §9) and [`eval/reports/ablation.md`](../eval/reports/ablation.md) (§2, §7), Macro Recall on pages for Rules + ML is reported as **0.804** (80.4%), with Micro Recall at **0.810** (34 of 42 planted instances caught).
- In [`eval/reports/eval-results.json`](../eval/reports/eval-results.json), `overall.rulesPlusML.recall` is reported as **0.705** (70.5%).

---

## 2. Mathematical Breakdown

In `eval/reports/eval-results.json`, overall recall is computed as the unweighted mean across the four category recalls:
- **DP-1 Fake Urgency**: 1.000
- **DP-2 Misleading Discount**: 0.000 (0 of 10)
- **DP-3 Confirm Shaming**: 1.000
- **DP-4 Pre-selected Extras**: 0.818
- **Mean**: `(1.000 + 0.000 + 1.000 + 0.818) / 4 = 0.7045` &rarr; rounded to **0.705**.

In contrast, `ablation.md` (Table §2) records DP-2 recall as **0.400** (4 of 10 pages caught) for both Rules-only and Rules + ML:
- **Mean**: `(1.000 + 0.400 + 1.000 + 0.818) / 4 = 0.8045` &rarr; rounded to **0.804**.

---

## 3. Working Hypothesis (Unconfirmed)

A possible cause for this difference is that in `eval/run.ts`, the synthetic candidate representation (`src/eval/labels.json`) evaluated by the test runner lacked the rendered DOM price calculation context required by the deterministic `DP2DiscountDetector`, resulting in 0 true positives for DP-2 in that specific automated JSON run. In `ablation.md`, Member B may have credited the 4 planted discount pages caught when evaluated with full reference pricing.

**Action Item:** Member B should review `eval/run.ts` mock candidate generation for DP-2 and update `eval/reports/eval-results.json` or `eval/reports/ablation.md` to ensure identical values across all evaluation artifacts.

---

## 4. Release Gate Impact

This discrepancy does **not** change the release-gate outcome:
1. **Precision Check ($\ge 0.85$):** Both reports record **0.914** (**PASS**).
2. **Recall Check ($\ge 0.70$):** Both 0.804 and 0.705 satisfy the $\ge 0.70$ requirement (**PASS**).
3. **Clean-Page False Alarm Check ($\le 0$ increase):** Both reports record that Rules + ML flagged **3 of 10 clean pages** (4 false detections) compared to **0 of 10 clean pages** for Rules-only (**FAILED**).
4. **Final Deployment Decision:** The release gate **FAILED** on clean-page false alarms; the model correctly ships disabled by default (`ml_enabled: false`).
