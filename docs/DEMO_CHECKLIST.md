# DarkGuard AI — Hackathon Demonstration Checklist & Guide

This document provides the authoritative 3-minute judging demonstration script, pre-demo preparation checklist, and fallback procedures for DarkGuard AI.

---

## 1. Pre-Demo Setup Checklist (Complete 10 Minutes Before Presentation)

| Step | Action | Expected State | Verification |
| :--- | :--- | :--- | :--- |
| **1. Build & Package** | `npm install && npm run package:extension && npm run build:web` | `dist/darkguard-unpacked` and `dist-web` generated | Files exist with zero errors |
| **2. Chrome Extension** | Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, select `dist/darkguard-unpacked` | DarkGuard AI v0.3.0 loaded | Pin shield icon to Chrome toolbar |
| **3. Local Preview Server** | In a background terminal, run `npm run serve:site` | Server running on `http://localhost:8080/Dark-pattern/` | Port 8080 active |
| **4. Prepare Browser Tabs** | Open tabs in this exact sequence: | | |
| Tab 1 | `http://localhost:8080/Dark-pattern/test-site/planted-combined-01.html` | Featured Combined Scenario | Ready for live scan |
| Tab 2 | `http://localhost:8080/Dark-pattern/test-site/clean-ticking-timer.html` | Clean Control with Active Timer | Ready for clean scan |
| Tab 3 | `http://localhost:8080/Dark-pattern/app/` | React Web App & Simulator | Ready for evaluation tab |
| Tab 4 | `http://localhost:8080/Dark-pattern/` | Marketing Landing Page | Ready for architecture view |

---

## 2. Three-Minute Timed Demonstration Script

### [0:00 – 0:30] Introduction & The Problem
- **Spoken:** *"Judges, online shoppers face an epidemic of psychological coercion known as dark patterns—fake countdown timers that freeze, fake discounts with dishonest math, manipulative decline buttons, and sneaking expensive add-ons into checkout carts. Today, we present **DarkGuard AI**, an intelligent, on-device browser extension that audits visible page elements in real time, provides mathematical and temporal proof, calculates a unified 0–100 risk score, and safely restores shopping transparency."*
- **Visual:** Point to Tab 1 (`planted-combined-01.html`).

---

### [0:30 – 1:15] Live Scan on Combined Scenario (`planted-combined-01.html`)
- **Action:** 
  1. Click the **DarkGuard AI shield icon** in Chrome's toolbar.
  2. Click **Scan this page**.
- **Spoken:** *"Let's audit this flagship e-commerce product page. Notice the countdown status: DarkGuard observes the timer across a 10-second window to verify if the digits actually tick down or are frozen to fabricate false urgency."*
- **Observe Results:**
  - Unified Risk Score displays **66 / 100** with a **High Risk** badge.
  - Review the four detected patterns:
    1. **DP-1 Fake Urgency:** Frozen countdown timer (`00:14:59` unchanged across 10 seconds).
    2. **DP-2 Misleading Discount:** Arithmetic discrepancy (Claims 70% off, but $50 to $25 is only 50%).
    3. **DP-3 Confirm Shaming:** Guilt-inducing decline text (*"No thanks, I prefer paying full price"*).
    4. **DP-4 Pre-Selected Extras:** Pre-checked $49.99 replacement warranty checkbox located near the primary checkout button.
- **Spoken:** *"In seconds, all four deceptive tactics are identified with exact evidence and unified into a 66 High score."*

---

### [1:15 – 1:45] In-Page Interactivity: Element Locator & Ethical View
- **Action:**
  1. In the popup, click **Locate** on the DP-2 or DP-4 card.
     - *Observation:* Page smoothly scrolls to the element and displays an animated pulse highlight box (`🛡️ Detected Suspicious Element`).
  2. In the popup, toggle **Ethical View** to **ON**.
     - *Observation:* A clear top banner appears (*"Ethical View Active: 4 possible issues found. Risk Score: 66/100"*), and contextual educational notes appear adjacent to the deceptive items.
  3. Point out strict safety: prices are NOT modified, buttons are NOT broken, checkboxes are NOT toggled.
  4. In the top banner, click **Show original**.
     - *Observation:* Banner and notes are immediately stripped; the page DOM returns to 100% identical original state.
- **Spoken:** *"Notice how Ethical View educates the consumer in-context without breaking merchant checkout flows. And clicking 'Show original' restores the DOM 100% reversibly."*

---

### [1:45 – 2:15] Clean Control Baseline (Zero False Alarms)
- **Action:**
  1. Switch to Tab 2 (`clean-ticking-timer.html`).
  2. Open DarkGuard AI popup and click **Scan this page**.
- **Spoken:** *"A detection system is only as good as its false-positive rate. Here is an honest artisan coffee product with an active flash-sale timer. Notice the timer is legitimately decrementing every second."*
- **Observe Results:**
  - After observation, DarkGuard reports **0 findings** and **Score: 0 / 100 (Low Risk)**.
- **Spoken:** *"Zero false alarms. DarkGuard does not penalize legitimate marketing—only mathematically and temporally proven deception."*

---

### [2:15 – 2:45] Evaluation Platform & Honest ML Release Gate Disclosure
- **Action:**
  1. Switch to Tab 3 (`http://localhost:8080/Dark-pattern/app/`).
  2. Click the **Evaluation** tab in the navigation bar.
- **Spoken:** *"We believe in radical engineering honesty. In our ablation platform, we evaluated our hybrid architecture across 30 labeled scenarios. While our TF-IDF text classifier achieved 85% recall, it introduced a 30% false-alarm rate on neutral strings on clean pages. Under our strict ML-R9 release gate, the text model FAILED to meet the zero-increase false-positive threshold."*
- **Highlight:**
  - Point to the red gate badge: `ML Release Gate: FAILED (Rules-Only Active)`.
  - *"Because consumer trust is non-negotiable, we shipped the extension with ML disabled by default. DarkGuard AI runs in deterministic, high-precision rules-only mode."*

---

### [2:45 – 3:00] Closing & Core Architecture
- **Spoken:** *"To conclude: DarkGuard AI is 100% on-device, fully compliant with Manifest V3, makes zero external network calls, and protects consumer agency with reversible transparency. Thank you!"*

---

## 3. Fallback & Troubleshooting Procedures

| Issue | Root Cause | Immediate Remediation |
| :--- | :--- | :--- |
| **Popup shows old UI / stale scan** | Browser cached unpacked extension bundle | 1. Go to `chrome://extensions`<br>2. Click **↺ Reload** on DarkGuard AI<br>3. Close and reopen the extension popup |
| **Cannot scan page (`chrome://` error)** | Chrome restricts script injection on internal pages | Make sure you are on `http://localhost:8080/Dark-pattern/...` or an HTTP/HTTPS site, not `chrome://` |
| **Port 8080 in use** | Another local service running | Run `npx serve _site -l 3000` or open files via direct file path |
| **10-second scan too long for fast demo** | Observation window required for timer proof | Mention the temporal verification during the 10s countdown to keep the audience engaged |
| **Ethical View banner not showing** | Ethical View was toggled off | Click the **Ethical View** switch in the popup finding header |
