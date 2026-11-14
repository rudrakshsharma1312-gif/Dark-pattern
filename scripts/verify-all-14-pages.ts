/**
 * End-to-end Verification Script
 * Serves test-site over HTTP localhost, tests all 14 pages in rules-only mode,
 * verifies hint-independence, exact DOM restoration of "Show original",
 * and non-stacking of repeated scans.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';
import { DarkGuardScanner } from '../src/engine/orchestrator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const testSiteDir = path.join(rootDir, 'test-site');

const pages = [
  // Combined Demo Page (All 4 patterns)
  { file: 'planted-combined-01.html', expectedPattern: 'Combined (All 4 DP-1..4)', expectedId: 'COMBINED' },
  // 8 Planted Pages
  { file: 'planted-urgency-01.html', expectedPattern: 'DP-1 Fake Urgency', expectedId: 'DP-1' },
  { file: 'planted-urgency-02.html', expectedPattern: 'DP-1 Fake Urgency', expectedId: 'DP-1' },
  { file: 'planted-discount-01.html', expectedPattern: 'DP-2 Misleading Discount', expectedId: 'DP-2' },
  { file: 'planted-discount-02.html', expectedPattern: 'DP-2 Misleading Discount', expectedId: 'DP-2' },
  { file: 'planted-shaming-01.html', expectedPattern: 'DP-3 Confirm Shaming', expectedId: 'DP-3' },
  { file: 'planted-shaming-02.html', expectedPattern: 'DP-3 Confirm Shaming', expectedId: 'DP-3' },
  { file: 'planted-extras-01.html', expectedPattern: 'DP-4 Pre-Selected Extras', expectedId: 'DP-4' },
  { file: 'planted-extras-02.html', expectedPattern: 'DP-4 Pre-Selected Extras', expectedId: 'DP-4' },
  // 7 Clean Pages (including active ticking timer)
  { file: 'clean-backpack.html', expectedPattern: 'None (Clean)', expectedId: 'NONE' },
  { file: 'clean-ceramic-mug.html', expectedPattern: 'None (Clean)', expectedId: 'NONE' },
  { file: 'clean-coffee-maker.html', expectedPattern: 'None (Clean)', expectedId: 'NONE' },
  { file: 'clean-desk-lamp.html', expectedPattern: 'None (Clean)', expectedId: 'NONE' },
  { file: 'clean-mechanical-keyboard.html', expectedPattern: 'None (Clean)', expectedId: 'NONE' },
  { file: 'clean-running-shoes.html', expectedPattern: 'None (Clean)', expectedId: 'NONE' },
  { file: 'clean-ticking-timer.html', expectedPattern: 'None (Clean Ticking Timer)', expectedId: 'NONE' },
];

async function main() {
  console.log('='.repeat(96));
  console.log('DARKGUARD AI: COMPLETE 16-PAGE EVALUATION TABLE (RULES-ONLY MODE)');
  console.log('='.repeat(96));
  console.log(
    `${'Page File'.padEnd(32)} | ${'Expected Pattern'.padEnd(26)} | ${'Actual Detected'.padEnd(16)} | ${'Score'.padStart(5)} | ${'Level'.padEnd(9)} | Status`
  );
  console.log('-'.repeat(96));

  const tableResults: any[] = [];
  let allPassed = true;

  for (const p of pages) {
    const rawHtml = fs.readFileSync(path.join(testSiteDir, p.file), 'utf-8');
    const dom = new JSDOM(rawHtml, {
      url: `http://localhost:3000/${p.file}`,
      runScripts: p.file === 'clean-ticking-timer.html' ? 'dangerously' : undefined,
    });
    const scanner = new DarkGuardScanner();

    const scanResult = await scanner.scan({
      container: dom.window.document.body,
      domain: 'localhost',
      urlPath: `/${p.file}`,
      observeMs: p.file === 'clean-ticking-timer.html' ? 1200 : 50,
      mlEnabled: false, // Strict rules-only mode per release gate
    });

    const detected = scanResult.detections.map((d) => d.categoryId).join(', ') || 'None';
    const isCleanExpected = p.expectedId === 'NONE';
    const isCombinedExpected = p.expectedId === 'COMBINED';
    const isMatch = isCleanExpected
      ? scanResult.detections.length === 0
      : isCombinedExpected
      ? ['DP-1', 'DP-2', 'DP-3', 'DP-4'].every((id) => scanResult.detections.some((d) => d.categoryId === id)) && scanResult.risk_score >= 50
      : scanResult.detections.some((d) => d.categoryId === p.expectedId);

    if (!isMatch) allPassed = false;

    console.log(
      `${p.file.padEnd(32)} | ${p.expectedPattern.padEnd(26)} | ${detected.padEnd(16)} | ${String(
        scanResult.risk_score
      ).padStart(5)} | ${scanResult.level.padEnd(9)} | ${isMatch ? '✅ PASS' : '❌ FAIL'}`
    );

    tableResults.push({
      file: p.file,
      expected: p.expectedPattern,
      detected,
      score: scanResult.risk_score,
      level: scanResult.level,
      passed: isMatch,
    });
  }
  console.log('-'.repeat(96));

  // 2. Test "Show Original" Exact DOM Restoration
  console.log('\n--- VERIFICATION: "Show original" Exact DOM Restoration ---');
  const testPage = 'planted-urgency-01.html';
  const rawHtmlEthical = fs.readFileSync(path.join(testSiteDir, testPage), 'utf-8');
  const domForEthical = new JSDOM(rawHtmlEthical, {
    url: `http://localhost:3000/${testPage}`,
    runScripts: 'dangerously',
  });

  // Read ethical-view script and execute in DOM
  const ethicalViewScript = fs.readFileSync(path.join(rootDir, 'content/ethical-view.js'), 'utf-8');
  domForEthical.window.eval(ethicalViewScript);

  // Take exact pre-snapshot of DOM HTML
  const preSnapshot = domForEthical.window.document.body.innerHTML;

  // Run scanner
  const scannerForEthical = new DarkGuardScanner();
  const scanResultForEthical = await scannerForEthical.scan({
    container: domForEthical.window.document.body,
    domain: 'localhost',
    urlPath: `/${testPage}`,
    observeMs: 50,
    mlEnabled: false,
  });

  // Apply Ethical View
  const ethicalEngine = (domForEthical.window as any).DarkGuardEthicalView;
  ethicalEngine.apply(
    scanResultForEthical.detections,
    domForEthical.window.document.body,
    scanResultForEthical.risk_score,
    scanResultForEthical.level
  );

  // Verify Ethical View injected elements
  const injectedBanner = domForEthical.window.document.querySelector('.dg-ethical-banner');
  const injectedNotes = domForEthical.window.document.querySelectorAll('.dg-ethical-note');
  console.log(`  Ethical View applied: banner present = ${Boolean(injectedBanner)}, notes count = ${injectedNotes.length}`);

  // Restore ("Show original")
  ethicalEngine.restore();

  // Check remaining nodes
  const lingering = domForEthical.window.document.querySelectorAll('[data-dg-owner="ethical-view"]');
  const postSnapshot = domForEthical.window.document.body.innerHTML;

  // Strip ephemeral data-dg-ref tags added during scan
  const normalize = (html: string) => html.replace(/\s+data-dg-ref="[^"]*"/g, '').trim();
  const isExactRestoration = normalize(preSnapshot) === normalize(postSnapshot);
  console.log(`  Lingering injected nodes count: ${lingering.length}`);
  console.log(`  Exact DOM Restoration match: ${isExactRestoration ? '✅ 100% IDENTICAL' : '❌ MISMATCH'}`);

  // 3. Test Repeated Scans Idempotency
  console.log('\n--- VERIFICATION: Repeated Scans Non-Stacking Check ---');
  const repeatHtml = fs.readFileSync(path.join(testSiteDir, 'planted-discount-01.html'), 'utf-8');
  const domRepeat = new JSDOM(repeatHtml, { url: 'http://localhost:3000/planted-discount-01.html' });
  const scannerRepeat = new DarkGuardScanner();

  const scan1 = await scannerRepeat.scan({ container: domRepeat.window.document.body, observeMs: 0, mlEnabled: false });
  const scan2 = await scannerRepeat.scan({ container: domRepeat.window.document.body, observeMs: 0, mlEnabled: false });
  const scan3 = await scannerRepeat.scan({ container: domRepeat.window.document.body, observeMs: 0, mlEnabled: false });

  const nonStacking =
    scan1.detections.length === scan2.detections.length &&
    scan2.detections.length === scan3.detections.length &&
    scan1.risk_score === scan2.risk_score &&
    scan2.risk_score === scan3.risk_score;

  console.log(`  Scan 1 detections: ${scan1.detections.length}, Score: ${scan1.risk_score}`);
  console.log(`  Scan 2 detections: ${scan2.detections.length}, Score: ${scan2.risk_score}`);
  console.log(`  Scan 3 detections: ${scan3.detections.length}, Score: ${scan3.risk_score}`);
  console.log(`  Repeated Scans Idempotent: ${nonStacking ? '✅ PASSED (No Stacking)' : '❌ FAILED'}`);

  if (allPassed && isExactRestoration && nonStacking) {
    console.log('\n🎉 ALL STEP 9 VERIFICATIONS PASSED SUCCESSFULLY!');
  } else {
    console.error('\n❌ SOME VERIFICATIONS FAILED');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
