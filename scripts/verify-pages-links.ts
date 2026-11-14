import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const siteDir = path.join(rootDir, '_site');

function copyRecursiveSync(src: string, dest: string) {
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

// Assemble _site for testing if not already complete
console.log('Ensuring _site directory is assembled...');
fs.mkdirSync(siteDir, { recursive: true });
copyRecursiveSync(path.join(rootDir, 'landing'), siteDir);
copyRecursiveSync(path.join(rootDir, 'landing'), path.join(siteDir, 'landing'));
copyRecursiveSync(path.join(rootDir, 'test-site'), path.join(siteDir, 'test-site'));

const distWeb = path.join(rootDir, 'dist-web');
if (fs.existsSync(distWeb)) {
  copyRecursiveSync(distWeb, path.join(siteDir, 'app'));
}

const mockOrigin = 'http://localhost:8080';
const subpath = '/Dark-pattern';
const baseUrl = `${mockOrigin}${subpath}`;

console.log(`[Crawler] Validating all links and asset references under ${baseUrl}/ ...`);

const visited = new Set<string>();
const toVisit: string[] = ['/index.html', '/test-site/index.html'];
if (fs.existsSync(path.join(siteDir, 'app', 'index.html'))) {
  toVisit.push('/app/index.html');
}

const errors: { from: string; link: string; target: string; reason: string }[] = [];

while (toVisit.length > 0) {
  const current = toVisit.shift()!;
  if (visited.has(current)) continue;
  visited.add(current);

  let diskPath = path.join(siteDir, current);
  if (fs.existsSync(diskPath) && fs.statSync(diskPath).isDirectory()) {
    diskPath = path.join(diskPath, 'index.html');
  }

  if (!fs.existsSync(diskPath)) {
    errors.push({ from: 'queue', link: current, target: diskPath, reason: 'File does not exist on disk' });
    continue;
  }

  const currentUrl = `${baseUrl}${current.startsWith('/') ? '' : '/'}${current}`;
  const html = fs.readFileSync(diskPath, 'utf-8');
  const dom = new JSDOM(html, { url: currentUrl });

  // 1. Check anchor links
  const links = Array.from(dom.window.document.querySelectorAll('a[href]'));
  for (const a of links) {
    const href = a.getAttribute('href') || '';
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('http://') || href.startsWith('https://')) {
      continue;
    }

    try {
      const resolved = new URL(href, currentUrl);
      if (resolved.origin === mockOrigin) {
        if (!resolved.pathname.startsWith(subpath)) {
          errors.push({
            from: current,
            link: href,
            target: resolved.pathname,
            reason: `Broken prefix: link does not stay within ${subpath}/ (went to ${resolved.pathname})`,
          });
          continue;
        }

        let relTarget = resolved.pathname.slice(subpath.length) || '/index.html';
        if (relTarget.endsWith('/')) relTarget += 'index.html';
        let targetDiskPath = path.join(siteDir, relTarget);
        if (fs.existsSync(targetDiskPath) && fs.statSync(targetDiskPath).isDirectory()) {
          targetDiskPath = path.join(targetDiskPath, 'index.html');
        }

        if (!fs.existsSync(targetDiskPath)) {
          errors.push({
            from: current,
            link: href,
            target: resolved.pathname,
            reason: `404 Not Found on disk: ${targetDiskPath}`,
          });
        } else if (!visited.has(relTarget) && relTarget.endsWith('.html')) {
          toVisit.push(relTarget);
        }
      }
    } catch (e: any) {
      errors.push({ from: current, link: href, target: href, reason: e.message });
    }
  }

  // 2. Check assets: script[src], link[rel="stylesheet"][href], img[src]
  const assets = [
    ...Array.from(dom.window.document.querySelectorAll('script[src]')).map((el) => ({ el, attr: 'src' })),
    ...Array.from(dom.window.document.querySelectorAll('link[rel="stylesheet"][href]')).map((el) => ({ el, attr: 'href' })),
    ...Array.from(dom.window.document.querySelectorAll('img[src]')).map((el) => ({ el, attr: 'src' })),
  ];

  for (const { el, attr } of assets) {
    const src = el.getAttribute(attr) || '';
    if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
      continue;
    }

    try {
      const resolved = new URL(src, currentUrl);
      if (resolved.origin === mockOrigin) {
        if (!resolved.pathname.startsWith(subpath)) {
          errors.push({
            from: current,
            link: src,
            target: resolved.pathname,
            reason: `Asset path breaks subpath: ${src}`,
          });
          continue;
        }

        const relTarget = resolved.pathname.slice(subpath.length);
        const targetDiskPath = path.join(siteDir, relTarget);
        if (!fs.existsSync(targetDiskPath)) {
          errors.push({
            from: current,
            link: src,
            target: resolved.pathname,
            reason: `Asset missing: ${targetDiskPath}`,
          });
        }
      }
    } catch (e: any) {
      errors.push({ from: current, link: src, target: src, reason: e.message });
    }
  }
}

console.log(`\nChecked ${visited.size} internal pages & views.`);
if (errors.length === 0) {
  console.log('✅ ZERO 404s detected across all links & assets under /Dark-pattern/ subpath!');
  process.exit(0);
} else {
  console.error(`❌ Found ${errors.length} broken links/assets:`, JSON.stringify(errors, null, 2));
  process.exit(1);
}
