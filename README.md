# DarkGuard AI 🛡️
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

1. **Hosted Live Deployments**:
   * **GitHub Pages**: `https://aditri-web.github.io/Dark-pattern/test-site/` (Test Bed) and `https://aditri-web.github.io/Dark-pattern/` (Landing Page)
   * **Vercel Preview**: `https://<your-project>.vercel.app/test-site/` (Placeholder until project is deployed via Vercel)
2. **Local Static Server**:
   * Serve `test-site/` directly using standard static server:
     ```bash
     npx serve test-site
     ```
     Navigate to `http://localhost:3000` (or the printed port).
   * Or run development server:
     ```bash
     npm run dev
     ```
3. **Direct File URL (Zero Setup)**:
   * Open `test-site/index.html` directly in Chrome or Edge by double-clicking [`test-site/index.html`](test-site/index.html).
4. **Navigating the 16 Scenarios**:
   * Use the **Evaluation Matrix Hub** at `test-site/index.html` to explore the **Featured Combined Demo** (`planted-combined-01.html`), the **8 single-pattern planted pages**, and the **7 clean control pages** (including `clean-ticking-timer.html`).
   * Each page includes a top inspection bar detailing the specific dark pattern under test and quick-jump links.

### Automated Test & Verification Commands
- `npm test`: Runs Vitest across all test suites (detectors, hint independence, privacy, contract, and real-world clean fixtures).
- `npm run verify:pages`: Runs the 16-page end-to-end verification script (`scripts/verify-all-pages.ts`) against the test site, checking all 9 planted and 7 clean pages with DOM restoration.
- `npm run eval:real`: Runs real engine evaluation on our own test bed (detectors were tuned on these pages), n=23 pages, rules-only. *Limitation: Real-site performance on live web stores has not been measured.*
- `npm run package:extension`: Bundles `content/scanner.js`, validates manifest paths, and creates `dist/darkguard-extension.zip`.

---

## 6b. Manual Verification Checklist for Loaded Unpacked Extension

Follow this checklist to verify DarkGuard AI in Google Chrome or Microsoft Edge:

1. **Load Unpacked Extension**:
   * Open `chrome://extensions` (or `edge://extensions`).
   * Enable **Developer mode** (toggle in upper right).
   * Click **Load unpacked** and select the repository root directory (where `manifest.json` resides).
   * Confirm **DarkGuard AI** (v0.3.0) appears in the extensions list. Pin its icon to the toolbar.
2. **ActiveTab Dynamic Injection Test**:
   * Open [`test-site/planted-urgency-01.html`](test-site/planted-urgency-01.html) in a tab.
   * Click the DarkGuard toolbar icon.
   * Click **Scan this page**.
   * Verify the **10-second countdown** UI observes the timer digits.
   * Verify detection of **DP-1 Fake Urgency** with a 0–100 risk score and findings card.
3. **Highlighter Verification**:
   * Click the **Locate** button on the finding card.
   * Verify the page smoothly scrolls to the countdown timer and displays the animated pulse outline (`🛡️ Detected Suspicious Element`).
4. **Ethical View & Exact Restoration Verification**:
   * Toggle the **Ethical View** switch.
   * Confirm the lavender top banner and contextual note callouts appear.
   * Click **Show original** in the banner.
   * Verify 100% exact DOM restoration: all notes and outline classes are stripped with zero residual layout artifacts.
5. **Clean Baseline Check (No False Positives)**:
   * Open [`test-site/clean-coffee-maker.html`](test-site/clean-coffee-maker.html).
   * Run a scan. Verify **0 findings** are reported and the risk level is **Low (0/100)**.
6. **Restricted Page Safety Gate**:
   * Open `chrome://extensions` and click **Scan this page**.
   * Verify the popup displays a graceful error message indicating the browser restricts extension scripts on internal pages.

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

## 8. Integration Architecture & Team Responsibilities

This project was built following the 12-hour hackathon work division across three specialized team roles:

| Role | Engineer | Assigned Components & Ownership |
|---|---|---|
| **Member A** | **Extension Core Engineer** | Scanner (`scanner.js`), 4 rule detectors (`dp1-urgency.ts` to `dp4-extras.ts`), `fusion.js`, `risk.js`, `manifest.json`, and background service worker. |
| **Member B** | **ML & Evaluation Engineer** | Dataset labeling (`ml/data/strings.csv`), TF-IDF logistic regression model (`ml/train.py`, `shaming-v1.json`), JS classifier (`ml/classifier.js`), checksum integrity verification, and evaluation report runner (`eval/run.js`). |
| **Member C** | **Product & Demo Lead** | 14-page test website (`test-site/`), extension popup (`popup/`), suspicious element highlighter (`content/highlighter.js`), Ethical View engine (`content/ethical-view.js`, `ethical-view.css`, `templates.json`), landing page (`landing/`), and documentation (`README.md`). |

### Current Integration Status & Known Dependencies
* **Core Extension Engine (Member A)**: Complete and fully integrated. Background service worker handles MV3 dynamic script injection (`chrome.scripting.executeScript`) on user click, avoiding static `<all_urls>` permissions. Bundled into `content/scanner.js`.
* **UI Components (Member C)**: Popup UI, interactive circular risk gauge, suspicious element highlighter (`content/highlighter.js`), and safe Ethical View engine (`content/ethical-view.js`) are fully wired and functional.
* **Production Release Gate Decision (ML Shipped OFF)**: As documented in the Model Card (`ml/model-card-v1.md`), the ML text classifier is shipped **OFF** (`ml_enabled: false`) by release gate decision. While the trained model is packaged with SHA-256 integrity validation, rules-only achieved 0 false alarms across all clean fixture pages, whereas ML increased false positive risk on neutral strings. The extension and demo run in deterministic, high-precision **rules-only mode**.

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

## 10. 3-Minute Hackathon Demo Script

* **0:00 – 0:50 (All-in-One Live Demo on Combined Page)**: Open the featured combined demo page [`test-site/planted-combined-01.html`](test-site/planted-combined-01.html). Click **Scan this page**.
  - Show the 10-second temporal observation window actively monitoring the countdown digits.
  - Observe the **High Risk Score of 66/100** (exceeding the 50+ High threshold) generated by all 4 dark patterns firing together without artificial weight inflation.
  - Highlight each finding card: DP-1 Frozen Timer (`00:14:59`), DP-2 Arithmetic Mismatch (Stated 70% vs actual 50%), DP-3 Confirm Shaming Decline ("No thanks, I prefer paying full price"), and DP-4 Pre-Selected Warranty Checkbox (+$49.99).
* **0:50 – 1:30 (Suspicious Element Highlighter & Ethical View)**:
  - Click **Locate** on any card to show the smooth scroll and non-destructive animated pulse outline (`🛡️ Detected Suspicious Element`).
  - Toggle **Ethical View** ON: demonstrate the lavender top banner and in-context educational notes placed adjacent to deceptive elements.
  - Click **Show original** in the banner: demonstrate 100% exact DOM restoration with zero residual layout shifts or altered styles.
* **1:30 – 2:10 (Clean Control Baseline - Zero False Alarms)**:
  - Open clean control page [`test-site/clean-coffee-maker.html`](test-site/clean-coffee-maker.html) or [`test-site/clean-ticking-timer.html`](test-site/clean-ticking-timer.html).
  - Run scan. Demonstrate that DarkGuard reports **0 findings (Risk Score: 0, Low)**, proving that genuinely decrementing timers and honest pricing are never falsely flagged.
* **2:10 – 2:45 (Architecture & ML Release Gate Disclosure)**:
  - Present the architectural design: lightweight Manifest V3 with dynamic `activeTab` injection and zero static URL permissions.
  - Transparently disclose the **ML Release Gate decision**: ML is shipped OFF (`ml_enabled: false`) to guarantee zero false positives, with the demo running purely on deterministic, verified rules.
* **2:45 – 3:00 (Closing Summary)**:
  - Emphasize total on-device consumer privacy (zero data leaves the client) and reversibility.
