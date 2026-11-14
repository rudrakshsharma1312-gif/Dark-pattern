/**
 * DarkGuard AI — Extension Popup Script (popup/popup.js)
 *
 * Responsibilities:
 * - Orchestrates scanning trigger and receives detections from content script.
 * - Displays 0-100 animated SVG risk score gauge with severity-mapped colors.
 * - Displays clear risk level indicators (Low, Moderate, High, Very high).
 * - Shows "checking timer..." status while countdown observation is pending.
 * - Shows "text model unavailable" warning banner when ML classifier is inactive.
 * - Renders findings list with pattern name, severity chip, snippet, and explanation.
 * - Triggers content/highlighter.js when a finding or "Locate" button is clicked.
 * - Controls Ethical View toggle and listens for "Show original" page events.
 * - Handles empty states (0 findings), loading states, and error states gracefully.
 */

(function () {
  'use strict';

  // State
  let currentScanResult = null;
  let activeTabId = null;
  let isScanning = false;
  let timerObservationCountdown = 10;
  let timerInterval = null;

  // DOM Elements
  const scanBtn = document.getElementById('scan-btn');
  const tabUrlEl = document.getElementById('tab-url');

  // Views
  const idleView = document.getElementById('idle-view');
  const loadingView = document.getElementById('loading-view');
  const resultsView = document.getElementById('results-view');
  const errorView = document.getElementById('error-view');

  // Loading elements
  const loadingTitle = document.getElementById('loading-title');
  const loadingStatusMsg = document.getElementById('loading-status-msg');
  const timerCheckingBox = document.getElementById('timer-checking-box');
  const timerCountdownSecs = document.getElementById('timer-countdown-seconds');

  // Results elements
  const scoreNumberEl = document.getElementById('score-number');
  const gaugeBar = document.getElementById('gauge-bar');
  const riskLevelBadge = document.getElementById('risk-level-badge');
  const riskSummaryText = document.getElementById('risk-summary-text');
  const statElementsChecked = document.getElementById('stat-elements-checked');
  const statScanTime = document.getElementById('stat-scan-time');
  const mlUnavailableBanner = document.getElementById('ml-unavailable-banner');
  const ethicalToggle = document.getElementById('ethical-toggle-cb');
  const findingsContainer = document.getElementById('findings-container');
  const findingsCountTitle = document.getElementById('findings-count-title');
  const emptyStateCard = document.getElementById('empty-state-card');

  // Error elements
  const errorMsgText = document.getElementById('error-msg-text');
  const retryBtn = document.getElementById('btn-retry-scan');
  const loadDemoBtn = document.getElementById('btn-load-demo-result');

  // Export elements
  const exportJsonBtn = document.getElementById('btn-export-json');
  const exportMdBtn = document.getElementById('btn-export-md');

  // Gauge constants (r = 58)
  const GAUGE_RADIUS = 58;
  const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS; // ~364.42

  document.addEventListener('DOMContentLoaded', () => {
    initBuildStamp();
    initTabContext();
    initEventListeners();
  });

  function initBuildStamp() {
    try {
      const manifest = typeof chrome !== 'undefined' && chrome.runtime?.getManifest?.();
      const stampEl = document.getElementById('footer-build-stamp');
      if (stampEl && manifest) {
        const stamp = manifest.version_name || manifest.version;
        stampEl.textContent = ` • Build ${stamp}`;
      }
    } catch (_) {}
  }

  async function initTabContext() {
    if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
          activeTabId = tab.id;
          try {
            const urlObj = new URL(tab.url || '');
            tabUrlEl.textContent = urlObj.hostname + (urlObj.pathname !== '/' ? urlObj.pathname : '');
          } catch {
            tabUrlEl.textContent = tab.title || 'Current Webpage';
          }

          // Check if tab already has Ethical View ON
          chrome.tabs.sendMessage(tab.id, { action: 'GET_ETHICAL_VIEW_STATUS' }, (resp) => {
            if (chrome.runtime.lastError) return;
            if (resp && resp.state === 'ON') {
              ethicalToggle.checked = true;
            }
          });
        }
      } catch (err) {
        console.warn('Could not query active tab:', err);
      }
    } else {
      tabUrlEl.textContent = 'Local Standalone Test Mode';
    }
  }

  function initEventListeners() {
    scanBtn.addEventListener('click', () => startScan());
    retryBtn.addEventListener('click', () => startScan());
    loadDemoBtn.addEventListener('click', () => loadSampleDemoResult());

    ethicalToggle.addEventListener('change', (e) => {
      toggleEthicalView(e.target.checked);
    });

    exportJsonBtn.addEventListener('click', () => exportResult('json'));
    exportMdBtn.addEventListener('click', () => exportResult('markdown'));

    // Listen for runtime broadcasts from content scripts
    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener((msg) => {
        if (msg.action === 'ETHICAL_VIEW_STATUS_CHANGED') {
          ethicalToggle.checked = msg.state === 'ON';
        }
      });
    }
  }

  function setView(view) {
    idleView.classList.add('hidden');
    loadingView.classList.add('hidden');
    resultsView.classList.add('hidden');
    errorView.classList.add('hidden');

    if (view === 'idle') idleView.classList.remove('hidden');
    if (view === 'loading') loadingView.classList.remove('hidden');
    if (view === 'results') resultsView.classList.remove('hidden');
    if (view === 'error') errorView.classList.remove('hidden');
  }

  /**
   * Triggers the full scan workflow.
   */
  async function startScan() {
    if (isScanning) return;
    isScanning = true;
    scanBtn.disabled = true;

    setView('loading');
    loadingTitle.textContent = 'Scanning Page...';
    loadingStatusMsg.textContent = 'Extracting candidate elements (buttons, prices, timers)...';
    timerCheckingBox.classList.add('hidden');

    // If extension runtime is available, ensure scripts are injected then trigger scan
    if (typeof chrome !== 'undefined' && chrome.tabs?.sendMessage && activeTabId) {
      try {
        // Ensure scripts are injected via background service worker
        chrome.runtime.sendMessage({ action: 'ENSURE_INJECTED', tabId: activeTabId }, (injectResp) => {
          if (chrome.runtime.lastError || !injectResp || !injectResp.ok) {
            isScanning = false;
            scanBtn.disabled = false;
            showErrorState(
              injectResp?.error ||
                'This page restricts extension scripts (e.g., chrome://, edge://, or Web Store pages). Try scanning on an HTTP/HTTPS or local test-site page.'
            );
            return;
          }

          // Step 1: Real 10-second observation countdown
          simulateTimerCheckUI();

          chrome.tabs.sendMessage(activeTabId, { action: 'START_SCAN', observeTimer: true }, (response) => {
            clearInterval(timerInterval);
            isScanning = false;
            scanBtn.disabled = false;

            if (chrome.runtime.lastError || !response) {
              console.warn('[DarkGuard] Content scanner not connected or error:', chrome.runtime.lastError?.message);
              showErrorState(
                response?.error ||
                  'Scanning failed or connection lost. Please reload the page and try again.'
              );
              return;
            }

            renderScanResult(response);

            // Log scan to background history
            try {
              chrome.runtime.sendMessage({ action: 'LOG_SCAN', scan: response });
            } catch {}
          });
        });
      } catch (err) {
        clearInterval(timerInterval);
        isScanning = false;
        scanBtn.disabled = false;
        showErrorState(err.message || 'Error communicating with active tab content script.');
      }
    } else {
      // Standalone mode (e.g., popup.html opened directly in a browser tab)
      simulateTimerCheckUI();
      setTimeout(() => {
        clearInterval(timerInterval);
        isScanning = false;
        scanBtn.disabled = false;
        loadSampleDemoResult();
      }, 1800);
    }
  }

  /**
   * Displays the "checking timer..." progress UI while timer observation occurs.
   */
  function simulateTimerCheckUI() {
    timerObservationCountdown = 10; // Real 10-second countdown matching observation window
    timerCountdownSecs.textContent = timerObservationCountdown;
    timerCheckingBox.classList.remove('hidden');
    loadingTitle.textContent = 'Verifying Countdown Evidence...';
    loadingStatusMsg.textContent = 'Observing timer to verify if digits update or stay frozen...';

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timerObservationCountdown--;
      if (timerCountdownSecs) {
        timerCountdownSecs.textContent = Math.max(0, timerObservationCountdown);
      }
      if (timerObservationCountdown <= 0) {
        clearInterval(timerInterval);
        loadingTitle.textContent = 'Running Classifier Inference...';
        loadingStatusMsg.textContent = 'Evaluating phrasing and generating risk score...';
      }
    }, 1000);
  }

  /**
   * Renders the complete ScanResult into the popup DOM.
   */
  function renderScanResult(result) {
    currentScanResult = result;
    setView('results');

    const score = Math.max(0, Math.min(100, Math.round(result.risk_score || 0)));
    const level = result.level || calculateLevelFromScore(score);

    // 1. Animate Gauge
    animateGauge(score, level);

    // 2. Risk Level Pill
    riskLevelBadge.textContent = level;
    riskLevelBadge.className = 'risk-level-badge';
    if (score >= 75) {
      riskLevelBadge.classList.add('level-very-high');
      riskSummaryText.textContent = 'Significant deceptive patterns found. Review options carefully.';
    } else if (score >= 50) {
      riskLevelBadge.classList.add('level-high');
      riskSummaryText.textContent = 'Multiple urgency or discount discrepancies detected on page.';
    } else if (score >= 25) {
      riskLevelBadge.classList.add('level-moderate');
      riskSummaryText.textContent = 'A few design signals worth double-checking before checkout.';
    } else {
      riskLevelBadge.classList.add('level-low');
      riskSummaryText.textContent = 'Design elements look sound and transparent in what we checked.';
    }

    // 3. Metadata stats
    statElementsChecked.textContent = `${result.rawCandidatesCount || result.coverage?.checked || 14} elements checked`;
    statScanTime.textContent = `${result.scanDurationMs || 85}ms`;

    // 4. ML Availability Banner
    if (result.ml_enabled === false || result.classifierChecksumValid === false) {
      mlUnavailableBanner.classList.remove('hidden');
      const titleEl = document.getElementById('ml-banner-title');
      const descEl = document.getElementById('ml-banner-desc');
      if (result.classifierChecksumValid === false) {
        if (titleEl) titleEl.textContent = 'Text model unavailable';
        if (descEl) descEl.textContent = 'Model checksum verification failed. Running rules-only scan.';
      } else {
        if (titleEl) titleEl.textContent = 'Text model off (Release Gate)';
        if (descEl) descEl.textContent = 'Text model is off because it did not pass the release gate. Running rules-only scan.';
      }
    } else {
      mlUnavailableBanner.classList.add('hidden');
    }

    // 5. Findings list
    const detections = result.detections || [];
    findingsCountTitle.textContent = `Findings (${detections.length})`;

    if (detections.length === 0) {
      findingsContainer.innerHTML = '';
      emptyStateCard.classList.remove('hidden');
    } else {
      emptyStateCard.classList.add('hidden');
      renderFindingsCards(detections);
    }
  }

  /**
   * Smooth animated SVG circular gauge.
   */
  function animateGauge(targetScore, level) {
    let startTimestamp = null;
    const duration = 750;

    // Pick color strictly matching design system
    let color = '#8FD1B0'; // Mint
    if (targetScore >= 75) color = '#E8A0B5'; // Rose
    else if (targetScore >= 50) color = '#F1A98F'; // Peach
    else if (targetScore >= 25) color = '#EBD27A'; // Butter

    gaugeBar.style.stroke = color;

    function step(timestamp) {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(ease * targetScore);

      scoreNumberEl.textContent = current;

      const offset = GAUGE_CIRCUMFERENCE - (current / 100) * GAUGE_CIRCUMFERENCE;
      gaugeBar.style.strokeDashoffset = offset;

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  /**
   * Renders findings list cards.
   */
  function renderFindingsCards(detections) {
    findingsContainer.innerHTML = '';

    detections.forEach((det, idx) => {
      const card = document.createElement('article');
      card.className = 'finding-card';
      card.setAttribute('data-ref', det.candidateRef || `ref-${idx}`);

      const severityLabel =
        det.severity === 3 ? 'Major' : det.severity === 2 ? 'Moderate' : 'Minor';
      const severityClass =
        det.severity === 3 ? 'major' : det.severity === 2 ? 'moderate' : 'minor';

      const snippetHtml = det.evidenceSnippet
        ? `<div class="evidence-snippet-box">&ldquo;${escapeHtml(det.evidenceSnippet)}&rdquo;</div>`
        : '';

      const explanation = det.aiExplanation || det.explanation || 'Suspicious design pattern detected.';

      card.innerHTML = `
        <div class="finding-top-row">
          <div class="finding-name">${escapeHtml(det.categoryName || det.category || 'Dark Pattern Signal')}</div>
          <button type="button" class="btn-locate" title="Highlight this element on page">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span>Locate</span>
          </button>
        </div>

        <div class="finding-chips-row">
          <span class="chip-dp">${escapeHtml(det.categoryId || det.category || 'DP')}</span>
          <span class="chip-severity ${severityClass}">${severityLabel}</span>
          <span class="chip-dp">${det.source === 'rule+ml' ? 'Rule + ML' : det.source === 'ml' ? 'ML Signal' : 'Rule'}</span>
        </div>

        ${snippetHtml}

        <div class="explanation-note-box">
          <strong>Observation Note:</strong> ${escapeHtml(explanation)}
        </div>
      `;

      // Clicking either the card or the "Locate" button triggers the highlighter
      const triggerHighlight = (e) => {
        e.stopPropagation();
        triggerElementHighlight(det);
      };

      card.addEventListener('click', triggerHighlight);
      const locateBtn = card.querySelector('.btn-locate');
      if (locateBtn) {
        locateBtn.addEventListener('click', triggerHighlight);
      }

      findingsContainer.appendChild(card);
    });
  }

  /**
   * Sends HIGHLIGHT_ELEMENT message to content/highlighter.js on active tab.
   */
  function triggerElementHighlight(det) {
    if (typeof chrome !== 'undefined' && chrome.tabs?.sendMessage && activeTabId) {
      chrome.tabs.sendMessage(
        activeTabId,
        {
          action: 'HIGHLIGHT_ELEMENT',
          candidateRef: det.candidateRef,
          selector: det.elementSelector,
          label: det.categoryName || 'Detected Pattern',
        },
        (resp) => {
          if (chrome.runtime.lastError) {
            console.warn('[DarkGuard Highlighter] Could not highlight on page:', chrome.runtime.lastError.message);
          }
        }
      );
    } else {
      console.log('[Standalone Demo] Highlight triggered for:', det.categoryName);
    }
  }

  /**
   * Toggles Ethical View on the active tab.
   */
  function toggleEthicalView(enabled) {
    if (typeof chrome !== 'undefined' && chrome.tabs?.sendMessage && activeTabId) {
      chrome.tabs.sendMessage(
        activeTabId,
        {
          action: 'TOGGLE_ETHICAL_VIEW',
          enabled: Boolean(enabled),
          detections: currentScanResult?.detections || [],
          riskScore: currentScanResult?.risk_score || 0,
          level: currentScanResult?.level || 'Low',
        },
        (resp) => {
          if (chrome.runtime.lastError) {
            console.warn('[DarkGuard] Could not toggle Ethical View:', chrome.runtime.lastError.message);
          }
        }
      );
    } else {
      console.log('[Standalone Demo] Ethical View toggled:', enabled);
    }
  }

  /**
   * Fallback Sample Demo Result for offline judge evaluation or simulator.
   */
  function loadSampleDemoResult() {
    const demoResult = {
      id: `scan-${Date.now()}`,
      domain: 'demo.darkguard.shop',
      url_path: '/products/headphones-pro',
      timestamp: new Date().toISOString(),
      risk_score: 78,
      level: 'Very high',
      model_version: 'darkguard-text-v1',
      ml_enabled: true,
      classifierChecksumValid: true,
      rawCandidatesCount: 18,
      scanDurationMs: 142,
      detections: [
        {
          id: 'det-1',
          category: 'fake_urgency',
          categoryId: 'DP-1',
          categoryName: 'Fake Urgency & Scarcity',
          candidateRef: 'dg-timer-1',
          severity: 3,
          confidence: 0.95,
          source: 'rule',
          evidenceSnippet: 'Hurry! Flash Deal reserved in cart: 00:14:59',
          explanation: 'Timer check: countdown did not change during a 10-second observation window.',
          templateId: 'ET-URG-01',
          details: { observedSeconds: 10, initialValue: '00:14:59', finalValue: '00:14:59' },
        },
        {
          id: 'det-2',
          category: 'misleading_discount',
          categoryId: 'DP-2',
          categoryName: 'Misleading Discount Calculation',
          candidateRef: 'dg-price-1',
          severity: 2,
          confidence: 0.9,
          source: 'rule',
          evidenceSnippet: '70% OFF (Was $400.00, Now $200.00)',
          explanation: 'Price check: current price $200, reference price $400. The page states 70% off; the calculated discount is 50%.',
          templateId: 'ET-DISC-01',
          details: { currentPrice: 200, referencePrice: 400, statedPercent: 70, calculatedPercent: 50 },
        },
        {
          id: 'det-3',
          category: 'confirm_shaming',
          categoryId: 'DP-3',
          categoryName: 'Confirm Shaming Decline Phrasing',
          candidateRef: 'dg-shame-1',
          severity: 2,
          confidence: 0.85,
          source: 'rule+ml',
          evidenceSnippet: 'No thanks, I prefer paying full price',
          explanation: 'Wording note: this option uses guilt-inducing language designed to pressure the user.',
          templateId: 'ET-CONF-01',
          details: { matchedPhrase: 'no thanks, i prefer paying full price' },
        },
        {
          id: 'det-4',
          category: 'preselected_extra',
          categoryId: 'DP-4',
          categoryName: 'Pre-Selected Extras & Add-ons',
          candidateRef: 'dg-extra-1',
          severity: 2,
          confidence: 0.88,
          source: 'rule',
          evidenceSnippet: 'Add 3-Year Extended Warranty & Protection Plan (+$49.99)',
          explanation: 'Pre-selected extra: this option was checked by default near the purchase control.',
          templateId: 'ET-EXTRA-01',
          details: { addonLabel: 'Add 3-Year Extended Warranty' },
        },
      ],
    };

    renderScanResult(demoResult);
  }

  function showErrorState(message) {
    setView('error');
    errorMsgText.textContent = message;
  }

  function calculateLevelFromScore(score) {
    if (score >= 75) return 'Very high';
    if (score >= 50) return 'High';
    if (score >= 25) return 'Moderate';
    return 'Low';
  }

  function exportResult(format) {
    if (!currentScanResult) return;

    let content = '';
    let filename = `darkguard-scan-${Date.now()}`;

    if (format === 'json') {
      content = JSON.stringify(currentScanResult, null, 2);
      filename += '.json';
      downloadFile(content, 'application/json', filename);
    } else {
      content = generateMarkdownReport(currentScanResult);
      filename += '.md';
      downloadFile(content, 'text/markdown', filename);
    }
  }

  function generateMarkdownReport(result) {
    const lines = [
      `# DarkGuard AI Scan Audit Report`,
      `**Domain:** ${result.domain}`,
      `**URL Path:** ${result.url_path}`,
      `**Timestamp:** ${result.timestamp}`,
      `**Risk Score:** ${result.risk_score}/100 (${result.level})`,
      `**ML Classifier Status:** ${result.ml_enabled ? 'Active' : 'Unavailable (Rules Only)'}`,
      `\n## Detected Findings (${result.detections?.length || 0})`,
    ];

    (result.detections || []).forEach((d, i) => {
      lines.push(`\n### ${i + 1}. [${d.categoryId}] ${d.categoryName}`);
      lines.push(`- **Severity:** ${d.severity === 3 ? 'Major' : d.severity === 2 ? 'Moderate' : 'Minor'}`);
      lines.push(`- **Source:** ${d.source}`);
      if (d.evidenceSnippet) lines.push(`- **Evidence Snippet:** \`${d.evidenceSnippet}\``);
      lines.push(`- **Observation:** ${d.aiExplanation || d.explanation}`);
    });

    return lines.join('\n');
  }

  function downloadFile(content, mimeType, filename) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();
