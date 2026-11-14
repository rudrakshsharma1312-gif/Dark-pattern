import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { extractCandidates } from '../src/engine/scanner';

describe('Scanner Privacy & Boundary Protections', () => {
  it('never reads input values and ignores sensitive form inputs', () => {
    const dom = new JSDOM(`
      <html>
        <body>
          <form>
            <input type="password" name="pwd" value="super_secret_password" />
            <input type="email" name="user_email" value="shopper@example.com" />
            <input type="tel" name="phone_number" value="+15551234567" />
            <input type="text" autocomplete="cc-number" value="4111222233334444" />
            <input type="text" name="card_cvv" value="123" />
            <input type="text" name="ssn" value="000-12-3456" />
            <input type="text" name="billing_address" value="123 Main St" />
            <input type="text" name="notes" value="Please deliver to front porch" />
          </form>
        </body>
      </html>
    `);

    const candidates = extractCandidates(dom.window.document.body);

    // None of the sensitive fields should be extracted
    expect(candidates.some((c) => c.text.includes('super_secret_password'))).toBe(false);
    expect(candidates.some((c) => c.text.includes('shopper@example.com'))).toBe(false);
    expect(candidates.some((c) => c.text.includes('4111222233334444'))).toBe(false);
    expect(candidates.some((c) => c.text.includes('000-12-3456'))).toBe(false);
    expect(candidates.some((c) => c.text.includes('front porch'))).toBe(false);

    // No input text value should ever be stored in candidate.text
    candidates.forEach((c) => {
      expect(c.text).not.toBe('super_secret_password');
      expect(c.text).not.toBe('shopper@example.com');
      expect(c.text).not.toBe('4111222233334444');
    });
  });

  it('records checked state only for checkboxes/radios without reading value', () => {
    const dom = new JSDOM(`
      <html>
        <body>
          <label>
            <input type="checkbox" id="warranty" checked value="hidden_sku_val" />
            Add extended warranty (+$19.99)
          </label>
        </body>
      </html>
    `);

    const candidates = extractCandidates(dom.window.document.body);
    const checkboxCandidate = candidates.find((c) => c.tag === 'input');
    expect(checkboxCandidate).toBeDefined();
    expect(checkboxCandidate?.attributes.checked).toBe(true);
    expect(checkboxCandidate?.text).not.toContain('hidden_sku_val');
  });

  it('skips elements owned by Ethical View overlay', () => {
    const dom = new JSDOM(`
      <html>
        <body>
          <div data-dg-owner="ethical-view">
            <span>Ethical View Note: This is an injected note</span>
          </div>
          <div class="product-item">
            <span class="price">$49.99</span>
          </div>
        </body>
      </html>
    `);

    const candidates = extractCandidates(dom.window.document.body);
    expect(candidates.some((c) => c.text.includes('Ethical View Note'))).toBe(false);
    expect(candidates.some((c) => c.text.includes('$49.99'))).toBe(true);
  });

  it('truncates overly long text to 200 characters', () => {
    const longString = 'A'.repeat(500);
    const dom = new JSDOM(`<html><body><p>${longString}</p></body></html>`);

    const candidates = extractCandidates(dom.window.document.body);
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].text.length).toBeLessThanOrEqual(200);
  });

  describe('Real-Browser Visibility Checks', () => {
    it('skips elements with display: none', () => {
      const dom = new JSDOM(`
        <html><body>
          <div style="display: none;">
            <button id="hidden-btn">Hidden Urgent Deal</button>
          </div>
          <button id="visible-btn">Visible Button</button>
        </body></html>
      `);
      const candidates = extractCandidates(dom.window.document.body);
      expect(candidates.some((c) => c.text.includes('Hidden Urgent Deal'))).toBe(false);
      expect(candidates.some((c) => c.text.includes('Visible Button'))).toBe(true);
    });

    it('skips elements with visibility: hidden', () => {
      const dom = new JSDOM(`
        <html><body>
          <div style="visibility: hidden;">
            <span class="timer">00:14:59</span>
          </div>
          <span class="price">$19.99</span>
        </body></html>
      `);
      const candidates = extractCandidates(dom.window.document.body);
      expect(candidates.some((c) => c.text.includes('00:14:59'))).toBe(false);
      expect(candidates.some((c) => c.text.includes('$19.99'))).toBe(true);
    });

    it('skips elements with opacity: 0', () => {
      const dom = new JSDOM(`
        <html><body>
          <button style="opacity: 0;">Invisible Shaming Button</button>
          <button style="opacity: 1;">Standard Button</button>
        </body></html>
      `);
      const candidates = extractCandidates(dom.window.document.body);
      expect(candidates.some((c) => c.text.includes('Invisible Shaming Button'))).toBe(false);
      expect(candidates.some((c) => c.text.includes('Standard Button'))).toBe(true);
    });

    it('skips elements with zero size (width: 0, height: 0) in browser / mocked layout', () => {
      const dom = new JSDOM(`
        <html><body>
          <button id="zero-size-btn">Zero Size Button</button>
          <button id="normal-btn">Normal Size Button</button>
        </body></html>
      `);

      const zeroBtn = dom.window.document.getElementById('zero-size-btn')!;
      zeroBtn.getBoundingClientRect = () => ({
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      const normalBtn = dom.window.document.getElementById('normal-btn')!;
      normalBtn.getBoundingClientRect = () => ({
        width: 120,
        height: 40,
        top: 10,
        left: 10,
        right: 130,
        bottom: 50,
        x: 10,
        y: 10,
        toJSON: () => ({}),
      });

      const candidates = extractCandidates(dom.window.document.body);
      expect(candidates.some((c) => c.text.includes('Zero Size Button'))).toBe(false);
      expect(candidates.some((c) => c.text.includes('Normal Size Button'))).toBe(true);
    });
  });
});
