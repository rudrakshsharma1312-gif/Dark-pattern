/**
 * DarkGuard AI — Ethical View Engine (content/ethical-view.js)
 *
 * CRITICAL SAFETY RULES ENFORCED:
 * 1. NEVER mutates product prices or reference price numbers.
 * 2. NEVER modifies button text, button attributes, or click handlers.
 * 3. NEVER modifies checkbox checked/unchecked states.
 * 4. NEVER impedes shopping actions or checkout flows.
 * 5. ONLY adds contextual notes, a top banner, and reversible visual outlines.
 * 6. SAFE RESTORATION: "Show original" removes injected banner and annotations,
 *    and removes only the outline classes that Ethical View added, preserving
 *    unrelated website changes, inline styles, and pre-existing classes.
 */

(function () {
  'use strict';

  // Default templates fallback in case templates.json is not fetched via chrome.runtime
  const DEFAULT_TEMPLATES = {
    'ET-URG-01': {
      id: 'ET-URG-01',
      action: 'caption',
      placement: 'after',
      text: 'Timer check: this countdown did not change during a {observed_seconds}-second check.',
      style: 'warning',
    },
    'ET-URG-02': {
      id: 'ET-URG-02',
      action: 'caption',
      placement: 'after',
      text: 'Urgency message: no visible stock or deadline indicator on this page supports this claim.',
      style: 'info',
    },
    'ET-DISC-01': {
      id: 'ET-DISC-01',
      action: 'comparison',
      placement: 'after',
      text: 'Price check: current price {current_price}, reference price {reference_price}. The page states {stated_percent}% off; the calculated discount is {calculated_percent}%.',
      style: 'warning',
    },
    'ET-DISC-02': {
      id: 'ET-DISC-02',
      action: 'caption',
      placement: 'after',
      text: 'Reference price: the higher price is shown without a clear label. Check what it refers to before comparing.',
      style: 'info',
    },
    'ET-CONF-01': {
      id: 'ET-CONF-01',
      action: 'caption',
      placement: 'after',
      text: 'Wording note: this option uses persuasive language. Choosing it still performs the button\'s original action.',
      style: 'info',
    },
    'ET-EXTRA-01': {
      id: 'ET-EXTRA-01',
      action: 'caption',
      placement: 'before',
      text: 'Pre-selected extra: this option was checked by default. Review it before continuing.',
      style: 'warning',
    },
    'ET-SIGNAL-01': {
      id: 'ET-SIGNAL-01',
      action: 'caption',
      placement: 'after',
      text: 'Possible pattern (text model, low certainty): this wording may be persuasive. Review in context.',
      style: 'info',
    },
    'ET-BANNER-01': {
      id: 'ET-BANNER-01',
      action: 'banner',
      placement: 'top',
      text: 'DarkGuard: {count} possible issue(s) found on this page. Risk score {risk_score} ({level}).',
      style: 'neutral',
    },
  };

  class EthicalViewEngine {
    constructor() {
      this.templates = new Map(Object.entries(DEFAULT_TEMPLATES));
      this.addedOutlineClasses = new Map(); // Map<HTMLElement, Set<string>>
      this.injectedElements = []; // HTMLElement[]
      this.state = 'OFF'; // 'OFF' | 'ON'
      this.bannerElement = null;

      this.loadExternalTemplates();
    }

    async loadExternalTemplates() {
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
          const url = chrome.runtime.getURL('content/templates.json');
          const resp = await fetch(url);
          if (resp.ok) {
            const data = await resp.json();
            if (data.templates && Array.isArray(data.templates)) {
              for (const t of data.templates) {
                this.templates.set(t.id, t);
              }
            }
          }
        }
      } catch {
        // Fall back gracefully to built-in templates
      }
    }

    interpolate(templateText, det, count, riskScore, level) {
      const details = det?.details || {};
      const currency = details.currencySymbol || '$';
      return templateText
        .replace(/{observed_seconds}/g, String(details.observedSeconds ?? 10))
        .replace(/{current_price}/g, details.currentPrice !== undefined ? `${currency}${details.currentPrice}` : '')
        .replace(/{reference_price}/g, details.referencePrice !== undefined ? `${currency}${details.referencePrice}` : '')
        .replace(/{stated_percent}/g, details.statedPercent !== undefined ? String(details.statedPercent) : '')
        .replace(/{calculated_percent}/g, details.calculatedPercent !== undefined ? String(details.calculatedPercent) : '')
        .replace(/{count}/g, String(count))
        .replace(/{risk_score}/g, String(riskScore))
        .replace(/{level}/g, level || 'Moderate');
    }

    /**
     * Applies Ethical View to the target container.
     * Guaranteed safe: never changes existing prices, buttons, or checkboxes.
     */
    apply(detections = [], container = document.body, riskScore = 0, level = 'Low') {
      if (this.state === 'ON') {
        this.restore();
      }

      try {
        this.addedOutlineClasses.clear();
        this.injectedElements = [];

        // 1. Inject Top Banner (ET-BANNER-01)
        const bannerTemplate = this.templates.get('ET-BANNER-01');
        if (bannerTemplate) {
          const banner = document.createElement('div');
          banner.setAttribute('data-dg-owner', 'ethical-view');
          banner.setAttribute('data-dg-id', 'ET-BANNER-01');
          banner.className = 'dg-ethical-banner';

          const levelClass =
            level === 'Very high'
              ? 'very-high'
              : level === 'High'
              ? 'high'
              : level === 'Moderate'
              ? 'moderate'
              : 'low';

          const bannerText = this.interpolate(
            bannerTemplate.text,
            detections[0] || {},
            detections.length,
            riskScore,
            level
          );

          banner.innerHTML = `
            <div class="dg-banner-left">
              <span class="dg-banner-shield">🛡️</span>
              <div>
                <span class="dg-banner-title">Ethical View Active:</span>
                <span class="dg-banner-text">${this.escapeHtml(bannerText)}</span>
                <span class="dg-banner-score-pill ${levelClass}">Risk Score: ${riskScore}/100</span>
              </div>
            </div>
            <div class="dg-banner-right">
              <button type="button" class="dg-btn-show-original" id="dg-show-original-btn">
                <span>✕ Show original</span>
              </button>
            </div>
          `;

          // Bind "Show original" button
          const showOrigBtn = banner.querySelector('#dg-show-original-btn');
          if (showOrigBtn) {
            showOrigBtn.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              this.restore();
            });
          }

          // Prepend banner at top of container or body
          const targetParent = container.tagName === 'BODY' ? (container.querySelector('main') || container) : container;
          targetParent.insertBefore(banner, targetParent.firstChild);
          this.bannerElement = banner;
          this.injectedElements.push(banner);
        }

        // 2. Add Contextual Note Callouts & Visual Outlines
        for (const det of detections) {
          // Locate target element by data-dg-ref, id, or selector
          let targetEl = null;
          if (det.candidateRef) {
            targetEl = container.querySelector(`[data-dg-ref="${det.candidateRef}"]`);
          }
          if (!targetEl && det.elementSelector) {
            try {
              targetEl = container.querySelector(det.elementSelector);
            } catch {}
          }

          if (!targetEl) continue;

          // NEVER modify interactive input properties or inline styles!
          // Outline styling is handled exclusively by non-intrusive CSS classes.
          const outlineClass =
            det.severity === 3
              ? 'dg-outlined-major'
              : det.severity === 2
              ? 'dg-outlined-moderate'
              : 'dg-outlined-minor';

          // Track only outline classes that Ethical View itself adds, ensuring
          // pre-existing classes are preserved and not accidentally removed on restore.
          if (!targetEl.classList.contains(outlineClass)) {
            targetEl.classList.add(outlineClass);
            if (!this.addedOutlineClasses.has(targetEl)) {
              this.addedOutlineClasses.set(targetEl, new Set());
            }
            this.addedOutlineClasses.get(targetEl).add(outlineClass);
          }

          // Get template for annotation
          const template =
            this.templates.get(det.templateId) ||
            this.templates.get('ET-SIGNAL-01') ||
            DEFAULT_TEMPLATES['ET-SIGNAL-01'];

          const noteEl = document.createElement('div');
          noteEl.setAttribute('data-dg-owner', 'ethical-view');
          noteEl.setAttribute('data-dg-id', template.id);
          noteEl.className = `dg-ethical-note ${template.style || 'info'}`;

          const icon = template.style === 'warning' ? '⚠️' : 'ℹ️';
          const noteText = this.interpolate(
            template.text,
            det,
            detections.length,
            riskScore,
            level
          );

          noteEl.innerHTML = `
            <span class="dg-note-icon">${icon}</span>
            <div class="dg-note-body">
              <strong>DarkGuard Note:</strong> ${this.escapeHtml(noteText)}
            </div>
          `;

          // Placement: before or after the element
          if (template.placement === 'before' && targetEl.parentNode) {
            targetEl.parentNode.insertBefore(noteEl, targetEl);
          } else if (targetEl.parentNode) {
            targetEl.parentNode.insertBefore(noteEl, targetEl.nextSibling);
          }

          this.injectedElements.push(noteEl);
        }

        this.state = 'ON';
        this.notifyStateChange('ON');
        return true;
      } catch (err) {
        console.error('[DarkGuard] Error applying Ethical View, reverting:', err);
        this.restore();
        return false;
      }
    }

    /**
     * Safely restores the page when "Show original" is clicked.
     * Removes only Ethical View injected elements and added outline classes,
     * preserving all unrelated inline styles, class mutations, and page behavior.
     */
    restore() {
      // 1. Remove all Ethical View injected DOM elements (banner, notes)
      const injected = document.querySelectorAll('[data-dg-owner="ethical-view"]');
      injected.forEach((el) => {
        try {
          el.remove();
        } catch {}
      });

      // 2. Remove ONLY the specific outline classes that Ethical View itself added.
      // Do not overwrite el.style.cssText or el.className, preserving concurrent site changes.
      for (const [el, classesAdded] of this.addedOutlineClasses.entries()) {
        if (document.contains(el)) {
          for (const cls of classesAdded) {
            el.classList.remove(cls);
          }
        }
      }

      this.addedOutlineClasses.clear();
      this.injectedElements = [];
      this.bannerElement = null;
      this.state = 'OFF';

      this.notifyStateChange('OFF');

      // Self-verification check
      const remainingNodes = document.querySelectorAll('[data-dg-owner="ethical-view"]');
      if (remainingNodes.length > 0) {
        console.warn('[DarkGuard] Lingering nodes detected during restore; removing:', remainingNodes.length);
        remainingNodes.forEach((n) => n.remove());
      }

      return true;
    }

    toggle(detections = [], container = document.body, riskScore = 0, level = 'Low') {
      if (this.state === 'ON') {
        this.restore();
        return 'OFF';
      } else {
        this.apply(detections, container, riskScore, level);
        return this.state;
      }
    }

    notifyStateChange(state) {
      // Dispatch browser custom event for local consumers
      window.dispatchEvent(
        new CustomEvent('darkguard-ethical-view-change', { detail: { state } })
      );

      // Notify Chrome extension popup/background if running in extension context
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        try {
          chrome.runtime.sendMessage({ action: 'ETHICAL_VIEW_STATUS_CHANGED', state }).catch(() => {});
        } catch {}
      }
    }

    escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  }

  // Singleton instance
  const ethicalEngine = new EthicalViewEngine();
  window.DarkGuardEthicalView = ethicalEngine;

  // Listen for extension messages
  if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'APPLY_ETHICAL_VIEW') {
        const success = ethicalEngine.apply(
          request.detections || [],
          document.body,
          request.riskScore || 0,
          request.level || 'Low'
        );
        sendResponse({ success, state: ethicalEngine.state });
        return true;
      }

      if (request.action === 'RESTORE_ORIGINAL' || request.action === 'RESTORE_ETHICAL_VIEW') {
        const success = ethicalEngine.restore();
        sendResponse({ success, state: 'OFF' });
        return true;
      }

      if (request.action === 'TOGGLE_ETHICAL_VIEW') {
        if (request.enabled === true) {
          ethicalEngine.apply(
            request.detections || [],
            document.body,
            request.riskScore || 0,
            request.level || 'Low'
          );
        } else if (request.enabled === false) {
          ethicalEngine.restore();
        } else {
          ethicalEngine.toggle(
            request.detections || [],
            document.body,
            request.riskScore || 0,
            request.level || 'Low'
          );
        }
        sendResponse({ state: ethicalEngine.state });
        return true;
      }

      if (request.action === 'GET_ETHICAL_VIEW_STATUS') {
        sendResponse({ state: ethicalEngine.state });
        return true;
      }
    });
  }
})();
