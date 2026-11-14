# DarkGuard AI - ML v2 Roadmap & Deferred Enhancements (`LATER-ml.md`)

## 1. Planned v2 Improvements

1. **Normalize Numbers to a Canonical `NUM` Token:**
   - Preprocess all isolated numeric digits and price decimals (`"$19.99"` $\rightarrow$ `"$"`, `"NUM"`, `"NUM"`, or `"$NUM"`) to prevent spurious features like decimal `"00"` from absorbing outsized positive weights (+1.20 in urgency, +2.87 in addon_extra).
2. **Minimum Known-Token Coverage Gate:**
   - Require that candidate strings achieve a minimum in-vocabulary token coverage (e.g., at least 2 in-vocab tokens or $\ge 50\%$ known token ratio) before running logistic regression inference. If a candidate consists solely of OOV words and a lone function word like `"in"`, abort ML inference to prevent 100% L2-norm concentration.
3. **Hard-Negative Neutral Strings as General Patterns:**
   - Add $\ge 100$ generalized neutral refusal buttons (`"No thanks"`, `"No, I'll think about it"`, `"Maybe later"`, `"Decline"`, `"Skip"`, `"Close"`) labeled `neutral`.
   - Add $\ge 100$ standard product catalog inventory statements (`"In stock"`, `"Available now"`, `"Back in stock soon"`, `"Ships in 2-3 days"`) labeled `neutral`.
   - Add standard unit pricing schedules (`"$36.00 each"`, `"$15.00/month"`, `"$4.50/lb"`) labeled `neutral`.
4. **Mandatory v2 Disclosure Rule:**
   - **Evaluation Contamination Disclosure:** Any future v2 model retrained using hard negatives derived from failure cases observed in `src/eval/labels.json` must explicitly state in its model card:
     > *"v2 training data was informed by failure cases identified on the v1 evaluation benchmark. To prevent overfitting to the benchmark, v2 must be verified against a newly authored, unseen set of test fixtures."*
5. **Multi-Annotator Verification (Independent Second Labeler):**
   - Introduce double-blind labeling across all new strings and report Cohen's Kappa ($\kappa$).
6. **User-Collected Real-World Validation Suite:**
   - Formally ingest `eval/real-sample-user.csv` (user-collected live production strings) as a separate benchmark.
7. **DOM-Context Gating in Extension Fusion:**
   - Require button text like `"No thanks"` to be verified inside modal parent containers (`dialog`, `.modal`, `.popup`) before emitting confirm shaming flags.

---

## 2. 3-Line Demo Pitch / Executive Summary

1. **On 30 fixture pages the text model raised recall from 57% to 80%, but every extra catch is a low-certainty flag.**
2. **It also added false flags on 3 of 10 clean pages (e.g. "In stock", "No thanks"), mainly because training data lacked those neutral examples.**
3. **So it ships off by default; numbers and fix list are in the model card.**
