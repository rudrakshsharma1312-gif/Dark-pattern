import JSZip from 'jszip';
import templatesData from '../engine/templates.json';
import modelData from '../ml/shaming-v1.json';

export async function generateExtensionZip(): Promise<Blob> {
  const zip = new JSZip();

  // 1. Manifest V3
  const manifest = {
    manifest_version: 3,
    name: 'DarkGuard AI',
    version: '0.3.0',
    description: 'Intelligent auditor for deceptive e-commerce design with hybrid ML and rule-based verification.',
    permissions: ['activeTab', 'scripting', 'storage'],
    optional_host_permissions: ['https://*/*', 'http://*/*'],
    action: {
      default_popup: 'popup/popup.html',
      default_title: 'DarkGuard AI Auditor',
    },
    background: {
      service_worker: 'background/service-worker.js',
      type: 'module',
    },
    web_accessible_resources: [
      {
        resources: ['content/ethical-view.css'],
        matches: ['<all_urls>'],
      },
    ],
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'",
    },
  };
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  // 2. Popup files
  const popupHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>DarkGuard AI</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="popup-container">
    <header class="popup-header">
      <div class="logo-area">
        <span class="shield">🛡️</span>
        <span class="title">DarkGuard AI</span>
      </div>
      <span class="version-tag">v0.3.0</span>
    </header>

    <div class="site-status">
      <span id="site-url" class="domain">Current Tab</span>
      <button id="scan-btn" class="btn-primary">Scan this page</button>
    </div>

    <div id="results-area" class="results-area hidden">
      <div class="score-card">
        <div class="score-circle">
          <span id="score-num" class="score-num">--</span>
          <span class="score-label">Risk score</span>
        </div>
        <div class="score-meta">
          <div id="risk-level" class="risk-level">Analyzing...</div>
          <p class="risk-desc">Signals of pressure or deceptive phrasing</p>
        </div>
      </div>

      <div class="ethical-view-toggle-area">
        <div class="toggle-info">
          <strong>Ethical View</strong>
          <span>Annotate suspicious elements</span>
        </div>
        <label class="switch">
          <input type="checkbox" id="ethical-toggle">
          <span class="slider"></span>
        </label>
      </div>

      <div id="findings-list" class="findings-list"></div>

      <div class="actions-row">
        <button id="export-json" class="btn-quiet">Export JSON</button>
        <button id="export-md" class="btn-quiet">Export Markdown</button>
      </div>
    </div>

    <div id="loading-area" class="loading-area hidden">
      <div class="spinner"></div>
      <p id="loading-msg">Observing countdown timer (10s window)...</p>
    </div>

    <footer class="popup-footer">
      <span>Screening only, not certification.</span>
    </footer>
  </div>
  <script src="popup.js"></script>
</body>
</html>`;
  zip.file('popup/popup.html', popupHtml);

  const popupCss = `body {
  margin: 0;
  padding: 0;
  width: 380px;
  min-height: 480px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background-color: #F6F9FC;
  color: #1F2A37;
}
.popup-container {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #E1E8F0;
  padding-bottom: 10px;
}
.logo-area {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: 15px;
}
.version-tag {
  font-size: 11px;
  color: #5F6E80;
}
.site-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  background: #FFFFFF;
  padding: 10px;
  border: 1px solid #E1E8F0;
  border-radius: 12px;
}
.domain {
  font-size: 13px;
  color: #3D4B5C;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.btn-primary {
  background: #DCEBFA;
  border: 1px solid #9CC5EE;
  color: #1D4E89;
  font-weight: 600;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
}
.btn-quiet {
  background: transparent;
  border: none;
  color: #1D4E89;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 6px;
}
.score-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #FFFFFF;
  border: 1px solid #E1E8F0;
  border-radius: 14px;
  padding: 14px;
}
.score-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 4px solid #8FD1B0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.score-num {
  font-size: 20px;
  font-weight: 800;
  line-height: 1;
}
.score-label {
  font-size: 9px;
  color: #5F6E80;
}
.risk-level {
  font-weight: 700;
  font-size: 15px;
}
.risk-desc {
  margin: 4px 0 0;
  font-size: 11px;
  color: #5F6E80;
}
.ethical-view-toggle-area {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #FFFFFF;
  border: 1px solid #E1E8F0;
  padding: 10px 14px;
  border-radius: 12px;
}
.toggle-info strong {
  display: block;
  font-size: 13px;
}
.toggle-info span {
  font-size: 11px;
  color: #5F6E80;
}
.findings-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 240px;
  overflow-y: auto;
}
.actions-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}
.popup-footer {
  text-align: center;
  font-size: 11px;
  color: #9AA7B6;
  border-top: 1px solid #E1E8F0;
  padding-top: 8px;
}
.hidden { display: none !important; }
.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #EDF2F8;
  border-top-color: #1D4E89;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 12px auto;
}
@keyframes spin { to { transform: rotate(360deg); } }
`;
  zip.file('popup/popup.css', popupCss);

  const popupJs = `document.getElementById('scan-btn').addEventListener('click', async () => {
  const loading = document.getElementById('loading-area');
  const results = document.getElementById('results-area');
  loading.classList.remove('hidden');
  results.classList.add('hidden');

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;

  chrome.tabs.sendMessage(tab.id, { action: "START_SCAN" }, (response) => {
    loading.classList.add('hidden');
    results.classList.remove('hidden');
    if (response) {
      document.getElementById('score-num').textContent = response.risk_score;
      document.getElementById('risk-level').textContent = response.level;
    }
  });
});

document.getElementById('ethical-toggle').addEventListener('change', async (e) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_ETHICAL_VIEW", enabled: e.target.checked });
  }
});
`;
  zip.file('popup/popup.js', popupJs);

  // 3. Background service worker
  const serviceWorker = `chrome.runtime.onInstalled.addListener(() => {
  console.log("DarkGuard AI service worker installed.");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "LOG_SCAN") {
    chrome.storage.local.get({ scans: [] }, (result) => {
      const scans = [request.scan, ...result.scans].slice(0, 20);
      chrome.storage.local.set({ scans });
    });
    sendResponse({ status: "saved" });
  }
  return true;
});
`;
  zip.file('background/service-worker.js', serviceWorker);

  // 4. Data models & templates
  zip.file('content/templates.json', JSON.stringify(templatesData, null, 2));
  zip.file('models/shaming-v1.json', JSON.stringify(modelData, null, 2));

  // 5. Readme instructions
  const readme = `# DarkGuard AI — Chrome/Edge Extension

## Installation Instructions (Manifest V3)
1. Download and extract this zip folder to a location on your computer.
2. In Google Chrome or Microsoft Edge, navigate to:
   - Chrome: chrome://extensions
   - Edge: edge://extensions
3. Toggle the **Developer mode** switch in the top-right corner.
4. Click the **Load unpacked** button in the top-left toolbar.
5. Select the unzipped \`darkguard-ai-extension\` directory.
6. The DarkGuard AI icon will appear in your browser extension toolbar! Pin it for quick access.
7. Open any e-commerce page or test site and click "Scan this page".
`;
  zip.file('README.md', readme);

  return await zip.generateAsync({ type: 'blob' });
}
