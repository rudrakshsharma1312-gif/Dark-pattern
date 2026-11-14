/**
 * DarkGuard AI — Real-Browser E2E Smoke Test Suite
 *
 * Runs on real Chromium using Playwright and launchPersistentContext,
 * loading the real unpacked extension from dist/darkguard-unpacked.
 */

import { chromium, BrowserContext, Page, Worker } from 'playwright';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
const extensionPath = path.join(rootDir, 'dist/darkguard-unpacked');
const testSiteDir = path.join(rootDir, 'test-site');
const userDataDir = path.join(rootDir, '.playwright-e2e-session');

interface ConsoleError {
  source: string;
  text: string;
  location?: { url: string; lineNumber?: number; columnNumber?: number };
  stack?: string;
}

interface TestResult {
  file: string;
  description: string;
  expectedPattern: string;
  actualDetected: string;
  expectedScore: string;
  actualScore: number;
  actualLevel: string;
  scanTimeMs: number;
  status: 'PASS' | 'FAIL';
  notes?: string;
}

async function runE2ESmokeTests() {
  console.log('='.repeat(90));
  console.log('DARKGUARD AI: REAL-BROWSER E2E EXTENSION SMOKE TESTS (PLAYWRIGHT CHROMIUM)');
  console.log('='.repeat(90));

  // 0. Ensure extension package exists
  if (!fs.existsSync(extensionPath) || !fs.existsSync(path.join(extensionPath, 'manifest.json'))) {
    console.log('Building dist/darkguard-unpacked extension bundle first...');
    const { execSync } = await import('child_process');
    execSync('npm run package:extension', { cwd: rootDir, stdio: 'inherit' });
  }

  // 1. Start local HTTP server on a free port
  const server = http.createServer((req, res) => {
    let reqPath = req.url?.split('?')[0] || '/';
    if (reqPath === '/favicon.ico') {
      res.writeHead(204);
      res.end();
      return;
    }
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(testSiteDir, reqPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      const mime =
        ext === '.html'
          ? 'text/html'
          : ext === '.css'
          ? 'text/css'
          : ext === '.js'
          ? 'application/javascript'
          : ext === '.json'
          ? 'application/json'
          : 'text/plain';
      res.writeHead(200, { 'Content-Type': mime });
      res.end(fs.readFileSync(filePath));
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  console.log(`[HTTP Server] Serving test-site on dynamic port ${port} (http://localhost:${port})`);

  // Console error tracking
  const capturedConsoleErrors: ConsoleError[] = [];

  // 2. Launch browser with extension
  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  const context: BrowserContext = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  // Attach error listeners to existing and new pages
  function wirePageErrors(page: Page, label: string) {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        capturedConsoleErrors.push({
          source: `${label} (${page.url()})`,
          text: msg.text(),
          location: msg.location(),
        });
      }
    });
    page.on('pageerror', (err) => {
      capturedConsoleErrors.push({
        source: `${label} PageError (${page.url()})`,
        text: err.message,
        stack: err.stack,
      });
    });
  }

  context.on('page', (p) => wirePageErrors(p, 'ContextPage'));

  // Get background service worker
  let [worker] = context.serviceWorkers();
  if (!worker) {
    worker = await context.waitForEvent('serviceworker', { timeout: 10000 });
  }
  const extensionId = worker.url().split('/')[2];
  console.log(`[Extension] Loaded DarkGuard AI (ID: ${extensionId})`);

  // Listen to service worker console errors
  worker.on('console', (msg) => {
    if (msg.type() === 'error') {
      capturedConsoleErrors.push({
        source: 'ServiceWorker',
        text: msg.text(),
        location: msg.location(),
      });
    }
  });

  // Open extension popup page to orchestrate permissions and scans
  const popupPage = await context.newPage();
  wirePageErrors(popupPage, 'PopupPage');
  await popupPage.goto(`chrome-extension://${extensionId}/popup/popup.html`);

  // Grant optional host permissions for http/https testing
  await popupPage.evaluate(async () => {
    return await chrome.permissions.request({
      origins: ['http://*/*', 'https://*/*'],
    });
  });

  const results: TestResult[] = [];

  // Helper to trigger scan on tab via popupPage
  async function triggerScanOnTab(tabUrlSubstring: string, timeoutMs = 20000) {
    return await popupPage.evaluate(
      async ({ substring, timeout }) => {
        const tabs = await chrome.tabs.query({});
        const targetTab = tabs.find((t) => t.url && t.url.includes(substring));
        if (!targetTab || !targetTab.id) {
          throw new Error(`Target tab not found for url substring: ${substring}`);
        }
        const tabId = targetTab.id;

        // 1. Ensure scripts are injected via service worker
        const injectResp: any = await new Promise((resolve) => {
          chrome.runtime.sendMessage({ action: 'ENSURE_INJECTED', tabId }, resolve);
        });

        if (!injectResp || !injectResp.ok) {
          throw new Error(`ENSURE_INJECTED failed: ${injectResp?.error}`);
        }

        // 2. Start scan with 20s timeout
        const scanResp: any = await Promise.race([
          new Promise((resolve) => {
            chrome.tabs.sendMessage(tabId, { action: 'START_SCAN', observeTimer: true }, resolve);
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`START_SCAN timed out after ${timeout}ms`)), timeout)
          ),
        ]);

        return { tabId, injectResp, scanResp };
      },
      { substring: tabUrlSubstring, timeout: timeoutMs }
    );
  }

  try {
    // ----------------------------------------------------------------------------------------
    // Part 2: Scan the 7 Required Pages
    // ----------------------------------------------------------------------------------------
    const testPagesToVerify = [
      {
        file: 'planted-combined-01.html',
        description: 'Combined Featured Demo (All 4 DP-1..4)',
        expectedPattern: 'DP-1, DP-2, DP-3, DP-4',
        expectedScore: '66 High',
        validate: (res: any) => {
          const cats = new Set(res.detections.map((d: any) => d.categoryId));
          return cats.has('DP-1') && cats.has('DP-2') && cats.has('DP-3') && cats.has('DP-4') && res.risk_score === 66 && res.level === 'High';
        },
      },
      {
        file: 'planted-urgency-01.html',
        description: 'Planted Frozen Timer',
        expectedPattern: 'DP-1 Fake Urgency',
        expectedScore: '> 0 (Moderate)',
        validate: (res: any) => res.detections.some((d: any) => d.categoryId === 'DP-1') && res.risk_score > 0,
      },
      {
        file: 'planted-discount-01.html',
        description: 'Planted Misleading Discount',
        expectedPattern: 'DP-2 Misleading Discount',
        expectedScore: '> 0 (Low)',
        validate: (res: any) => res.detections.some((d: any) => d.categoryId === 'DP-2') && res.risk_score > 0,
      },
      {
        file: 'planted-shaming-01.html',
        description: 'Planted Confirm Shaming',
        expectedPattern: 'DP-3 Confirm Shaming',
        expectedScore: '> 0 (Low)',
        validate: (res: any) => res.detections.some((d: any) => d.categoryId === 'DP-3') && res.risk_score > 0,
      },
      {
        file: 'planted-extras-01.html',
        description: 'Planted Pre-selected Warranty',
        expectedPattern: 'DP-4 Pre-Selected Extras',
        expectedScore: '> 0 (Low)',
        validate: (res: any) => res.detections.some((d: any) => d.categoryId === 'DP-4') && res.risk_score > 0,
      },
      {
        file: 'clean-coffee-maker.html',
        description: 'Clean Product Control Page',
        expectedPattern: 'None (Clean)',
        expectedScore: '0 Low',
        validate: (res: any) => res.detections.length === 0 && res.risk_score === 0 && res.level === 'Low',
      },
      {
        file: 'clean-ticking-timer.html',
        description: 'Clean Ticking Countdown Control',
        expectedPattern: 'None (Clean)',
        expectedScore: '0 Low',
        validate: (res: any) => res.detections.length === 0 && res.risk_score === 0 && res.level === 'Low',
      },
    ];

    console.log('\n--- Running Page Verification Scans (20s timeout per scan) ---');
    const contentPage = await context.newPage();
    wirePageErrors(contentPage, 'ContentPage');

    for (const testCase of testPagesToVerify) {
      const pageUrl = `http://localhost:${port}/${testCase.file}`;
      await contentPage.goto(pageUrl, { waitUntil: 'load' });

      const startTime = Date.now();
      const { scanResp } = await triggerScanOnTab(testCase.file, 20000);
      const scanTime = Date.now() - startTime;

      const detectedCategories = Array.from(new Set(scanResp.detections.map((d: any) => d.categoryId))).join(', ') || 'None';
      const isPass = testCase.validate(scanResp);

      results.push({
        file: testCase.file,
        description: testCase.description,
        expectedPattern: testCase.expectedPattern,
        actualDetected: detectedCategories,
        expectedScore: testCase.expectedScore,
        actualScore: scanResp.risk_score,
        actualLevel: scanResp.level,
        scanTimeMs: scanTime,
        status: isPass ? 'PASS' : 'FAIL',
      });

      console.log(`  - ${testCase.file.padEnd(28)}: ${isPass ? '✅ PASS' : '❌ FAIL'} | Score: ${scanResp.risk_score} (${scanResp.level}) | Detected: [${detectedCategories}] (${(scanTime / 1000).toFixed(1)}s)`);
    }

    // ----------------------------------------------------------------------------------------
    // Part 3: Combined Page Deep Interactions (Highlight, Ethical View, DOM Restoration, Idempotence)
    // ----------------------------------------------------------------------------------------
    console.log('\n--- Running Combined Page Interaction Tests ---');
    const combinedUrl = `http://localhost:${port}/planted-combined-01.html`;
    await contentPage.goto(combinedUrl, { waitUntil: 'load' });

    const { tabId, scanResp: combinedScan } = await triggerScanOnTab('planted-combined-01.html', 20000);

    // 3a. Check HIGHLIGHT_ELEMENT works
    const firstFinding = combinedScan.detections[0];
    await popupPage.evaluate(async ({ tId, ref, sel }) => {
      await chrome.tabs.sendMessage(tId, {
        action: 'HIGHLIGHT_ELEMENT',
        candidateRef: ref,
        selector: sel,
      });
    }, { tId: tabId, ref: firstFinding.candidateRef, sel: firstFinding.elementSelector });

    const highlightActive = await contentPage.evaluate(() => {
      const overlay = document.querySelector('.dg-highlighter-overlay');
      return Boolean(overlay);
    });
    console.log(`  - HIGHLIGHT_ELEMENT overlay injected: ${highlightActive ? '✅ PASS' : '❌ FAIL'}`);

    // Dismiss highlight before testing ethical view
    await contentPage.evaluate(() => {
      const overlay = document.querySelector('.dg-highlighter-overlay');
      if (overlay) overlay.remove();
    });

    // 3b. Check TOGGLE_ETHICAL_VIEW adds banner and notes
    const preEthicalBodyHtml = await contentPage.evaluate(() => document.body.innerHTML);

    await popupPage.evaluate(async ({ tId, dets, score, lvl }) => {
      await chrome.tabs.sendMessage(tId, {
        action: 'TOGGLE_ETHICAL_VIEW',
        enabled: true,
        enable: true,
        detections: dets,
        riskScore: score,
        riskLevel: lvl,
      });
    }, { tId: tabId, dets: combinedScan.detections, score: combinedScan.risk_score, lvl: combinedScan.level });

    const ethicalViewInjected = await contentPage.evaluate(() => {
      const banner = document.querySelector('.dg-ethical-banner, [data-dg-id="ET-BANNER-01"]');
      const notes = document.querySelectorAll('.dg-ethical-note, [data-dg-owner="ethical-view"]:not(.dg-ethical-banner)');
      return { hasBanner: Boolean(banner), notesCount: notes.length };
    });
    console.log(`  - TOGGLE_ETHICAL_VIEW banner present: ${ethicalViewInjected.hasBanner ? '✅ PASS' : '❌ FAIL'}, notes: ${ethicalViewInjected.notesCount}`);

    // 3c. Click "Show original" in banner and confirm exact DOM restoration
    await contentPage.click('#dg-show-original-btn');
    const restoredBodyHtml = await contentPage.evaluate(() => document.body.innerHTML);
    const isRestoredExact = preEthicalBodyHtml === restoredBodyHtml;
    console.log(`  - "Show original" Exact DOM Restoration: ${isRestoredExact ? '✅ PASS' : '❌ FAIL'}`);

    // 3d. Run 3 repeated scans and confirm no stacked highlights or notes
    for (let i = 1; i <= 3; i++) {
      await triggerScanOnTab('planted-combined-01.html', 20000);
    }
    const lingeringNodesCount = await contentPage.evaluate(() => {
      return document.querySelectorAll('.dg-highlighter-overlay, [data-dg-owner="ethical-view"]').length;
    });
    console.log(`  - Repeated Scans Idempotent (Lingering nodes: ${lingeringNodesCount}): ${lingeringNodesCount === 0 ? '✅ PASS' : '❌ FAIL'}`);

    // ----------------------------------------------------------------------------------------
    // Part 4: Restricted-Page Case (chrome://extensions)
    // ----------------------------------------------------------------------------------------
    console.log('\n--- Running Restricted-Page Safety Gate Test ---');
    const restrictedPage = await context.newPage();
    wirePageErrors(restrictedPage, 'RestrictedPage');
    await restrictedPage.goto('chrome://extensions/');
    await restrictedPage.bringToFront();

    const restrictedTestResult = await popupPage.evaluate(async () => {
      const tabs = await chrome.tabs.query({});
      const restTab = tabs.find((t) => !t.url || t.url.startsWith('chrome://'));
      if (!restTab || !restTab.id) {
        return { handled: false, error: 'Restricted tab not found in chrome.tabs' };
      }

      const injectResp: any = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'ENSURE_INJECTED', tabId: restTab.id }, resolve);
      });

      return {
        handled: true,
        ok: injectResp?.ok,
        error: injectResp?.error,
      };
    });

    const isRestrictedSafe =
      restrictedTestResult.handled &&
      restrictedTestResult.ok === false &&
      Boolean(restrictedTestResult.error?.includes('restricts extension scripts'));

    console.log(`  - Restricted page blocked gracefully: ${isRestrictedSafe ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`    Message returned: "${restrictedTestResult.error}"`);

    // ----------------------------------------------------------------------------------------
    // Part 5: Console Error Audit
    // ----------------------------------------------------------------------------------------
    console.log('\n--- Console Error Audit (Service Worker & Pages) ---');
    if (capturedConsoleErrors.length === 0) {
      console.log('  ✅ ZERO console errors captured across all pages and service worker!');
    } else {
      console.log(`  ⚠️ Captured ${capturedConsoleErrors.length} console error(s):`);
      capturedConsoleErrors.forEach((err, idx) => {
        console.log(`    [Error ${idx + 1}] Source: ${err.source}`);
        console.log(`             Message: ${err.text}`);
        if (err.location) {
          console.log(`             Location: ${err.location.url}:${err.location.lineNumber}:${err.location.columnNumber}`);
        }
      });
    }

    // ----------------------------------------------------------------------------------------
    // Part 6: Formatted Pass/Fail Summary Table
    // ----------------------------------------------------------------------------------------
    console.log('\n' + '='.repeat(100));
    console.log('DARKGUARD AI REAL-BROWSER SMOKE TEST EVALUATION MATRIX');
    console.log('='.repeat(100));
    console.log(
      `${'Scenario / Page'.padEnd(28)} | ${'Expected Pattern'.padEnd(26)} | ${'Detected'.padEnd(22)} | ${'Score'.padStart(5)} | ${'Time'.padStart(6)} | ${'Status'.padStart(6)}`
    );
    console.log('-'.repeat(100));
    for (const r of results) {
      console.log(
        `${r.file.padEnd(28)} | ${r.expectedPattern.padEnd(26)} | ${r.actualDetected.padEnd(22)} | ${String(r.actualScore).padStart(5)} | ${(r.scanTimeMs / 1000).toFixed(1).padStart(5)}s | ${r.status.padStart(6)}`
      );
    }
    console.log('-'.repeat(100));
    console.log(`Interaction Checks: HIGHLIGHT (${highlightActive ? 'PASS' : 'FAIL'}), ETHICAL VIEW (${ethicalViewInjected.hasBanner ? 'PASS' : 'FAIL'}), DOM RESTORATION (${isRestoredExact ? 'PASS' : 'FAIL'}), NON-STACKING (${lingeringNodesCount === 0 ? 'PASS' : 'FAIL'})`);
    console.log(`Restricted Page Safety Gate: ${isRestrictedSafe ? 'PASS' : 'FAIL'}`);
    console.log(`Console Errors Total: ${capturedConsoleErrors.length}`);
    console.log('='.repeat(100));

    // Determine final exit code
    const allScansPassed = results.every((r) => r.status === 'PASS');
    const allInteractionsPassed = highlightActive && ethicalViewInjected.hasBanner && isRestoredExact && lingeringNodesCount === 0 && isRestrictedSafe;
    const zeroConsoleErrors = capturedConsoleErrors.length === 0;

    if (allScansPassed && allInteractionsPassed && zeroConsoleErrors) {
      console.log('\n🎉 ALL REAL-BROWSER E2E SMOKE TESTS PASSED PERFECTLY!\n');
    } else {
      console.error('\n❌ E2E Smoke Tests failed one or more assertions.\n');
      process.exit(1);
    }
  } finally {
    await context.close();
    server.close();
    if (fs.existsSync(userDataDir)) {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
  }
}

runE2ESmokeTests().catch((err) => {
  console.error('\n❌ Unhandled E2E Runner Error:', err);
  process.exit(1);
});
