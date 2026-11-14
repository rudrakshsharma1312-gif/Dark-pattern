import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Zero-Network Extension Privacy Verification', () => {
  const rootDir = path.resolve(__dirname, '..');

  it('verifies content/scanner.js contains zero network calls', () => {
    const scannerPath = path.join(rootDir, 'content/scanner.js');
    expect(fs.existsSync(scannerPath)).toBe(true);

    const code = fs.readFileSync(scannerPath, 'utf-8');
    const networkPatterns = [
      /fetch\s*\(/g,
      /XMLHttpRequest/g,
      /WebSocket/g,
      /sendBeacon/g,
      /\/v1\/explain/g,
    ];

    for (const pattern of networkPatterns) {
      const matches = code.match(pattern);
      expect(matches, `Expected 0 matches for ${pattern} in content/scanner.js`).toBeNull();
    }
  });

  it('verifies popup/popup.js contains zero network calls', () => {
    const popupPath = path.join(rootDir, 'popup/popup.js');
    expect(fs.existsSync(popupPath)).toBe(true);

    const code = fs.readFileSync(popupPath, 'utf-8');
    const networkPatterns = [
      /fetch\s*\(/g,
      /XMLHttpRequest/g,
      /WebSocket/g,
      /sendBeacon/g,
      /https?:\/\/(?!www\.w3\.org)/g,
    ];

    for (const pattern of networkPatterns) {
      const matches = code.match(pattern);
      expect(matches, `Expected 0 matches for ${pattern} in popup/popup.js`).toBeNull();
    }
  });

  it('verifies background/service-worker.js contains zero network calls', () => {
    const swPath = path.join(rootDir, 'background/service-worker.js');
    expect(fs.existsSync(swPath)).toBe(true);

    const code = fs.readFileSync(swPath, 'utf-8');
    const networkPatterns = [
      /fetch\s*\(/g,
      /XMLHttpRequest/g,
      /WebSocket/g,
      /sendBeacon/g,
    ];

    for (const pattern of networkPatterns) {
      const matches = code.match(pattern);
      expect(matches, `Expected 0 matches for ${pattern} in background/service-worker.js`).toBeNull();
    }
  });

  it('verifies content/highlighter.js contains zero network calls', () => {
    const hlPath = path.join(rootDir, 'content/highlighter.js');
    expect(fs.existsSync(hlPath)).toBe(true);

    const code = fs.readFileSync(hlPath, 'utf-8');
    const networkPatterns = [
      /fetch\s*\(/g,
      /XMLHttpRequest/g,
      /WebSocket/g,
      /sendBeacon/g,
    ];

    for (const pattern of networkPatterns) {
      const matches = code.match(pattern);
      expect(matches, `Expected 0 matches for ${pattern} in content/highlighter.js`).toBeNull();
    }
  });

  it('verifies content/ethical-view.js only fetches local chrome.runtime.getURL resources', () => {
    const evPath = path.join(rootDir, 'content/ethical-view.js');
    expect(fs.existsSync(evPath)).toBe(true);

    const code = fs.readFileSync(evPath, 'utf-8');

    // Forbidden APIs
    expect(code.match(/XMLHttpRequest/g)).toBeNull();
    expect(code.match(/WebSocket/g)).toBeNull();
    expect(code.match(/sendBeacon/g)).toBeNull();

    // Any fetch must strictly be for chrome.runtime.getURL
    const fetchMatches = code.match(/fetch\s*\([^)]*\)/g) || [];
    for (const match of fetchMatches) {
      expect(match).toMatch(/fetch\s*\(\s*url\s*\)/);
    }
    // Verify url comes from chrome.runtime.getURL
    expect(code.includes("chrome.runtime.getURL('content/templates.json')")).toBe(true);
  });
});
