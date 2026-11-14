# DarkGuard AI - ML v2 Roadmap & Deferred Enhancements (`LATER-ml.md`)

## 1. Planned v2 Improvements

1. **Retrain with Explicit Hard-Negative Neutral Strings:**
   - Add $\ge 50$ standalone refusal and button terms without guilt copy (`"No thanks"`, `"No, I'll think about it"`, `"Maybe later"`, `"Decline"`, `"Skip"`) labeled `neutral` to neutralize the `"no"` / `"thanks"` shortcut.
   - Add $\ge 50$ legitimate inventory availability strings (`"In stock"`, `"Available now"`, `"Ships immediately"`) labeled `neutral` to neutralize the isolated `"stock"` shortcut.
   - Add regular retail price strings with rate units (`"$36.00 each"`, `"$15.00/item"`, `"$4.50/lb"`) labeled `neutral` to suppress false positive add-on predictions on unit prices.
2. **Substantial Scale & Merchant Diversity Expansion:**
   - Expand dataset from 823 strings to $\ge 2,500$ strings spanning 25+ real-world merchant structures (including airline checkouts, ticketing platforms, and consumer electronics).
3. **Multi-Annotator Verification (Independent Second Labeler):**
   - Introduce an independent secondary labeler with double-blind annotation and report Cohen's Kappa ($\kappa$) inter-annotator agreement rate.
4. **User-Collected Real-World Validation Suite:**
   - Ingest `eval/real-sample-user.csv` (user-collected live production strings) as a formal external benchmark suite.
5. **DOM-Context Gating in Extension Fusion:**
   - Require button text like `"No thanks"` to be evaluated in conjunction with modal parent containers (`dialog`, `.modal`, `.popup`) before emitting confirm shaming flags.

---

## 2. 3-Line Demo Pitch / Executive Summary

> **"Our ML text model boosted detection recall by +23.1%, catching 100% of planted fake urgency and confirm shaming without requiring timers or hardcoded wordlists.**  
> **However, because it operates on raw text without page context, it generated false alarms on 3 out of 10 clean stores on common phrases like 'In stock' and 'No thanks'.**  
> **To protect consumer trust and maintain zero false alarms on legitimate merchants, we made the disciplined engineering decision to ship with ML disabled by default."**
