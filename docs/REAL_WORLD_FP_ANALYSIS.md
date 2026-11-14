# Real-World False-Positive Hardening Analysis

This report documents the false-positive analysis conducted on synthetic real-world clean e-commerce fixtures using the DarkGuard AI rules engine (rules-only mode, `mlEnabled: false`).

> [!NOTE]
> **Test Bed Scope**: Results on our own test bed (detectors were tuned on these pages), n=23 pages, rules-only.
> **Limitation**: Real-site performance on live uncurated commercial websites has not been measured.

---

## 1. Test Matrix & Results (After Hardening)

| Fixture File | Scenario | Detections Count | Flagged Categories | Risk Score | Status |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `clean-from-pricing.html` | "From $49.00" range + MSRP bundle strike-through | **0** | None | **0** | ✅ PASS (CLEAN) |
| `clean-polite-decline.html` | "No thanks", "Maybe later", "Decline and return to cart" | **0** | None | **0** | ✅ PASS (CLEAN) |
| `clean-newsletter-checkbox.html` | Pre-checked "Subscribe to newsletter", "Save address", "Terms" | **0** | None (Excluded via DP-4 narrow rule) | **0** | ✅ PASS (CLEAN) |
| `clean-free-shipping.html` | "Free shipping on all orders over $50!" banner | **0** | None | **0** | ✅ PASS (CLEAN) |
| `clean-sale-ends-sunday.html` | "Sale ends Sunday at midnight" promotional notice | **0** | None | **0** | ✅ PASS (CLEAN) |
| `clean-remember-me.html` | Pre-checked "Remember me on this computer" checkbox | **0** | None | **0** | ✅ PASS (CLEAN) |
| `clean-stock-urgency.html` | "Only 3 left in stock - order soon" in standard product card | **0** | None (Honest stock count excluded from visible findings) | **0** | ✅ PASS (CLEAN) |

---

## 2. Hardening Details

### A. Clean Pricing (`clean-from-pricing.html`, `clean-free-shipping.html`)
- **Engine Behavior:** `DP-2` (`misleading_discount`) validates discount claims against actual mathematical differences between reference and current prices.
- **Why it passed:** When a site displays "From $49.00" without claiming a false percent-off discount, or shows an honest MSRP comparison ($120.00 strike-through down to $99.00 without bogus math or hidden fee drip pricing), or offers a standard promotional banner ("Free shipping over $50"), `DP-2` correctly recognizes that no deceptive price anchoring is taking place.

### B. Polite Declines (`clean-polite-decline.html`)
- **Engine Behavior:** `DP-3` (`confirm_shaming`) matches against an explicit curated list of guilt-inducing phrases (`SHAMING_PHRASES`).
- **Why it passed:** Courteous, standard decline options such as `"No thanks"`, `"Maybe later"`, and `"Decline and return to cart"` do not contain guilt or emotional manipulation ("I don't care about saving money", "I prefer paying full price"). In rules-only mode, `DP-3` has 0 false alarms on standard decline UI.

### C. Newsletter Opt-In & Remember Me Checkboxes (`clean-newsletter-checkbox.html`, `clean-remember-me.html`)
- **Engine Behavior:** `DP-4` (`preselected_extra`) features a narrow exclusion rule:
  - If a checked checkbox label matches `newsletter`, `email update`, `terms`, `privacy`, or `I agree`, it is skipped UNLESS the element also mentions `warranty`, `insurance`, `protection`, `donation`, `gift wrap`, or a paid plan or price.
  - "Remember me" does not match add-on keywords and is skipped.
- **Planted Pages Verification:** Planted warranty and protection pages (`planted-extras-01.html`, `planted-extras-02.html`, and `planted-combined-01.html`) do not contain newsletter/terms terms and explicitly mention warranty/protection/price, retaining 100% detection recall.

### D. Low-Stock Urgency & Promotional Deadlines (`clean-stock-urgency.html`, `clean-sale-ends-sunday.html`)
- **Engine Behavior:**
  - `clean-sale-ends-sunday.html`: "Sale ends Sunday at midnight" does not match countdown timer patterns or high-pressure scarcity keywords, producing 0 detections.
  - `clean-stock-urgency.html`: Honest stock-count text ("Only 3 left in stock", "Only 2 left") produces 0 visible finding cards, 0 Ethical View notes, and 0 contribution to the banner's issue count or risk score.
  - Urgency text without stock count (e.g. "Hurry! Offer ends soon!" with no timer) continues to use `ET-URG-02` as an informational note.
- **Planted Pages Verification:** Planted urgency pages (`planted-urgency-01.html`, `planted-urgency-02.html`, and `planted-combined-01.html`) employ observed timers (frozen countdowns) and continue to be detected at full confidence and severity.
