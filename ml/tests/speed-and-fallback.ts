import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DarkGuardClassifier } from '../../src/ml/classifier.ts';
import { sha256Sync } from '../../src/ml/sha256-sync.ts';
import { SHAMING_V1_SHA256 } from '../../src/ml/shaming-v1.checksum.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function runTests() {
  console.log('=== DarkGuard ML: Speed and Fallback Verification Tests ===\n');

  const jsonPath = path.join(__dirname, '..', '..', 'src', 'ml', 'shaming-v1.json');
  const validRawText = fs.readFileSync(jsonPath, 'utf-8');

  // ---------------------------------------------------------------------------
  // Test A: Speed Budget (200 strings under 5 ms)
  // ---------------------------------------------------------------------------
  console.log('--- Test A: Latency Test (200 candidate strings < 5 ms) ---');
  const csvPath = path.join(__dirname, '..', 'data', 'strings.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter((l) => l.trim().length > 0).slice(1, 201);

  const candidates = lines.map((l, i) => {
    const match = l.match(/"([^"]+)"/);
    const text = match ? match[1] : l.split(',')[1] || 'Sample text';
    return { ref: `cand-${i}`, text };
  });

  // Construct from valid raw text (proves the checksum is computed and passes)
  const classifier = new DarkGuardClassifier(validRawText);
  console.log(`  Classifier status: ${classifier.status}, checksumValid: ${classifier.isChecksumValid}`);

  // Warmup (5 full runs on all 200 strings)
  for (let w = 0; w < 5; w++) {
    classifier.batchPredict(candidates);
  }

  // 20 timed benchmark runs
  const latencies: number[] = [];
  for (let r = 0; r < 20; r++) {
    const start = performance.now();
    classifier.batchPredict(candidates);
    latencies.push(performance.now() - start);
  }

  latencies.sort((a, b) => a - b);
  const median = latencies[Math.floor(latencies.length / 2)];
  const min = latencies[0];
  const max = latencies[latencies.length - 1];
  const mean = latencies.reduce((a, b) => a + b, 0) / latencies.length;

  console.log(`  20 Runs on 200 candidate strings:`);
  console.log(`    Median latency: ${median.toFixed(3)} ms`);
  console.log(`    Mean latency:   ${mean.toFixed(3)} ms`);
  console.log(`    Min latency:    ${min.toFixed(3)} ms`);
  console.log(`    Max latency:    ${max.toFixed(3)} ms`);
  console.log(`    Per-candidate:  ${(median / candidates.length).toFixed(4)} ms/candidate`);

  if (median < 5.0) {
    console.log(`✅ Test A PASSED: Median ${median.toFixed(3)} ms is within < 5.0 ms budget (Max: ${max.toFixed(3)} ms)\n`);
  } else {
    console.error(`❌ Test A FAILED: Median ${median.toFixed(3)} ms exceeded 5.0 ms limit\n`);
    process.exit(1);
  }

  // ---------------------------------------------------------------------------
  // Test B: Corrupted Model Fallback – mutate one weight value in the raw text
  // ---------------------------------------------------------------------------
  console.log('--- Test B: Corrupted Model Fallback (weight mutation) ---');

  // Find a real weight value and flip one digit to prove the hash changes
  const weightMatch = validRawText.match(/"values":\s*\[\s*(-?\d+\.\d+)/s);
  if (!weightMatch) {
    console.error('❌ Test B FAILED: could not find a weight value to mutate');
    process.exit(1);
  }
  const originalWeight = weightMatch[1];
  // Flip the last digit: e.g. "1.23456" → "1.23457" (or "1.23450" if it was 1)
  const lastChar = originalWeight[originalWeight.length - 1];
  const newLastChar = lastChar === '9' ? '0' : String(Number(lastChar) + 1);
  const mutatedWeight = originalWeight.slice(0, -1) + newLastChar;
  const corruptedRawText = validRawText.replace(originalWeight, mutatedWeight);

  console.log(`  Original weight: ${originalWeight}`);
  console.log(`  Mutated  weight: ${mutatedWeight}`);

  // Prove the hashes really differ
  const originalHash = sha256Sync(validRawText);
  const corruptedHash = sha256Sync(corruptedRawText);
  console.log(`  Original hash: ${originalHash.slice(0, 16)}...`);
  console.log(`  Corrupted hash: ${corruptedHash.slice(0, 16)}...`);
  console.log(`  Hashes differ: ${originalHash !== corruptedHash}`);

  if (originalHash === corruptedHash) {
    console.error('❌ Test B FAILED: hashes should differ after mutation!');
    process.exit(1);
  }

  // Construct classifier from corrupted text — must reject
  const corruptInstance = new DarkGuardClassifier(corruptedRawText);
  console.log(`  Corrupted classifier status: ${corruptInstance.status}, checksumValid: ${corruptInstance.isChecksumValid}`);

  const fallbackResult = corruptInstance.batchPredict(candidates.slice(0, 5));
  console.log(`  Corrupt batchPredict results count: ${fallbackResult.results.length}`);

  const testBPassed =
    originalHash === SHAMING_V1_SHA256 &&
    originalHash !== corruptedHash &&
    corruptInstance.status === 'corrupted' &&
    corruptInstance.isChecksumValid === false &&
    fallbackResult.results.length === 0;

  if (testBPassed) {
    console.log('✅ Test B PASSED: Mutated weight → different hash → status corrupted → empty results\n');
  } else {
    console.error('❌ Test B FAILED\n');
    process.exit(1);
  }

  // ---------------------------------------------------------------------------
  // Test C: Missing / Empty Model Fallback
  // ---------------------------------------------------------------------------
  console.log('--- Test C: Missing Model Fallback Test ---');
  const missingInstance = new DarkGuardClassifier('');
  console.log(`  Missing model status: ${missingInstance.status}, checksumValid: ${missingInstance.isChecksumValid}`);

  const missingResult = missingInstance.batchPredict(candidates.slice(0, 5));
  console.log(`  Missing batchPredict results count: ${missingResult.results.length}`);

  const testCPassed =
    missingInstance.status === 'corrupted' &&
    missingInstance.isChecksumValid === false &&
    missingResult.results.length === 0;

  if (testCPassed) {
    console.log('✅ Test C PASSED: Empty model text → status corrupted → empty results\n');
  } else {
    console.error('❌ Test C FAILED\n');
    process.exit(1);
  }

  // ---------------------------------------------------------------------------
  // Test D: Valid model constructed from raw text passes checksum
  // ---------------------------------------------------------------------------
  console.log('--- Test D: Valid Model Raw Text Verification ---');
  const validInstance = new DarkGuardClassifier(validRawText);
  console.log(`  Valid classifier status: ${validInstance.status}, checksumValid: ${validInstance.isChecksumValid}`);

  const validResult = validInstance.batchPredict([{ ref: 'test', text: 'Hurry! Deal ends soon!' }]);
  console.log(`  Valid batchPredict results count: ${validResult.results.length}`);

  const testDPassed =
    validInstance.status === 'ready' &&
    validInstance.isChecksumValid === true &&
    validResult.results.length === 1;

  if (testDPassed) {
    console.log('✅ Test D PASSED: Valid raw text → hash matches → status ready → results returned\n');
  } else {
    console.error('❌ Test D FAILED\n');
    process.exit(1);
  }

  console.log('🎉 ALL SPEED & FALLBACK TESTS PASSED!');
}

runTests();
