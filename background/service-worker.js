/**
 * DarkGuard AI — Background Service Worker (Manifest V3)
 * Handles on-demand tab injection, scan history storage, and extension lifecycle.
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('[DarkGuard AI] Extension installed successfully.');
});

// Check if a URL cannot be scripted by extensions
function isRestrictedUrl(url) {
  if (!url) return true;
  const restrictedPrefixes = [
    'chrome://',
    'chrome-extension://',
    'edge://',
    'about:',
    'view-source:',
    'data:',
    'https://chrome.google.com/webstore',
    'https://chromewebstore.google.com',
    'https://microsoftedge.microsoft.com',
  ];
  return restrictedPrefixes.some((p) => url.startsWith(p));
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 1. Dynamic Script & Style Injection (no static <all_urls> content_scripts)
  if (request.action === 'ENSURE_INJECTED') {
    const tabId = request.tabId;
    if (!tabId) {
      sendResponse({ ok: false, error: 'No active tab ID provided.' });
      return true;
    }

    (async () => {
      try {
        const tab = await chrome.tabs.get(tabId);
        if (!tab || !tab.url) {
          sendResponse({ ok: false, error: 'Cannot access active tab details.' });
          return;
        }

        if (isRestrictedUrl(tab.url)) {
          sendResponse({
            ok: false,
            error: 'This page restricts extension scripts (e.g., chrome://, edge://, or Web Store pages). Please scan on an HTTP, HTTPS, or local test-site page.',
          });
          return;
        }

        // Test if content script is already injected
        try {
          const pingResp = await chrome.tabs.sendMessage(tabId, { action: 'PING' });
          if (pingResp && pingResp.injected) {
            sendResponse({ ok: true, alreadyInjected: true });
            return;
          }
        } catch {
          // Not yet injected, proceed with injection
        }

        // Inject stylesheet first
        await chrome.scripting.insertCSS({
          target: { tabId },
          files: ['content/ethical-view.css'],
        });

        // Inject content scripts in sequence
        await chrome.scripting.executeScript({
          target: { tabId },
          files: [
            'content/scanner.js',
            'content/highlighter.js',
            'content/ethical-view.js',
          ],
        });

        sendResponse({ ok: true, newlyInjected: true });
      } catch (err) {
        console.error('[DarkGuard AI Service Worker] Injection failed:', err);
        sendResponse({
          ok: false,
          error: err.message || 'Failed to inject scanner into this tab.',
        });
      }
    })();

    return true; // Keep message channel open for async response
  }

  // 2. Scan History Logging
  if (request.action === 'LOG_SCAN' && request.scan) {
    const scan = request.scan;
    let cleanPath = scan.url_path || '/';
    try {
      cleanPath = cleanPath.split('?')[0].split('#')[0];
    } catch {}

    const entry = {
      id: scan.id || `scan-${Date.now()}`,
      domain: scan.domain || 'localhost',
      url_path: cleanPath,
      timestamp: scan.timestamp || new Date().toISOString(),
      risk_score: scan.risk_score || 0,
      level: scan.level || 'Low',
      model_version: scan.model_version || 'darkguard-text-v1',
      findingsCount: Array.isArray(scan.detections) ? scan.detections.length : 0,
      ml_enabled: Boolean(scan.ml_enabled),
    };

    chrome.storage.local.get({ scans: [] }, (res) => {
      const existing = res.scans || [];
      const updated = [entry, ...existing.filter((s) => s.id !== entry.id)].slice(0, 20);
      chrome.storage.local.set({ scans: updated }, () => {
        sendResponse({ status: 'saved', count: updated.length });
      });
    });

    return true;
  }

  // 3. Scan History Retrieval
  if (request.action === 'GET_HISTORY') {
    chrome.storage.local.get({ scans: [] }, (res) => {
      sendResponse({ scans: res.scans || [] });
    });
    return true;
  }

  // 4. Scan History Clear
  if (request.action === 'CLEAR_HISTORY') {
    chrome.storage.local.set({ scans: [] }, () => {
      sendResponse({ status: 'cleared' });
    });
    return true;
  }
});
