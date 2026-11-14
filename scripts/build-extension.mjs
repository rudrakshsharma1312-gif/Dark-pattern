/**
 * Bundles the DarkGuard AI TypeScript engine into browser-ready IIFE content/scanner.js.
 */
import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const modelJsonRaw = fs.readFileSync(path.join(rootDir, 'src/ml/shaming-v1.json'), 'utf-8');

async function build() {
  console.log('[DarkGuard Bundler] Compiling content/scanner.js with esbuild...');
  await esbuild.build({
    entryPoints: [path.join(rootDir, 'src/content/scanner-entry.ts')],
    outfile: path.join(rootDir, 'content/scanner.js'),
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['chrome100', 'edge100'],
    minify: false,
    sourcemap: false,
    plugins: [
      {
        name: 'zero-network-ai-explain-stub',
        setup(build) {
          build.onResolve({ filter: /ai-explain/ }, (args) => {
            return { path: args.path, namespace: 'ai-explain-stub' };
          });
          build.onLoad({ filter: /.*/, namespace: 'ai-explain-stub' }, () => {
            return {
              contents: `
                export async function enhanceExplanationsWithTimeout() { return; }
              `,
            };
          });
        },
      },
      {
        name: 'node-builtins-browser-shim',
        setup(build) {
          build.onResolve({ filter: /^(fs|path|url)$/ }, (args) => {
            return { path: args.path, namespace: 'node-builtins-shim' };
          });
          build.onLoad({ filter: /.*/, namespace: 'node-builtins-shim' }, (args) => {
            if (args.path === 'fs') {
              return {
                contents: `
                  const rawModel = ${JSON.stringify(modelJsonRaw)};
                  export function readFileSync() { return rawModel; }
                  export default { readFileSync };
                `,
              };
            }
            if (args.path === 'path') {
              return {
                contents: `
                  export function dirname() { return ''; }
                  export function join(...args) { return args.join('/'); }
                  export default { dirname, join };
                `,
              };
            }
            if (args.path === 'url') {
              return {
                contents: `
                  export function fileURLToPath() { return ''; }
                  export default { fileURLToPath };
                `,
              };
            }
          });
        },
      },
    ],
    define: {
      'process.env.NODE_ENV': '"production"',
    },
  });
  console.log('✅ Successfully generated content/scanner.js');
}

build().catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
