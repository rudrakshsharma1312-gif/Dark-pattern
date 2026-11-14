import { CandidateElement, RuleEvidence } from '../../types';

export interface ShamingContext {
  candidates: CandidateElement[];
}

export const SHAMING_PHRASES = [
  "no, i don't want to save money",
  "no thanks, i don't want to save",
  "no thanks, i prefer paying full price",
  "i prefer full price",
  "prefer paying full price",
  "i don't care about",
  "don't care about audio quality",
  "i don't care about my safety",
  "i hate discounts",
  "no, i hate discounts",
  "i enjoy paying more",
  "i like paying full price",
  "skip this special offer",
  "skip savings",
  "no thanks, i will take the risk",
  "take the risk",
  "i'll take the risk",
  "no warranty needed",
  "no thanks, i don't want free gifts",
  "continue without saving",
  "no, i don't want protection",
  "no, i prefer bad posture",
  "decline discount",
  "no, i'd rather pay more",
  "no thanks, my current headphones are fine",
  "no, i hate good deals",
  "i don't need savings",
  "no, i prefer paying retail",
  "leave this deal behind",
  "no, i don't want to protect my purchase",
  "no thanks, i don't need help",
  "i will pay original price",
  "no thanks, cancel my discount",
  "i don't deserve this discount",
  "no thanks, i don't like saving money",
  "skip offer and pay more",
  "lose my discount",
  "i decline all savings",
  "no, i don't care about discounts",
];

export const DP3ShamingDetector = {
  id: 'DP-3' as const,
  category: 'confirm_shaming' as const,
  name: 'Confirm Shaming Decline Phrasing',

  run(ctx: ShamingContext): RuleEvidence[] {
    const evidenceList: RuleEvidence[] = [];

    for (const candidate of ctx.candidates) {
      const lowerText = candidate.text.toLowerCase().trim();

      // Check if element is an interactive decline-style button, link, or label
      const isDeclineElement =
        candidate.tag === 'button' ||
        candidate.tag === 'a' ||
        candidate.role === 'button' ||
        candidate.attributes.type === 'button' ||
        candidate.nearPrimaryAction ||
        lowerText.startsWith('no') ||
        lowerText.includes('skip') ||
        lowerText.includes('cancel') ||
        lowerText.includes('decline') ||
        lowerText.includes('pass') ||
        lowerText.includes('reject');

      if (!isDeclineElement && !candidate.nearPrimaryAction) {
        continue;
      }

      // Check against curated phrase list
      const matchedPhrase = SHAMING_PHRASES.find((phrase) =>
        lowerText.includes(phrase)
      );

      if (matchedPhrase) {
        evidenceList.push({
          ruleId: 'DP-3',
          ruleName: 'Confirm Shaming Decline Phrasing',
          category: 'confirm_shaming',
          candidateRef: candidate.ref,
          evidenceCode: 'shaming_phrase',
          confidence: 0.7,
          severity: 2,
          details: {
            matchedPhrase,
          },
          explanation:
            "Wording note: this decline option uses guilt-inducing language designed to pressure the user. Choosing it still performs the button's original action.",
        });
      }
    }

    return evidenceList;
  },
};
