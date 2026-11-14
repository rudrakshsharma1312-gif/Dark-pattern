/**
 * DarkGuard AI — Content Script Scanner Entrypoint
 * Bundled into content/scanner.js via esbuild.
 * Injected on-demand into the active tab via chrome.scripting.executeScript.
 */

import { scannerInstance } from '../engine/orchestrator';

declare const chrome: any;

declare global {
  interface Window {
    __DARKGUARD_SCANNER_INJECTED__?: boolean;
  }
}

(function () {
  if (typeof window === 'undefined') return;

  // Prevent duplicate listener registration
  if (window.__DARKGUARD_SCANNER_INJECTED__) {
    return;
  }
  window.__DARKGUARD_SCANNER_INJECTED__ = true;

  console.log('[DarkGuard AI] Content scanner engine injected.');

  if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener(
      (request: any, sender: any, sendResponse: (response?: any) => void) => {
        // Health check / injection probe
      if (request.action === 'PING') {
        sendResponse({ status: 'ready', injected: true });
        return true;
      }

      // Core scanning trigger from popup
      if (request.action === 'START_SCAN') {
        const observeMs = typeof request.observeMs === 'number' ? request.observeMs : 10000;
        const mlEnabled = Boolean(request.mlEnabled); // default false per release gate

        scannerInstance
          .scan({
            container: document.body,
            domain: window.location.hostname || 'localhost',
            urlPath: window.location.pathname || '/',
            observeMs,
            mlEnabled,
          })
          .then((result) => {
            sendResponse(result);
          })
          .catch((err) => {
            console.error('[DarkGuard AI] Scan error:', err);
            sendResponse({
              id: `scan-err-${Date.now()}`,
              domain: window.location.hostname || 'localhost',
              url_path: window.location.pathname || '/',
              timestamp: new Date().toISOString(),
              risk_score: 0,
              level: 'Low',
              model_version: 'darkguard-text-v1',
              ml_enabled: false,
              classifierChecksumValid: true,
              rawCandidatesCount: 0,
              scanDurationMs: 0,
              detections: [],
              error: err?.message || 'Scanning encountered an error.',
            });
          });

        return true; // Keep message channel open for async response
      }
    });
  }
})();
