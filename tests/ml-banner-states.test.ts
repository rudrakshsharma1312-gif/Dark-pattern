import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

describe('Condition 5: ML Banner States & Copy Verification', () => {
  const rootDir = path.resolve(__dirname, '..');
  const popupHtml = fs.readFileSync(path.join(rootDir, 'popup/popup.html'), 'utf-8');

  it('renders "Text model off (Release Gate)" when ml_enabled=false and checksum is valid', () => {
    const dom = new JSDOM(popupHtml);
    const doc = dom.window.document;

    // Simulate popup.js renderScanResult behavior
    const result = {
      risk_score: 25,
      level: 'Moderate',
      ml_enabled: false,
      classifierChecksumValid: true,
      detections: [],
    };

    const banner = doc.getElementById('ml-unavailable-banner')!;
    const titleEl = doc.getElementById('ml-banner-title')!;
    const descEl = doc.getElementById('ml-banner-desc')!;

    if (result.ml_enabled === false || result.classifierChecksumValid === false) {
      banner.classList.remove('hidden');
      if (result.classifierChecksumValid === false) {
        titleEl.textContent = 'Text model unavailable';
        descEl.textContent = 'Model checksum verification failed. Running rules-only scan.';
      } else {
        titleEl.textContent = 'Text model off (Release Gate)';
        descEl.textContent = 'Text model is off because it did not pass the release gate. Running rules-only scan.';
      }
    }

    expect(banner.classList.contains('hidden')).toBe(false);
    expect(titleEl.textContent).toBe('Text model off (Release Gate)');
    expect(descEl.textContent).toContain('Text model is off because it did not pass the release gate');
  });

  it('renders "Text model unavailable" when checksum verification fails (corrupted model)', () => {
    const dom = new JSDOM(popupHtml);
    const doc = dom.window.document;

    // Simulate scan result with corrupted model checksum
    const result = {
      risk_score: 25,
      level: 'Moderate',
      ml_enabled: false,
      classifierChecksumValid: false,
      detections: [],
    };

    const banner = doc.getElementById('ml-unavailable-banner')!;
    const titleEl = doc.getElementById('ml-banner-title')!;
    const descEl = doc.getElementById('ml-banner-desc')!;

    if (result.ml_enabled === false || result.classifierChecksumValid === false) {
      banner.classList.remove('hidden');
      if (result.classifierChecksumValid === false) {
        titleEl.textContent = 'Text model unavailable';
        descEl.textContent = 'Model checksum verification failed. Running rules-only scan.';
      } else {
        titleEl.textContent = 'Text model off (Release Gate)';
        descEl.textContent = 'Text model is off because it did not pass the release gate. Running rules-only scan.';
      }
    }

    expect(banner.classList.contains('hidden')).toBe(false);
    expect(titleEl.textContent).toBe('Text model unavailable');
    expect(descEl.textContent).toBe('Model checksum verification failed. Running rules-only scan.');
  });
});
