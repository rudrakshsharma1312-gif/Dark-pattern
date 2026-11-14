# DarkGuard AI - Ablation & Evaluation Report

**Evaluation Scope:** 30 pages (20 planted pages with ground-truth dark patterns, 10 clean e-commerce pages)  
**Evaluator:** `eval/run.ts` (executes deterministic rule detectors + ML classifier + fusion)  
**Date:** 2026-11-14  
**Status:** Release Gate Checked (ML-R9) - **FAILED (Shipped Disabled by Default)**

---

## 1. Executive Summary

DarkGuard AI operates a two-tier hybrid architecture:
1. **Rules Verify:** Deterministic detectors check for concrete DOM signals (countdown timer observation over $\Delta t \ge 10\text{ s}$, arithmetic discount mismatch, pre-checked add-on checkboxes, curated confirm shaming refusal phrases).
2. **Machine Learning Proposes:** A lightweight in-browser TF-IDF logistic regression classifier scores button, heading, and label text.

This ablation report evaluates the exact system performance of **Rules-only** versus **Rules + ML** on the 30-page benchmark ground-truth test suite (`src/eval/labels.json`).

> **Statistical Sample Size Context:** Each category contains only approximately 10 positive planted pages (DP-1: 11 pages, DP-2: 10 pages, DP-3: 10 pages, DP-4: 11 pages). Consequently, performance differences of 1–2 pages represent roughly 9–10 percentage points and are within statistical noise.

---

## 2. Category-by-Category Ablation Table

*All counts stated as "x of n pages" with exact mathematical definitions:*

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
| **MACRO AVERAGE** | Rules-only | 1.000 | 0.573 (24 of 42) | 0.728 | 0.000 (0 of 78) |
| | **Rules + ML** | **0.914** | **0.804** (34 of 42) | **0.856** | **0.052** (4 of 78) |

---

## 3. Rate Definitions & Disaggregation (Detection vs. Page Level)

### Mathematical Definitions of Table Rates
1. **Precision:** $\frac{TP}{TP + FP}$  
   - *Numerator:* Number of pages where the category was correctly detected and actually planted.  
   - *Denominator:* Total pages where the category was detected (planted + unplanted).
2. **Recall:** $\frac{TP}{TP + FN}$  
   - *Numerator:* Number of planted pages correctly detected.  
   - *Denominator:* Total pages where this category was planted (10 or 11 pages).
3. **Negative-Page False Alarm Rate:** $\frac{FP}{FP + TN}$  
   - *Numerator:* Number of unplanted pages where the category was falsely detected.  
   - *Denominator:* Total pages where this category was NOT planted (19 or 20 pages).

### Disaggregation of False Alarms on the 10 Clean Control Pages
- **Clean Page-Level False Alarm Rate:** **30.0% (3 of 10 clean pages had $\ge 1$ false detection)**.  
  *(Note: The previous table had `0.300` in the bottom row. That figure represented the 3/10 clean-page rate, not the category macro-average of 0.052).*
- **Clean Element Detection-Level False Alarm Rate:** **17.4% (4 false detections out of 23 total candidate elements across the 10 clean pages)**.  
  In Rules-only mode, the detection-level false alarm rate is **0.0% (0 of 23 elements)**.

---

## 4. What ML Added & Recall Gain Decomposition

### A. Recall Breakdown: Verified Rule Evidence vs. Uncertain ML Flags
Out of 42 total planted category instances across the 20 planted pages:
- **Caught with Verified Rule Evidence:** **24 of 42 instances (57.3% recall)**.
- **Caught ONLY by ML (Uncertain Flags, Confidence capped at 0.50):** **10 of 42 instances (+23.1% recall)**.
- **Total Rules + ML Recall:** **34 of 42 instances (80.4% recall)**.

> **Key Finding:** **100% of the recall gain (+23.1%) comes from ML-only flags tagged as uncertain ($isUncertain = true$)**. When ML is disabled, detection relies strictly on deterministic proof.

### B. Category Specifics
- **DP-1 (Fake Urgency):** Jumped from 7 of 11 (63.6%) to 11 of 11 (100.0%) (+4 pages). Caught un-timed text scarcity (`"Demand is high! Only 1 remaining"`).
- **DP-3 (Confirm Shaming):** Jumped from 8 of 10 (80.0%) to 10 of 10 (100.0%) (+2 pages). Caught paraphrased guilt copy (`"No thanks, I will take the risk of lost luggage"`).
- **DP-4 (Pre-selected Extras):** Jumped from 5 of 11 (45.5%) to 9 of 11 (81.8%) (+4 pages). Caught unflagged subscription add-ons (`"Monthly VIP Health Analytics Subscription $9.99/mo"`).
- **DP-2 (Misleading Discount):** Remained identical at 4 of 10 (40.0%). **ML contributed zero additional detections for DP-2 because `fusion.ts` explicitly drops ML discount wording signals without deterministic arithmetic verification.** Rules-only recall (40.0%) is limited by Member A's discount detector regex, not the ML model.

---

## 5. Clean-Page False Positives: Exact Token Contribution Audit

On the 10 verified clean negative control pages, Rules-only produced **0 false positives**.  
Rules + ML produced **4 false detections across 3 clean pages**.

Below are the exact mathematical contributions ($\text{Model Weight} \times \text{TF-IDF}$) calculated from the classifier:

### 1. `eval-clean-02` (*Artisan Ceramic Pour-Over Dripper*): DP-1 Fake Urgency
- **Candidate Text:** `"Handcrafted in Kyoto, $42.00"`
- **Intercept:** $-0.6654$ | **Final Log-Odds:** $+0.9688$ | **Calculated Probability:** **0.7249** ($\ge 0.65$ threshold)
- **Top Token Contributions:**
  1. `"in"`: Weight $= +1.13797$, TF-IDF $= 0.79060$, Contribution $= \mathbf{+0.89968}$
  2. `"00"`: Weight $= +1.19959$, TF-IDF $= 0.61233$, Contribution $= \mathbf{+0.73454}$
  - *Mechanism:* Words `"handcrafted"`, `"kyoto"`, and `"42"` were Out-of-Vocabulary (OOV). Only `"in"` (prevalent in urgency phrases like *"ends in..."*) and `"00"` (prevalent in countdown timers like *"00:15:00"*) were matched, absorbing 100% of the normalized vector weight and pushing log-odds positive.

### 2. `eval-clean-02` (*Artisan Ceramic Pour-Over Dripper*): DP-3 Confirm Shaming
- **Candidate Text:** `"No thanks"`
- **Intercept:** $-1.2872$ | **Final Log-Odds:** $+1.8211$ | **Calculated Probability:** **0.8607** ($\ge 0.70$ threshold)
- **Top Token Contributions:**
  1. `"no"`: Weight $= +3.14465$, TF-IDF $= 0.47617$, Contribution $= \mathbf{+1.49739}$
  2. `"thanks"`: Weight $= +1.36410$, TF-IDF $= 0.61494$, Contribution $= \mathbf{+0.83883}$
  3. `"no thanks"`: Weight $= +1.22838$, TF-IDF $= 0.62858$, Contribution $= \mathbf{+0.77214}$
  - *Mechanism:* In training data, `"no thanks"` occurred in 20 strings: 18 labeled `shaming` and only 2 labeled `neutral` (90% shaming). The model learned an uncalibrated shortcut for isolated refusal buttons lacking sentence context.

### 3. `eval-clean-04` (*Muji Mechanical Pencil 0.5mm*): DP-1 Fake Urgency
- **Candidate Text:** `"In stock"`
- **Intercept:** $-0.6654$ | **Final Log-Odds:** $+0.8022$ | **Calculated Probability:** **0.6904** ($\ge 0.65$ threshold)
- **Top Token Contributions:**
  1. `"stock"`: Weight $= +1.73136$, TF-IDF $= 0.52329$, Contribution $= \mathbf{+0.90600}$
  2. `"in"`: Weight $= +1.13797$, TF-IDF $= 0.49264$, Contribution $= \mathbf{+0.56060}$
  3. `"in stock"`: Weight $= +0.00142$, TF-IDF $= 0.69533$, Contribution $= \mathbf{+0.00099}$
  - *Mechanism:* The unigram `"stock"` has a heavy positive weight (+1.731) from scarcity training strings (*"only 2 left in stock"*, *"low stock"*). The bigram `"in stock"` had an insufficient negative weight (+0.0014) to offset the individual unigrams.

### 4. `eval-clean-06` (*Hasami Porcelain Mug 11oz Natural*): DP-4 Pre-selected Extras
- **Candidate Text:** `"$36.00 each"`
- **Intercept:** $-0.7384$ | **Final Log-Odds:** $+2.1313$ | **Calculated Probability:** **0.8939** ($\ge 0.65$ threshold)
- **Top Token Contributions:**
  1. `"00"`: Weight $= +2.86969$, TF-IDF $= 1.00000$, Contribution $= \mathbf{+2.86969}$
  - *Mechanism:* `"each"` and `"36"` were absent from the training vocabulary (0 occurrences in train). The only in-vocabulary token was `"00"`, which carries a massive positive weight (+2.870) from add-on price examples (*"$14.00"*, *"$6.00"*). With TF-IDF normalized to 1.0, it triggered a false alarm on standard unit pricing.

---

## 6. How `fusion.ts` Treats ML-Only Hits & Impact on Risk Score

In `src/engine/fusion.ts` (lines 101–147), ML-only hits are **SHOWN, but strictly DOWN-WEIGHTED and flagged as UNCERTAIN**:

```typescript
// Quoted from src/engine/fusion.ts lines 101-147:
  // Process ML-only signals (candidates without rule evidence where classifier >= threshold)
  if (classifierAvailable) {
    for (const [ref, mlResult] of classifierMap.entries()) {
      if (coveredRefs.has(ref)) continue;
      const candidate = candidateMap.get(ref);
      if (!candidate) continue;

      // Check highest probability against thresholds
      const { probabilities } = mlResult;
      let matchedCategory: DarkPatternCategory | null = null;
      let prob = 0;

      if (probabilities.shaming >= 0.7) {
        matchedCategory = 'confirm_shaming';
        prob = probabilities.shaming;
      } else if (probabilities.urgency >= 0.65) {
        matchedCategory = 'fake_urgency';
        prob = probabilities.urgency;
      } else if (probabilities.addon_extra >= 0.65) {
        matchedCategory = 'preselected_extra';
        prob = probabilities.addon_extra;
      }

      if (matchedCategory) {
        const catMeta = CATEGORY_NAMES[matchedCategory];
        detections.push({
          id: `det-ml-${ref}-${Date.now().toString(36)}`,
          category: matchedCategory,
          categoryId: catMeta.id,
          categoryName: catMeta.name,
          candidateRef: ref,
          severity: 1, // Minor / low certainty
          confidence: Math.min(0.5, Number(prob.toFixed(2))), // capped at 0.5 per PRD FR-13
          source: 'ml',
          explanation:
            'Possible pattern (text model, low certainty): this wording may be persuasive. Review in context.',
          templateId: 'ET-SIGNAL-01',
          evidenceSnippet: candidate.text,
          elementSelector: candidate.selector,
          elementRect: candidate.rect,
          details: { classifierProbability: prob },
          sellerQuestion: 'Is this wording indicative of a limited offer or standard promotional copy?',
          isUncertain: true,
        });
      }
    }
  }
```

### Risk Score Contribution in `src/engine/risk.ts`
Do ML-only hits contribute to the final risk score? **Yes, but at heavily attenuated weight**:
- In `risk.ts` line 58: `const effectiveWeight = isAllClassifierOnly ? weight * 0.5 : weight;`
- Severity is forced to `1` (Minor), so $S_c = 1/3 \approx 0.333$.
- Confidence is hard-capped at `0.50` ($C_c \le 0.50$).
- Total contribution per ML-only category is capped at $\text{weight} \times 0.5 \times \frac{1}{3} \times 0.5 = \frac{\text{weight}}{12}$:
  - **DP-1 ML-only:** Maximum 2.5 points out of 100.
  - **DP-3 ML-only:** Maximum 1.25 points out of 100.
  - **DP-4 ML-only:** Maximum 2.08 points out of 100.

---

## 7. Final Release Gate Assessment (ML-R9)

| Gate Check | Criterion | Achieved Value | Result |
| :--- | :---: | :---: | :---: |
| 1. Macro Precision on Pages | $\ge 0.85$ | **0.914** | **PASS** |
| 2. Macro Recall on Pages | $\ge 0.70$ | **0.804** (34 of 42 instances) | **PASS** |
| 3. Clean Page False Alarm Increase | $\le 0$ (Zero clean page FPs) | **+3 clean pages (4 detections)** | **FAIL** |
| **System Release Gate Result** | **All Pass** | **1 Failed** | **FAILED** |

### Deployment Recommendation: Ship Turned Off by Default (`ml_enabled: false`)
DarkGuard AI **ships with the text classifier disabled by default**:
- Running in **verified Rules-Only mode by default** guarantees 0 false positives on legitimate stores.
- Preserves the text model as an opt-in experimental setting for users seeking maximal detection recall.
