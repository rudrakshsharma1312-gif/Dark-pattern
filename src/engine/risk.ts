import { CategoryId, Detection, RiskLevel } from '../types';

export const CATEGORY_WEIGHTS: Record<CategoryId, number> = {
  'DP-1': 0.30, // Fake urgency
  'DP-2': 0.30, // Misleading discount
  'DP-3': 0.15, // Confirm shaming
  'DP-4': 0.25, // Pre-selected extras
};

export interface RiskCalculation {
  score: number;
  level: RiskLevel;
  contributions: Record<CategoryId, { weight: number; severity: number; confidence: number; contribution: number }>;
}

export function calculateRiskScore(detections: Detection[]): RiskCalculation {
  const categoryDetections = new Map<CategoryId, Detection[]>();
  for (const cat of ['DP-1', 'DP-2', 'DP-3', 'DP-4'] as CategoryId[]) {
    categoryDetections.set(cat, []);
  }

  for (const det of detections) {
    if (categoryDetections.has(det.categoryId)) {
      categoryDetections.get(det.categoryId)!.push(det);
    }
  }

  let totalWeightedContribution = 0;
  let totalWeights = 0;
  const contributions: any = {};

  for (const [catId, dets] of categoryDetections.entries()) {
    let weight = CATEGORY_WEIGHTS[catId];
    totalWeights += weight;

    if (dets.length === 0) {
      contributions[catId] = {
        weight,
        severity: 0,
        confidence: 0,
        contribution: 0,
      };
      continue;
    }

    // S_c = highest severity / 3
    let maxSeverity = 0;
    let maxConfidence = 0;
    let isAllClassifierOnly = true;

    for (const d of dets) {
      if (d.details?.scoreContributionZero) continue;
      if (d.severity > maxSeverity) maxSeverity = d.severity;
      if (d.confidence > maxConfidence) maxConfidence = d.confidence;
      if (d.source !== 'ml') isAllClassifierOnly = false;
    }

    // Classifier-only signals contribute at most half their category's weight
    const effectiveWeight = isAllClassifierOnly ? weight * 0.5 : weight;
    const S_c = maxSeverity / 3.0;
    const C_c = maxConfidence;
    const contribution = effectiveWeight * S_c * C_c;

    totalWeightedContribution += contribution;

    contributions[catId] = {
      weight: effectiveWeight,
      severity: S_c,
      confidence: C_c,
      contribution: Number((contribution * 100).toFixed(1)),
    };
  }

  // Risk = 100 * sum(Contribution) / sum(W_c)
  const rawScore = Math.round((100 * totalWeightedContribution) / (totalWeights || 1.0));
  const score = Math.max(0, Math.min(100, rawScore));

  let level: RiskLevel = 'Low';
  if (score >= 75) level = 'Very high';
  else if (score >= 50) level = 'High';
  else if (score >= 25) level = 'Moderate';
  else level = 'Low';

  return {
    score,
    level,
    contributions,
  };
}
