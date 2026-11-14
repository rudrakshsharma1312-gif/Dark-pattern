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
  mlEnabled?: boolean;
}

const STORAGE_KEY = 'darkguard_scan_history_v1';

export class DarkGuardScanner {
  private timerSnapshots: Map<string, string> = new Map();

  /**
   * Reads stored history from localStorage
   */
  public getHistory(): ScanResult[] {
    try {
      if (typeof localStorage === 'undefined' || !localStorage || typeof localStorage.getItem !== 'function') {
        return [];
      }
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
      if (typeof localStorage === 'undefined' || !localStorage || typeof localStorage.setItem !== 'function') {
        return;
      }
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
      if (typeof localStorage === 'undefined' || !localStorage || typeof localStorage.removeItem !== 'function') {
        return;
      }
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
    const win = container.ownerDocument?.defaultView || (typeof window !== 'undefined' ? window : null);
    const domain = options.domain || win?.location.hostname || 'demo.darkguard.shop';
    const urlPath = options.urlPath || win?.location.pathname || '/products/item';
    const observeMs = options.observeMs ?? 10000;
    const mlEnabled = options.mlEnabled ?? false; // Shipped disabled by default per ML-R9 release gate

    // 1. Extract candidates
    const candidates = extractCandidates(container);

    // Identify candidate elements containing a countdown/time pattern
    const timePatternRegex = /(\d{1,2}:\d{2}(?::\d{2})?|\b(?:ends?\s*(?:in)?|left|remaining|expires?\s*(?:in)?|order\s*within|closing\s*in)\s*:?\s*\d+\s*(?:days?|hours?|hrs?|mins?|minutes?|secs?|seconds?)\b)/i;
    const timerCandidates = candidates.filter((c) => timePatternRegex.test(c.text));

    const observationSnapshots = new Map<string, string>(this.timerSnapshots);

    // If there are timer candidates and observeMs > 0, observe them
    const needsObservation = timerCandidates.some((tc) => !observationSnapshots.has(tc.ref));
    if (needsObservation && observeMs > 0) {
      // Record initial values
      timerCandidates.forEach((tc) => {
        if (!observationSnapshots.has(tc.ref)) {
          const match = tc.text.match(timePatternRegex)?.[0] || tc.text;
          observationSnapshots.set(tc.ref, match);
        }
      });

      // Wait observation duration
      await new Promise((resolve) => setTimeout(resolve, observeMs));

      // Re-sample candidate texts from live DOM elements
      timerCandidates.forEach((tc) => {
        if (tc.element) {
          const liveText = (tc.element.innerText || tc.element.textContent || '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 200);
          tc.text = liveText;
        }
      });
    }

    // 2. Rule detectors
    const urgencyEvidence = DP1UrgencyDetector.run({
      candidates,
      observedSnapshots: observationSnapshots,
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
    timerCandidates.forEach((tc) => {
      const match = tc.text.match(timePatternRegex)?.[0] || tc.text;
      this.timerSnapshots.set(tc.ref, match);
    });

    // 3. Classifier inference (runs under 5ms)
    let mlResults: any[] = [];
    const isClassifierReady = defaultClassifier.status === 'ready' && defaultClassifier.isChecksumValid;
    if (mlEnabled && isClassifierReady) {
      const textCandidates = candidates.map((c) => ({ ref: c.ref, text: c.text }));
      const prediction = defaultClassifier.batchPredict(textCandidates);
      mlResults = prediction.results;
    }

    // 4. Fusion
    const detections = fuseDetections({
      candidates,
      ruleEvidence: allRuleEvidence,
      classifierResults: mlResults,
      classifierAvailable: mlEnabled && isClassifierReady,
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
      ml_enabled: mlEnabled && isClassifierReady,
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
