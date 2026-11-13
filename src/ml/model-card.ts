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
  releaseDate: '2026-11-13T12:00:00Z',
  architecture: 'One-vs-Rest Logistic Regression over Sublinear TF-IDF (word unigrams/bigrams, char n-grams omitted per G-1)',
  intendedUse: 'Flag short UI strings (buttons, badges, labels, banners <= 200 characters) that may exhibit deceptive or high-pressure dark-pattern phrasing alongside rule evidence.',
  outOfScope: [
    'Legal conclusions or statutory compliance findings',
    'Full-page semantic analysis or long article text',
    'Non-English interfaces without localized tokenizers',
    'Direct autonomous DOM or price modification',
  ],
  trainingData: {
    source: 'Curated e-commerce checkout strings across 10 merchant sites (site-A through site-J)',
    sampleCount: 804,
    license: 'hand-written-MIT',
    labelers: '1 annotator (Member B), two review passes',
    agreementRate: 'N/A (single labeler)',
    splitMethod: 'Grouped by site_id to prevent leakages across identical product templates',
  },
  metricsHeldOut: {
    urgency: { precision: 0.857, recall: 0.968, f1: 0.909 },
    shaming: { precision: 0.912, recall: 1.000, f1: 0.954 },
    addon_extra: { precision: 1.000, recall: 0.806, f1: 0.893 },
    discount_wording: { precision: 0.966, recall: 0.966, f1: 0.966 },
  },
  releaseGate: {
    passed: false,
    cleanPrecisionTarget: 0.85,
    cleanPrecisionAchieved: 0.914,
    plantedRecallTarget: 0.70,
    plantedRecallAchieved: 0.804,
    falsePositiveRate: 0.30,
    guaranteeTestsPassed: true,
  },
  knownWeaknesses: [
    'Sarcasm and double-negation in informal copy',
    'Isolated decline phrases ("No thanks") flagged as confirm shaming without guilt context',
    'Stock confirmation copy ("In stock") occasionally mistaken for urgency',
  ],
};
