# DarkGuard AI 
> Intelligent On-Device Auditor for Deceptive E-Commerce Design Patterns

[![Project Status](https://img.shields.io/badge/Status-12--Hour%20Hackathon%20Build-blue)](#)
[![Privacy First](https://img.shields.io/badge/Privacy-100%25%20On--Device-emerald)](#)
[![Architecture](https://img.shields.io/badge/Architecture-Manifest%20V3%20Extension-indigo)](#)
[![Test Suite](https://img.shields.io/badge/Test%20Bed-16%20Deterministic%20Pages-purple)](test-site/index.html)

---

## 1. Project Overview

**DarkGuard AI** is a lightweight, privacy-first Chromium extension (Chrome / Brave / Edge) designed to detect, contextualize, and neutralize manipulative e-commerce design patterns ("dark patterns"). 

Rather than relying on vague heuristics or sending sensitive shopping data to third-party cloud servers, DarkGuard AI audits visible webpage candidates entirely on-device, verifies evidence mathematically and temporally, generates a **0–100 risk score**, highlights suspicious DOM elements, and activates an **Ethical View** overlay with a one-click **Show Original** restoration guarantee.

---

## 2. Problem Statement & Solution

### The Problem
E-commerce websites frequently deploy psychological coercion tactics:
* **Manufactured Urgency**: Countdown timers that freeze or reset upon reload to fabricate urgency.
* **Miscalculated Discounts**: Slashed "original" prices paired with inflated discount percentages that contradict basic math.
* **Emotional Manipulation**: Guilt-inducing decline buttons (*"No thanks, I hate saving money"*) that pressure shoppers.
* **Hidden Add-ons**: Sneaking insurance, extended warranties, or recurring subscriptions into carts via pre-checked boxes.

### The DarkGuard AI Solution
* **Zero Telemetry / 100% Private**: All rule evaluations run strictly in-browser. Zero passwords, card details, or browsing histories leave your machine.
* **Deterministic Proof**: Every finding provides demonstrable evidence—a 10-second timer freeze observation, an arithmetic mismatch calculation, or an exact shaming phrase match.
* **Ethical View with Show Original**: Annotates manipulative design in-context without ever modifying prices, breaking buttons, or toggling checkboxes. Restores the exact pre-annotation state with one click.

---

## 3. The Four Dark Patterns & Detection Mechanisms

| Category ID | Pattern Name | Detection Mechanism | Verification Proof |
|---|---|---|---|
| **DP-1** | **Fake Urgency & Scarcity** | Temporal Observation & Regex | Samples countdown timers across a 10-second observation window. Unchanging digits are flagged as frozen countdowns. |
| **DP-2** | **Misleading Discount Calculations** | Arithmetic Parsing Heuristics | Parses reference price (`Was`) and sale price (`Now`), calculates `((Was - Now) / Was) * 100`, and flags discrepancies > 5 percentage points. |
| **DP-3** | **Confirm Shaming Phrasing** | Curated Lexicon Match | Checks refusal and decline elements against a curated list of guilt-inducing phrases (*"No, I hate saving"*, *"No thanks, I prefer paying full price"*). |
| **DP-4** | **Pre-Selected Extras & Add-ons** | DOM Attribute & Area Inspection | Identifies `input[type="checkbox"]` with `checked="true"` inside purchase action containers matching warranty, insurance, or protection keywords. |

---

## 4. How to See Each UI Surface

DarkGuard AI provides three dedicated surfaces for judges, evaluators, and shoppers:

### Surface 1: The Real Browser Extension (`popup/` & `dist/darkguard-unpacked`)
* **What it is**: The lightweight, zero-dependency Manifest V3 browser extension popup.
* **How to see it**:
  1. Build the extension package:
     ```bash
     npm run package:extension
     ```
  2. Open `chrome://extensions` in Chrome/Edge, toggle on **Developer mode** (top-right).
  3. Click **Load unpacked** (top-left) and select `dist/darkguard-unpacked`.
  4. *If you already have it loaded*: Click the circular **↺ (Reload)** button on the DarkGuard AI card.
  5. Navigate to any page (e.g. `test-site/planted-combined-01.html`), close and reopen the popup, and click **Scan this page**.

### Surface 2: The Interactive Web App & Simulator (`src/` & `dist-web/`)
* **What it is**: Full-screen interactive dashboard featuring the in-browser Extension Simulator, interactive Test Shop, Evaluation & Ablation Platform, and Architecture explorer.
* **How to see it locally**:
  ```bash
  npm run dev
  ```
  Open `http://localhost:3000` in your browser.
* **Production preview**:
  ```bash
  npm run build:web && npm run preview:web
  ```

### Surface 3: Public Landing Page & 16-Page Test Bed (`landing/` & `test-site/`)
* **What it is**: The marketing landing page, educational walkthrough, and 16-page e-commerce test suite.
* **How to preview both together under the GitHub Pages subpath**:
  ```bash
  npm run serve:site
  ```
  Navigate to:
  * Landing page: `http://localhost:8080/Dark-pattern/`
  * React Web App: `http://localhost:8080/Dark-pattern/app/`
  * 16-Page Test Bed: `http://localhost:8080/Dark-pattern/test-site/`

---

## 5. Judge Quick-Start: Install in 2 Minutes

Follow these quick steps to evaluate DarkGuard AI locally:

1. **Clone & Install**:
   ```bash
   git clone https://github.com/rudrakshsharma1312-gif/Dark-pattern.git
   cd Dark-pattern
   npm install
   ```
2. **Package the Extension**:
   ```bash
   npm run package:extension
   ```
   *Creates a clean, zero-network extension in `dist/darkguard-unpacked/`.*
3. **Load in Chrome / Edge**:
   - Open `chrome://extensions` and enable **Developer mode**.
   - Click **Load unpacked** and select the folder `dist/darkguard-unpacked`.
   - Pin the DarkGuard AI shield icon to your browser toolbar.
4. **Run Live Test**:
   - Start the local test server: `npm run serve:site`
   - Open `http://localhost:8080/Dark-pattern/test-site/planted-combined-01.html`
   - Click the DarkGuard toolbar icon and click **Scan this page**.

---

## 6. Project Architecture & Directory Structure

```
Dark-pattern/
├── background/                 # Extension Service Worker (MV3 activeTab injector)
│   └── service-worker.js
├── content/                    # Content Scripts (Injected into Webpages)
│   ├── scanner.js              # Bundled core detector & candidate extraction engine
│   ├── ethical-view.js         # Safe Ethical View engine & Show Original controller
│   ├── ethical-view.css        # Ethical View styling (banner, notes, outlines)
│   ├── highlighter.js          # Suspicious element locator with pulse overlay
│   └── templates.json          # Ethical template definitions & placeholders
├── popup/                      # Extension Browser Action Popup (Vanilla MV3)
│   ├── popup.html              # Popup DOM (Branding, gauge, findings, dual banners)
│   ├── popup.css               # Popup design tokens & animated circular gauge
│   └── popup.js                # Popup event handling & tab messaging
├── test-site/                  # 16-Page Standalone Evaluation Test Bed
│   ├── index.html              # Test Bed Directory Hub & Judge Evaluation Matrix
│   ├── planted-combined-01.html# Combined Scenario: All 4 dark patterns (Score: 66 High)
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
│   ├── clean-mechanical-keyboard.html # Clean Control: Neutral decline & options
│   └── clean-ticking-timer.html# Clean Control: Actively ticking sale timer (Score: 0)
├── landing/                    # Public Landing Page & Educational Walkthrough
│   ├── css/landing.css         # Responsive landing page stylesheet
│   └── index.html              # 3-step guide, pattern breakdowns, install steps
├── src/                        # Core TypeScript Engine & React Web App
│   ├── engine/                 # Scanner, detectors, fusion, risk, ethical view
│   ├── ml/                     # Classifier, feature extraction, model weights
│   ├── eval/                   # Evaluation runner and labeled test benchmarks
│   ├── components/             # React web preview components & simulator
│   └── App.tsx                 # Main React web application
├── scripts/                    # Build & Verification Tooling
│   ├── build-extension.mjs     # Esbuild bundler for content/scanner.js
│   ├── package-extension.mjs   # Strict asset validator & extension packager
│   ├── serve-site.ts           # Local preview server matching GitHub Pages layout
│   ├── verify-all-pages.ts     # 16-page automated verification suite
│   └── verify-pages-links.ts   # Subpath link & asset crawler
├── dist/                       # Packaged Extension Artifacts
│   ├── darkguard-unpacked/     # Unpacked extension folder for chrome://extensions
│   └── darkguard-extension.zip # Release zip archive
├── dist-web/                   # Web Build Output (Vite output for /app/)
├── docs/                       # Specifications & Documentation
│   ├── EXTENSION_CONTRACT.md   # Message passing API & state machine contract
│   └── DEMO_CHECKLIST.md       # 3-minute judging presentation script
└── .github/workflows/pages.yml # GitHub Pages CI/CD workflow
```

---

## 7. Hosted Live Deployments

* **Landing Page**: `https://rudrakshsharma1312-gif.github.io/Dark-pattern/` *(Live on GitHub Pages after push to main)*
* **React Web App & Simulator**: `https://rudrakshsharma1312-gif.github.io/Dark-pattern/app/`
* **16-Page Test Bed**: `https://rudrakshsharma1312-gif.github.io/Dark-pattern/test-site/`
* **Vercel Preview (Optional)**: `https://<your-project>.vercel.app/` *(Optional deployment)*

---

## 8. Automated Test & Verification Commands

All verifications run locally with zero cloud dependencies:

```bash
# Run Vitest test suite (unit detectors, contract, privacy, real-world clean fixtures)
npm test

# Run 16-page end-to-end verification against test bed (checks all 9 planted & 7 clean pages)
npm run verify:pages

# Run crawler verifying all internal links & assets resolve under /Dark-pattern/
npm run verify:links

# Run real engine evaluation on our test bed
npm run eval:real

# Package unpacked extension and zip
npm run package:extension

# Build React web application for deployment
npm run build:web
```

---

## 9. Model Card & ML Release Gate Disclosure

DarkGuard AI operates a hybrid architecture:
1. **Deterministic Rule Detectors:** Temporal timer monitoring, discount arithmetic verification, curated confirm-shaming lexicons, and checkbox attributes.
2. **On-Device TF-IDF Logistic Classifier:** Scores button and heading text.

### Release Gate (ML-R9) Audit
During rigorous evaluation across 30 labeled fixture pages (20 planted, 10 clean controls):
* While the text model improved recall on ambiguous text, it introduced **4 false alarms across clean control pages (+30% false alarm rate)**.
* **Under strict safety criterion ML-R9 (no increase in false-positive rate over rules), the text model FAILED the release gate.**
* **Engineering Decision:** To protect shopper trust, the extension is shipped with the text model **DISABLED by default** (`ml_enabled: false`). DarkGuard AI runs in high-precision, zero-false-alarm **rules-only mode**.
* *Limitation:* Results reflect evaluation on our own test bed (detectors were tuned on these pages), n=23 pages, rules-only. Real-site performance on arbitrary web stores has not been measured.

---

## 10. Recommended 3-Minute Demo Walkthrough

*(See [`docs/DEMO_CHECKLIST.md`](docs/DEMO_CHECKLIST.md) for full script and timings)*

1. **Combined Planted Page Audit**:
   - Open [`test-site/planted-combined-01.html`](test-site/planted-combined-01.html).
   - Click **Scan this page**.
   - Show the 10-second observation window verifying that the countdown timer is frozen (`00:14:59`).
   - Observe the **Unified Risk Score of 66 / 100 (High Risk)**.
   - Review the 4 detected findings cards (DP-1 Frozen Timer, DP-2 Arithmetic Mismatch, DP-3 Confirm Shaming, DP-4 Pre-Selected Warranty).
2. **Interactive In-Page Features**:
   - Click **Locate** on a finding to demonstrate smooth scrolling and animated pulse highlight box.
   - Toggle **Ethical View** ON: demonstrate the contextual notes and lavender summary banner without altering product prices.
   - Click **Show original**: demonstrate 100% exact DOM restoration with zero lingering nodes.
3. **Clean Control Baseline (Zero False Alarms)**:
   - Open [`test-site/clean-ticking-timer.html`](test-site/clean-ticking-timer.html) or [`test-site/clean-coffee-maker.html`](test-site/clean-coffee-maker.html).
   - Run scan. DarkGuard reports **0 findings (Score: 0 / 100, Low Risk)**. Actively ticking timers are never falsely flagged.
4. **Architecture & Engineering Honesty**:
   - Open the web app at `http://localhost:3000` or `/app/`.
   - Show the **Evaluation & Ablation Platform**: transparently explain that the text model failed the release gate due to false alarms on clean controls, so rules-only was selected for release.
5. **Closing**:
   - 100% on-device, Manifest V3 compliant, zero data exfiltration.
