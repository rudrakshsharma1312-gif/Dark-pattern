export type DarkPatternCategory =
  | 'fake_urgency'
  | 'misleading_discount'
  | 'confirm_shaming'
  | 'preselected_extra'
  | 'classifier_signal';

export type CategoryId = 'DP-1' | 'DP-2' | 'DP-3' | 'DP-4';

export type SeverityLevel = 1 | 2 | 3; // 1 = Minor (Butter), 2 = Moderate (Peach), 3 = Major (Rose)
export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Very high';
export type DetectionSource = 'rule' | 'ml' | 'rule+ml';

export interface CandidateElement {
  ref: string;
  tag: string;
  role?: string;
  text: string;
  attributes: Record<string, string | boolean | undefined>;
  rect: { x: number; y: number; w: number; h: number };
  selector: string;
  inForm: boolean;
  nearPrimaryAction: boolean;
  visible: boolean;
  element?: HTMLElement;
}

export interface RuleEvidence {
  ruleId: CategoryId;
  ruleName: string;
  category: DarkPatternCategory;
  candidateRef: string;
  evidenceCode:
    | 'frozen_countdown'
    | 'urgency_text_only'
    | 'arithmetic_mismatch'
    | 'unlabeled_reference'
    | 'shaming_phrase'
    | 'preselected_addon';
  confidence: number;
  severity: SeverityLevel;
  details: {
    observedSeconds?: number;
    initialValue?: string;
    finalValue?: string;
    currentPrice?: number;
    referencePrice?: number;
    statedPercent?: number;
    calculatedPercent?: number;
    matchedPhrase?: string;
    addonLabel?: string;
    currencySymbol?: string;
  };
  explanation: string;
}

export interface ClassifierResult {
  candidateRef: string;
  probabilities: {
    urgency: number;
    shaming: number;
    addon_extra: number;
    discount_wording: number;
  };
  topClass?: DarkPatternCategory;
  topProbability: number;
}

export interface Detection {
  id: string;
  category: DarkPatternCategory;
  categoryId: CategoryId;
  categoryName: string;
  candidateRef: string;
  severity: SeverityLevel;
  confidence: number;
  source: DetectionSource;
  explanation: string;
  aiExplanation?: string;
  templateId: string;
  evidenceSnippet: string;
  elementSelector: string;
  elementRect?: { x: number; y: number; w: number; h: number };
  details: Record<string, any>;
  sellerQuestion?: string;
  isUncertain?: boolean;
}

export interface ScanResult {
  id: string;
  domain: string;
  url_path: string;
  timestamp: string;
  risk_score: number;
  level: RiskLevel;
  model_version: string;
  ml_enabled: boolean;
  detections: Detection[];
  rawCandidatesCount: number;
  scanDurationMs: number;
  classifierChecksumValid: boolean;
  coverage: {
    checked: number;
    total: number;
    details: string;
  };
}

export interface EthicalTemplate {
  id: string;
  action: 'caption' | 'outline' | 'comparison' | 'banner';
  placement: 'after' | 'before' | 'top' | 'around';
  text: string;
  style: 'warning' | 'info' | 'neutral';
  controls?: string[];
}

export interface ModelArtifact {
  model_id: string;
  trained_at: string;
  training_data_sha256: string;
  features: {
    type: string;
    ngram_range: number[][];
    analyzer: string[];
    lowercase: boolean;
    sublinear_tf: boolean;
    vocab_size: number;
  };
  vocabulary: Record<string, number>;
  idf: number[];
  classes: string[];
  weights: Record<string, { indices: number[]; values: number[] }>;
  intercepts: Record<string, number>;
  thresholds: Record<string, number>;
  checksum_sha256: string;
}

export interface EvaluationGroundTruth {
  pageId: string;
  title: string;
  isPlanted: boolean;
  plantedCategories: CategoryId[];
  elements: Array<{
    selector: string;
    text: string;
    expectedCategory: CategoryId | 'none';
  }>;
}

export interface EvaluationCategoryMetric {
  category: CategoryId;
  name: string;
  rulesOnly: {
    precision: number;
    recall: number;
    f1: number;
    falsePositiveRate: number;
  };
  rulesPlusML: {
    precision: number;
    recall: number;
    f1: number;
    falsePositiveRate: number;
  };
  improvement: {
    recallDelta: number;
    fpIncrease: boolean;
  };
}
