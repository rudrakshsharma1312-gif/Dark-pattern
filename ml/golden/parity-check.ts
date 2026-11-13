import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { FeatureExtractor } from '../../src/ml/features.ts';
import rawModel from '../../src/ml/shaming-v1.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const vectorsPath = path.join(__dirname, 'parity-vectors.json');
const goldenVectors = JSON.parse(fs.readFileSync(vectorsPath, 'utf-8'));

const extractor = new FeatureExtractor(
  rawModel.vocabulary as Record<string, number>,
  rawModel.idf as number[],
  rawModel.features.lowercase,
  rawModel.features.sublinear_tf
);

console.log(`Running parity check on ${goldenVectors.length} golden test strings...`);

let passedCount = 0;
let failedCount = 0;

for (let i = 0; i < goldenVectors.length; i++) {
  const g = goldenVectors[i];
  const jsTokens = extractor.extractNgrams(g.text);
  const jsVec = extractor.transform(g.text);

  // Check tokens
  const tokensMatch = JSON.stringify(jsTokens) === JSON.stringify(g.tokens);
  if (!tokensMatch) {
    console.error(`FAIL [Tokens mismatch] string #${i + 1}: "${g.text}"`);
    console.error(`  Expected:`, g.tokens);
    console.error(`  Received:`, jsTokens);
    failedCount++;
    continue;
  }

  // Check indices
  const indicesMatch = JSON.stringify(jsVec.indices) === JSON.stringify(g.sparse_indices);
  if (!indicesMatch) {
    console.error(`FAIL [Indices mismatch] string #${i + 1}: "${g.text}"`);
    console.error(`  Expected indices:`, g.sparse_indices);
    console.error(`  Received indices:`, jsVec.indices);
    failedCount++;
    continue;
  }

  // Check values within 1e-4 tolerance
  let valuesMatch = true;
  for (let j = 0; j < jsVec.values.length; j++) {
    const diff = Math.abs(jsVec.values[j] - g.sparse_values[j]);
    if (diff > 1e-4) {
      console.error(
        `FAIL [Value mismatch] string #${i + 1}: idx ${jsVec.indices[j]} expected ${g.sparse_values[j]} vs ${jsVec.values[j]}`
      );
      valuesMatch = false;
      break;
    }
  }

  if (!valuesMatch) {
    failedCount++;
    continue;
  }

  passedCount++;
}

console.log(`\nParity Check Results: ${passedCount}/${goldenVectors.length} PASSED (${failedCount} failed)`);
if (failedCount > 0) {
  process.exit(1);
} else {
  console.log('✅ ALL GOLDEN PARITY VECTORS MATCH 100% (Tokens, Indices, TF-IDF Values)!');
}
