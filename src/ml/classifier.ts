import type { ClassifierResult, ModelArtifact } from '../types/index.ts';
import { FeatureExtractor } from './features.ts';
import { sha256Sync } from './sha256-sync.ts';
import { SHAMING_V1_SHA256 } from './shaming-v1.checksum.ts';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

/**
 * Loads the raw model JSON text from the co-located shaming-v1.json file.
 * Under Node/tsx (tests, CLI eval): uses fs.readFileSync on the known path.
 * Under Vite (browser bundle): this code is tree-shaken; the Vite entrypoint
 * should pass rawModelText to the constructor via the ?raw static import,
 * or rely on the fallback returning '' which marks the classifier corrupted.
 */
function loadRawModelText(): string {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    return fs.readFileSync(path.join(__dirname, 'shaming-v1.json'), 'utf-8');
  } catch {
    return '';
  }
}

export class DarkGuardClassifier {
  private model: ModelArtifact;
  private featureExtractor: FeatureExtractor;
  public isChecksumValid: boolean = false;
  public status: 'ready' | 'corrupted' | 'disabled' = 'corrupted';
  public modelId: string = 'darkguard-text-v1';
  public expectedSha256: string = SHAMING_V1_SHA256;

  // Precomputed dense weight arrays for ultra-fast dot product (< 1 ms for 200 strings)
  private classWeightsMap: Map<string, Float64Array> = new Map();

  /**
   * Construct a classifier from raw model text.
   *
   * Integrity protocol:
   * 1. Compute SHA-256 of the exact raw file text (pure-JS, FIPS 180-4).
   * 2. Compare to the expected digest from shaming-v1.checksum.ts.
   * 3. Only if the hash matches, JSON.parse the model and mark ready.
   * 4. Otherwise, status = 'corrupted', batchPredict returns empty results,
   *    and fusion.ts falls back to rules-only scanning.
   *
   * Note: The checksum guards against accidental corruption only, not deliberate
   * tampering, because it ships in the same bundle.
   *
   * @param modelRawText  Raw JSON text of the model file (exact bytes).
   *                      If omitted, auto-loads from the co-located shaming-v1.json.
   */
  constructor(modelRawText?: string) {
    const text = modelRawText !== undefined ? modelRawText : loadRawModelText();

    if (!text) {
      this.status = 'corrupted';
      this.isChecksumValid = false;
      this.model = {} as ModelArtifact;
      this.featureExtractor = new FeatureExtractor({}, []);
      return;
    }

    // Hash the exact raw file text — never re-serialize
    const computedHash = sha256Sync(text);
    this.isChecksumValid = computedHash === SHAMING_V1_SHA256;

    if (!this.isChecksumValid) {
      this.status = 'corrupted';
      this.model = {} as ModelArtifact;
      this.featureExtractor = new FeatureExtractor({}, []);
      return;
    }

    // Parse only after checksum passes
    try {
      this.model = JSON.parse(text) as ModelArtifact;
    } catch {
      this.status = 'corrupted';
      this.isChecksumValid = false;
      this.model = {} as ModelArtifact;
      this.featureExtractor = new FeatureExtractor({}, []);
      return;
    }

    this.modelId = this.model.model_id || 'darkguard-text-v1';
    this.status = 'ready';

    this.featureExtractor = new FeatureExtractor(
      this.model.vocabulary || {},
      this.model.idf || [],
      this.model.features?.lowercase ?? true,
      this.model.features?.sublinear_tf ?? true
    );

    // Build dense weight lookup arrays for sub-millisecond inference
    const vocabSize = this.model.features?.vocab_size || Object.keys(this.model.vocabulary || {}).length;
    if (this.model.classes && this.model.weights) {
      for (const cls of this.model.classes) {
        const dense = new Float64Array(vocabSize + 10);
        const cw = this.model.weights[cls];
        if (cw && cw.indices && cw.values) {
          for (let i = 0; i < cw.indices.length; i++) {
            dense[cw.indices[i]] = cw.values[i];
          }
        }
        this.classWeightsMap.set(cls, dense);
      }
    }
  }

  private sigmoid(z: number): number {
    if (z > 20) return 1.0;
    if (z < -20) return 0.0;
    return 1 / (1 + Math.exp(-z));
  }

  public predict(candidateRef: string, text: string): ClassifierResult {
    const probabilities = {
      urgency: 0,
      shaming: 0,
      addon_extra: 0,
      discount_wording: 0,
    };

    if (this.status !== 'ready' || !this.isChecksumValid || !text.trim()) {
      return {
        candidateRef,
        probabilities,
        topProbability: 0,
      };
    }

    const sparseVec = this.featureExtractor.transform(text);

    if (sparseVec.indices.length === 0) {
      return {
        candidateRef,
        probabilities: {
          urgency: Number(this.sigmoid(this.model.intercepts?.urgency ?? -2.0).toFixed(4)),
          shaming: Number(this.sigmoid(this.model.intercepts?.shaming ?? -2.0).toFixed(4)),
          addon_extra: Number(this.sigmoid(this.model.intercepts?.addon_extra ?? -2.0).toFixed(4)),
          discount_wording: Number(this.sigmoid(this.model.intercepts?.discount_wording ?? -2.0).toFixed(4)),
        },
        topProbability: 0,
      };
    }

    const numIndices = sparseVec.indices.length;

    // Fast sparse dot product: O(num_active_features) instead of O(vocab_size)
    for (const className of this.model.classes as Array<keyof typeof probabilities>) {
      const denseWeights = this.classWeightsMap.get(className);
      const intercept = this.model.intercepts[className] ?? 0;
      let dotProduct = intercept;

      if (denseWeights) {
        for (let k = 0; k < numIndices; k++) {
          const idx = sparseVec.indices[k];
          dotProduct += denseWeights[idx] * sparseVec.values[k];
        }
      }

      probabilities[className] = Number(this.sigmoid(dotProduct).toFixed(4));
    }

    let topClass: any = undefined;
    let topProbability = 0;

    for (const [cls, prob] of Object.entries(probabilities)) {
      if (prob > topProbability) {
        topProbability = prob;
        topClass = cls;
      }
    }

    return {
      candidateRef,
      probabilities,
      topClass,
      topProbability,
    };
  }

  public batchPredict(
    candidates: Array<{ ref: string; text: string }>
  ): { results: ClassifierResult[]; elapsedMs: number } {
    if (this.status !== 'ready' || !this.isChecksumValid) {
      return { results: [], elapsedMs: 0 };
    }

    const start = performance.now();
    const results = candidates.map((c) => this.predict(c.ref, c.text));
    const elapsedMs = performance.now() - start;
    return { results, elapsedMs };
  }
}

export const defaultClassifier = new DarkGuardClassifier();
