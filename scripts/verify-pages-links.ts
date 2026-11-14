import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const siteDir = path.join(rootDir, '_site');

// 1. HTTP server serving _site under /Dark-pattern/
const server = http.createServer((req, res) => {
  let urlPath = req.url?.split('?')[0] || '/';
  if (!urlPath.startsWith('/Dark-pattern')) {
    res.writeHead(404);
    res.end('Not under /Dark-pattern');
    return;
  }

  let relPath = urlPath.slice('/Dark-pattern'.length) || '/';
  if (relPath === '/' || relPath === '') relPath = '/index.html';
  if (relPath.endsWith('/')) relPath += 'index.html';

  const filePath = path.join(siteDir, relPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    const mime =
      ext === '.html'
        ? 'text/html'
        : ext === '.css'
        ? 'text/css'
        : ext === '.js'
        ? 'application/javascript'
        : 'text/plain';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(fs.readFileSync(filePath));
  } else {
    res.writeHead(404);
    res.end(`File not found: ${filePath}`);
  }
});

server.listen(0, async () => {
  const port = (server.address() as any).port;
  const baseUrl = `http://localhost:${port}/Dark-pattern`;
  console.log(`[Server] Serving _site under ${baseUrl}`);

  const visited = new Set<string>();
  const toVisit: string[] = ['/index.html', '/test-site/index.html'];
  const errors: { from: string; link: string; status: number; target: string }[] = [];

  while (toVisit.length > 0) {
    const current = toVisit.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const fullUrl = `${baseUrl}${current.startsWith('/') ? '' : '/'}${current}`;
    try {
      const resp = await fetch(fullUrl);
      if (!resp.ok) {
        errors.push({ from: 'queue', link: current, status: resp.status, target: fullUrl });
        continue;
      }

      if (resp.headers.get('content-type')?.includes('text/html')) {
        const html = await resp.text();
        const dom = new JSDOM(html, { url: fullUrl });
        const links = Array.from(dom.window.document.querySelectorAll('a[href]'));

        for (const a of links) {
          const href = a.getAttribute('href') || '';
          if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('http://') || href.startsWith('https://')) {
            continue;
          }

          // Resolve against current page URL
          const resolved = new URL(href, fullUrl);
          if (resolved.origin === `http://localhost:${port}`) {
            const checkResp = await fetch(resolved.href);
            if (!checkResp.ok) {
              errors.push({ from: current, link: href, status: checkResp.status, target: resolved.pathname });
            } else if (resolved.pathname.startsWith('/Dark-pattern') && !visited.has(resolved.pathname.slice('/Dark-pattern'.length))) {
              toVisit.push(resolved.pathname.slice('/Dark-pattern'.length));
            }
          }
        }
      }
    } catch (err: any) {
      errors.push({ from: 'fetch-err', link: current, status: 500, target: err.message });
    }
  }

  console.log(`\nChecked ${visited.size} internal pages.`);
  if (errors.length === 0) {
    console.log('✅ ZERO 404s detected across all links under /Dark-pattern/ subpath!');
  } else {
    console.error(`❌ Found ${errors.length} broken links:`, errors);
  }

  server.close();
  process.exit(errors.length === 0 ? 0 : 1);
});
