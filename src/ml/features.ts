/**
 * DarkGuard AI Feature Extractor
 * Generates word unigrams/bigrams and character 3-5 grams with TF-IDF weighting.
 * Matches training logic in Python for cross-runtime parity.
 */

export interface SparseVector {
  indices: number[];
  values: number[];
}

export class FeatureExtractor {
  private vocabulary: Map<string, number>;
  private idf: number[];
  private lowercase: boolean;
  private sublinearTf: boolean;

  constructor(
    vocabulary: Record<string, number>,
    idf: number[],
    lowercase: boolean = true,
    sublinearTf: boolean = true
  ) {
    this.vocabulary = new Map(Object.entries(vocabulary));
    this.idf = idf;
    this.lowercase = lowercase;
    this.sublinearTf = sublinearTf;
  }

  /**
   * Tokenizes text into word unigrams and bigrams, and character 3-5 grams.
   */
  public extractNgrams(rawText: string): string[] {
    const text = this.lowercase ? rawText.toLowerCase().trim() : rawText.trim();
    if (!text) return [];

    const ngrams: string[] = [];

    // 1. Word tokens (split on non-alphanumerics)
    const words = text
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 0);

    // Word unigrams
    for (const w of words) {
      ngrams.push(w);
    }

    // Word bigrams
    for (let i = 0; i < words.length - 1; i++) {
      ngrams.push(`${words[i]} ${words[i + 1]}`);
    }

    // 2. Character 3-5 grams (word-boundary aware: char_wb)
    const padded = ` ${text} `;
    const len = padded.length;
    for (let n = 3; n <= 5; n++) {
      for (let i = 0; i <= len - n; i++) {
        ngrams.push(padded.substring(i, i + n));
      }
    }

    return ngrams;
  }

  /**
   * Transforms text to sparse TF-IDF vector matching vocabulary indices
   */
  public transform(text: string): SparseVector {
    const ngrams = this.extractNgrams(text);
    const termCounts = new Map<number, number>();

    for (const ngram of ngrams) {
      const idx = this.vocabulary.get(ngram);
      if (idx !== undefined) {
        termCounts.set(idx, (termCounts.get(idx) || 0) + 1);
      }
    }

    if (termCounts.size === 0) {
      return { indices: [], values: [] };
    }

    const indices: number[] = [];
    const values: number[] = [];
    let normSq = 0;

    for (const [idx, count] of termCounts.entries()) {
      // Sublinear TF: 1 + log(tf)
      const tf = this.sublinearTf ? 1 + Math.log(count) : count;
      const idfVal = this.idf[idx] ?? 1.0;
      const weight = tf * idfVal;

      indices.push(idx);
      values.push(weight);
      normSq += weight * weight;
    }

    // L2 normalization
    const norm = Math.sqrt(normSq) || 1.0;
    const normalizedValues = values.map((v) => v / norm);

    return {
      indices,
      values: normalizedValues,
    };
  }
}
