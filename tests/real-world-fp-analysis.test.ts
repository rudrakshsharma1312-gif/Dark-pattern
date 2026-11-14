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
      // Honest stock-count text produces 0 visible findings and 0 Ethical View notes
      expectedDetections: 0,
    },
  ];

  it.each(cleanFixtures)('produces 0 risk score and 0 visible findings on $name ($file)', async (fixture) => {
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

      // All honest real-world clean fixtures must produce Risk Score 0 and 0 visible findings
      expect(result.risk_score).toBe(0);
      expect(result.level).toBe('Low');
      expect(result.detections.length).toBe(fixture.expectedDetections);
    } finally {
      dom.window.close();
    }
  });

  it('keeps ET-URG-02 for urgency claims without stock text (e.g. Hurry! Offer ends soon!)', async () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <div>
          <h2>Flash Deals</h2>
          <p class="urgency-banner">Hurry! Offer ends soon!</p>
          <button>Buy Now</button>
        </div>
      </body>
      </html>
    `;
    const dom = new JSDOM(html, { url: 'http://localhost:3000/urgency-claim.html' });
    try {
      const scanner = new DarkGuardScanner();
      const result = await scanner.scan({
        container: dom.window.document.body,
        domain: 'localhost',
        urlPath: '/urgency-claim.html',
        observeMs: 1500,
        mlEnabled: false,
      });

      // Claims without stock text trigger ET-URG-02 informational template
      expect(result.detections.length).toBe(1);
      const det = result.detections[0];
      expect(det.categoryId).toBe('DP-1');
      expect(det.templateId).toBe('ET-URG-02');
      expect(det.details?.scoreContributionZero).toBe(true);
      expect(result.risk_score).toBe(0); // Score contribution 0 when ML is off
    } finally {
      dom.window.close();
    }
  });
});
