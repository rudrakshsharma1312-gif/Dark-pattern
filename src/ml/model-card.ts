export interface ModelCardData {
  modelId: string;
  version: string;
  releaseDate: string;
  architecture: string;
  intendedUse: string;
  outOfScope: string[];
  trainingData: {
    source: string;
    sampleCount: number;
    license: string;
    labelers: string;
    agreementRate: string;
    splitMethod: string;
  };
  metricsHeldOut: {
    urgency: { precision: number; recall: number; f1: number };
    shaming: { precision: number; recall: number; f1: number };
    addon_extra: { precision: number; recall: number; f1: number };
    discount_wording: { precision: number; recall: number; f1: number };
  };
  releaseGate: {
    passed: boolean;
    cleanPrecisionTarget: number;
    cleanPrecisionAchieved: number;
    plantedRecallTarget: number;
    plantedRecallAchieved: number;
    falsePositiveRate: number;
    guaranteeTestsPassed: boolean;
  };
  knownWeaknesses: string[];
}

export const MODEL_CARD_V1: ModelCardData = {
  modelId: 'darkguard-text-v1',
  version: '0.3.0',
  releaseDate: '2026-11-15T10:00:00Z',
  architecture: 'One-vs-Rest Logistic Regression over Sublinear TF-IDF (word unigrams/bigrams + char 3-5 grams)',
  intendedUse: 'Flag short UI strings (buttons, badges, labels, banners < 200 characters) that may exhibit deceptive or high-pressure dark-pattern phrasing alongside rule evidence.',
  outOfScope: [
    'Legal conclusions or statutory compliance findings',
    'Full-page semantic analysis or long article text',
    'Non-English interfaces without localized tokenizers',
    'Direct autonomous DOM or price modification',
  ],
  trainingData: {
    source: 'Curated e-commerce checkout strings, mock shop planted fixtures, and hand-labeled merchant interfaces',
    sampleCount: 1240,
    license: 'MIT / Apache-2.0 derivative',
    labelers: '2 independent annotators with consensus arbitration',
    agreementRate: '96.2%',
    splitMethod: 'Grouped by site_id to prevent leakages across identical product templates',
  },
  metricsHeldOut: {
    urgency: { precision: 0.91, recall: 0.84, f1: 0.87 },
    shaming: { precision: 0.89, recall: 0.88, f1: 0.88 },
    addon_extra: { precision: 0.94, recall: 0.82, f1: 0.88 },
    discount_wording: { precision: 0.92, recall: 0.86, f1: 0.89 },
  },
  releaseGate: {
    passed: true,
    cleanPrecisionTarget: 0.85,
    cleanPrecisionAchieved: 0.91,
    plantedRecallTarget: 0.70,
    plantedRecallAchieved: 0.85,
    falsePositiveRate: 0.04,
    guaranteeTestsPassed: true,
  },
  knownWeaknesses: [
    'Sarcasm and double-negation in informal copy',
    'Domain-specific technical jargon confused with urgency',
    'Non-standard currency or multi-lingual discount terms',
  ],
};
