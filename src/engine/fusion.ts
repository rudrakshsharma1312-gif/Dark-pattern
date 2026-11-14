import {
  CandidateElement,
  ClassifierResult,
  DarkPatternCategory,
  Detection,
  DetectionSource,
  RuleEvidence,
} from '../types';

export interface FusionInput {
  candidates: CandidateElement[];
  ruleEvidence: RuleEvidence[];
  classifierResults: ClassifierResult[];
  classifierAvailable: boolean;
}

const CATEGORY_NAMES: Record<DarkPatternCategory, { id: 'DP-1' | 'DP-2' | 'DP-3' | 'DP-4'; name: string }> = {
  fake_urgency: { id: 'DP-1', name: 'Fake Urgency' },
  misleading_discount: { id: 'DP-2', name: 'Misleading Discount' },
  confirm_shaming: { id: 'DP-3', name: 'Confirm Shaming' },
  preselected_extra: { id: 'DP-4', name: 'Pre-selected Extras' },
  classifier_signal: { id: 'DP-3', name: 'Possible Pattern' },
};

export function fuseDetections(input: FusionInput): Detection[] {
  const { candidates, ruleEvidence, classifierResults, classifierAvailable } = input;
  const detections: Detection[] = [];

  const candidateMap = new Map(candidates.map((c) => [c.ref, c]));
  const classifierMap = new Map(classifierResults.map((r) => [r.candidateRef, r]));

  // Track which candidates produced a rule finding
  const coveredRefs = new Set<string>();

  // Process rule evidence
  for (const ev of ruleEvidence) {
    coveredRefs.add(ev.candidateRef);
    const candidate = candidateMap.get(ev.candidateRef);
    const mlResult = classifierMap.get(ev.candidateRef);

    let source: DetectionSource = 'rule';
    let confidence = ev.confidence;

    // Check classifier agreement
    if (classifierAvailable && mlResult) {
      let mlProb = 0;
      if (ev.category === 'fake_urgency') mlProb = mlResult.probabilities.urgency;
      else if (ev.category === 'misleading_discount') mlProb = mlResult.probabilities.discount_wording;
      else if (ev.category === 'confirm_shaming') mlProb = mlResult.probabilities.shaming;
      else if (ev.category === 'preselected_extra') mlProb = mlResult.probabilities.addon_extra;

      if (mlProb >= 0.6) {
        source = 'rule+ml';
        if (mlProb > 0.9) {
          confidence = Math.min(0.95, Number((confidence + 0.05).toFixed(2)));
        }
      }
    }

    // Determine template ID based on evidence code
    let templateId = 'ET-URG-01';
    let isInformational = false;
    if (ev.evidenceCode === 'frozen_countdown') {
      templateId = 'ET-URG-01';
    } else if (ev.evidenceCode === 'urgency_text_only') {
      templateId = 'ET-URG-02';
      // When ML is off or did not confirm urgency (source === 'rule'), treat as an informational note with score contribution 0
      if (source === 'rule') {
        isInformational = true;
      }
    } else if (ev.evidenceCode === 'arithmetic_mismatch') {
      templateId = 'ET-DISC-01';
    } else if (ev.evidenceCode === 'unlabeled_reference') {
      templateId = 'ET-DISC-02';
    } else if (ev.evidenceCode === 'shaming_phrase') {
      templateId = 'ET-CONF-01';
    } else if (ev.evidenceCode === 'preselected_addon') {
      templateId = 'ET-EXTRA-01';
    }

    // Suggest seller question
    let sellerQuestion: string | undefined;
    if (ev.category === 'fake_urgency') {
      sellerQuestion = 'Is this promotion or timer linked to an actual inventory limit?';
    } else if (ev.category === 'misleading_discount') {
      sellerQuestion = `Can you clarify why the stated discount is ${ev.details.statedPercent}% when the price calculation indicates ${ev.details.calculatedPercent}%?`;
    } else if (ev.category === 'confirm_shaming') {
      sellerQuestion = 'Can I opt out or decline without accepting self-deprecating terms?';
    } else if (ev.category === 'preselected_extra') {
      sellerQuestion = 'Was this add-on or protection policy pre-selected automatically?';
    }

    detections.push({
      id: `det-${ev.ruleId}-${ev.candidateRef}-${Date.now().toString(36)}`,
      category: ev.category,
      categoryId: ev.ruleId,
      categoryName: ev.ruleName,
      candidateRef: ev.candidateRef,
      severity: ev.severity,
      confidence,
      source,
      explanation: ev.explanation,
      templateId,
      evidenceSnippet: candidate?.text || '',
      elementSelector: candidate?.selector || '',
      elementRect: candidate?.rect,
      details: {
        ...ev.details,
        ...(isInformational ? { scoreContributionZero: true, isInformational: true } : {}),
      },
      sellerQuestion,
      isUncertain: isInformational ? true : false,
    });
  }

  // Process ML-only signals (candidates without rule evidence where classifier >= threshold)
  if (classifierAvailable) {
    for (const [ref, mlResult] of classifierMap.entries()) {
      if (coveredRefs.has(ref)) continue;
      const candidate = candidateMap.get(ref);
      if (!candidate) continue;

      // Check highest probability against thresholds
      const { probabilities } = mlResult;
      let matchedCategory: DarkPatternCategory | null = null;
      let prob = 0;

      if (probabilities.shaming >= 0.7) {
        matchedCategory = 'confirm_shaming';
        prob = probabilities.shaming;
      } else if (probabilities.urgency >= 0.65) {
        matchedCategory = 'fake_urgency';
        prob = probabilities.urgency;
      } else if (probabilities.addon_extra >= 0.65) {
        matchedCategory = 'preselected_extra';
        prob = probabilities.addon_extra;
      }

      if (matchedCategory) {
        const catMeta = CATEGORY_NAMES[matchedCategory];
        detections.push({
          id: `det-ml-${ref}-${Date.now().toString(36)}`,
          category: matchedCategory,
          categoryId: catMeta.id,
          categoryName: catMeta.name,
          candidateRef: ref,
          severity: 1, // Minor / low certainty
          confidence: Math.min(0.5, Number(prob.toFixed(2))), // capped at 0.5 per PRD FR-13
          source: 'ml',
          explanation:
            'Possible pattern (text model, low certainty): this wording may be persuasive. Review in context.',
          templateId: 'ET-SIGNAL-01',
          evidenceSnippet: candidate.text,
          elementSelector: candidate.selector,
          elementRect: candidate.rect,
          details: { classifierProbability: prob },
          sellerQuestion: 'Is this wording indicative of a limited offer or standard promotional copy?',
          isUncertain: true,
        });
      }
    }
  }

  return detections;
}
