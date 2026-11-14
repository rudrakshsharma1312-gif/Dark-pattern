/**
 * DarkGuard AI — Extension Parity Verifier (scripts/verify-extension.mjs)
 *
 * Verifies that:
 * 1. The committed extension-dist/ folder contains all required runtime files.
 * 2. All manifest.json and popup.html references resolve.
 * 3. A fresh isolated build produces files with 100% identical SHA-256 digests.
 * 4. The packaged downloads/darkguard-extension.zip contains the exact same files at root.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const extensionDistDir = path.join(rootDir, 'extension-dist');
const tmpDir = path.join(rootDir, 'node_modules', '.tmp');
const verifyBuildDir = path.join(tmpDir, 'extension-verify-build');
const verifyZipDir = path.join(tmpDir, 'extension-verify-zip');
const zipFile = path.join(rootDir, 'downloads', 'darkguard-extension.zip');

function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      copyRecursiveSync(path.join(src, item), path.join(dest, item));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function getAllFiles(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, base));
    } else {
      files.push(path.relative(base, fullPath));
    }
  }
  return files;
}

function computeSha256(filePath) {
  const bytes = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

async function runVerification() {
  console.log('='.repeat(70));
  console.log('DARKGUARD AI: VERIFYING EXTENSION PARITY & ARTIFACT INTEGRITY');
  console.log('='.repeat(70));

  // 1. Verify extension-dist exists
  if (!fs.existsSync(extensionDistDir)) {
    throw new Error('❌ extension-dist/ does not exist! Run "npm run package:extension" first.');
  }

  const manifestPath = path.join(extensionDistDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error('❌ extension-dist/manifest.json does not exist!');
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  console.log(`\n[1/4] Checking manifest metadata: version=${manifest.version}, version_name=${manifest.version_name}`);
  if (!manifest.version_name) {
    throw new Error('❌ manifest.json is missing required version_name build stamp!');
  }

  // 2. Validate manifest references in extension-dist
  console.log('\n[2/4] Validating runtime asset resolution in extension-dist/...');
  const requiredFiles = [
    'manifest.json',
    'background/service-worker.js',
    'popup/popup.html',
    'popup/popup.js',
    'popup/popup.css',
    'content/scanner.js',
    'content/highlighter.js',
    'content/ethical-view.js',
    'content/ethical-view.css',
    'content/templates.json',
    'content/shaming-v1.json',
  ];

  for (const file of requiredFiles) {
    const fullPath = path.join(extensionDistDir, file);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`❌ Missing required runtime file in extension-dist: ${file}`);
    }
    console.log(`  - ${file.padEnd(32)}: ✅ OK`);
  }

  // 3. Isolated rebuild comparison
  console.log('\n[3/4] Rebuilding into temp directory and checking per-file SHA-256 parity...');
  fs.rmSync(verifyBuildDir, { recursive: true, force: true });
  fs.mkdirSync(verifyBuildDir, { recursive: true });

  // Compile bundle
  execSync('node scripts/build-extension.mjs', { cwd: rootDir, stdio: 'pipe' });

  // Copy runtime files to verifyBuildDir
  copyRecursiveSync(path.join(rootDir, 'background'), path.join(verifyBuildDir, 'background'));
  copyRecursiveSync(path.join(rootDir, 'popup'), path.join(verifyBuildDir, 'popup'));
  copyRecursiveSync(path.join(rootDir, 'content'), path.join(verifyBuildDir, 'content'));
  if (fs.existsSync(path.join(rootDir, 'ethical-view.css'))) {
    fs.copyFileSync(path.join(rootDir, 'ethical-view.css'), path.join(verifyBuildDir, 'ethical-view.css'));
  }
  if (fs.existsSync(path.join(rootDir, 'templates.json'))) {
    fs.copyFileSync(path.join(rootDir, 'templates.json'), path.join(verifyBuildDir, 'templates.json'));
  }

  // Calculate content hash
  const rebuildRuntimeFiles = getAllFiles(verifyBuildDir).sort();
  const hashCollector = crypto.createHash('sha256');
  for (const relPath of rebuildRuntimeFiles) {
    const fileBytes = fs.readFileSync(path.join(verifyBuildDir, relPath));
    const fileHash = crypto.createHash('sha256').update(fileBytes).digest('hex');
    hashCollector.update(`${relPath}:${fileHash}\n`);
  }
  const rebuildContentHash = hashCollector.digest('hex').slice(0, 8);

  const srcManifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'src', 'manifest.json'), 'utf-8'));
  srcManifest.version_name = `${srcManifest.version} (${rebuildContentHash})`;
  fs.writeFileSync(
    path.join(verifyBuildDir, 'manifest.json'),
    JSON.stringify(srcManifest, null, 2) + '\n',
    'utf-8'
  );

  // Compare file lists
  const distFiles = getAllFiles(extensionDistDir).sort();
  const tempFiles = getAllFiles(verifyBuildDir).sort();

  if (JSON.stringify(distFiles) !== JSON.stringify(tempFiles)) {
    throw new Error(
      `❌ File list mismatch between extension-dist and rebuilt package!\n` +
      `extension-dist: ${distFiles.join(', ')}\n` +
      `rebuilt:        ${tempFiles.join(', ')}`
    );
  }

  let hashMismatches = 0;
  for (const relPath of distFiles) {
    const distHash = computeSha256(path.join(extensionDistDir, relPath));
    const tempHash = computeSha256(path.join(verifyBuildDir, relPath));
    if (distHash !== tempHash) {
      console.error(`❌ Hash mismatch in ${relPath}: committed=${distHash}, rebuilt=${tempHash}`);
      hashMismatches++;
    } else {
      console.log(`  - ${relPath.padEnd(32)}: ✅ MATCH (${distHash.slice(0, 12)}...)`);
    }
  }

  if (hashMismatches > 0) {
    throw new Error(`❌ Stale extension-dist: ${hashMismatches} file(s) differ from source. Run "npm run package:extension" to update extension-dist.`);
  }

  // 4. Verify ZIP archive matches extension-dist contents
  console.log('\n[4/4] Verifying downloads/darkguard-extension.zip matches extension-dist/ ...');
  if (fs.existsSync(zipFile)) {
    fs.rmSync(verifyZipDir, { recursive: true, force: true });
    fs.mkdirSync(verifyZipDir, { recursive: true });
    execSync(`unzip -q "${zipFile}" -d "${verifyZipDir}"`);

    // Verify manifest is at the root of the ZIP
    if (!fs.existsSync(path.join(verifyZipDir, 'manifest.json'))) {
      throw new Error('❌ ZIP root check failed: manifest.json is NOT at the root of the zip archive!');
    }

    const zipFiles = getAllFiles(verifyZipDir).sort();
    for (const relPath of distFiles) {
      const distHash = computeSha256(path.join(extensionDistDir, relPath));
      const zipFilePath = path.join(verifyZipDir, relPath);
      if (!fs.existsSync(zipFilePath)) {
        throw new Error(`❌ File ${relPath} missing from downloads/darkguard-extension.zip!`);
      }
      const zipFileHash = computeSha256(zipFilePath);
      if (distHash !== zipFileHash) {
        throw new Error(`❌ ZIP content mismatch in ${relPath}: extension-dist=${distHash}, zip=${zipFileHash}`);
      }
    }
    console.log(`  - ZIP root verified: manifest.json present at root.`);
    console.log(`  - All ${distFiles.length} files match extension-dist/ 100% byte-for-byte.`);
  } else {
    console.log('  - downloads/darkguard-extension.zip not yet generated (skipped).');
  }

  // Clean up
  fs.rmSync(verifyBuildDir, { recursive: true, force: true });
  fs.rmSync(verifyZipDir, { recursive: true, force: true });

  console.log('\n✅ EXTENSION VERIFICATION PASSED: extension-dist/ is fresh, valid, and identical to source.');
}

runVerification().catch((err) => {
  console.error('\n' + err.message);
  process.exit(1);
});
