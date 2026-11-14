import { CandidateElement, RuleEvidence } from '../../types';

export interface UrgencyContext {
  candidates: CandidateElement[];
  observedSnapshots?: Map<string, string>; // ref -> previous text
  observeMs?: number;
}

const TIME_PATTERN = /(\d{1,2}:\d{2}(?::\d{2})?|\b\d+\s*(?:days?|hours?|hrs?|mins?|minutes?|secs?|seconds?)\b)/i;
const URGENCY_WORDS = /\b(hurry|limited\s*time|ends\s*soon|flash\s*sale|only\s*\d+\s*left|almost\s*gone|selling\s*fast|act\s*now|last\s*chance|expires|don'?t\s*miss)\b/i;

export const DP1UrgencyDetector = {
  id: 'DP-1' as const,
  category: 'fake_urgency' as const,
  name: 'Fake Urgency & Scarcity',

  run(ctx: UrgencyContext): RuleEvidence[] {
    const evidenceList: RuleEvidence[] = [];

    for (const candidate of ctx.candidates) {
      const text = candidate.text;
      const hasTimePattern = TIME_PATTERN.test(text);
      const hasUrgencyWord = URGENCY_WORDS.test(text);

      // Check for countdown / deadline timer
      if (hasTimePattern) {
        const timeMatch = text.match(TIME_PATTERN)?.[0] || '';
        const prevValue = ctx.observedSnapshots?.get(candidate.ref);

        // Check if value stayed unchanged or is marked as frozen
        const isFrozen =
          (prevValue !== undefined && prevValue === timeMatch) ||
          candidate.element?.getAttribute('data-dg-frozen') === 'true' ||
          candidate.attributes['data-dg-frozen'] === 'true' ||
          (ctx.observeMs && ctx.observeMs >= 3000 && prevValue === timeMatch);

        if (isFrozen) {
          evidenceList.push({
            ruleId: 'DP-1',
            ruleName: 'Fake Urgency & Scarcity',
            category: 'fake_urgency',
            candidateRef: candidate.ref,
            evidenceCode: 'frozen_countdown',
            confidence: 0.9,
            severity: 3,
            details: {
              observedSeconds: Math.round((ctx.observeMs || 10000) / 1000),
              initialValue: prevValue || timeMatch,
              finalValue: timeMatch,
            },
            explanation: `Timer check: countdown did not change during a ${Math.round(
              (ctx.observeMs || 10000) / 1000
            )}-second observation window.`,
          });
          continue;
        }
      }

      // Urgency text with no timer or stock indicator
      if (hasUrgencyWord && !hasTimePattern) {
        evidenceList.push({
          ruleId: 'DP-1',
          ruleName: 'Fake Urgency & Scarcity',
          category: 'fake_urgency',
          candidateRef: candidate.ref,
          evidenceCode: 'urgency_text_only',
          confidence: 0.5,
          severity: 2,
          details: {
            initialValue: text,
          },
          explanation:
            'Urgency message: no visible stock or deadline indicator on this page supports this claim.',
        });
      }
    }

    return evidenceList;
  },
};
