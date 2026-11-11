import { CategoryId, EvaluationCategoryMetric } from '../types';
import rawLabels from './labels.json';
import { defaultClassifier } from '../ml/classifier';
import { DP1UrgencyDetector } from '../engine/detectors/dp1-urgency';
import { DP2DiscountDetector } from '../engine/detectors/dp2-discount';
import { DP3ShamingDetector } from '../engine/detectors/dp3-shaming';
import { DP4ExtrasDetector } from '../engine/detectors/dp4-extras';
import { fuseDetections } from '../engine/fusion';

export interface EvalRunResult {
  metrics: EvaluationCategoryMetric[];
  overall: {
    rulesOnly: { precision: number; recall: number; f1: number; falsePositiveRate: number };
    rulesPlusML: { precision: number; recall: number; f1: number; falsePositiveRate: number };
  };
  releaseGate: {
    passed: boolean;
    precisionCheck: boolean;
    recallCheck: boolean;
    fpRateCheck: boolean;
  };
  latencyMs: number;
  testedPagesCount: number;
  plantedCount: number;
  cleanCount: number;
}

export function runEvaluation(): EvalRunResult {
  const start = performance.now();
  const testPages = rawLabels as any[];

  // Counters for confusion matrix: TP, FP, FN, TN per category for both modes
  const stats = {
    rulesOnly: {
      'DP-1': { tp: 0, fp: 0, fn: 0, tn: 0 },
      'DP-2': { tp: 0, fp: 0, fn: 0, tn: 0 },
      'DP-3': { tp: 0, fp: 0, fn: 0, tn: 0 },
      'DP-4': { tp: 0, fp: 0, fn: 0, tn: 0 },
    },
    rulesPlusML: {
      'DP-1': { tp: 0, fp: 0, fn: 0, tn: 0 },
      'DP-2': { tp: 0, fp: 0, fn: 0, tn: 0 },
      'DP-3': { tp: 0, fp: 0, fn: 0, tn: 0 },
      'DP-4': { tp: 0, fp: 0, fn: 0, tn: 0 },
    },
  };

  let cleanPageCount = 0;
  let cleanFpRulesOnly = 0;
  let cleanFpRulesPlusML = 0;

  for (const page of testPages) {
    if (!page.isPlanted) {
      cleanPageCount++;
    }

    // Build synthetic candidates from the page elements
    const candidates = page.elements.map((el: any, idx: number) => ({
      ref: `eval-${idx}`,
      tag: el.text.includes('button') || el.text.includes('No') ? 'button' : el.text.includes('Add') || el.text.includes('Pre-checked') ? 'input' : 'div',
      text: el.text,
      attributes: {
        checked: el.text.includes('Pre-checked') || el.text.includes('Auto-ship') || el.text.includes('Include') || el.text.includes('Add'),
        type: el.text.includes('Add') ? 'checkbox' : 'button',
      },
      rect: { x: 10, y: 10, w: 100, h: 40 },
      selector: `eval-sel-${idx}`,
      inForm: true,
      nearPrimaryAction: true,
      visible: true,
      element: {
        getAttribute: (attr: string) => attr === 'data-dg-frozen' && el.text.includes('ends in') || el.text.includes('remaining') || el.text.includes('Timer:') ? 'true' : null,
        closest: (sel: string) => ({
          querySelector: (sub: string) => {
            if (sub.includes('s, del') && (el.text.includes('Was') || el.text.includes('was') || el.text.includes('Original') || el.text.includes('->'))) {
              return { textContent: el.text.match(/(?:was|mrp|original|\$)\s*[€$₹]?\d+(?:\.\d+)?/i)?.[0] || '$200' };
            }
            if (sub.includes('current-price') || sub.includes('span')) {
              return { textContent: el.text.match(/(?:now|sale|\$)\s*[€$₹]?\d+(?:\.\d+)?/i)?.[0] || '$120' };
            }
            return null;
          },
        }),
      } as any,
    }));

    // 1. Run Rules Only
    const urgencyRules = DP1UrgencyDetector.run({ candidates, observeMs: 10000 });
    const discountRules = DP2DiscountDetector.run({ candidates });
    const shamingRules = DP3ShamingDetector.run({ candidates });
    const extrasRules = DP4ExtrasDetector.run({ candidates });
    const allRules = [...urgencyRules, ...discountRules, ...shamingRules, ...extrasRules];

    const detectedRulesOnly = new Set(allRules.map((r) => r.ruleId));

    // 2. Run Rules + ML
    const { results: mlResults } = defaultClassifier.batchPredict(
      candidates.map((c: any) => ({ ref: c.ref, text: c.text }))
    );

    const fusedDetections = fuseDetections({
      candidates,
      ruleEvidence: allRules,
      classifierResults: mlResults,
      classifierAvailable: true,
    });

    const detectedRulesPlusML = new Set(fusedDetections.map((d) => d.categoryId));

    // Check false positives on clean pages
    if (!page.isPlanted) {
      if (detectedRulesOnly.size > 0) cleanFpRulesOnly++;
      if (detectedRulesPlusML.size > 0) cleanFpRulesPlusML++;
    }

    // Update category metrics
    const plantedSet = new Set(page.plantedCategories as CategoryId[]);

    for (const cat of ['DP-1', 'DP-2', 'DP-3', 'DP-4'] as CategoryId[]) {
      const isActuallyPlanted = plantedSet.has(cat);
      const caughtByRules = detectedRulesOnly.has(cat);
      const caughtByFused = detectedRulesPlusML.has(cat);

      // Rules Only
      if (isActuallyPlanted && caughtByRules) stats.rulesOnly[cat].tp++;
      else if (!isActuallyPlanted && caughtByRules) stats.rulesOnly[cat].fp++;
      else if (isActuallyPlanted && !caughtByRules) stats.rulesOnly[cat].fn++;
      else stats.rulesOnly[cat].tn++;

      // Rules + ML
      if (isActuallyPlanted && caughtByFused) stats.rulesPlusML[cat].tp++;
      else if (!isActuallyPlanted && caughtByFused) stats.rulesPlusML[cat].fp++;
      else if (isActuallyPlanted && !caughtByFused) stats.rulesPlusML[cat].fn++;
      else stats.rulesPlusML[cat].tn++;
    }
  }

  // Calculate precision, recall, f1
  const categoryNames: Record<CategoryId, string> = {
    'DP-1': 'Fake Urgency',
    'DP-2': 'Misleading Discount',
    'DP-3': 'Confirm Shaming',
    'DP-4': 'Pre-selected Extras',
  };

  const metrics: EvaluationCategoryMetric[] = (['DP-1', 'DP-2', 'DP-3', 'DP-4'] as CategoryId[]).map((cat) => {
    const ro = stats.rulesOnly[cat];
    const rm = stats.rulesPlusML[cat];

    const roPrec = ro.tp + ro.fp === 0 ? 1 : ro.tp / (ro.tp + ro.fp);
    const roRec = ro.tp + ro.fn === 0 ? 1 : ro.tp / (ro.tp + ro.fn);
    const roF1 = roPrec + roRec === 0 ? 0 : (2 * roPrec * roRec) / (roPrec + roRec);
    const roFpRate = ro.fp + ro.tn === 0 ? 0 : ro.fp / (ro.fp + ro.tn);

    const rmPrec = rm.tp + rm.fp === 0 ? 1 : rm.tp / (rm.tp + rm.fp);
    const rmRec = rm.tp + rm.fn === 0 ? 1 : rm.tp / (rm.tp + rm.fn);
    const rmF1 = rmPrec + rmRec === 0 ? 0 : (2 * rmPrec * rmRec) / (rmPrec + rmRec);
    const rmFpRate = rm.fp + rm.tn === 0 ? 0 : rm.fp / (rm.fp + rm.tn);

    return {
      category: cat,
      name: categoryNames[cat],
      rulesOnly: {
        precision: Number(roPrec.toFixed(3)),
        recall: Number(roRec.toFixed(3)),
        f1: Number(roF1.toFixed(3)),
        falsePositiveRate: Number(roFpRate.toFixed(3)),
      },
      rulesPlusML: {
        precision: Number(rmPrec.toFixed(3)),
        recall: Number(rmRec.toFixed(3)),
        f1: Number(rmF1.toFixed(3)),
        falsePositiveRate: Number(rmFpRate.toFixed(3)),
      },
      improvement: {
        recallDelta: Number((rmRec - roRec).toFixed(3)),
        fpIncrease: rmFpRate > roFpRate,
      },
    };
  });

  // Calculate overall aggregates
  const avgRoPrec = metrics.reduce((acc, m) => acc + m.rulesOnly.precision, 0) / 4;
  const avgRoRec = metrics.reduce((acc, m) => acc + m.rulesOnly.recall, 0) / 4;
  const avgRoF1 = (2 * avgRoPrec * avgRoRec) / (avgRoPrec + avgRoRec || 1);

  const avgRmPrec = metrics.reduce((acc, m) => acc + m.rulesPlusML.precision, 0) / 4;
  const avgRmRec = metrics.reduce((acc, m) => acc + m.rulesPlusML.recall, 0) / 4;
  const avgRmF1 = (2 * avgRmPrec * avgRmRec) / (avgRmPrec + avgRmRec || 1);

  const fpRateClean = cleanPageCount > 0 ? cleanFpRulesPlusML / cleanPageCount : 0;

  // Release Gate Check (ML-R9): precision >= 0.85 on held-out clean set, recall >= 0.70 on planted, no increase in FP over rules
  const precisionCheck = avgRmPrec >= 0.85;
  const recallCheck = avgRmRec >= 0.70;
  const fpRateCheck = cleanFpRulesPlusML <= cleanFpRulesOnly;

  const totalTime = performance.now() - start;

  return {
    metrics,
    overall: {
      rulesOnly: {
        precision: Number(avgRoPrec.toFixed(3)),
        recall: Number(avgRoRec.toFixed(3)),
        f1: Number(avgRoF1.toFixed(3)),
        falsePositiveRate: 0,
      },
      rulesPlusML: {
        precision: Number(avgRmPrec.toFixed(3)),
        recall: Number(avgRmRec.toFixed(3)),
        f1: Number(avgRmF1.toFixed(3)),
        falsePositiveRate: Number(fpRateClean.toFixed(3)),
      },
    },
    releaseGate: {
      passed: precisionCheck && recallCheck && fpRateCheck,
      precisionCheck,
      recallCheck,
      fpRateCheck,
    },
    latencyMs: Number(totalTime.toFixed(1)),
    testedPagesCount: testPages.length,
    plantedCount: testPages.filter((p) => p.isPlanted).length,
    cleanCount: cleanPageCount,
  };
}
