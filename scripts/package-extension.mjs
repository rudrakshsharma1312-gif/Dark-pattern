/**
 * Packages the DarkGuard AI extension into extension-dist/ and downloads/darkguard-extension.zip
 * and validates that all manifest.json references resolve in the unpacked directory.
 *
 * Single Source of Truth protocol:
 * - Runtime folder: extension-dist/ (committed to git)
 * - Source manifest: src/manifest.json
 * - Runtime manifest: extension-dist/manifest.json (stamped with deterministic content hash)
 * - Extension ZIPs: downloads/darkguard-extension.zip and extension-dist.zip
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
const downloadsDir = path.join(rootDir, 'downloads');
const publicDownloadsDir = path.join(rootDir, 'public', 'downloads');
const zipFile = path.join(downloadsDir, 'darkguard-extension.zip');
const rootZipFile = path.join(rootDir, 'extension-dist.zip');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function getAllFiles(dir, base = dir) {
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

export async function packageExtension() {
  console.log('='.repeat(70));
  console.log('DARKGUARD AI: PACKAGING EXTENSION FOR RELEASE (SINGLE SOURCE)');
  console.log('='.repeat(70));

  // 1. Build extension bundle first
  console.log('\n[1/6] Building content/scanner.js bundle...');
  execSync('node scripts/build-extension.mjs', { cwd: rootDir, stdio: 'inherit' });

  // 2. Prepare clean extension-dist directory
  console.log('\n[2/6] Preparing extension-dist/ directory...');
  if (fs.existsSync(extensionDistDir)) {
    fs.rmSync(extensionDistDir, { recursive: true, force: true });
  }
  fs.mkdirSync(extensionDistDir, { recursive: true });
  fs.mkdirSync(downloadsDir, { recursive: true });
  fs.mkdirSync(publicDownloadsDir, { recursive: true });

  // 3. Copy only necessary extension files
  console.log('[3/6] Copying extension runtime files...');

  // Background
  copyRecursiveSync(path.join(rootDir, 'background'), path.join(extensionDistDir, 'background'));

  // Popup
  copyRecursiveSync(path.join(rootDir, 'popup'), path.join(extensionDistDir, 'popup'));

  // Content (scanner.js, ethical-view.js, highlighter.js, ethical-view.css, templates.json, shaming-v1.json)
  copyRecursiveSync(path.join(rootDir, 'content'), path.join(extensionDistDir, 'content'));

  // Root mirror assets for extension packaging
  if (fs.existsSync(path.join(rootDir, 'ethical-view.css'))) {
    fs.copyFileSync(path.join(rootDir, 'ethical-view.css'), path.join(extensionDistDir, 'ethical-view.css'));
  }
  if (fs.existsSync(path.join(rootDir, 'templates.json'))) {
    fs.copyFileSync(path.join(rootDir, 'templates.json'), path.join(extensionDistDir, 'templates.json'));
  }

  // 4. Compute deterministic content hash across all copied runtime files
  console.log('\n[4/6] Computing deterministic content hash & stamping manifest...');
  const runtimeFiles = getAllFiles(extensionDistDir).sort();
  const hashCollector = crypto.createHash('sha256');

  for (const relPath of runtimeFiles) {
    const fileBytes = fs.readFileSync(path.join(extensionDistDir, relPath));
    const fileHash = crypto.createHash('sha256').update(fileBytes).digest('hex');
    hashCollector.update(`${relPath}:${fileHash}\n`);
  }
  const contentHash = hashCollector.digest('hex').slice(0, 8);
  console.log(`  - Runtime files: ${runtimeFiles.length}`);
  console.log(`  - Content hash:  ${contentHash}`);

  // Read base manifest from src/manifest.json and stamp version_name
  const srcManifestPath = path.join(rootDir, 'src', 'manifest.json');
  if (!fs.existsSync(srcManifestPath)) {
    throw new Error(`Source manifest missing at ${srcManifestPath}`);
  }
  const manifest = JSON.parse(fs.readFileSync(srcManifestPath, 'utf-8'));
  manifest.version_name = `${manifest.version} (${contentHash})`;
  fs.writeFileSync(
    path.join(extensionDistDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
    'utf-8'
  );

  // 5. Validate manifest paths & popup runtime assets
  console.log('\n[5/6] Validating manifest.json and popup asset resolution...');
  const pathsToCheck = [];

  if (manifest.action?.default_popup) pathsToCheck.push(manifest.action.default_popup);
  if (manifest.background?.service_worker) pathsToCheck.push(manifest.background.service_worker);

  if (Array.isArray(manifest.web_accessible_resources)) {
    for (const group of manifest.web_accessible_resources) {
      if (Array.isArray(group.resources)) {
        pathsToCheck.push(...group.resources);
      }
    }
  }

  // Scripts injected by background service worker
  pathsToCheck.push('content/scanner.js');
  pathsToCheck.push('content/highlighter.js');
  pathsToCheck.push('content/ethical-view.js');
  pathsToCheck.push('content/ethical-view.css');

  // Check all assets referenced by popup.html
  const popupHtmlPath = path.join(extensionDistDir, 'popup', 'popup.html');
  if (fs.existsSync(popupHtmlPath)) {
    const popupHtml = fs.readFileSync(popupHtmlPath, 'utf-8');
    const srcMatches = Array.from(popupHtml.matchAll(/src=["']([^"']+)["']/g)).map((m) => m[1]);
    const hrefMatches = Array.from(popupHtml.matchAll(/href=["']([^"']+)["']/g)).map((m) => m[1]);
    for (const ref of [...srcMatches, ...hrefMatches]) {
      if (
        ref.startsWith('http://') ||
        ref.startsWith('https://') ||
        ref.startsWith('#') ||
        ref.startsWith('data:')
      ) {
        continue;
      }
      pathsToCheck.push(path.join('popup', ref));
    }
  }

  let allResolved = true;
  for (const relPath of pathsToCheck) {
    const fullPath = path.join(extensionDistDir, relPath);
    const exists = fs.existsSync(fullPath);
    console.log(`  - ${relPath.padEnd(32)}: ${exists ? '✅ RESOLVED' : '❌ MISSING'}`);
    if (!exists) allResolved = false;
  }

  if (!allResolved) {
    throw new Error('❌ Asset validation failed: One or more files referenced by manifest.json or popup.html are missing in extension-dist.');
  }

  // 6. Create zip archives
  console.log('\n[6/6] Creating zip archives (files at archive root)...');
  // -X strips macOS extended attributes
  execSync(`cd "${extensionDistDir}" && zip -X -q -r "${zipFile}" .`, { stdio: 'pipe' });
  fs.copyFileSync(zipFile, rootZipFile);
  fs.copyFileSync(zipFile, path.join(publicDownloadsDir, 'darkguard-extension.zip'));

  const zipBytes = fs.readFileSync(zipFile);
  const zipSha256 = crypto.createHash('sha256').update(zipBytes).digest('hex');

  const buildInfoText = [
    `Version: ${manifest.version}`,
    `Version-Name: ${manifest.version_name}`,
    `Content-Hash: ${contentHash}`,
    `ZIP-SHA256: ${zipSha256}`,
  ].join('\n') + '\n';

  fs.writeFileSync(path.join(downloadsDir, 'build-info.txt'), buildInfoText, 'utf-8');
  fs.writeFileSync(path.join(publicDownloadsDir, 'build-info.txt'), buildInfoText, 'utf-8');

  console.log(`\n🎉 Packaging complete!`);
  console.log(`Folder:  extension-dist/ (${getAllFiles(extensionDistDir).length} files)`);
  console.log(`Archive: downloads/darkguard-extension.zip (${(zipBytes.length / 1024).toFixed(1)} KB)`);
  console.log(`SHA-256: ${zipSha256}`);
  console.log(`Version: ${manifest.version_name}`);
}

// Auto-run if executed directly
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  packageExtension().catch((err) => {
    console.error('\n❌ Packaging failed:', err);
    process.exit(1);
  });
}
