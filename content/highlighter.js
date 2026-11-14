/**
 * DarkGuard AI — Suspicious Element Highlighter (content/highlighter.js)
 *
 * Requirements:
 * - Highlight suspicious DOM elements associated with detected dark patterns.
 * - Scroll smoothly to the target element.
 * - Clearly visible with pulsing emphasis without altering element content or layout.
 * - Support clearing highlights.
 * - 100% Non-destructive: never permanently modifies element attributes or styles.
 */

(function () {
  'use strict';

  class ElementHighlighter {
    constructor() {
      this.activeOverlay = null;
      this.activeTarget = null;
      this.originalStyle = '';
      this.autoDismissTimer = null;

      this.injectStyles();
      this.setupGlobalDismiss();
    }

    injectStyles() {
      if (document.getElementById('dg-highlighter-styles')) return;

      const style = document.createElement('style');
      style.id = 'dg-highlighter-styles';
      style.textContent = `
        .dg-highlighter-overlay {
          position: absolute !important;
          z-index: 2147483640 !important;
          pointer-events: none !important;
          border: 3px solid #2563EB !important;
          border-radius: 8px !important;
          background: rgba(37, 99, 235, 0.08) !important;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.25), 0 0 25px rgba(37, 99, 235, 0.35) !important;
          animation: dg-highlighter-pulse 1.8s ease-in-out infinite alternate !important;
          transition: all 0.2s ease-out !important;
        }

        .dg-highlighter-badge {
          position: absolute !important;
          top: -30px !important;
          left: 0 !important;
          background: #1E293B !important;
          color: #FFFFFF !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          padding: 3px 9px !important;
          border-radius: 6px !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 5px !important;
          white-space: nowrap !important;
          letter-spacing: 0.02em !important;
        }

        @keyframes dg-highlighter-pulse {
          0% {
            box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.25), 0 0 15px rgba(37, 99, 235, 0.3);
          }
          100% {
            box-shadow: 0 0 0 8px rgba(37, 99, 235, 0.4), 0 0 30px rgba(37, 99, 235, 0.6);
          }
        }
      `;
      (document.head || document.documentElement).appendChild(style);
    }

    setupGlobalDismiss() {
      // Dismiss highlight when user clicks anywhere on the page
      document.addEventListener(
        'click',
        (e) => {
          if (this.activeOverlay && !e.target.closest('[data-dg-owner="ethical-view"]')) {
            this.clearHighlight();
          }
        },
        { passive: true }
      );

      // Re-position overlay on window resize or scroll
      window.addEventListener(
        'resize',
        () => {
          if (this.activeTarget && this.activeOverlay) {
            this.updateOverlayPosition(this.activeTarget, this.activeOverlay);
          }
        },
        { passive: true }
      );
    }

    /**
     * Finds target element by candidate ref, selector, or text snippet.
     */
    findElement(candidateRef, selector, textSnippet) {
      if (candidateRef) {
        const el = document.querySelector(`[data-dg-ref="${candidateRef}"]`);
        if (el) return el;
      }

      if (selector) {
        try {
          const el = document.querySelector(selector);
          if (el) return el;
        } catch {}
      }

      if (textSnippet && textSnippet.length > 3) {
        const allCandidates = document.querySelectorAll('button, a, span, p, div, label, input');
        for (const el of allCandidates) {
          if (el.textContent && el.textContent.includes(textSnippet.trim())) {
            return el;
          }
        }
      }

      return null;
    }

    /**
     * Highlights element and smoothly scrolls into view.
     */
    highlightElement(candidateRef, selector, label = 'Detected Suspicious Element') {
      this.clearHighlight();

      const target = this.findElement(candidateRef, selector);
      if (!target) {
        console.warn('[DarkGuard Highlighter] Target element not found for ref:', candidateRef);
        return false;
      }

      // 1. Scroll smoothly into view
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });

      // 2. Create floating overlay element (ensures zero modification to original DOM element styles)
      const overlay = document.createElement('div');
      overlay.className = 'dg-highlighter-overlay';
      overlay.setAttribute('data-dg-owner', 'highlighter');

      const badge = document.createElement('div');
      badge.className = 'dg-highlighter-badge';
      badge.innerHTML = `<span>🛡️</span> <span>${this.escapeHtml(label)}</span>`;
      overlay.appendChild(badge);

      document.body.appendChild(overlay);
      this.activeOverlay = overlay;
      this.activeTarget = target;

      // Position overlay
      this.updateOverlayPosition(target, overlay);

      // Auto dismiss after 7 seconds
      clearTimeout(this.autoDismissTimer);
      this.autoDismissTimer = setTimeout(() => {
        this.clearHighlight();
      }, 7000);

      return true;
    }

    updateOverlayPosition(target, overlay) {
      const rect = target.getBoundingClientRect();
      const scrollX = window.scrollX || window.pageXOffset || 0;
      const scrollY = window.scrollY || window.pageYOffset || 0;

      const padding = 4;
      overlay.style.top = `${Math.max(0, rect.top + scrollY - padding)}px`;
      overlay.style.left = `${Math.max(0, rect.left + scrollX - padding)}px`;
      overlay.style.width = `${rect.width + padding * 2}px`;
      overlay.style.height = `${rect.height + padding * 2}px`;
    }

    /**
     * Completely removes highlight overlay.
     */
    clearHighlight() {
      clearTimeout(this.autoDismissTimer);

      const existingOverlays = document.querySelectorAll('[data-dg-owner="highlighter"]');
      existingOverlays.forEach((el) => el.remove());

      this.activeOverlay = null;
      this.activeTarget = null;
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
  const highlighter = new ElementHighlighter();
  window.DarkGuardHighlighter = highlighter;

  // Listen for Chrome Extension runtime messages
  if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'HIGHLIGHT_ELEMENT') {
        const success = highlighter.highlightElement(
          request.candidateRef,
          request.selector,
          request.label || request.categoryName || 'Detected Suspicious Element'
        );
        sendResponse({ success });
        return true;
      }

      if (request.action === 'CLEAR_HIGHLIGHT') {
        highlighter.clearHighlight();
        sendResponse({ success: true });
        return true;
      }
    });
  }
})();
