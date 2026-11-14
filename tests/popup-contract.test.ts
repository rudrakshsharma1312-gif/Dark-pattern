import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import { DarkGuardScanner } from '../src/engine/orchestrator';
import { ScanResult, Detection, RiskLevel, SeverityLevel } from '../src/types';

describe('Step 3: Popup Contract & Data Schema Invariant Tests', () => {
  const rootDir = path.resolve(__dirname, '..');
  const testSiteDir = path.join(rootDir, 'test-site');
  const fixturesPath = path.join(rootDir, 'fixtures/sample-scan-results.json');

  function validateDetectionSchema(d: Detection) {
    // Required fields and non-empty strings
    expect(typeof d.id).toBe('string');
    expect(d.id.length).toBeGreaterThan(0);

    expect(['fake_urgency', 'misleading_discount', 'confirm_shaming', 'preselected_extra', 'classifier_signal']).toContain(
      d.category
    );
    expect(['DP-1', 'DP-2', 'DP-3', 'DP-4']).toContain(d.categoryId);

    expect(typeof d.categoryName).toBe('string');
    expect(d.categoryName.length).toBeGreaterThan(0);

    expect(typeof d.candidateRef).toBe('string');
    expect(d.candidateRef.length).toBeGreaterThan(0);

    // Severity in {1, 2, 3}
    expect([1, 2, 3]).toContain(d.severity);

    // Confidence in [0, 1]
    expect(typeof d.confidence).toBe('number');
    expect(d.confidence).toBeGreaterThanOrEqual(0);
    expect(d.confidence).toBeLessThanOrEqual(1);

    // Source
    expect(['rule', 'ml', 'rule+ml']).toContain(d.source);

    // Explanation & Snippet
    expect(typeof d.explanation).toBe('string');
    expect(d.explanation.length).toBeGreaterThan(0);

    expect(typeof d.templateId).toBe('string');
    expect(d.templateId.length).toBeGreaterThan(0);

    expect(typeof d.evidenceSnippet).toBe('string');
    expect(typeof d.elementSelector).toBe('string');

    // Details object
    expect(typeof d.details).toBe('object');
    expect(d.details).not.toBeNull();
  }

  function validateScanResultSchema(res: ScanResult) {
    expect(typeof res.id).toBe('string');
    expect(typeof res.domain).toBe('string');
    expect(typeof res.url_path).toBe('string');

    // Valid ISO timestamp
    expect(typeof res.timestamp).toBe('string');
    expect(Number.isNaN(Date.parse(res.timestamp))).toBe(false);

    // Score in [0, 100]
    expect(typeof res.risk_score).toBe('number');
    expect(res.risk_score).toBeGreaterThanOrEqual(0);
    expect(res.risk_score).toBeLessThanOrEqual(100);

    // Risk Level mapping
    const expectedLevel: RiskLevel =
      res.risk_score >= 75
        ? 'Very high'
        : res.risk_score >= 50
        ? 'High'
        : res.risk_score >= 25
        ? 'Moderate'
        : 'Low';
    expect(res.level).toBe(expectedLevel);

    // Model and release gate flags
    expect(typeof res.model_version).toBe('string');
    expect(typeof res.ml_enabled).toBe('boolean');
    expect(typeof res.classifierChecksumValid).toBe('boolean');

    // Candidates and timing stats
    expect(typeof res.rawCandidatesCount).toBe('number');
    expect(res.rawCandidatesCount).toBeGreaterThanOrEqual(0);

    expect(typeof res.scanDurationMs).toBe('number');
    expect(res.scanDurationMs).toBeGreaterThanOrEqual(0);

    // Detections
    expect(Array.isArray(res.detections)).toBe(true);
    for (const det of res.detections) {
      validateDetectionSchema(det);
    }
  }

  it('validates real engine output on combined page (Score 66, High, 4 detections)', async () => {
    const rawHtml = fs.readFileSync(path.join(testSiteDir, 'planted-combined-01.html'), 'utf-8');
    const dom = new JSDOM(rawHtml, { url: 'http://localhost:3000/planted-combined-01.html' });
    try {
      const scanner = new DarkGuardScanner();
      const res = await scanner.scan({
        container: dom.window.document.body,
        domain: 'novastore.local',
        urlPath: '/planted-combined-01.html',
        observeMs: 1500,
        mlEnabled: false,
      });

      validateScanResultSchema(res);
      expect(res.risk_score).toBe(66);
      expect(res.level).toBe('High');
      expect(res.detections.length).toBeGreaterThanOrEqual(4);

      // Verify all 4 DP categories exist in detections
      const categoriesFound = new Set(res.detections.map((d) => d.categoryId));
      expect(categoriesFound.has('DP-1')).toBe(true);
      expect(categoriesFound.has('DP-2')).toBe(true);
      expect(categoriesFound.has('DP-3')).toBe(true);
      expect(categoriesFound.has('DP-4')).toBe(true);
    } finally {
      dom.window.close();
    }
  });

  it('validates real engine output on clean page (Score 0, Low, 0 detections)', async () => {
    const rawHtml = fs.readFileSync(path.join(testSiteDir, 'clean-coffee-maker.html'), 'utf-8');
    const dom = new JSDOM(rawHtml, { url: 'http://localhost:3000/clean-coffee-maker.html' });
    try {
      const scanner = new DarkGuardScanner();
      const res = await scanner.scan({
        container: dom.window.document.body,
        domain: 'novastore.local',
        urlPath: '/clean-coffee-maker.html',
        observeMs: 1500,
        mlEnabled: false,
      });

      validateScanResultSchema(res);
      expect(res.risk_score).toBe(0);
      expect(res.level).toBe('Low');
      expect(res.detections.length).toBe(0);
    } finally {
      dom.window.close();
    }
  });

  it('validates that sample fixtures (fixtures/sample-scan-results.json) conform 100% to contract', () => {
    expect(fs.existsSync(fixturesPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(fixturesPath, 'utf-8'));

    expect(content.combined_high_risk).toBeDefined();
    expect(content.clean_low_risk).toBeDefined();
    expect(content.rules_only_release_gate).toBeDefined();
    expect(content.corrupted_checksum).toBeDefined();

    validateScanResultSchema(content.combined_high_risk);
    validateScanResultSchema(content.clean_low_risk);
    validateScanResultSchema(content.rules_only_release_gate);
    validateScanResultSchema(content.corrupted_checksum);

    // Check release gate banner invariants
    expect(content.combined_high_risk.ml_enabled).toBe(false);
    expect(content.combined_high_risk.classifierChecksumValid).toBe(true);

    expect(content.corrupted_checksum.classifierChecksumValid).toBe(false);
  });
});
