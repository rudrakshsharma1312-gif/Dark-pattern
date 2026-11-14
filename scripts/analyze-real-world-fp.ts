import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';
import { DarkGuardScanner } from '../src/engine/orchestrator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function analyzeRealWorldCleanFixtures() {
  const fixturesDir = path.resolve(__dirname, '../tests/fixtures/real-world-clean');
  const files = [
    'clean-stock-urgency.html',
    'clean-from-pricing.html',
    'clean-newsletter-checkbox.html',
    'clean-polite-decline.html',
    'clean-free-shipping.html',
    'clean-sale-ends-sunday.html',
    'clean-remember-me.html',
  ];

  console.log('='.repeat(80));
  console.log('DARKGUARD AI: REAL-WORLD CLEAN FIXTURES FALSE-POSITIVE ANALYSIS');
  console.log('='.repeat(80));

  const results: Record<string, any> = {};

  for (const file of files) {
    const filePath = path.join(fixturesDir, file);
    const html = fs.readFileSync(filePath, 'utf-8');
    const dom = new JSDOM(html, { url: `http://localhost:3000/${file}` });

    try {
      const scanner = new DarkGuardScanner();
      // Rules only (ship-off mode)
      const scanResult = await scanner.scan({
        container: dom.window.document.body,
        domain: 'localhost',
        urlPath: `/${file}`,
        observeMs: 1500,
        mlEnabled: false
      });

      results[file] = {
        scanResult,
        file
      };

      console.log(`\n📄 Fixture: ${file}`);
      console.log(`   Detections count: ${scanResult.detections.length}`);
      console.log(`   Risk Score: ${scanResult.risk_score} (Level: ${scanResult.level})`);

      if (scanResult.detections.length > 0) {
        scanResult.detections.forEach((d, idx) => {
          console.log(`   [Flag ${idx + 1}] Category: ${d.category} (${d.categoryId || 'unknown'}) | Conf: ${d.confidence} | Sev: ${d.severity}`);
          console.log(`          Explanation: ${d.explanation}`);
          console.log(`          Evidence Snippet: ${d.evidenceSnippet}`);
          console.log(`          Element Selector: ${d.elementSelector}`);
          console.log(`          Details:`, JSON.stringify(d.details, null, 2));
        });
      } else {
        console.log('   ✅ No detections (Clean page passed cleanly)');
      }
    } finally {
      dom.window.close();
    }
  }

  return results;
}

analyzeRealWorldCleanFixtures().catch((err) => {
  console.error('Analysis failed:', err);
  process.exit(1);
});
