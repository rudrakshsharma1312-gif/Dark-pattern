import { CandidateElement, RuleEvidence } from '../../types';

export interface ExtrasContext {
  candidates: CandidateElement[];
}

const ADDON_KEYWORDS = /\b(insurance|warranty|protection\s*plan|extended\s*warranty|gift\s*wrap|donation|subscribe|subscription|vip\s*membership|accidental\s*damage|care\s*plan|priority\s*shipping|carbon\s*offset)\b/i;

export const DP4ExtrasDetector = {
  id: 'DP-4' as const,
  category: 'preselected_extra' as const,
  name: 'Pre-selected Extras & Add-ons',

  run(ctx: ExtrasContext): RuleEvidence[] {
    const evidenceList: RuleEvidence[] = [];

    for (const candidate of ctx.candidates) {
      const isCheckbox =
        candidate.tag === 'input' && candidate.attributes.type === 'checkbox';

      if (!isCheckbox) continue;

      const isCheckedByDefault = Boolean(candidate.attributes.checked);
      if (!isCheckedByDefault) continue;

      // Check label or nearby text
      const el = candidate.element as HTMLInputElement | undefined;
      const label =
        candidate.text ||
        el?.labels?.[0]?.textContent ||
        el?.closest('label')?.textContent ||
        el?.parentElement?.textContent ||
        '';

      const matchesAddon = ADDON_KEYWORDS.test(label);
      if (!matchesAddon) continue;

      // Walk up parent tree to check if near an action button, form, or purchase area
      let container: HTMLElement | null = el?.parentElement || null;
      let hasActionBtn = false;
      const docBody = el.ownerDocument?.body;
      while (container && container !== docBody && container.tagName !== 'MAIN') {
        if (
          container.querySelector('button, input[type="submit"], [role="button"]') ||
          container.matches?.('form, .product-actions, .cart-actions, .checkout-area')
        ) {
          hasActionBtn = true;
          break;
        }
        container = container.parentElement;
      }

      if (hasActionBtn || candidate.nearPrimaryAction || candidate.inForm) {
        evidenceList.push({
          ruleId: 'DP-4',
          ruleName: 'Pre-selected Extras & Add-ons',
          category: 'preselected_extra',
          candidateRef: candidate.ref,
          evidenceCode: 'preselected_addon',
          confidence: 0.85,
          severity: 2,
          details: {
            addonLabel: label.trim().slice(0, 100),
          },
          explanation:
            'Pre-selected extra: this option was checked by default near the purchase control. Review it before continuing.',
        });
      }
    }

    return evidenceList;
  },
};
