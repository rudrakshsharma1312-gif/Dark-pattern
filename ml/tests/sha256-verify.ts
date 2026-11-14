/**
 * Quick validation: pure-JS sha256Sync vs known test vectors.
 */
import { sha256Sync } from '../../src/ml/sha256-sync.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// NIST test vectors
const tests: Array<[string, string]> = [
  ['', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'],
  ['abc', 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'],
  [
    'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq',
    '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
  ],
];

let allPass = true;
for (const [input, expected] of tests) {
  const got = sha256Sync(input);
  const ok = got === expected;
  console.log(`${ok ? '✅' : '❌'} sha256("${input.slice(0, 30)}${input.length > 30 ? '...' : ''}") = ${got.slice(0, 16)}... ${ok ? 'PASS' : 'FAIL (expected ' + expected.slice(0, 16) + '...)'}`);
  if (!ok) allPass = false;
}

// Now test against the actual model file
const modelPath = path.join(__dirname, '..', '..', 'src', 'ml', 'shaming-v1.json');
const modelText = fs.readFileSync(modelPath, 'utf-8');
const modelHash = sha256Sync(modelText);
const expectedHash = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'ml', 'shaming-v1.sha256'), 'utf-8').trim();

const modelOk = modelHash === expectedHash;
console.log(`\n${modelOk ? '✅' : '❌'} shaming-v1.json hash: ${modelHash}`);
console.log(`   Expected (sidecar):   ${expectedHash}`);
console.log(`   Match: ${modelOk ? 'YES' : 'NO'}`);
if (!modelOk) allPass = false;

if (allPass) {
  console.log('\n🎉 ALL SHA-256 TESTS PASSED');
} else {
  console.error('\n❌ SOME SHA-256 TESTS FAILED');
  process.exit(1);
}

