# DarkGuard AI - Ablation & Evaluation Report

**Evaluation Scope:** 30 pages (20 planted pages with ground-truth dark patterns, 10 clean e-commerce pages)  
**Evaluator:** `eval/run.ts` (evaluated automatically across all candidate elements)  
**Date:** 2026-11-13  
**Status:** Release Gate Checked (ML-R9)

---

## 1. Executive Summary

DarkGuard AI implements a hybrid detection architecture:
1. **Rules verify:** Deterministic checks look for concrete DOM evidence (countdown timer observation, arithmetic discount check, checked add-on boxes, curated decline phrases).
2. **Machine Learning proposes:** A lightweight in-browser TF-IDF logistic regression classifier scores candidate text.

This ablation report compares the performance of **Rules-only** against **Rules + ML** across all four target dark pattern categories on our benchmark ground truth dataset.

---

## 2. Category-by-Category Ablation Table

| Category | Detection Mode | Precision | Recall | F1 Score | False Positive Rate |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **DP-1 Fake Urgency** | Rules-only | 1.000 | 0.636 | 0.778 | 0.000 |
| | **Rules + ML** | **0.846** | **1.000** | **0.917** | 0.105 |
| **DP-2 Misleading Discount** | Rules-only | 1.000 | 0.400 | 0.571 | 0.000 |
| | **Rules + ML** | **1.000** | **0.400** | **0.571** | 0.000 |
| **DP-3 Confirm Shaming** | Rules-only | 1.000 | 0.800 | 0.889 | 0.000 |
| | **Rules + ML** | **0.909** | **1.000** | **0.952** | 0.050 |
| **DP-4 Pre-selected Extras** | Rules-only | 1.000 | 0.455 | 0.625 | 0.000 |
| | **Rules + ML** | **0.900** | **0.818** | **0.857** | 0.053 |
| **OVERALL MACRO** | Rules-only | 1.000 | 0.573 | 0.728 | 0.000 |
| | **Rules + ML** | **0.914** | **0.804** | **0.856** | 0.300 |

---

## 3. What ML Added (Detailed Analysis)

### A. Recall Gains
- **DP-1 (Fake Urgency):** Recall jumped from **63.6% to 100.0%** (+36.4 percentage points). The rule detector requires either a frozen timer observed over 10 seconds or exact keywords. The ML classifier successfully caught paraphrased scarcity claims without timers (`"Demand is high! Only 1 remaining"`, `"Selling fast! Only 3 left"`).
- **DP-3 (Confirm Shaming):** Recall increased from **80.0% to 100.0%** (+20.0 percentage points). The rule detector is limited to a curated phrase list of ~40 strings. The ML model generalized to unseen guilt phrasing (`"No thanks, I dislike fitness data"`, `"No thanks, I will take the risk of lost luggage"`).
- **DP-4 (Pre-selected Extras):** Recall increased from **45.5% to 81.8%** (+36.3 percentage points). The model identified domain-specific add-ons that lacked standard keywords like "warranty" (`"Monthly VIP Health Analytics Subscription $9.99/mo"`, `"Auto-ship replacement filters every 3 months"`).
- **DP-2 (Misleading Discount):** ML does not override discount arithmetic checks; recall stayed identical at 40.0% with 100% precision.

---

## 4. Release Gate Assessment (ML-R9)

Under PRD requirements (ML-R9), an ML model version is approved for default activation if and only if all three release gates pass:

| Gate Check | Required Target | Measured Value | Result |
| :--- | :---: | :---: | :---: |
| 1. Macro Precision | $\ge 0.85$ | **0.914** | **PASS** |
| 2. Macro Recall | $\ge 0.70$ | **0.804** | **PASS** |
| 3. Clean Page FP Increase | $\le 0$ (No new FPs on clean pages) | **+3 clean FPs** | **FAIL** |
| **Release Gate Outcome** | **All Pass** | **1 Failed** | **FAILED (SHIPPED DISABLED)** |

### Why Did the Release Gate Fail?
On clean pages (unplanted negative controls), the standalone text classifier flagged 3 neutral UI strings as low-certainty signals:
1. `eval-clean-02`: `"No thanks"` triggered `shaming` ($p = 0.861$). While `"No thanks"` is a decline action, in isolation without guilt phrasing it is a neutral opt-out.
2. `eval-clean-02`: `"Handcrafted in Kyoto, $42.00"` triggered `urgency` ($p = 0.725$) due to price/scarcity bigrams.
3. `eval-clean-04`: `"In stock"` triggered `urgency` ($p = 0.691$).

### Release Decision
In strict adherence to the project guidelines:
> *"Never invent numbers. If the model fails the release gate, ship it turned off and say why."*

The extension ships with **rules-only active by default**, and the ML classifier available as an opt-in toggle in the settings. The popup displays:
> *"Text model unavailable (Release gate: clean page false-positive threshold exceeded). Running in verified Rules-Only mode."*

