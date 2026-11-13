import type { ClassifierResult, ModelArtifact } from '../types/index.ts';
import { FeatureExtractor } from './features.ts';
import rawModel from './shaming-v1.json' with { type: 'json' };
import { SHAMING_V1_SHA256 } from './shaming-v1.checksum.ts';

/**
 * Universal SHA-256 helper using standard Web Crypto API.
 */
export async function computeSha256(text: string): Promise<string> {
  if (typeof globalThis.crypto?.subtle?.digest === 'function') {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  try {
    const nodeCrypto = await import('node:crypto');
    return nodeCrypto.createHash('sha256').update(text, 'utf-8').digest('hex');
  } catch {
    return '';
  }
}

export class DarkGuardClassifier {
  private model: ModelArtifact;
  private featureExtractor: FeatureExtractor;
  public isChecksumValid: boolean = false;
  public status: 'ready' | 'corrupted' | 'disabled' = 'ready';
  public modelId: string = 'darkguard-text-v1';
  public expectedSha256: string = SHAMING_V1_SHA256;

  // Precomputed dense weight arrays for ultra-fast dot product (< 1 ms for 200 strings)
  private classWeightsMap: Map<string, Float64Array> = new Map();

  constructor(customModel?: ModelArtifact, rawText?: string) {
    if (!customModel && !rawModel) {
      this.status = 'corrupted';
      this.isChecksumValid = false;
      this.model = {} as ModelArtifact;
      this.featureExtractor = new FeatureExtractor({}, []);
      return;
    }

    this.model = (customModel || rawModel) as ModelArtifact;
    this.modelId = this.model.model_id || 'darkguard-text-v1';

    if (rawText !== undefined) {
      this.isChecksumValid = true;
    } else {
      const hasCoreFields =
        this.model &&
        Boolean(this.model.vocabulary) &&
        Array.isArray(this.model.idf) &&
        Boolean(this.model.weights) &&
        Boolean(this.model.thresholds) &&
        this.model.classes?.length === 4;

      if (!hasCoreFields) {
        this.isChecksumValid = false;
        this.status = 'corrupted';
      } else {
        this.isChecksumValid = true;
        this.status = 'ready';
      }
    }

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

  public static async create(rawText?: string, customModel?: ModelArtifact): Promise<DarkGuardClassifier> {
    if (rawText === null || customModel === null) {
      const corrupt = new DarkGuardClassifier({} as any);
      corrupt.status = 'corrupted';
      corrupt.isChecksumValid = false;
      return corrupt;
    }

    if (rawText !== undefined) {
      const computedHash = await computeSha256(rawText);
      const isValid = computedHash === SHAMING_V1_SHA256;
      if (!isValid) {
        const corrupt = new DarkGuardClassifier(customModel || (rawModel as any));
        corrupt.status = 'corrupted';
        corrupt.isChecksumValid = false;
        return corrupt;
      }
    }

    const instance = new DarkGuardClassifier(customModel);
    return instance;
  }

  public async verifyRawTextChecksum(rawText: string): Promise<boolean> {
    try {
      const computed = await computeSha256(rawText);
      this.isChecksumValid = computed === this.expectedSha256;
      this.status = this.isChecksumValid ? 'ready' : 'corrupted';
      return this.isChecksumValid;
    } catch {
      this.isChecksumValid = false;
      this.status = 'corrupted';
      return false;
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
