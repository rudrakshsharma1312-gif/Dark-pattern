# DarkGuard AI — Labeling Guidelines v1

> **Single labeler:** All strings in this dataset were labeled by one person (Member B).
> No inter-annotator agreement rate is reported.
> Two-pass review was used to catch obvious inconsistencies.

---

## 0. How to label a string

1. Read the string as if you were a shopper seeing it on a product page.
2. Ask for each class independently: *does this string belong to this class?*
3. A string can belong to **multiple** classes — assign all that apply (pipe-separated in the CSV).
4. If none of the four classes apply, label it `neutral`.
5. When in doubt, prefer `neutral` over a positive label. The model must not false-alarm on ordinary copy.
6. Never read the surrounding page context — label the string in isolation.

---

## 1. `urgency` — Pressure or scarcity wording

### Definition
The string uses language that implies time pressure, low stock, or high demand — real or manufactured — to push the reader toward an immediate action. The implication that the reader will *miss out* if they do not act now is the core signal.

A timer value alone (e.g. `"02:45:00"`) with no urgency word does **not** qualify; pair it with a word from the list below.

### Positive examples
| String | Why it qualifies |
|---|---|
| `"Hurry! Deal ends in 00:14:59"` | Explicit time pressure + timer |
| `"Only 2 left in stock! Selling fast"` | Scarcity claim + demand signal |
| `"Flash Sale: 02:45:00 remaining"` | Flash sale = manufactured urgency |
| `"Demand is high! Only 1 remaining"` | High-demand claim + scarcity |
| `"Order now! 00:19:59 left before price increases"` | Price-increase threat + timer |
| `"Offer expires in 00:09:30"` | Expiry signal |
| `"Almost gone — grab yours before it's too late"` | Stock scarcity + FOMO |
| `"Only 3 left — others are watching this item"` | Social proof scarcity |
| `"Flash deal ends in 00:04:12"` | Timer + flash framing |
| `"Hurry! Almost gone"` | Stock scarcity (no specific number) |
| `"Selling fast! Only 3 left"` | Demand + scarcity |
| `"Timer: 00:07:45 ends today"` | Timer + deadline |
| `"Flash deal expires in 00:11:20"` | Timer + flash |
| `"Act now — this price won't last"` | Implied time limit |
| `"Limited time offer: 15 hours left"` | Explicit time limit |

### Near-miss / negative examples (do NOT label `urgency`)
| String | Why it does NOT qualify |
|---|---|
| `"Ships in 2–3 business days"` | Shipping estimate, no pressure |
| `"In stock"` | Stock confirmation, no scarcity claim |
| `"Free standard shipping over $50"` | Incentive, no urgency |
| `"00:30:00"` | Timer value alone, no urgency word |
| `"Sale ends Sunday"` | Day of week, mild — borderline; label as `urgency` only if it also says "hurry" or "last chance" |
| `"New arrival"` | Novelty, not scarcity |
| `"Best seller"` | Popularity, not imminent loss |

### Trigger words / phrases (non-exhaustive)
hurry, hurry up, only N left, almost gone, selling fast, limited stock, flash sale, flash deal, deal ends, offer expires, act now, last chance, don't miss, before it's too late, today only, N hours left, N minutes left, price increase, demand is high, others are watching

---

## 2. `shaming` — Guilt or self-deprecation in a decline option

### Definition
The string is the **decline/opt-out** side of a choice — a button, link, or label the user clicks to *refuse* a promotion or add-on — AND it uses wording that makes the user feel foolish, irresponsible, cheap, or guilty for declining.

**Both conditions must hold.** A headline that says "Don't miss savings!" is not shaming (it is not a decline action). A plain "No thanks" is not shaming (it carries no guilt).

The guilt must be directed at **the user's judgment or character** ("I don't want to save money"), not at an external outcome ("Continue without protection").

### Positive examples
| String | Why it qualifies |
|---|---|
| `"No thanks, I don't care about audio quality"` | Decline + self-deprecation about taste |
| `"No, I prefer full price"` | Decline + implies user is irrational |
| `"No, I prefer bad posture"` | Decline + guilt about health choice |
| `"No, I don't want to save money"` | Classic confirm-shaming phrasing |
| `"No thanks, I hate saving money"` | Explicit self-deprecation |
| `"No thanks, I hate discounts"` | Decline + implies irrational preference |
| `"No thanks, I will take the risk of lost luggage"` | Decline + guilt about safety |
| `"No thanks, I will pay full price"` | Implies user is accepting a bad deal |
| `"No, I don't care about my safety"` | Decline + guilt about health/safety |
| `"I'd rather pay more"` | Implies user is irrational with money |
| `"Skip savings and pay full price"` | Decline framed as a loss |
| `"No, I hate good deals"` | Paradoxical self-deprecation |
| `"I don't deserve a discount"` | Extreme self-deprecation |
| `"Continue without saving — I prefer to pay more"` | Compound self-deprecation |
| `"No thanks, I prefer losing money"` | Financial self-deprecation |

### Near-miss / negative examples (do NOT label `shaming`)
| String | Why it does NOT qualify |
|---|---|
| `"No thanks"` | Plain decline — no guilt attached |
| `"Decline gift wrap"` | Neutral decline — no self-deprecation |
| `"Skip"` | Navigation action — no guilt |
| `"Continue without protection"` | Factual consequence, not guilt |
| `"No, I'll add it later"` | Practical reason — no shaming |
| `"I'll think about it"` | Deferral — no guilt |
| `"No thanks, I already have insurance"` | Legitimate reason — not shaming |

### Trigger patterns (non-exhaustive)
Decline cue (`no thanks`, `no,`, `skip`, `continue without`) combined with any of:
- self-reference about bad taste / irrationality: `I don't care about`, `I hate`, `I prefer bad`, `I enjoy paying more`, `I'd rather pay more`
- explicit financial self-harm: `prefer full price`, `pay more`, `pay retail`, `lose my discount`
- explicit risk acceptance guilt: `take the risk`, `no warranty`, `no protection`

---

## 3. `addon_extra` — Label of an optional add-on or extra

### Definition
The string is the **label or description** of a checkbox, subscription, or optional product that is being offered alongside the main purchase — insurance, protection, warranty, gift wrap, donation, premium subscription, priority shipping, or any similar upsell. The string does not need to be guilt-laden; it just needs to identify an optional chargeable or non-chargeable extra.

Pre-selected state is NOT required for the label to be `addon_extra`. The rule detector handles that; the classifier just needs to recognise the label text as an add-on offering.

### Positive examples
| String | Why it qualifies |
|---|---|
| `"Add 2-Year Accidental Damage Protection for $19.99"` | Explicit protection add-on |
| `"Include Premium Bulb Replacement Warranty $9.99"` | Warranty upsell |
| `"Add carbon offset donation $2.00"` | Optional donation add-on |
| `"Monthly VIP Health Analytics Subscription $9.99/mo"` | Subscription add-on |
| `"Add express shipping insurance $8.95"` | Insurance + shipping |
| `"Add 3-year extended warranty €49.00"` | Extended warranty |
| `"Include leather conditioning kit $15.00"` | Product add-on kit |
| `"Auto-ship replacement filters every 3 months"` | Subscription (auto-ship) |
| `"Add sharpening service warranty $14.99"` | Service warranty |
| `"Add hard shell case and microfiber cloth $12.50"` | Physical add-on bundle |
| `"Priority shipping protection — $4.99"` | Shipping upgrade/protection |
| `"Gift wrap option — $3.00"` | Gift service add-on |
| `"Accident and theft protection $12/year"` | Insurance add-on |
| `"VIP membership — $5.99/month"` | Premium membership |
| `"Add screen protector kit $9.00"` | Accessory add-on |

### Near-miss / negative examples (do NOT label `addon_extra`)
| String | Why it does NOT qualify |
|---|---|
| `"Optional filter pack (unchecked)"` | Neutral description of an option — this is borderline; label `addon_extra` only if it has a price or explicit upsell language |
| `"Add to bag"` | Main purchase action, not an add-on |
| `"Add to wishlist"` | Wishlist action, not a chargeable extra |
| `"Free standard shipping"` | Included shipping, not an optional extra |
| `"Decline gift wrap"` | Decline action — this is a shaming candidate, not the add-on label |
| `"Retail price $4.50"` | Pricing info only |

### Trigger words / phrases (non-exhaustive)
warranty, protection, insurance, coverage, gift wrap, donation, subscription, monthly, auto-ship, extended, VIP, membership, priority shipping, add-on, upgrade, service plan, replace, accident, theft

---

## 4. `discount_wording` — Discount or savings claim

### Definition
The string claims that the user is saving money or that the price is reduced from a higher reference point. This includes percentage-off claims, struck-through or labelled "was" prices, MRP labels, and savings-amount claims.

A plain current price with no comparison or savings claim does **not** qualify.

### Positive examples
| String | Why it qualifies |
|---|---|
| `"60% OFF - Was $200.00 Now $120.00"` | Pct-off + before/after price |
| `"50% Discount (Was $100.00, Now $70.00)"` | Pct-off + reference price |
| `"Save 40% (Original MRP $250.00, Sale $180.00)"` | Savings pct + MRP reference |
| `"Save 70% ($500 → $250)"` | Savings pct + price comparison |
| `"65% off ($400 down to $220)"` | Pct + before/after |
| `"Special 50% discount: $80 down to $60"` | Pct + before/after |
| `"Save 50% ($120 → $80)"` | Savings pct + price |
| `"50% OFF (was €600, now €400)"` | Pct + currency pair |
| `"45% off: was $60, now $45"` | Pct + reference |
| `"Save 40%: was ₹4,999 now ₹3,999"` | Pct + INR reference |
| `"Save up to 60% on selected items"` | Savings claim with qualifier |
| `"Clearance: 70% below retail"` | Clearance discount |
| `"Lowest price in 30 days"` | Price comparison claim |
| `"Was $89.99 — now $49.99"` | Before/after without pct |
| `"Flash sale price: $29 (list price $59)"` | Sale + list price |

### Near-miss / negative examples (do NOT label `discount_wording`)
| String | Why it does NOT qualify |
|---|---|
| `"Price: $32.00"` | Current price only — no comparison |
| `"Retail price $4.50"` | "Retail" is the stated price, not a comparison |
| `"Original Aeropress $39.95"` | Brand + price, no markdown claim |
| `"Handcrafted in Kyoto, $42.00"` | Product info + price |
| `"Free standard shipping over $50"` | Shipping threshold, not a discount |
| `"Stainless Steel 1.2L - $55.00"` | Spec + price |

> ⚠️ **Near-miss alert:** `"Retail price $4.50"` has the word "retail" (a TRD trigger) but there is no comparison price — label `neutral`. `"Retail: was $8.00, now $4.50"` would be `discount_wording`.

### Trigger words / phrases (non-exhaustive)
% off, % discount, save, was, MRP, original price, list price, reference price, clearance, flash sale price, reduced from, now only, down to, → (price arrow), slashed, special offer

---

## 5. `neutral` — None of the above

### Definition
Everything that does not match any of the four classes above. Neutral strings include:
- Plain prices with no comparison: `"$32.00"`, `"€42.00"`
- Product descriptions: `"Handcrafted in Kyoto"`
- Shipping info: `"Ships in 2–3 business days"`, `"Free standard shipping over $50"`
- Factual product specs: `"Stainless Steel 1.2L"`, `"Quiet precision quartz movement"`
- Plain call-to-action: `"Add to bag"`, `"Buy now"`, `"Continue"`
- Availability without scarcity claim: `"In stock"`, `"Available in blue and black"`
- Plain declines without guilt: `"No thanks"`, `"Skip"`, `"Maybe later"`

---

## 6. Multi-label rules

| Situation | Label |
|---|---|
| String has urgency + discount wording | `urgency\|discount_wording` |
| String is a shaming decline for a warranty | `shaming\|addon_extra` is **wrong** — the shaming is the decline, the addon_extra is the offer label. Keep them on separate rows. |
| Countdown timer text that is urgency + has a discount claim | `urgency\|discount_wording` |
| Plain "No thanks" near a checkbox | `neutral` — not shaming by itself |

Maximum two classes per string is the practical limit. If you think three apply, re-read the definitions — you are likely mislabeling one.

---

## 7. Edge cases

| Case | Ruling |
|---|---|
| Non-English strings | Label `neutral` — the model is English-only. Document in model card. |
| All-caps versions (`"HURRY!"`) | Label as normal — the tokenizer lowercases. |
| Prices with comma separators (`"₹1,299"`) | Treat as numeric context — does not change the class |
| Sarcasm (`"Because who needs savings?"`) | Label `neutral` — the model cannot handle sarcasm reliably. Note in model card known weaknesses. |
| Button text that is both a main CTA and an add-on (`"Buy now + warranty"`) | Label `addon_extra` only if the add-on is explicit. |
| Strings with HTML entities or punctuation only | Label `neutral` and exclude from training if text is fewer than 3 tokens after tokenization. |

