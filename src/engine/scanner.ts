import { CandidateElement } from '../types';

/**
 * Extracts candidate elements from a DOM root.
 * Enforces privacy boundaries:
 * - Never reads password, email, phone, card, or address inputs.
 * - Never reads input text values.
 * - Only records 'checked' for checkboxes and radios.
 * - Extracts only visible elements with normalized text <= 200 chars.
 */
export function extractCandidates(rootElement: HTMLElement = document.body): CandidateElement[] {
  const candidates: CandidateElement[] = [];
  const sensitiveSelectors = [
    'input[type="password"]',
    'input[type="email"]',
    'input[type="tel"]',
    'input[autocomplete*="cc-"]',
    'input[name*="card"]',
    'input[name*="cvv"]',
    'input[name*="ssn"]',
    'input[name*="address"]',
  ];

  // Helper to check visibility
  const isElementVisible = (el: HTMLElement): boolean => {
    if (!el) return false;
    const win = el.ownerDocument?.defaultView || (typeof window !== 'undefined' ? window : null);
    if (!win) return true;
    if (typeof win.getComputedStyle !== 'function') return true;

    // Check element and all ancestors up to body
    let current: HTMLElement | null = el;
    while (current && current.tagName !== 'BODY') {
      const s = win.getComputedStyle(current);
      if (
        s.display === 'none' ||
        s.visibility === 'hidden' ||
        parseFloat(s.opacity || '1') === 0
      ) {
        return false;
      }
      current = current.parentElement;
    }

    if (!el.getBoundingClientRect) return true;
    const rect = el.getBoundingClientRect();

    const isJsdom = typeof win.navigator !== 'undefined' && /jsdom/i.test(win.navigator.userAgent || '');
    if (isJsdom) {
      // In JSDOM, default Element.prototype.getBoundingClientRect returns 0x0 because JSDOM lacks a layout engine
      // If getBoundingClientRect has been explicitly mocked on the element, respect its dimensions
      const isMocked = el.getBoundingClientRect !== win.Element?.prototype?.getBoundingClientRect;
      if (isMocked) {
        return rect.width > 0 && rect.height > 0;
      }
      return true;
    }

    // In a real browser, element must have non-zero dimensions
    return rect.width > 0 && rect.height > 0;
  };

  // Skip sensitive elements entirely
  const isSensitive = (el: HTMLElement): boolean => {
    for (const sel of sensitiveSelectors) {
      if (el.matches?.(sel) || el.closest?.(sel)) return true;
    }
    return false;
  };

  // Target candidate elements: buttons, links, price containers, countdown timers, checkboxes, banners, headings
  const targetSelector = [
    'button',
    'a[role="button"]',
    'a',
    'input[type="checkbox"]',
    'input[type="radio"]',
    '[role="button"]',
    '.price',
    '.discount',
    '.timer',
    '.countdown',
    '.urgent',
    '.badge',
    'h1',
    'h2',
    'h3',
    'h4',
    'span',
    'p',
    'label',
  ].join(', ');

  const elements = rootElement.querySelectorAll<HTMLElement>(targetSelector);
  let refCounter = 1;

  elements.forEach((el) => {
    // If element is inside an existing Ethical View node or test harness bar, ignore it
    if (el.closest('[data-dg-owner]')) return;
    if (isSensitive(el)) return;
    if (!isElementVisible(el)) return;

    // Normalize text up to 200 characters
    const rawText = el.innerText || el.textContent || '';
    const cleanText = rawText.replace(/\s+/g, ' ').trim().slice(0, 200);

    const rect = el.getBoundingClientRect();
    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute('role') || undefined;

    // Attributes (safe metadata only)
    const attributes: Record<string, string | boolean | undefined> = {
      disabled: el.hasAttribute('disabled'),
      type: el.getAttribute('type') || undefined,
    };

    if (tag === 'input' && (el as HTMLInputElement).type === 'checkbox') {
      attributes.checked = (el as HTMLInputElement).checked;
    }

    // Determine context (inForm, near primary action)
    const inForm = Boolean(el.closest('form'));
    const nearPrimaryAction = Boolean(
      el.closest('.cart-actions, .product-actions, form, .checkout-area, [data-action-area="true"]') ||
        el.parentElement?.querySelector('button[type="submit"], button.primary-btn, [data-buy-button="true"]')
    );

    // Filter out useless empty non-input elements
    if (tag !== 'input' && (!cleanText || cleanText.length < 2)) {
      return;
    }

    // Assign reference ID
    const ref = el.getAttribute('data-dg-ref') || `dg-${refCounter++}`;
    el.setAttribute('data-dg-ref', ref);

    // Build unique selector
    let selector = tag;
    if (el.id) {
      selector += `#${el.id}`;
    } else if (el.className && typeof el.className === 'string') {
      const firstClass = el.className.split(' ').filter(c => c && !c.startsWith('dg-'))[0];
      if (firstClass) selector += `.${firstClass}`;
    }

    const win = el.ownerDocument?.defaultView || (typeof window !== 'undefined' ? window : null);
    const scrollX = win?.scrollX || 0;
    const scrollY = win?.scrollY || 0;

    candidates.push({
      ref,
      tag,
      role,
      text: cleanText,
      attributes,
      rect: {
        x: Math.round(rect.left + scrollX),
        y: Math.round(rect.top + scrollY),
        w: Math.round(rect.width),
        h: Math.round(rect.height),
      },
      selector,
      inForm,
      nearPrimaryAction,
      visible: true,
      element: el,
    });
  });

  return candidates;
}
