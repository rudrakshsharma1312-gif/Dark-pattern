/**
 * Packages the DarkGuard AI extension into dist/darkguard-extension.zip
 * and validates that all manifest.json references resolve in the unpacked directory.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const unpackedDir = path.join(distDir, 'darkguard-unpacked');
const zipFile = path.join(distDir, 'darkguard-extension.zip');

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
    fs.copyFileSync(src, dest);
  }
}

async function packageExtension() {
  console.log('='.repeat(70));
  console.log('DARKGUARD AI: PACKAGING EXTENSION FOR RELEASE');
  console.log('='.repeat(70));

  // 1. Build extension bundle first
  console.log('\n[1/5] Building content/scanner.js bundle...');
  execSync('node scripts/build-extension.mjs', { cwd: rootDir, stdio: 'inherit' });

  // 2. Prepare clean dist directories
  console.log('\n[2/5] Preparing clean dist directories...');
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(unpackedDir, { recursive: true });

  // 3. Copy only necessary extension files
  console.log('[3/5] Copying extension runtime files...');

  // Manifest
  fs.copyFileSync(path.join(rootDir, 'manifest.json'), path.join(unpackedDir, 'manifest.json'));

  // Background
  copyRecursiveSync(path.join(rootDir, 'background'), path.join(unpackedDir, 'background'));

  // Popup
  copyRecursiveSync(path.join(rootDir, 'popup'), path.join(unpackedDir, 'popup'));

  // Content (scanner.js, ethical-view.js, highlighter.js, ethical-view.css, templates.json, shaming-v1.json)
  copyRecursiveSync(path.join(rootDir, 'content'), path.join(unpackedDir, 'content'));

  // Root mirror assets for extension packaging
  if (fs.existsSync(path.join(rootDir, 'ethical-view.css'))) {
    fs.copyFileSync(path.join(rootDir, 'ethical-view.css'), path.join(unpackedDir, 'ethical-view.css'));
  }
  if (fs.existsSync(path.join(rootDir, 'templates.json'))) {
    fs.copyFileSync(path.join(rootDir, 'templates.json'), path.join(unpackedDir, 'templates.json'));
  }

  // 4. Validate manifest paths & popup runtime assets
  console.log('\n[4/5] Validating manifest.json and popup asset resolution...');
  const manifest = JSON.parse(fs.readFileSync(path.join(unpackedDir, 'manifest.json'), 'utf-8'));
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

  // Also check scripts injected by background service worker
  pathsToCheck.push('content/scanner.js');
  pathsToCheck.push('content/highlighter.js');
  pathsToCheck.push('content/ethical-view.js');
  pathsToCheck.push('content/ethical-view.css');

  // Also check all assets referenced by popup.html
  const popupHtmlPath = path.join(unpackedDir, 'popup', 'popup.html');
  if (fs.existsSync(popupHtmlPath)) {
    const popupHtml = fs.readFileSync(popupHtmlPath, 'utf-8');
    const srcMatches = Array.from(popupHtml.matchAll(/src=["']([^"']+)["']/g)).map(m => m[1]);
    const hrefMatches = Array.from(popupHtml.matchAll(/href=["']([^"']+)["']/g)).map(m => m[1]);
    for (const ref of [...srcMatches, ...hrefMatches]) {
      if (ref.startsWith('http://') || ref.startsWith('https://') || ref.startsWith('#') || ref.startsWith('data:')) continue;
      pathsToCheck.push(path.join('popup', ref));
    }
  }

  let allResolved = true;
  for (const relPath of pathsToCheck) {
    const fullPath = path.join(unpackedDir, relPath);
    const exists = fs.existsSync(fullPath);
    console.log(`  - ${relPath.padEnd(30)}: ${exists ? '✅ RESOLVED' : '❌ MISSING'}`);
    if (!exists) allResolved = false;
  }

  if (!allResolved) {
    throw new Error('❌ Asset validation failed: One or more files referenced by manifest.json or popup.html are missing in dist/darkguard-unpacked.');
  }

  // 5. Create zip archive
  console.log('\n[5/5] Creating dist/darkguard-extension.zip...');
  execSync(`cd "${unpackedDir}" && zip -r "${zipFile}" .`, { stdio: 'pipe' });

  const zipStats = fs.statSync(zipFile);
  console.log(`\n🎉 Packaging complete!`);
  console.log(`Archive: dist/darkguard-extension.zip (${(zipStats.size / 1024).toFixed(1)} KB)`);

  console.log('\nPackage contents:');
  const zipListing = execSync(`unzip -l "${zipFile}"`, { encoding: 'utf-8' });
  console.log(zipListing);
}

packageExtension().catch((err) => {
  console.error('\n❌ Packaging failed:', err);
  process.exit(1);
});
