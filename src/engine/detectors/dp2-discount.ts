import { CandidateElement, RuleEvidence } from '../../types';

export interface DiscountContext {
  candidates: CandidateElement[];
}

/**
 * Locale-aware price parser
 * Handles ₹1,299, $19.99, 1.299,00 €, £45.50, $200, etc.
 */
export function parsePrice(text: string): { amount: number; currency: string } | null {
  if (!text) return null;

  // Currency symbols
  const currencyMatch = text.match(/([$€£₹]|USD|EUR|GBP|INR)/i);
  const currency = currencyMatch ? currencyMatch[0] : '$';

  // Match numerical patterns like 1,299.00 or 1.299,00 or 19.99 or 200
  const match = text.match(/(?:[$€£₹]\s*)?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)/);
  if (!match) return null;

  let numStr = match[1];

  // If both . and , exist, figure out decimal separator
  if (numStr.includes(',') && numStr.includes('.')) {
    if (numStr.indexOf(',') < numStr.indexOf('.')) {
      // 1,299.50 -> comma is thousand, dot is decimal
      numStr = numStr.replace(/,/g, '');
    } else {
      // 1.299,50 -> dot is thousand, comma is decimal
      numStr = numStr.replace(/\./g, '').replace(',', '.');
    }
  } else if (numStr.includes(',')) {
    // Check if comma is decimal (e.g., 19,99) or thousands (e.g., 1,299)
    const parts = numStr.split(',');
    if (parts.length === 2 && parts[1].length === 2) {
      numStr = numStr.replace(',', '.');
    } else {
      numStr = numStr.replace(/,/g, '');
    }
  }

  const amount = parseFloat(numStr);
  return isNaN(amount) ? null : { amount, currency };
}

export const DP2DiscountDetector = {
  id: 'DP-2' as const,
  category: 'misleading_discount' as const,
  name: 'Misleading Discount Calculation',

  run(ctx: DiscountContext): RuleEvidence[] {
    const evidenceList: RuleEvidence[] = [];

    // Find all price candidates and discount claims
    for (const candidate of ctx.candidates) {
      const el = candidate.element;
      const text = candidate.text;

      // Stated discount percentage search: "60% off", "Save 40%", "50% DISCOUNT"
      const statedMatch = text.match(/(\d{1,2})\s*%\s*(?:off|discount|save|savings)/i) ||
                          text.match(/(?:save|off)\s*(\d{1,2})\s*%/i);

      if (!statedMatch) continue;
      const statedPercent = parseInt(statedMatch[1], 10);

      // Look in parent container for current price and reference price
      const container = el?.closest('.price-container, .product-pricing, .pricing, [data-price-group="true"]') ||
                        el?.parentElement?.parentElement ||
                        el?.parentElement;

      if (!container) continue;

      // Search for reference (original) price
      // Look for <s>, <del>, line-through style, or "was", "mrp", "original"
      const refEl = container.querySelector('s, del, .line-through, [style*="line-through"], .original-price, .was-price, .mrp');
      const refText = refEl?.textContent || '';
      const refParsed = parsePrice(refText);

      // Search for current (sale) price
      const currEl = container.querySelector('.current-price, .sale-price, .final-price, .now-price') ||
                     Array.from(container.querySelectorAll('span, strong, b, div')).find(
                       (node) => node !== refEl && !node.contains(refEl as Node) && parsePrice(node.textContent || '')
                     );
      const currText = currEl?.textContent || '';
      const currParsed = parsePrice(currText);

      if (refParsed && currParsed && refParsed.amount > currParsed.amount) {
        const reference = refParsed.amount;
        const current = currParsed.amount;
        const calculatedPercent = Math.round(((reference - current) / reference) * 100);

        // Check if stated differs from calculated by more than 5 points
        if (Math.abs(statedPercent - calculatedPercent) > 5) {
          evidenceList.push({
            ruleId: 'DP-2',
            ruleName: 'Misleading Discount Calculation',
            category: 'misleading_discount',
            candidateRef: candidate.ref,
            evidenceCode: 'arithmetic_mismatch',
            confidence: 0.9,
            severity: 2,
            details: {
              currentPrice: current,
              referencePrice: reference,
              statedPercent,
              calculatedPercent,
              currencySymbol: currParsed.currency,
            },
            explanation: `Price check: current price ${currParsed.currency}${current}, reference price ${refParsed.currency}${reference}. The page states ${statedPercent}% off; the calculated discount is ${calculatedPercent}%.`,
          });
          continue;
        }
      }

      // Check for unlabeled reference price
      if (refEl && !/(?:was|mrp|list\s*price|original|regular|retail)/i.test(refEl.textContent || '') &&
          !refEl.parentElement?.textContent?.match(/(?:was|mrp|list\s*price|regular)/i)) {
        evidenceList.push({
          ruleId: 'DP-2',
          ruleName: 'Misleading Discount Calculation',
          category: 'misleading_discount',
          candidateRef: candidate.ref,
          evidenceCode: 'unlabeled_reference',
          confidence: 0.5,
          severity: 1,
          details: {
            statedPercent,
            referencePrice: refParsed?.amount,
          },
          explanation: 'Reference price: the higher price is shown without a clear label. Check what it refers to before comparing.',
        });
      }
    }

    return evidenceList;
  },
};
