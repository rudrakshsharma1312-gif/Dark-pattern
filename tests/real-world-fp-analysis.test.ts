import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import { DarkGuardScanner } from '../src/engine/orchestrator';

describe('Real-World Clean Fixtures Regression Suite (Score 0 Expected)', () => {
  const fixturesDir = path.resolve(__dirname, 'fixtures/real-world-clean');

  const cleanFixtures = [
    {
      file: 'clean-from-pricing.html',
      name: 'Clean From Pricing ($49 range & honest MSRP)',
      expectedDetections: 0,
    },
    {
      file: 'clean-polite-decline.html',
      name: 'Clean Polite Decline (No thanks / Maybe later)',
      expectedDetections: 0,
    },
    {
      file: 'clean-newsletter-checkbox.html',
      name: 'Clean Newsletter & Terms Checkboxes',
      expectedDetections: 0,
    },
    {
      file: 'clean-free-shipping.html',
      name: 'Clean Free Shipping Over $50 Banner',
      expectedDetections: 0,
    },
    {
      file: 'clean-sale-ends-sunday.html',
      name: 'Clean Sale Ends Sunday (No timer)',
      expectedDetections: 0,
    },
    {
      file: 'clean-remember-me.html',
      name: 'Clean Remember Me Login Checkbox',
      expectedDetections: 0,
    },
    {
      file: 'clean-stock-urgency.html',
      name: 'Clean Stock Urgency (Only 3 left in stock)',
      // Text-only urgency produces an informational note (ET-URG-02) but zero score contribution
      expectedDetections: 1,
      isInformationalOnly: true,
    },
  ];

  it.each(cleanFixtures)('produces 0 risk score on $name ($file)', async (fixture) => {
    const html = fs.readFileSync(path.join(fixturesDir, fixture.file), 'utf-8');
    const dom = new JSDOM(html, { url: `http://localhost:3000/${fixture.file}` });
    try {
      const scanner = new DarkGuardScanner();
      const result = await scanner.scan({
        container: dom.window.document.body,
        domain: 'localhost',
        urlPath: `/${fixture.file}`,
        observeMs: 1500,
        mlEnabled: false,
      });

      // All honest real-world clean fixtures must produce Risk Score 0 and Low band
      expect(result.risk_score).toBe(0);
      expect(result.level).toBe('Low');
      expect(result.detections.length).toBe(fixture.expectedDetections);

      if (fixture.isInformationalOnly) {
        expect(result.detections[0].templateId).toBe('ET-URG-02');
        expect(result.detections[0].details?.scoreContributionZero).toBe(true);
      }
    } finally {
      dom.window.close();
    }
  });
});
