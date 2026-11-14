/**
 * Serves the public _site directory locally, matching GitHub Pages structure:
 * - http://localhost:8080/Dark-pattern/          -> Landing page
 * - http://localhost:8080/Dark-pattern/app/     -> React Web App
 * - http://localhost:8080/Dark-pattern/test-site/ -> 16-page Test Bed
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Ensure _site is assembled
console.log('Assembling _site directory for local preview...');
fs.mkdirSync(siteDir, { recursive: true });
copyRecursiveSync(path.join(rootDir, 'landing'), siteDir);
copyRecursiveSync(path.join(rootDir, 'landing'), path.join(siteDir, 'landing'));
copyRecursiveSync(path.join(rootDir, 'test-site'), path.join(siteDir, 'test-site'));

const distWeb = path.join(rootDir, 'dist-web');
if (fs.existsSync(distWeb)) {
  copyRecursiveSync(distWeb, path.join(siteDir, 'app'));
}

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

const server = http.createServer((req, res) => {
  let urlPath = req.url?.split('?')[0] || '/';

  // Normalize subpath prefix
  if (urlPath.startsWith('/Dark-pattern')) {
    urlPath = urlPath.slice('/Dark-pattern'.length);
  }
  if (!urlPath || urlPath === '/') {
    urlPath = '/index.html';
  }

  let filePath = path.join(siteDir, urlPath);

  // Directory handling
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(fs.readFileSync(filePath));
  } else {
    // If inside /app/ (SPA fallback)
    if (urlPath.startsWith('/app')) {
      const appIndex = path.join(siteDir, 'app', 'index.html');
      if (fs.existsSync(appIndex)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(fs.readFileSync(appIndex));
        return;
      }
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end(`404 Not Found: ${urlPath}`);
  }
});

const PORT = 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(70));
  console.log(`DARKGUARD AI LOCAL PREVIEW SERVER RUNNING ON PORT ${PORT}`);
  console.log('='.repeat(70));
  console.log(`\n• Landing Page:     http://localhost:${PORT}/Dark-pattern/`);
  console.log(`• React Web App:    http://localhost:${PORT}/Dark-pattern/app/`);
  console.log(`• 16-Page Test Bed: http://localhost:${PORT}/Dark-pattern/test-site/`);
  console.log('\nPress Ctrl+C to stop.\n');
});
