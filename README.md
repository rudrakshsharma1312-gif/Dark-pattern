<div align="center">

# DarkGuard AI

### See the trick behind the deal.

**A privacy-first Chrome & Edge extension that spots dark patterns on shopping pages, shows the proof, and lets you read the page honestly with one click.**

![Chrome and Edge](https://img.shields.io/badge/Chrome%20%7C%20Edge-Manifest%20V3-4F46E5)
![On-device](https://img.shields.io/badge/Runs-100%25%20in%20your%20browser-10B981)
![Patterns](https://img.shields.io/badge/Dark%20patterns-4%20detected-F59E0B)
![Test bed](https://img.shields.io/badge/Test%20site-14%20pages-8B5CF6)
![Hackathon](https://img.shields.io/badge/Built%20in-12--hour%20hackathon-0EA5E9)

[**Install in 2 minutes**](#install-in-2-minutes) · [**Try it yourself**](#try-it-yourself) · [**How it works**](#how-it-works) · [**Results**](#results-the-honest-numbers) · [**Roadmap**](#roadmap)

</div>

---

## The problem

You are about to buy something online.

- A timer says **"Deal ends in 14:59"**. You refresh. Still **14:59**.
- **"70% OFF!"** But the old price is **$400** and the new one is **$200**. That is 50%.
- The decline button says **"No thanks, I prefer paying full price."**
- A **$49.99 warranty** is already ticked in your cart.

These are **dark patterns**: interface tricks designed to make you decide fast, not decide well. Nothing in your browser warns you about them. Until now.

## What DarkGuard AI does

Click **Scan this page** and DarkGuard AI:

1. **Finds** four kinds of manipulation on the page.
2. **Proves** each one with evidence you can check yourself.
3. **Scores** the page from 0 to 100 so you see the risk at a glance.
4. **Points** at the exact element when you click a finding.
5. **Explains** in plain language with **Ethical View**, and restores the original page with one click.

| | |
|---|---|
| **Evidence-based findings** | A frozen timer, a failed percentage calculation, a matched guilt phrase, a ticked box. Every finding shows its proof. |
| **Private by design** | No backend. No account. The scanner never reads what you type. Nothing leaves your browser. |
| **Safe Ethical View** | It only *adds* notes and a banner. It never edits a price, a button or a checkbox. **Show original** undoes everything. |
| **Fast** | Rule checks run on the page itself. The optional text model is a small JSON file that runs offline. |

## See it in action

<!-- Add your screenshots to docs/screenshots/ and keep these names, or delete this section. -->

| Popup with risk gauge | Locate the evidence | Ethical View |
|:---:|:---:|:---:|
| ![Popup](docs/screenshots/popup.png) | ![Highlighter](docs/screenshots/highlight.png) | ![Ethical View](docs/screenshots/ethical-view.png) |

## The four patterns we catch

| ID | Pattern | How we detect it | The proof you see |
|:--:|---|---|---|
| **DP-1** | **Fake urgency** | Read the countdown, wait 10 seconds, read again | "Timer did not change in 10 seconds" |
| **DP-2** | **Misleading discount** | Compare old price with the stated percent off (Rs, $ and EUR). Flag a gap above 5 points | The arithmetic, shown on screen |
| **DP-3** | **Confirm shaming** | Match decline buttons against a list of about 40 guilt phrases | The matched phrase |
| **DP-4** | **Pre-selected extras** | Find ticked add-on boxes (insurance, warranty, gift wrap) near Add to cart | The ticked box, highlighted |

## How it works

````mermaid
flowchart LR
    A[Visible page elements<br/>buttons, labels, checkboxes, prices] --> B[Scanner]
    B --> C[4 rule detectors<br/>DP-1 to DP-4]
    B -.optional.-> D[Text model<br/>TF-IDF + logistic regression]
    C --> E[Fusion]
    D -.-> E
    E --> F[Risk score 0-100]
    F --> G[Popup + Highlighter + Ethical View]
````

- **Scanner** lists the visible candidates (text, tag, position, selector). It never reads input values.
- **Rule detectors** collect evidence you can verify. This is the trusted core.
- **Text model (optional, off by default)** reads short button and label wording. It cannot prove anything, so its hits are shown as *possible pattern, low certainty* and count at half weight in the score.
- **Fusion** merges everything into one list. Each detection keeps its source: rule or ML.
- **Risk score** combines detections using four category weights.

## Results: the honest numbers

We tested on **30 labeled fixture pages**: 20 with planted patterns (42 planted patterns in total) and 10 clean pages.

| Setup | Planted patterns caught | Clean pages falsely flagged |
|---|:---:|:---:|
| **Rules only (shipped)** | **24 / 42** (57.1%) | **0 / 10** |
| Rules + text model | 34 / 42 (81.0%) | 3 / 10 |

**Why the text model ships turned off:** it found 10 more patterns, but every extra catch was low certainty and it put false flags on 3 of 10 clean pages. A tool that raises false alarms loses trust, so we kept the verified rules and documented the fix.

Rules-only recall by category: DP-1 0.64 · DP-2 0.40 · DP-3 0.80 · DP-4 0.45 (precision 1.00 on these pages).

**What these numbers do and do not mean**

- The pages and the training strings are **ours**. Real shops will be harder.
- About 10 planted pages per category, so one page moves a score by 9 to 10 points.
- The eval uses fixture element lists, not the live scanner on rendered pages.
- The text model was trained on 823 hand-written strings by one labeler. We report that as in-distribution only.
- DP-2 and DP-4 are our weakest detectors. Fixing them is first on the roadmap.

## Privacy and safety

- **No data leaves the browser.** No backend, no account, no analytics.
- **The scanner ignores sensitive inputs** (passwords, email, card, CVV, address fields) and never reads what you type.
- **Ethical View safety rules**
  1. Never changes price text or numbers.
  2. Never disables or alters buttons or form submits.
  3. Never changes a checkbox state.
  4. Only removes the classes and notes it added itself.
- **Model integrity:** the text model is checked with a SHA-256 hash at load. If the file is missing or changed, the scan falls back to rules only. The hash catches accidental damage, not deliberate tampering.

---

## Install in 2 minutes

DarkGuard AI runs in **Google Chrome** and **Microsoft Edge**. No store account needed.

### Step 1: Get the code

**Option A: download the ZIP**
1. Open this repository on GitHub.
2. Click the green **Code** button, then **Download ZIP**.
3. Unzip it. You should get a folder named `Dark-pattern-main`.

**Option B: clone with Git**
````bash
git clone https://github.com/rudrakshsharma1312-gif/Dark-pattern.git
````

### Step 2: Load it in your browser

1. Open the extensions page:
   - **Chrome:** type `chrome://extensions` in the address bar
   - **Edge:** type `edge://extensions` in the address bar
2. Turn on **Developer mode** (toggle at the top right in Chrome, bottom left in Edge).
3. Click **Load unpacked**.
4. Select the project folder that contains **`manifest.json`** (the repository root).
5. **DarkGuard AI** now appears in your extension list.

### Step 3: Pin it and scan

1. Click the puzzle-piece icon in the toolbar and **pin** the DarkGuard AI shield.
2. Open any shopping page, or one of our [test pages](#try-it-yourself).
3. **Refresh the page once** (tabs that were already open before install do not get the scanner).
4. Click the shield, then **Scan this page**.
5. Wait about 10 seconds while it says "Checking timer...". That is the urgency check at work.

### Troubleshooting

| Problem | Fix |
|---|---|
| "Manifest file is missing or unreadable" | You selected the wrong folder. Pick the one that directly contains `manifest.json`. |
| Scan does nothing on a test page opened from your disk (`file://`) | Open the extension's **Details** page and turn on **Allow access to file URLs**. Or serve the test site locally: `npx serve test-site`. |
| Scan does nothing on a page that was already open | Refresh the page, then scan again. |
| Cannot scan `chrome://` or Web Store pages | Browsers block extensions on those pages. Try a normal website. |
| You pulled new code | On the extensions page, click the **reload** icon on the DarkGuard AI card, then refresh your test page. |

---

## Try it yourself

We built a **14-page offline test site** so you can see every pattern, and see the tool stay quiet on honest pages. Open `test-site/index.html` (the hub), or jump straight in:

| Try this page | What is planted | What you should see |
|---|---|---|
| [`planted-urgency-01.html`](test-site/planted-urgency-01.html) | A timer frozen at `00:14:59` | DP-1 finding and a high risk score |
| [`planted-discount-01.html`](test-site/planted-discount-01.html) | "70% off" where $400 to $200 is really 50% | DP-2 finding with the arithmetic |
| [`planted-shaming-01.html`](test-site/planted-shaming-01.html) | "No thanks, I prefer paying full price" | DP-3 finding with the matched phrase |
| [`planted-extras-01.html`](test-site/planted-extras-01.html) | A pre-checked $49.99 warranty | DP-4 finding, checkbox highlighted |
| [`clean-coffee-maker.html`](test-site/clean-coffee-maker.html) | Nothing. Honest pricing | **0 findings**. It does not raise false alarms |

### 60-second walkthrough

1. Open `planted-urgency-01.html` and click **Scan this page**. Watch the gauge fill.
2. Click a finding or its **Locate** button. The page scrolls and pulses the exact element.
3. Switch on **Ethical View**. A banner and small notes appear. Prices, buttons and checkboxes stay untouched.
4. Click **Show original**. The page is back exactly as it was.
5. Open `clean-coffee-maker.html` and scan. Zero findings.

---

## Project structure

````
Dark-pattern/
├── content/        Content scripts: scanner, Ethical View, highlighter
├── popup/          Extension popup: scan button, findings, risk gauge
├── src/            TypeScript engine: detectors, fusion, risk score
├── ml/             Text model: data, training, JS classifier, model card
├── eval/           Evaluation runner and labeled fixture pages
├── test-site/      14-page offline test bed (8 planted, 6 clean)
├── landing/        Landing page and install walkthrough
└── LATER.md        What we would build next
````

## Built with

JavaScript and TypeScript · Chrome Extension **Manifest V3** · TF-IDF and logistic regression (trained in Python, run in plain JavaScript) · React and Vite for the web preview

### Optional: run the web preview

The extension does not need this. It is a development preview only.

````bash
npm install
npm run dev
````

### Re-run the evaluation

````bash
./node_modules/.bin/tsx eval/run.ts
````

---

## Roadmap

- **Stronger DP-2 and DP-4 detectors** (our weakest two today)
- **Retrain the text model** with a placeholder for numbers, neutral hard negatives and a second labeler, then re-test the clean-page check before turning it on
- **Test on real, rendered shop pages**, not only our fixtures
- **More languages and regions** (today: English pages, prices in Rs, $ and EUR)
- **More patterns** beyond the first four
- **A Settings toggle** for the text model

See [`LATER.md`](LATER.md) for the full list.

## Team

| Role | Owns | Who |
|---|---|---|
| **Core engine** | Scanner, four rule detectors, fusion, risk score, extension manifest | _add name_ |
| **ML and evaluation** | Dataset, text model, classifier, integrity check, eval runner | _add name_ |
| **Product and demo** | Test site, popup, highlighter, Ethical View, landing page | _add name_ |

## Responsible use

DarkGuard AI shows you things worth checking. Findings are evidence for you to judge, not verdicts about any shop. Text-model hits are always labeled *possible pattern, low certainty*.

---

<div align="center">

**DarkGuard AI does not tell you what to buy. It shows you what the page is doing, with proof, so the decision stays yours.**

</div>
````
````

Copy everything between the first and last fence lines and paste it into `README.md` in your repo. Before you commit, replace the three "_add name_" entries in the Team table with your teammates' names, and add the screenshots or delete the "See it in action" section.