import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import { parsePrice, DP2DiscountDetector } from '../src/engine/detectors/dp2-discount';
import { DP1UrgencyDetector } from '../src/engine/detectors/dp1-urgency';
import { DP3ShamingDetector } from '../src/engine/detectors/dp3-shaming';
import { DP4ExtrasDetector } from '../src/engine/detectors/dp4-extras';
import { CandidateElement } from '../src/types';
import { DarkGuardScanner } from '../src/engine/orchestrator';

describe('Detectors & Price Parsing Suite', () => {
  describe('parsePrice Locale & Format Support', () => {
    it('parses standard US Dollar amounts ($19.99, $200, $1,299.00)', () => {
      expect(parsePrice('$19.99')).toEqual({ amount: 19.99, currency: '$' });
      expect(parsePrice('$200')).toEqual({ amount: 200, currency: '$' });
      expect(parsePrice('$1,299.00')).toEqual({ amount: 1299.0, currency: '$' });
    });

    it('parses Indian Rupee amounts (₹1,299, ₹499)', () => {
      expect(parsePrice('₹1,299')).toEqual({ amount: 1299, currency: '₹' });
      expect(parsePrice('₹499.50')).toEqual({ amount: 499.5, currency: '₹' });
    });

    it('parses European comma decimal amounts (1.299,00 €, 19,99 €)', () => {
      expect(parsePrice('19,99 €')).toEqual({ amount: 19.99, currency: '€' });
      expect(parsePrice('1.299,00 €')).toEqual({ amount: 1299.0, currency: '€' });
    });

    it('parses British Pound amounts (£45.50)', () => {
      expect(parsePrice('£45.50')).toEqual({ amount: 45.5, currency: '£' });
    });

    it('returns null for text with no prices', () => {
      expect(parsePrice('Free Shipping')).toBeNull();
      expect(parsePrice('In Stock')).toBeNull();
      expect(parsePrice('20% OFF')).toBeNull();
    });
  });

  describe('DP-1 Urgency Detector', () => {
    it('flags frozen countdown timers when snapshot values match', () => {
      const candidates: CandidateElement[] = [
        {
          ref: 'cand-1',
          tag: 'span',
          text: '00:14:59',
          attributes: {},
          rect: { x: 0, y: 0, w: 50, h: 20 },
          selector: 'span',
          inForm: false,
          nearPrimaryAction: false,
          visible: true,
        },
      ];

      const snapshots = new Map<string, string>([['cand-1', '00:14:59']]);
      const evidence = DP1UrgencyDetector.run({
        candidates,
        observedSnapshots: snapshots,
        observeMs: 10000,
      });

      expect(evidence.length).toBe(1);
      expect(evidence[0].ruleId).toBe('DP-1');
      expect(evidence[0].evidenceCode).toBe('frozen_countdown');
      expect(evidence[0].confidence).toBe(0.9);
      expect(evidence[0].severity).toBe(3);
    });

    it('does NOT flag actively ticking countdown timers where values changed', () => {
      const candidates: CandidateElement[] = [
        {
          ref: 'cand-1',
          tag: 'span',
          text: '00:14:49', // Changed during 10s observation window
          attributes: {},
          rect: { x: 0, y: 0, w: 50, h: 20 },
          selector: 'span',
          inForm: false,
          nearPrimaryAction: false,
          visible: true,
        },
      ];

      const snapshots = new Map<string, string>([['cand-1', '00:14:59']]);
      const evidence = DP1UrgencyDetector.run({
        candidates,
        observedSnapshots: snapshots,
        observeMs: 10000,
      });

      expect(evidence.length).toBe(0);
    });

    it('does NOT flag neutral product descriptions containing "days" like "roasted within 7 days"', () => {
      const candidates: CandidateElement[] = [
        {
          ref: 'cand-2',
          tag: 'span',
          text: 'Ethically sourced and roasted within the last 7 days for peak bloom and clarity.',
          attributes: {},
          rect: { x: 0, y: 0, w: 200, h: 40 },
          selector: 'span',
          inForm: false,
          nearPrimaryAction: false,
          visible: true,
        },
      ];

      const snapshots = new Map<string, string>([['cand-2', '7 days']]);
      const evidence = DP1UrgencyDetector.run({
        candidates,
        observedSnapshots: snapshots,
        observeMs: 10000,
      });

      expect(evidence.length).toBe(0);
    });

    it('does NOT flag actively ticking countdown timer page (clean-ticking-timer.html)', async () => {
      const filePath = path.resolve(__dirname, '../test-site/clean-ticking-timer.html');
      const rawHtml = fs.readFileSync(filePath, 'utf-8');
      const dom = new JSDOM(rawHtml, {
        url: 'http://localhost:3000/clean-ticking-timer.html',
        runScripts: 'dangerously',
      });

      const scanner = new DarkGuardScanner();
      const res = await scanner.scan({
        container: dom.window.document.body,
        domain: 'localhost',
        urlPath: '/clean-ticking-timer.html',
        observeMs: 1200,
        mlEnabled: false,
      });

      expect(res.detections.length).toBe(0);
      expect(res.risk_score).toBe(0);
    });
  });

  describe('DP-2 Discount Detector', () => {
    it('flags mathematical discount discrepancy (stated 70% vs actual 50%)', () => {
      const dom = new JSDOM(`
        <div class="price-container">
          <span class="discount">70% OFF</span>
          <span class="was-price"><s>Was $400.00</s></span>
          <span class="current-price">$200.00</span>
        </div>
      `);

      const discountSpan = dom.window.document.querySelector('.discount') as HTMLElement;
      const candidates: CandidateElement[] = [
        {
          ref: 'disc-1',
          tag: 'span',
          text: '70% OFF',
          attributes: {},
          rect: { x: 0, y: 0, w: 50, h: 20 },
          selector: '.discount',
          inForm: false,
          nearPrimaryAction: false,
          visible: true,
          element: discountSpan,
        },
      ];

      const evidence = DP2DiscountDetector.run({ candidates });
      expect(evidence.length).toBe(1);
      expect(evidence[0].ruleId).toBe('DP-2');
      expect(evidence[0].evidenceCode).toBe('arithmetic_mismatch');
      expect(evidence[0].details.statedPercent).toBe(70);
      expect(evidence[0].details.calculatedPercent).toBe(50);
      expect(evidence[0].severity).toBe(2);
    });

    it('does NOT flag mathematically accurate discounts (20% off $120 -> $96)', () => {
      const dom = new JSDOM(`
        <div class="price-container">
          <span class="discount">20% OFF</span>
          <span class="was-price"><s>Was $120.00</s></span>
          <span class="current-price">$96.00</span>
        </div>
      `);

      const discountSpan = dom.window.document.querySelector('.discount') as HTMLElement;
      const candidates: CandidateElement[] = [
        {
          ref: 'disc-2',
          tag: 'span',
          text: '20% OFF',
          attributes: {},
          rect: { x: 0, y: 0, w: 50, h: 20 },
          selector: '.discount',
          inForm: false,
          nearPrimaryAction: false,
          visible: true,
          element: discountSpan,
        },
      ];

      const evidence = DP2DiscountDetector.run({ candidates });
      expect(evidence.length).toBe(0);
    });
  });

  describe('DP-3 Confirm Shaming Detector', () => {
    it('flags guilt-inducing decline phrases', () => {
      const candidates: CandidateElement[] = [
        {
          ref: 'btn-1',
          tag: 'button',
          text: 'No thanks, I prefer paying full price',
          attributes: { type: 'button' },
          rect: { x: 0, y: 0, w: 120, h: 30 },
          selector: 'button',
          inForm: false,
          nearPrimaryAction: true,
          visible: true,
        },
        {
          ref: 'btn-2',
          tag: 'button',
          text: "No, I don't want to save money",
          attributes: { type: 'button' },
          rect: { x: 0, y: 0, w: 120, h: 30 },
          selector: 'button',
          inForm: false,
          nearPrimaryAction: true,
          visible: true,
        },
      ];

      const evidence = DP3ShamingDetector.run({ candidates });
      expect(evidence.length).toBe(2);
      expect(evidence[0].ruleId).toBe('DP-3');
      expect(evidence[0].evidenceCode).toBe('shaming_phrase');
      expect(evidence[1].ruleId).toBe('DP-3');
    });

    it('does NOT flag honest neutral decline or navigation buttons', () => {
      const candidates: CandidateElement[] = [
        {
          ref: 'btn-neutral-1',
          tag: 'button',
          text: 'No thanks',
          attributes: { type: 'button' },
          rect: { x: 0, y: 0, w: 80, h: 30 },
          selector: 'button',
          inForm: false,
          nearPrimaryAction: true,
          visible: true,
        },
        {
          ref: 'btn-neutral-2',
          tag: 'button',
          text: 'Skip',
          attributes: { type: 'button' },
          rect: { x: 0, y: 0, w: 60, h: 30 },
          selector: 'button',
          inForm: false,
          nearPrimaryAction: true,
          visible: true,
        },
        {
          ref: 'btn-neutral-3',
          tag: 'button',
          text: 'Cancel',
          attributes: { type: 'button' },
          rect: { x: 0, y: 0, w: 60, h: 30 },
          selector: 'button',
          inForm: false,
          nearPrimaryAction: true,
          visible: true,
        },
      ];

      const evidence = DP3ShamingDetector.run({ candidates });
      expect(evidence.length).toBe(0);
    });
  });

  describe('DP-4 Pre-Selected Extras Detector', () => {
    it('flags pre-checked warranty checkbox near purchase CTA', () => {
      const dom = new JSDOM(`
        <div class="product-actions">
          <label>
            <input type="checkbox" id="warranty" checked>
            Add 3-Year Extended Warranty (+$49.99)
          </label>
          <button type="submit" class="add-to-cart">Add to Bag</button>
        </div>
      `);

      const checkbox = dom.window.document.querySelector('#warranty') as HTMLInputElement;
      const candidates: CandidateElement[] = [
        {
          ref: 'extra-1',
          tag: 'input',
          text: 'Add 3-Year Extended Warranty (+$49.99)',
          attributes: { type: 'checkbox', checked: true },
          rect: { x: 0, y: 0, w: 20, h: 20 },
          selector: '#warranty',
          inForm: true,
          nearPrimaryAction: true,
          visible: true,
          element: checkbox,
        },
      ];

      const evidence = DP4ExtrasDetector.run({ candidates });
      expect(evidence.length).toBe(1);
      expect(evidence[0].ruleId).toBe('DP-4');
      expect(evidence[0].evidenceCode).toBe('preselected_addon');
      expect(evidence[0].severity).toBe(2);
      expect(evidence[0].confidence).toBe(0.85);
    });

    it('does NOT flag unchecked optional add-on checkboxes', () => {
      const dom = new JSDOM(`
        <div class="product-actions">
          <label>
            <input type="checkbox" id="cleaner">
            Optional Stainless Steel Cleanser (+$14.00)
          </label>
          <button type="submit" class="add-to-cart">Add to Bag</button>
        </div>
      `);

      const checkbox = dom.window.document.querySelector('#cleaner') as HTMLInputElement;
      const candidates: CandidateElement[] = [
        {
          ref: 'extra-2',
          tag: 'input',
          text: 'Optional Stainless Steel Cleanser (+$14.00)',
          attributes: { type: 'checkbox', checked: false },
          rect: { x: 0, y: 0, w: 20, h: 20 },
          selector: '#cleaner',
          inForm: true,
          nearPrimaryAction: true,
          visible: true,
          element: checkbox,
        },
      ];

      const evidence = DP4ExtrasDetector.run({ candidates });
      expect(evidence.length).toBe(0);
    });
  });
});
