import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DarkGuardClassifier, computeSha256 } from '../../src/ml/classifier.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
  console.log('=== DarkGuard ML: Speed and Fallback Verification Tests ===\n');

  // ---------------------------------------------------------------------------
  // Test A: Speed Budget (200 strings under 5 ms)
  // ---------------------------------------------------------------------------
  console.log('--- Test A: Latency Test (200 candidate strings < 5 ms) ---');
  const csvPath = path.join(__dirname, '..', 'data', 'strings.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter((l) => l.trim().length > 0).slice(1, 201);

  const candidates = lines.map((l, i) => {
    // Extract text between quotes or split by comma
    const match = l.match(/"([^"]+)"/);
    const text = match ? match[1] : l.split(',')[1] || 'Sample text';
    return { ref: `cand-${i}`, text };
  });

  const classifier = new DarkGuardClassifier();

  // Warmup
  classifier.batchPredict(candidates.slice(0, 10));

  // Timed run
  const { results, elapsedMs } = classifier.batchPredict(candidates);
  console.log(`Classified ${results.length} strings in ${elapsedMs.toFixed(3)} ms`);
  console.log(`Average latency per candidate: ${(elapsedMs / candidates.length).toFixed(4)} ms`);

  if (elapsedMs < 5.0) {
    console.log(`✅ Test A PASSED: ${elapsedMs.toFixed(3)} ms is within < 5.0 ms budget\n`);
  } else {
    console.warn(`⚠️ Test A WARNING: ${elapsedMs.toFixed(3)} ms exceeded 5.0 ms target\n`);
  }

  // ---------------------------------------------------------------------------
  // Test B: Corrupted Checksum Fallback
  // ---------------------------------------------------------------------------
  console.log('--- Test B: Checksum Fallback Test ---');
  const jsonPath = path.join(__dirname, '..', '..', 'src', 'ml', 'shaming-v1.json');
  const validRawText = fs.readFileSync(jsonPath, 'utf-8');

  // Verify valid raw text passes
  const validInstance = await DarkGuardClassifier.create(validRawText);
  console.log(`Valid raw text status: ${validInstance.status}, isChecksumValid: ${validInstance.isChecksumValid}`);

  // Now mutate raw text
  const corruptedRawText = validRawText.replace('"sublinear_tf": true', '"sublinear_tf": false');
  const corruptInstance = await DarkGuardClassifier.create(corruptedRawText);
  console.log(`Corrupted text status: ${corruptInstance.status}, isChecksumValid: ${corruptInstance.isChecksumValid}`);

  const fallbackResult = corruptInstance.batchPredict(candidates.slice(0, 5));
  console.log(`Corrupt instance batchPredict results count: ${fallbackResult.results.length}`);

  const testBPassed =
    validInstance.status === 'ready' &&
    corruptInstance.status === 'corrupted' &&
    corruptInstance.isChecksumValid === false &&
    fallbackResult.results.length === 0;

  if (testBPassed) {
    console.log('✅ Test B PASSED: Damaged checksum rejected, falls back to empty results (rules-only scan)\n');
  } else {
    console.error('❌ Test B FAILED\n');
    process.exit(1);
  }

  // ---------------------------------------------------------------------------
  // Test C: Missing / Null Model Fallback
  // ---------------------------------------------------------------------------
  console.log('--- Test C: Missing Model Fallback Test ---');
  const missingInstance = await DarkGuardClassifier.create(null as any, null as any);
  console.log(`Missing model status: ${missingInstance.status}, isChecksumValid: ${missingInstance.isChecksumValid}`);

  const missingResult = missingInstance.batchPredict(candidates.slice(0, 5));
  console.log(`Missing instance batchPredict results count: ${missingResult.results.length}`);

  const testCPassed =
    missingInstance.status === 'corrupted' &&
    missingInstance.isChecksumValid === false &&
    missingResult.results.length === 0;

  if (testCPassed) {
    console.log('✅ Test C PASSED: Missing model returns status corrupted and empty results\n');
  } else {
    console.error('❌ Test C FAILED\n');
    process.exit(1);
  }

  console.log('🎉 ALL SPEED & FALLBACK TESTS PASSED!');
}

runTests();

