import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import { DarkGuardScanner } from '../src/engine/orchestrator';

describe('Step 2: Detector Hint Independence (Strip all data-dg-* hints)', () => {
  const testSiteDir = path.resolve(__dirname, '../test-site');

  const plantedPages: Array<{ file: string; expectedCategory: string; expectedId: string }> = [
    { file: 'planted-urgency-01.html', expectedCategory: 'fake_urgency', expectedId: 'DP-1' },
    { file: 'planted-urgency-02.html', expectedCategory: 'fake_urgency', expectedId: 'DP-1' },
    { file: 'planted-discount-01.html', expectedCategory: 'misleading_discount', expectedId: 'DP-2' },
    { file: 'planted-discount-02.html', expectedCategory: 'misleading_discount', expectedId: 'DP-2' },
    { file: 'planted-shaming-01.html', expectedCategory: 'confirm_shaming', expectedId: 'DP-3' },
    { file: 'planted-shaming-02.html', expectedCategory: 'confirm_shaming', expectedId: 'DP-3' },
    { file: 'planted-extras-01.html', expectedCategory: 'preselected_extra', expectedId: 'DP-4' },
    { file: 'planted-extras-02.html', expectedCategory: 'preselected_extra', expectedId: 'DP-4' },
  ];

  const cleanPages: string[] = [
    'clean-backpack.html',
    'clean-ceramic-mug.html',
    'clean-coffee-maker.html',
    'clean-desk-lamp.html',
    'clean-mechanical-keyboard.html',
    'clean-running-shoes.html',
  ];

  function stripAllHints(html: string): string {
    // Strip data-dg-* attributes (data-dg-frozen, data-dg-target, data-dg-action, etc.)
    // Also strip data-action-area and data-price-group
    return html
      .replace(/\s+data-dg-[a-zA-Z0-9_-]+(=["'][^"']*["'])?/gi, '')
      .replace(/\s+data-action-area(=["'][^"']*["'])?/gi, '')
      .replace(/\s+data-price-group(=["'][^"']*["'])?/gi, '');
  }

  function stripAllHintsAndClasses(html: string): string {
    // 1. Strip all data-dg-*, data-action-area, data-price-group attributes
    let result = stripAllHints(html);

    // 2. Strip or rename every test-site-specific class on decline buttons, price containers, add-on blocks, and timers
    // Keeping tag, text, and DOM structure
    const targetClasses = [
      'decline-btn',
      'secondary-action',
      'decline-action',
      'cancel-action',
      'price-container',
      'product-pricing',
      'pricing',
      'was-price',
      'original-price',
      'current-price',
      'sale-price',
      'final-price',
      'now-price',
      'addon-card',
      'addon-checkbox',
      'addon-item',
      'addon-group',
      'addon-label-flex',
      'addon-content',
      'addon-title',
      'addon-price',
      'addon-desc',
      'timer-container',
      'countdown',
      'urgent',
      'timer',
      'timer-icon',
      'timer-text-wrap',
      'timer-label',
      'timer-digits',
      'countdown-timer',
      'price',
      'discount',
      'discount-badge',
    ];

    // Only replace within class attributes to preserve inner text
    result = result.replace(/class=(["'])(.*?)\1/gi, (match, quote, classVal) => {
      let updated = classVal;
      for (const cls of targetClasses) {
        const regex = new RegExp(`\\b${cls}\\b`, 'gi');
        updated = updated.replace(regex, 'x-generic-neutral');
      }
      return `class=${quote}${updated}${quote}`;
    });

    return result;
  }

  it.each(plantedPages)('detects planted pattern in $file with ALL hints stripped', async ({ file, expectedCategory, expectedId }) => {
    const rawHtml = fs.readFileSync(path.join(testSiteDir, file), 'utf-8');
    const strippedHtml = stripAllHints(rawHtml);

    // Verify hints are actually removed
    expect(strippedHtml).not.toContain('data-dg-frozen');
    expect(strippedHtml).not.toContain('data-dg-target');
    expect(strippedHtml).not.toContain('data-dg-action');

    const dom = new JSDOM(strippedHtml, { url: `http://localhost:3000/${file}` });
    const scanner = new DarkGuardScanner();

    // Use a short observe window (50ms) to verify temporal snapshot comparison without delaying test suite
    const result = await scanner.scan({
      container: dom.window.document.body,
      domain: 'localhost',
      urlPath: `/${file}`,
      observeMs: 50,
      mlEnabled: false, // Strict rules-only verification
    });

    const matched = result.detections.filter((d) => d.categoryId === expectedId || d.category === expectedCategory);
    expect(matched.length).toBeGreaterThanOrEqual(1);
    expect(matched[0].categoryId).toBe(expectedId);
    expect(result.risk_score).toBeGreaterThan(0);
  });

  it.each(cleanPages)('produces ZERO detections in clean page $file with ALL hints stripped', async (file) => {
    const rawHtml = fs.readFileSync(path.join(testSiteDir, file), 'utf-8');
    const strippedHtml = stripAllHints(rawHtml);

    const dom = new JSDOM(strippedHtml, { url: `http://localhost:3000/${file}` });
    const scanner = new DarkGuardScanner();

    const result = await scanner.scan({
      container: dom.window.document.body,
      domain: 'localhost',
      urlPath: `/${file}`,
      observeMs: 50,
      mlEnabled: false,
    });

    expect(result.detections.length).toBe(0);
    expect(result.risk_score).toBe(0);
    expect(result.level).toBe('Low');
  });

  describe('Step 2 (Part B): Heavy Stripping (Strip hints AND rename/strip all test-site specific classes)', () => {
    it.each(plantedPages)('detects planted pattern in $file with hints stripped AND classes stripped/renamed', async ({ file, expectedCategory, expectedId }) => {
      const rawHtml = fs.readFileSync(path.join(testSiteDir, file), 'utf-8');
      const heavyStrippedHtml = stripAllHintsAndClasses(rawHtml);

      // Verify hints are gone
      expect(heavyStrippedHtml).not.toContain('data-dg-frozen');
      expect(heavyStrippedHtml).not.toContain('data-dg-target');
      expect(heavyStrippedHtml).not.toContain('data-dg-action');
      expect(heavyStrippedHtml).not.toContain('data-price-group');
      expect(heavyStrippedHtml).not.toContain('data-action-area');

      // Verify specific classes were stripped/renamed
      expect(heavyStrippedHtml).not.toMatch(/\bdecline-btn\b/i);
      expect(heavyStrippedHtml).not.toMatch(/\bsecondary-action\b/i);
      expect(heavyStrippedHtml).not.toMatch(/\bprice-container\b/i);
      expect(heavyStrippedHtml).not.toMatch(/\baddon-checkbox\b/i);
      expect(heavyStrippedHtml).not.toMatch(/\btimer-container\b/i);

      const dom = new JSDOM(heavyStrippedHtml, { url: `http://localhost:3000/${file}` });
      const scanner = new DarkGuardScanner();

      const result = await scanner.scan({
        container: dom.window.document.body,
        domain: 'localhost',
        urlPath: `/${file}`,
        observeMs: 50,
        mlEnabled: false,
      });

      const matched = result.detections.filter((d) => d.categoryId === expectedId || d.category === expectedCategory);
      expect(matched.length).toBeGreaterThanOrEqual(1);
      expect(matched[0].categoryId).toBe(expectedId);
      expect(result.risk_score).toBeGreaterThan(0);
    });

    it.each(cleanPages)('produces ZERO detections in clean page $file with hints stripped AND classes stripped/renamed', async (file) => {
      const rawHtml = fs.readFileSync(path.join(testSiteDir, file), 'utf-8');
      const heavyStrippedHtml = stripAllHintsAndClasses(rawHtml);

      const dom = new JSDOM(heavyStrippedHtml, { url: `http://localhost:3000/${file}` });
      const scanner = new DarkGuardScanner();

      const result = await scanner.scan({
        container: dom.window.document.body,
        domain: 'localhost',
        urlPath: `/${file}`,
        observeMs: 50,
        mlEnabled: false,
      });

      expect(result.detections.length).toBe(0);
      expect(result.risk_score).toBe(0);
      expect(result.level).toBe('Low');
    });
  });
});
