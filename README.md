# DarkGuard AI 
> Intelligent On-Device Auditor for Deceptive E-Commerce Design Patterns

[![Project Status](https://img.shields.io/badge/Status-12--Hour%20Hackathon%20Build-blue)](#)
[![Privacy First](https://img.shields.io/badge/Privacy-100%25%20On--Device-emerald)](#)
[![Architecture](https://img.shields.io/badge/Architecture-Manifest%20V3%20Extension-indigo)](#)
[![Test Suite](https://img.shields.io/badge/Test%20Bed-14%20Deterministic%20Pages-purple)](test-site/index.html)

---

## 1. Project Overview

**DarkGuard AI** is a lightweight, privacy-first Chromium extension (Chrome / Edge) designed to detect, contextualize, and neutralize manipulative e-commerce design patterns ("dark patterns"). 

Rather than relying on vague heuristics or sending sensitive shopping data to third-party cloud servers, DarkGuard AI audits visible webpage candidates entirely on-device, verifies evidence mathematically and temporally, generates a **0–100 risk score**, highlights suspicious DOM elements, and activates an **Ethical View** overlay with a one-click **Show Original** restoration guarantee.

---

## 2. Problem Statement & Solution

### The Problem
E-commerce websites frequently deploy psychological coercion tactics:
* **Manufactured Urgency**: Countdown timers that freeze or reset upon reload to induce panic.
* **Miscalculated Discounts**: Slashed "original" prices paired with inflated discount percentages that contradict basic math.
* **Emotional Manipulation**: Guilt-inducing decline buttons ("No thanks, I hate saving money") that pressure shoppers.
* **Hidden Add-ons**: Sneaking insurance, extended warranties, or recurring subscriptions into carts via pre-checked boxes.

### The DarkGuard AI Solution
* **Zero Telemetry / 100% Private**: All rule evaluations and text classifications run strictly in-browser. Zero passwords, card details, or browsing histories leave your machine.
* **Deterministic Proof**: Every finding provides demonstrable evidence—a 10-second timer freeze observation, an arithmetic mismatch calculation, or an exact shaming phrase match.
* **Ethical View with Show Original**: Annotates manipulative design in-context without ever modifying prices, breaking buttons, or toggling checkboxes. Restores the exact pre-annotation state with one click.

---

## 3. The Four Dark Patterns & Detection Mechanisms

| Category ID | Pattern Name | Detection Mechanism | Verification Proof |
|---|---|---|---|
| **DP-1** | **Fake Urgency & Scarcity** | Temporal Observation & Regex | Samples countdown timers across a 10-second observation window. Unchanging digits are flagged as frozen countdowns. |
| **DP-2** | **Misleading Discount Calculations** | Arithmetic Parsing Heuristics | Parses reference price (`Was`) and sale price (`Now`), calculates `((Was - Now) / Was) * 100`, and flags discrepancies > 5 percentage points. |
| **DP-3** | **Confirm Shaming Phrasing** | Lexicon Match + On-Device ML | Combines a 40+ curated shaming phrase list with an on-device TF-IDF logistic regression classifier to detect guilt-inducing decline language. |
| **DP-4** | **Pre-Selected Extras & Add-ons** | DOM Attribute & Area Inspection | Identifies `input[type="checkbox"]` with `checked="true"` inside purchase action containers matching warranty, insurance, or protection keywords. |

---

## 4. Project Architecture & Directory Structure

```
Dark-pattern/
├── content/                    # Content Scripts (Injected into Webpages)
│   ├── ethical-view.js         # Safe Ethical View engine & Show Original controller
│   ├── ethical-view.css        # Ethical View styling (banner, notes, outlines)
│   ├── highlighter.js          # Suspicious element locator with pulse overlay
│   └── templates.json          # Ethical template definitions & placeholders
├── popup/                      # Extension Browser Action Popup
│   ├── popup.html              # Popup DOM (Branding, gauge, findings, states)
│   ├── popup.css               # Popup design tokens & animated circular gauge
│   └── popup.js                # Popup event handling & tab messaging
├── test-site/                  # 14-Page Standalone Evaluation Test Bed
│   ├── css/style.css           # Realistic e-commerce store styling
│   ├── js/main.js              # Store client interactions (frozen timers genuine)
│   ├── index.html              # Test Bed Directory Hub & Judge Evaluation Matrix
│   ├── planted-urgency-01.html # DP-1 Scenario: 00:14:59 Frozen Timer
│   ├── planted-urgency-02.html # DP-1 Scenario: 02:45:00 Deadline Timer
│   ├── planted-discount-01.html# DP-2 Scenario: 70% Fake Discount (50% actual)
│   ├── planted-discount-02.html# DP-2 Scenario: 55% Fake Discount (30% actual)
│   ├── planted-shaming-01.html # DP-3 Scenario: "No thanks, I prefer paying full price"
│   ├── planted-shaming-02.html # DP-3 Scenario: "No, I don't want to save money"
│   ├── planted-extras-01.html  # DP-4 Scenario: Pre-checked $49.99 Warranty
│   ├── planted-extras-02.html  # DP-4 Scenario: Pre-checked $29.00 Transit Insurance
│   ├── clean-coffee-maker.html # Clean Control: Honest pricing ($249)
│   ├── clean-desk-lamp.html    # Clean Control: Verified 20% discount math
│   ├── clean-backpack.html     # Clean Control: Unchecked rain cover add-on
│   ├── clean-running-shoes.html# Clean Control: Verified 20% discount math
│   ├── clean-ceramic-mug.html  # Clean Control: Standard artisan price ($28)
│   └── clean-mechanical-keyboard.html # Clean Control: Neutral decline & options
├── landing/                    # Public Landing Page & Educational Walkthrough
│   ├── css/landing.css         # Responsive landing page stylesheet
│   └── index.html              # 3-step guide, pattern breakdowns, install steps
├── src/                        # Core TypeScript Engine & Dev Simulator
│   ├── engine/                 # Scanner, detectors, fusion, risk, ethical view
│   ├── ml/                     # Classifier, feature extraction, model weights
│   ├── eval/                   # Evaluation runner and labeled test benchmarks
│   └── components/             # React web preview components
├── ethical-view.css            # Root-level mirror for extension packaging
├── templates.json              # Root-level mirror for extension packaging
└── server.ts                   # Local development and API server
```

---

## 5. Local Installation & Testing Instructions

### Option A: Install Extension in Chrome / Edge (Developer Mode)
1. Open Google Chrome or Microsoft Edge and navigate to:
   * **Chrome**: `chrome://extensions`
   * **Edge**: `edge://extensions`
2. Enable **Developer mode** via the toggle switch in the top-right corner.
3. Click the **Load unpacked** button on the top-left toolbar.
4. Select this project repository root directory (`Dark-pattern/`).
5. Pin the **DarkGuard AI** shield icon to your toolbar.

### Option B: Local Web Development Server
To run the project development server:
```powershell
# Install dependencies (if not already installed)
npm install

# Start development server
npm run dev
```
The server will start at `http://localhost:3000`.

---

## 6. How to Open and Explore the Test Website

The test website is **100% offline and standalone** with zero external dependencies.

1. **Direct File URL (No Server Required)**:
   * Open `file:///c:/Users/gur83/Dark-pattern/test-site/index.html` in Chrome or Edge, or double-click [`test-site/index.html`](test-site/index.html).
2. **Via Local Server**:
   * Navigate to `http://localhost:3000/test-site/index.html` (or `npx serve test-site`).
3. **Navigating the 14 Pages**:
   * Use the **Evaluation Matrix Hub** at `test-site/index.html` to filter between the **8 planted pages** and **6 clean control pages**.
   * Each page includes a top inspection bar detailing the specific dark pattern under test and quick-jump links.

---

## 7. How to Test the Popup, Highlighter, and Ethical View

1. Navigate to any test page, such as:
   * **Planted Fake Urgency**: [`test-site/planted-urgency-01.html`](test-site/planted-urgency-01.html)
   * **Planted Misleading Discount**: [`test-site/planted-discount-01.html`](test-site/planted-discount-01.html)
   * **Clean Baseline**: [`test-site/clean-coffee-maker.html`](test-site/clean-coffee-maker.html)
2. Click the **DarkGuard AI** extension icon in your browser toolbar to open the popup.
3. Click **Scan this page**:
   * Notice the **"Checking timer..."** status during the 10-second observation window.
   * Review the animated **0–100 Risk Score Gauge** and the **Risk Level Badge**.
   * Inspect the detected findings cards displaying pattern names, evidence snippets, and observation notes.
4. Click on any finding card or its **Locate** button:
   * The page will smoothly scroll to the suspicious element.
   * A non-destructive animated pulse box (`🛡️ Detected Suspicious Element`) will highlight the element.
5. Toggle **Ethical View**:
   * A lavender top banner appears: *"Ethical View Active: X possible issues found. Risk Score: Y/100"*.
   * Small contextual notes appear adjacent to deceptive elements.
   * Product prices, button texts, and checkbox states remain strictly untouched.
6. Click **Show original** in the top banner:
   * Injected notes and banner are cleanly removed.
   * Added outline classes are safely stripped without touching unrelated inline styles or classes.

---

## 8. Integration Architecture

This project was built following the 12-hour hackathon work division across three specialized team roles:

| Role | Engineer | Assigned Components & Ownership |
|---|---|---|
| **Member A** | **Extension Core Engineer** | Scanner (`scanner.js`), 4 rule detectors (`dp1-urgency.ts` to `dp4-extras.ts`), `fusion.js`, `risk.js`, `manifest.json`, and background service worker. |
| **Member B** | **ML & Evaluation Engineer** | Dataset labeling (`ml/data/strings.csv`), TF-IDF logistic regression model (`ml/train.py`, `shaming-v1.json`), JS classifier (`ml/classifier.js`), checksum integrity verification, and evaluation report runner (`eval/run.js`). |
| **Member C** | **Product & Demo Lead** | 14-page test website (`test-site/`), extension popup (`popup/`), suspicious element highlighter (`content/highlighter.js`), Ethical View engine (`content/ethical-view.js`, `ethical-view.css`, `templates.json`), landing page (`landing/`), and documentation (`README.md`). |


---

## 9. Privacy & Safety Guarantees

* **Zero Data Exfiltration**: DarkGuard runs 100% on the client. It sends no DOM trees, cookies, or URLs to external cloud servers.
* **Strict Input Exclusion**: The scanner explicitly ignores sensitive DOM inputs (`type="password"`, `type="email"`, credit card autocomplete fields, CVV, and address fields). It never reads text input values.
* **Critical Safety Policy for Ethical View**:
  1. Never alters visible product price text or reference numbers.
  2. Never disables, modifies, or alters primary action buttons or form submit behaviors.
  3. Never mutates checkbox `.checked` states.
  4. Only removes classes added by Ethical View itself, preserving all concurrent site style mutations.

---


