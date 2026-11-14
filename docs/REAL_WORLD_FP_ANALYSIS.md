# Real-World False-Positive Hardening Analysis

This report documents the false-positive analysis conducted on synthetic real-world clean e-commerce fixtures using the DarkGuard AI rules engine (rules-only mode, `mlEnabled: false`).

---

## 1. Test Matrix & Results

| Fixture File | Scenario | Detections Count | Flagged Categories | Risk Score | Status |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `clean-from-pricing.html` | "From $49.00" range + MSRP bundle strike-through | **0** | None | 0 | ✅ CLEAN |
| `clean-polite-decline.html` | "No thanks", "Maybe later", "Decline and return to cart" | **0** | None | 0 | ✅ CLEAN |
| `clean-stock-urgency.html` | "Only 3 left in stock - order soon" in standard product card | **1** | `DP-1` (`fake_urgency`) | 10 | ⚠️ FALSE POSITIVE |
| `clean-newsletter-checkbox.html` | Pre-checked "Subscribe to newsletter", "Save address", "Terms" | **1** | `DP-4` (`preselected_extra`) | 14 | ⚠️ FALSE POSITIVE |

---

## 2. Root Cause Analysis

### A. Clean "From" Pricing (`clean-from-pricing.html`) — Passed (0 FP)
- **Engine Behavior:** `DP-2` (`misleading_discount`) validates discount claims against actual mathematical differences between reference and current prices.
- **Why it passed:** When a site displays "From $49.00" without claiming a false percent-off discount, or shows an honest MSRP comparison ($120.00 strike-through down to $99.00 without bogus math or hidden fee drip pricing), `DP-2` correctly recognizes that no deceptive price anchoring is taking place.

### B. Polite Declines (`clean-polite-decline.html`) — Passed (0 FP)
- **Engine Behavior:** `DP-3` (`confirm_shaming`) matches against an explicit curated list of guilt-inducing phrases (`SHAMING_PHRASES`).
- **Why it passed:** Courteous, standard decline options such as `"No thanks"`, `"Maybe later"`, and `"Decline and return to cart"` do not contain guilt or emotional manipulation ("I don't care about saving money", "I prefer paying full price"). In rules-only mode, `DP-3` has 0 false alarms on standard decline UI.

### C. Low-Stock Urgency (`clean-stock-urgency.html`) — Flagged (1 FP)
- **Flagged Element:** `<span class="stock-status">Only 3 left in stock - order soon.</span>`
- **Detector:** `DP-1` (`fake_urgency`), confidence `0.50`, severity `2`, details: `{"initialValue": "Only 3 left in stock - order soon."}`.
- **Root Cause:** `DP-1` contains a static text heuristic that detects inventory scarcity statements (`/only \d+ left in stock/i`, `/selling fast/i`). Because the client-side extension cannot query the merchant's backend inventory database, it flags static urgency claims with moderate confidence (`0.50`). On genuine low-stock items in major stores (Amazon, Best Buy), this causes an unverified urgency flag.

### D. Newsletter Opt-In Checkbox (`clean-newsletter-checkbox.html`) — Flagged (1 FP)
- **Flagged Element:** `<input type="checkbox" name="newsletter" checked>`
- **Detector:** `DP-4` (`preselected_extra`), confidence `0.85`, severity `2`, details: `{"addonLabel": "Subscribe to our weekly product newsletter"}`.
- **Root Cause:** In `src/engine/detectors/dp4-extras.ts`, `ADDON_KEYWORDS` includes `\b(subscribe|subscription)\b`. When a standard newsletter checkbox appears inside a checkout form with a submit button (`hasActionBtn = true`), the word "Subscribe" triggers `DP-4`, mistaking an email newsletter opt-in for a recurring paid subscription.
- **Note:** The other two pre-checked boxes on the page ("Save shipping address" and "I agree to Terms & Conditions") were correctly ignored by `DP-4`.

---

## 3. Proposed Non-Breaking Remediation (Post-Core)

> **Important Constraint:** No edits have been made to `src/engine/` during this audit to preserve frozen test baselines. The proposals below represent recommended tuning for future releases.

### Proposal 1: Newsletter & Marketing Exclusion for DP-4
- **Proposed Change:** Update `ADDON_KEYWORDS` in `dp4-extras.ts` or add an exclusion pattern:
  ```typescript
  const NON_PAID_EXCLUSIONS = /\b(newsletter|email\s*updates?|terms|privacy|save\s*info|remember\s*me)\b/i;
  ```
  If `candidate.text` or label matches `NON_PAID_EXCLUSIONS`, skip the candidate even if it contains "subscribe".
- **Impact on Planted Pages:**
  - `planted-extras-01.html`: "Extended 2-Year Replacement Warranty (+$19.99)" — does not contain exclusion terms; **detection retained (100% recall)**.
  - `planted-extras-02.html`: "Expedited VIP Shipping Protection (+$4.99)" — does not contain exclusion terms; **detection retained (100% recall)**.
  - **Verdict:** Zero regression on planted test sites.

### Proposal 2: Confidence Tiering for DP-1 Static Stock Claims
- **Proposed Change:**
  - Lower the confidence of isolated text-only stock statements (`"Only N left in stock"`) from `0.50` to `0.30` or mark as informational when unaccompanied by ticking or frozen timer mechanisms.
  - Alternatively, check whether the element carries e-commerce metadata (e.g. schema.org `ItemAvailability`) before penalizing risk score.
- **Impact on Planted Pages:**
  - `planted-urgency-01.html`: Employs a ticking timer (`04:59`) — detected via observation; **detection retained**.
  - `planted-urgency-02.html`: Employs a frozen/fake timer (`05:00`) — detected via frozen observation; **detection retained**.
  - **Verdict:** Planted pages rely on timer mechanisms, not isolated static stock text; **zero regression**.

### Proposal 3: Retain ML Ship-Off Status
- The text ML classifier previously demonstrated severe false positive rates on clean pages (3 of 10 clean pages flagged) due to class imbalance on "no thanks" (18 shaming vs 2 neutral) and out-of-vocabulary tokens.
- As confirmed by `clean-polite-decline.html`, the rules engine alone achieves 0% false positive rate on standard decline buttons. Keeping ML disabled preserves this high precision.
