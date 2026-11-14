import { Detection, ScanResult } from '../types';
import { extractCandidates } from './scanner';
import { DP1UrgencyDetector } from './detectors/dp1-urgency';
import { DP2DiscountDetector } from './detectors/dp2-discount';
import { DP3ShamingDetector } from './detectors/dp3-shaming';
import { DP4ExtrasDetector } from './detectors/dp4-extras';
import { defaultClassifier } from '../ml/classifier';
import { fuseDetections } from './fusion';
import { calculateRiskScore } from './risk';

export interface ScanOptions {
  container?: HTMLElement;
  domain?: string;
  urlPath?: string;
  observeMs?: number;
  useAiExplanations?: boolean;
}

const STORAGE_KEY = 'darkguard_scan_history_v1';

export class DarkGuardScanner {
  private timerSnapshots: Map<string, string> = new Map();

  /**
   * Reads stored history from localStorage
   */
  public getHistory(): ScanResult[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Saves scan to history, keeping maximum 20 entries
   */
  public saveScan(scan: ScanResult): void {
    try {
      const history = this.getHistory();
      const updated = [scan, ...history.filter((s) => s.id !== scan.id)].slice(0, 20);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save scan to localStorage:', e);
    }
  }

  /**
   * Clears scan history
   */
  public clearHistory(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Could not clear scan history:', e);
    }
  }

  /**
   * Executes full DarkGuard scanning pipeline
   */
  public async scan(options: ScanOptions = {}): Promise<ScanResult> {
    const startTime = performance.now();
    const container = options.container || document.body;
    const domain = options.domain || window.location.hostname || 'demo.darkguard.shop';
    const urlPath = options.urlPath || window.location.pathname || '/products/item';
    const observeMs = options.observeMs ?? 10000;

    // 1. Extract candidates
    const candidates = extractCandidates(container);

    // 2. Rule detectors
    const urgencyEvidence = DP1UrgencyDetector.run({
      candidates,
      observedSnapshots: this.timerSnapshots,
      observeMs,
    });

    const discountEvidence = DP2DiscountDetector.run({ candidates });
    const shamingEvidence = DP3ShamingDetector.run({ candidates });
    const extrasEvidence = DP4ExtrasDetector.run({ candidates });

    const allRuleEvidence = [
      ...urgencyEvidence,
      ...discountEvidence,
      ...shamingEvidence,
      ...extrasEvidence,
    ];

    // Update snapshots for countdown timers
    candidates.forEach((c) => {
      if (c.text.match(/(\d{1,2}:\d{2})/)) {
        this.timerSnapshots.set(c.ref, c.text.match(/(\d{1,2}:\d{2}(?::\d{2})?)/)?.[0] || c.text);
      }
    });

    // 3. Classifier inference (runs under 5ms)
    const textCandidates = candidates.map((c) => ({ ref: c.ref, text: c.text }));
    const { results: mlResults } = defaultClassifier.batchPredict(textCandidates);

    // 4. Fusion
    const detections = fuseDetections({
      candidates,
      ruleEvidence: allRuleEvidence,
      classifierResults: mlResults,
      classifierAvailable: defaultClassifier.status === 'ready',
    });

    // 5. Risk Calculation
    const { score: risk_score, level } = calculateRiskScore(detections);

    // 6. Optional AI explanation enhancement via /v1/explain with strict 3-second timeout
    if (options.useAiExplanations && detections.length > 0) {
      try {
        await this.enhanceExplanationsWithTimeout(detections, 3000);
      } catch (err) {
        console.warn('AI explanation timed out or failed; keeping template explanations.');
      }
    }

    const elapsed = Math.round(performance.now() - startTime);

    const scanResult: ScanResult = {
      id: `scan-${Date.now()}`,
      domain,
      url_path: urlPath,
      timestamp: new Date().toISOString(),
      risk_score,
      level,
      model_version: defaultClassifier.modelId,
      ml_enabled: defaultClassifier.status === 'ready',
      detections,
      rawCandidatesCount: candidates.length,
      scanDurationMs: elapsed,
      classifierChecksumValid: defaultClassifier.isChecksumValid,
      coverage: {
        checked: candidates.length,
        total: candidates.length,
        details: 'Checked visible pricing, timers, decline buttons, and checkbox options.',
      },
    };

    // Save to local scan history (last 20)
    this.saveScan(scanResult);

    return scanResult;
  }

  /**
   * Calls optional backend /v1/explain with a hard 3s timeout
   */
  private async enhanceExplanationsWithTimeout(
    detections: Detection[],
    timeoutMs: number
  ): Promise<void> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch('/v1/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          detections: detections.map((d) => ({
            id: d.id,
            category: d.category,
            categoryName: d.categoryName,
            evidenceSnippet: d.evidenceSnippet,
            details: d.details,
          })),
        }),
        signal: controller.signal,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.explanations && Array.isArray(data.explanations)) {
          data.explanations.forEach((item: { id: string; aiExplanation: string }) => {
            const det = detections.find((d) => d.id === item.id);
            if (det && item.aiExplanation) {
              det.aiExplanation = item.aiExplanation;
            }
          });
        }
      }
    } catch {
      // Graceful fallback to pre-baked template text
    } finally {
      clearTimeout(timer);
    }
  }
}

export const scannerInstance = new DarkGuardScanner();
