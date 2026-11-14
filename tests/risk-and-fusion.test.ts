import { describe, it, expect } from 'vitest';
import { calculateRiskScore, CATEGORY_WEIGHTS } from '../src/engine/risk';
import { fuseDetections } from '../src/engine/fusion';
import { CandidateElement, ClassifierResult, Detection, RuleEvidence } from '../src/types';

describe('Risk Calculation & Fusion Engine Suite', () => {
  describe('Risk Calculation Boundaries and Weights', () => {
    it('verifies category weights sum to 1.0', () => {
      const sum =
        CATEGORY_WEIGHTS['DP-1'] +
        CATEGORY_WEIGHTS['DP-2'] +
        CATEGORY_WEIGHTS['DP-3'] +
        CATEGORY_WEIGHTS['DP-4'];
      expect(sum).toBeCloseTo(1.0, 5);
    });

    it('returns score 0 and level Low when no detections exist', () => {
      const { score, level } = calculateRiskScore([]);
      expect(score).toBe(0);
      expect(level).toBe('Low');
    });

    it('classifies risk levels accurately according to 25/50/75 boundaries', () => {
      // Minor detection: DP-3 (severity 1, confidence 0.5)
      // weight = 0.15 * 0.5 (if ML only) or 0.15
      // DP-3 alone: 0.15 * (1/3) * 0.5 = 0.025 -> 3/100 -> Low
      const base = { evidenceSnippet: '', elementSelector: '', details: {} };
      const dLow: Detection = {
        ...base,
        id: '1',
        category: 'confirm_shaming',
        categoryId: 'DP-3',
        categoryName: 'Confirm Shaming',
        candidateRef: 'ref-1',
        severity: 1,
        confidence: 0.5,
        source: 'rule',
        explanation: 'note',
        templateId: 'ET-CONF-01',
      };
      expect(calculateRiskScore([dLow]).level).toBe('Low');

      // Moderate level: DP-2 with severity 2, confidence 0.8
      // DP-2 weight = 0.30; contribution = 0.30 * (2/3) * 0.8 = 0.16 -> 16
      // plus DP-4: 0.25 * (2/3) * 0.8 = 0.133 -> total 0.293 -> 29 -> Moderate (>= 25)
      const dMod1: Detection = {
        ...base,
        id: '2',
        category: 'misleading_discount',
        categoryId: 'DP-2',
        categoryName: 'Misleading Discount',
        candidateRef: 'ref-2',
        severity: 2,
        confidence: 0.8,
        source: 'rule',
        explanation: 'note',
        templateId: 'ET-DISC-01',
      };
      const dMod2: Detection = {
        ...base,
        id: '3',
        category: 'preselected_extra',
        categoryId: 'DP-4',
        categoryName: 'Pre-selected Extras',
        candidateRef: 'ref-3',
        severity: 2,
        confidence: 0.8,
        source: 'rule',
        explanation: 'note',
        templateId: 'ET-EXTRA-01',
      };
      const modResult = calculateRiskScore([dMod1, dMod2]);
      expect(modResult.score).toBeGreaterThanOrEqual(25);
      expect(modResult.score).toBeLessThan(50);
      expect(modResult.level).toBe('Moderate');

      // High level: DP-1 + DP-2 (DP-1 severity 3, conf 1.0; DP-2 severity 3, conf 0.8)
      // DP-1: 0.30 * (3/3) * 1.0 = 0.30
      // DP-2: 0.30 * (3/3) * 0.8 = 0.24
      // Total = 0.54 -> 54 -> High (>= 50)
      const dHigh1: Detection = {
        ...base,
        id: '4',
        category: 'fake_urgency',
        categoryId: 'DP-1',
        categoryName: 'Fake Urgency',
        candidateRef: 'ref-4',
        severity: 3,
        confidence: 1.0,
        source: 'rule',
        explanation: 'note',
        templateId: 'ET-URG-01',
      };
      const dHigh2: Detection = {
        ...base,
        id: '4b',
        category: 'misleading_discount',
        categoryId: 'DP-2',
        categoryName: 'Misleading Discount',
        candidateRef: 'ref-4b',
        severity: 3,
        confidence: 0.8,
        source: 'rule',
        explanation: 'note',
        templateId: 'ET-DISC-01',
      };
      const highResult = calculateRiskScore([dHigh1, dHigh2]);
      expect(highResult.score).toBeGreaterThanOrEqual(50);
      expect(highResult.level).toBe('High');

      // Very high level (>= 75): 3 major detections
      const dHigh3: Detection = {
        ...base,
        id: '5',
        category: 'preselected_extra',
        categoryId: 'DP-4',
        categoryName: 'Pre-selected Extras',
        candidateRef: 'ref-5',
        severity: 3,
        confidence: 1.0,
        source: 'rule',
        explanation: 'note',
        templateId: 'ET-EXTRA-01',
      };
      const vHighResult = calculateRiskScore([dHigh1, dHigh2, dHigh3]);
      expect(vHighResult.score).toBeGreaterThanOrEqual(75);
      expect(vHighResult.level).toBe('Very high');
    });

    it('halves effective weight for ML-only detections', () => {
      const base = { evidenceSnippet: '', elementSelector: '', details: {} };
      const dRule: Detection = {
        ...base,
        id: '1',
        category: 'fake_urgency',
        categoryId: 'DP-1',
        categoryName: 'Fake Urgency',
        candidateRef: 'ref-1',
        severity: 2,
        confidence: 0.6,
        source: 'rule',
        explanation: 'note',
        templateId: 'ET-URG-01',
      };
      const dMLOnly: Detection = {
        ...base,
        id: '2',
        category: 'fake_urgency',
        categoryId: 'DP-1',
        categoryName: 'Fake Urgency',
        candidateRef: 'ref-2',
        severity: 2,
        confidence: 0.6,
        source: 'ml',
        explanation: 'note',
        templateId: 'ET-SIGNAL-01',
      };

      const resRule = calculateRiskScore([dRule]);
      const resML = calculateRiskScore([dMLOnly]);

      // DP-1 weight is 0.30. In ML-only it is halved to 0.15
      expect(resML.contributions['DP-1'].weight).toBe(0.15);
      expect(resRule.contributions['DP-1'].weight).toBe(0.30);
      expect(resML.score).toBeLessThan(resRule.score);
    });
  });

  describe('Fusion Table Logic', () => {
    const candidate: CandidateElement = {
      ref: 'c-1',
      tag: 'button',
      text: 'No thanks, I prefer paying full price',
      attributes: {},
      rect: { x: 0, y: 0, w: 100, h: 40 },
      selector: 'button',
      inForm: false,
      nearPrimaryAction: true,
      visible: true,
    };

    it('Row 1: Rule Only -> tags source "rule"', () => {
      const ruleEvidence: RuleEvidence[] = [
        {
          ruleId: 'DP-3',
          ruleName: 'Confirm Shaming',
          category: 'confirm_shaming',
          candidateRef: 'c-1',
          evidenceCode: 'shaming_phrase',
          confidence: 0.7,
          severity: 2,
          details: {},
          explanation: 'shaming note',
        },
      ];

      const detections = fuseDetections({
        candidates: [candidate],
        ruleEvidence,
        classifierResults: [],
        classifierAvailable: false,
      });

      expect(detections.length).toBe(1);
      expect(detections[0].source).toBe('rule');
      expect(detections[0].confidence).toBe(0.7);
      expect(detections[0].templateId).toBe('ET-CONF-01');
      expect(detections[0].isUncertain).toBe(false);
    });

    it('Row 2: Rule + ML Agreement (prob >= 0.60) -> tags source "rule+ml"', () => {
      const ruleEvidence: RuleEvidence[] = [
        {
          ruleId: 'DP-3',
          ruleName: 'Confirm Shaming',
          category: 'confirm_shaming',
          candidateRef: 'c-1',
          evidenceCode: 'shaming_phrase',
          confidence: 0.7,
          severity: 2,
          details: {},
          explanation: 'shaming note',
        },
      ];

      const mlResults: ClassifierResult[] = [
        {
          candidateRef: 'c-1',
          probabilities: { urgency: 0.05, shaming: 0.95, addon_extra: 0.02, discount_wording: 0.01 },
          topClass: 'confirm_shaming',
          topProbability: 0.95,
        },
      ];

      const detections = fuseDetections({
        candidates: [candidate],
        ruleEvidence,
        classifierResults: mlResults,
        classifierAvailable: true,
      });

      expect(detections.length).toBe(1);
      expect(detections[0].source).toBe('rule+ml');
      // Confidence boosted from 0.70 to 0.75 because mlProb > 0.90
      expect(detections[0].confidence).toBe(0.75);
    });

    it('Row 3: ML Only Signal (above threshold) -> tags source "ml", severity 1, capped at 0.50 confidence', () => {
      const mlResults: ClassifierResult[] = [
        {
          candidateRef: 'c-1',
          probabilities: { urgency: 0.05, shaming: 0.85, addon_extra: 0.02, discount_wording: 0.01 },
          topClass: 'confirm_shaming',
          topProbability: 0.85,
        },
      ];

      const detections = fuseDetections({
        candidates: [candidate],
        ruleEvidence: [], // No rule evidence
        classifierResults: mlResults,
        classifierAvailable: true,
      });

      expect(detections.length).toBe(1);
      expect(detections[0].source).toBe('ml');
      expect(detections[0].severity).toBe(1);
      expect(detections[0].confidence).toBeLessThanOrEqual(0.50);
      expect(detections[0].isUncertain).toBe(true);
      expect(detections[0].templateId).toBe('ET-SIGNAL-01');
    });

    it('Row 4: Neither rule nor ML triggers -> 0 detections', () => {
      const mlResults: ClassifierResult[] = [
        {
          candidateRef: 'c-1',
          probabilities: { urgency: 0.1, shaming: 0.2, addon_extra: 0.05, discount_wording: 0.02 },
          topClass: 'confirm_shaming',
          topProbability: 0.2,
        },
      ];

      const detections = fuseDetections({
        candidates: [candidate],
        ruleEvidence: [],
        classifierResults: mlResults,
        classifierAvailable: true,
      });

      expect(detections.length).toBe(0);
    });

    it('DP-1 text-only urgency when ML is off: informational note with score contribution 0 and ET-URG-02', () => {
      const ev: RuleEvidence = {
        ruleId: 'DP-1',
        ruleName: 'Fake Urgency & Scarcity',
        category: 'fake_urgency',
        candidateRef: 'c-1',
        evidenceCode: 'urgency_text_only',
        confidence: 0.5,
        severity: 2,
        details: { initialValue: 'Only 3 left in stock - order soon.' },
        explanation: 'Urgency message: no visible stock or deadline indicator on this page supports this claim.',
      };

      const detections = fuseDetections({
        candidates: [candidate],
        ruleEvidence: [ev],
        classifierResults: [],
        classifierAvailable: false,
      });

      expect(detections.length).toBe(1);
      const det = detections[0];
      expect(det.templateId).toBe('ET-URG-02');
      expect(det.source).toBe('rule');
      expect(det.confidence).toBe(0.5);
      expect(det.severity).toBe(2);
      expect(det.details?.scoreContributionZero).toBe(true);

      const risk = calculateRiskScore(detections);
      expect(risk.score).toBe(0);
      expect(risk.level).toBe('Low');
    });

    it('DP-1 text-only urgency when ML agrees: counts toward risk score with source rule+ml', () => {
      const ev: RuleEvidence = {
        ruleId: 'DP-1',
        ruleName: 'Fake Urgency & Scarcity',
        category: 'fake_urgency',
        candidateRef: 'c-1',
        evidenceCode: 'urgency_text_only',
        confidence: 0.5,
        severity: 2,
        details: { initialValue: 'Only 3 left in stock - order soon.' },
        explanation: 'Urgency message: no visible stock or deadline indicator on this page supports this claim.',
      };

      const mlResults: ClassifierResult[] = [
        {
          candidateRef: 'c-1',
          probabilities: { urgency: 0.85, shaming: 0.05, addon_extra: 0.02, discount_wording: 0.01 },
          topClass: 'fake_urgency',
          topProbability: 0.85,
        },
      ];

      const detections = fuseDetections({
        candidates: [candidate],
        ruleEvidence: [ev],
        classifierResults: mlResults,
        classifierAvailable: true,
      });

      expect(detections.length).toBe(1);
      const det = detections[0];
      expect(det.source).toBe('rule+ml');
      expect(det.details?.scoreContributionZero).toBeFalsy();

      const risk = calculateRiskScore(detections);
      expect(risk.score).toBeGreaterThan(0);
    });
  });
});
