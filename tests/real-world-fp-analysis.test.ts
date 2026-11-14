import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import { DarkGuardScanner } from '../src/engine/orchestrator';

describe('Real-Site False-Positive Hardening Analysis', () => {
  const fixturesDir = path.resolve(__dirname, 'fixtures/real-world-clean');

  it('scans clean-from-pricing.html with 0 false positives', async () => {
    const html = fs.readFileSync(path.join(fixturesDir, 'clean-from-pricing.html'), 'utf-8');
    const dom = new JSDOM(html, { url: 'http://localhost:3000/clean-from-pricing.html' });
    try {
      const scanner = new DarkGuardScanner();
      const result = await scanner.scan({
        container: dom.window.document.body,
        domain: 'localhost',
        urlPath: '/clean-from-pricing.html',
        observeMs: 1500,
        mlEnabled: false,
      });

      expect(result.detections.length).toBe(0);
      expect(result.risk_score).toBe(0);
    } finally {
      dom.window.close();
    }
  });

  it('scans clean-polite-decline.html with 0 false positives', async () => {
    const html = fs.readFileSync(path.join(fixturesDir, 'clean-polite-decline.html'), 'utf-8');
    const dom = new JSDOM(html, { url: 'http://localhost:3000/clean-polite-decline.html' });
    try {
      const scanner = new DarkGuardScanner();
      const result = await scanner.scan({
        container: dom.window.document.body,
        domain: 'localhost',
        urlPath: '/clean-polite-decline.html',
        observeMs: 1500,
        mlEnabled: false,
      });

      // Simple "No thanks" / "Maybe later" should NOT trigger confirm_shaming in rules mode
      const shamingHits = result.detections.filter((d) => d.categoryId === 'DP-3');
      expect(shamingHits.length).toBe(0);
      expect(result.detections.length).toBe(0);
    } finally {
      dom.window.close();
    }
  });

  it('analyzes clean-stock-urgency.html for text-only urgency false alarm', async () => {
    const html = fs.readFileSync(path.join(fixturesDir, 'clean-stock-urgency.html'), 'utf-8');
    const dom = new JSDOM(html, { url: 'http://localhost:3000/clean-stock-urgency.html' });
    try {
      const scanner = new DarkGuardScanner();
      const result = await scanner.scan({
        container: dom.window.document.body,
        domain: 'localhost',
        urlPath: '/clean-stock-urgency.html',
        observeMs: 1500,
        mlEnabled: false,
      });

      // DP-1 flags static "Only 3 left in stock" with confidence 0.50 (text-only rule match)
      expect(result.detections.length).toBe(1);
      const flag = result.detections[0];
      expect(flag.categoryId).toBe('DP-1');
      expect(flag.confidence).toBe(0.5);
      expect(flag.source).toBe('rule');
    } finally {
      dom.window.close();
    }
  });

  it('analyzes clean-newsletter-checkbox.html for preselected extra keyword collision', async () => {
    const html = fs.readFileSync(path.join(fixturesDir, 'clean-newsletter-checkbox.html'), 'utf-8');
    const dom = new JSDOM(html, { url: 'http://localhost:3000/clean-newsletter-checkbox.html' });
    try {
      const scanner = new DarkGuardScanner();
      const result = await scanner.scan({
        container: dom.window.document.body,
        domain: 'localhost',
        urlPath: '/clean-newsletter-checkbox.html',
        observeMs: 1500,
        mlEnabled: false,
      });

      // DP-4 flags because "subscribe" in "Subscribe to our weekly product newsletter" matches addon keyword
      expect(result.detections.length).toBe(1);
      const flag = result.detections[0];
      expect(flag.categoryId).toBe('DP-4');
      expect(flag.confidence).toBe(0.85);
      expect(flag.details?.addonLabel).toContain('Subscribe to our weekly product newsletter');
    } finally {
      dom.window.close();
    }
  });
});
