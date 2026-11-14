/**
 * DarkGuard AI Feature Extractor
 * Generates word unigrams and bigrams with sublinear TF-IDF weighting.
 * Paritied with training logic in ml/train.py.
 * Note: char_wb n-grams removed per G-1 decision; TRD §6.3 deviation noted in model card.
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
   * Tokenizes text into word unigrams and bigrams.
   * Matches extract_unigrams_and_bigrams in ml/train.py.
   */
  public extractNgrams(rawText: string): string[] {
    const text = this.lowercase ? rawText.toLowerCase().trim() : rawText.trim();
    if (!text) return [];

    const ngrams: string[] = [];

    // Unicode-aware word tokenization:
    // Matches Python extract_unigrams_and_bigrams.
    // Retains Unicode letters (\p{L}), numbers (\p{N}), combining marks (\p{M}),
    // hyphens (-), underscores (_), and whitespace (\s).
    // Replaces all currency symbols, em-dashes, and punctuation with spaces.
    const words = text
      .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, ' ')
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

    // Keep indices sorted for deterministic order
    const sortedIndices = Array.from(termCounts.keys()).sort((a, b) => a - b);
    const values: number[] = [];
    let normSq = 0;

    for (const idx of sortedIndices) {
      const count = termCounts.get(idx)!;
      // Sublinear TF: 1 + log(tf)
      const tf = this.sublinearTf ? 1 + Math.log(count) : count;
      const idfVal = this.idf[idx] ?? 1.0;
      const weight = tf * idfVal;

      values.push(weight);
      normSq += weight * weight;
    }

    // L2 normalization
    const norm = Math.sqrt(normSq) || 1.0;
    const normalizedValues = values.map((v) => v / norm);

    return {
      indices: sortedIndices,
      values: normalizedValues,
    };
  }
}
