import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { ScanResult } from '../types';
import { ScoreRing } from './ScoreRing';
import { FindingCard } from './FindingCard';
import { AITextRenderer, AISkeletonLoader, AICodeBlock } from './AITextRenderer';
import { EthicalViewEngine } from '../engine/ethical-view';
import { scannerInstance } from '../engine/orchestrator';
import { generateExtensionZip } from '../extension-package/build-extension';
import {
  Shield,
  Download,
  RotateCcw,
  History,
  FileJson,
  FileText,
  CheckCircle2,
  Play,
  Globe,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';

interface ExtensionSimulatorProps {
  testContainerRef: React.RefObject<HTMLElement | null>;
  currentDomain?: string;
  currentPath?: string;
}

export const ExtensionSimulator: React.FC<ExtensionSimulatorProps> = ({
  testContainerRef,
  currentDomain = 'demo.darkguard.shop',
  currentPath = '/products/aura-sound-pro',
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepMessage, setScanStepMessage] = useState('');
  const [scanSecondsLeft, setScanSecondsLeft] = useState(10);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [ethicalViewOn, setEthicalViewOn] = useState(false);
  const [checkedSellerQuestions, setCheckedSellerQuestions] = useState<Set<string>>(new Set());
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<ScanResult[]>([]);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [aiExplainEnabled, setAiExplainEnabled] = useState(true);
  const [briefOpen, setBriefOpen] = useState(false);
  const [briefMode, setBriefMode] = useState<'formatted' | 'json'>('formatted');

  const [ethicalEngine] = useState(
    () =>
      new EthicalViewEngine((state) => {
        setEthicalViewOn(state === 'ON');
      })
  );

  useEffect(() => {
    setHistoryItems(scannerInstance.getHistory());
  }, []);

  const formattedAuditBrief = useMemo(() => {
    if (!scanResult) return '';
    if (scanResult.detections.length === 0) {
      return `## Audit Brief · ${scanResult.domain}

No deceptive patterns were flagged across **${scanResult.rawCandidatesCount} inspected elements**.

- **Pricing transparency:** No mismatched discount arithmetic detected
- **Urgency signals:** No frozen countdown timers observed
- **Consent controls:** Add-on checkboxes remain unchecked by default`;
    }

    const tableRows = scanResult.detections
      .map(
        (d) =>
          `| \`${d.categoryId}\` | ${d.categoryName} | ${Math.round(d.confidence * 100)}% | ${d.source} |`
      )
      .join('\n');

    const observations = scanResult.detections
      .map((d, idx) => `${idx + 1}. **${d.categoryName}:** ${d.aiExplanation || d.explanation}`)
      .join('\n');

    return `## Audit Brief · ${scanResult.domain}

Scanned **${scanResult.rawCandidatesCount} elements** in \`${scanResult.scanDurationMs}ms\` with a unified risk score of **${scanResult.risk_score}/100** (${scanResult.level}).

| Code | Pattern | Confidence | Signal |
| --- | --- | --- | --- |
${tableRows}

### Key Observations
${observations}

> Screening summary only. Toggle **Ethical View** above to annotate these items directly on the storefront.`;
  }, [scanResult]);

  const handleStartScan = async (fastForwardTimer = false) => {
    setIsScanning(true);
    setScanStepMessage('Extracting visible candidate elements...');
    setScanSecondsLeft(fastForwardTimer ? 0 : 3);

    if (!fastForwardTimer) {
      await new Promise<void>((resolve) => {
        let left = 3;
        const interval = setInterval(() => {
          left--;
          setScanSecondsLeft(left);
          if (left <= 0) {
            clearInterval(interval);
            resolve();
          }
        }, 1000);
      });
    }

    setScanStepMessage('Verifying rule evidence (DP-1 to DP-4)...');
    await new Promise((r) => setTimeout(r, 200));

    setScanStepMessage(
      aiExplainEnabled
        ? 'Running ML inference & formatting AI explanations...'
        : 'Running text classifier ML inference...'
    );
    await new Promise((r) => setTimeout(r, 100));

    const container =
      testContainerRef.current || document.getElementById('test-shop-container') || document.body;
    const result = await scannerInstance.scan({
      container,
      domain: currentDomain,
      urlPath: currentPath,
      observeMs: 10000,
      useAiExplanations: aiExplainEnabled,
    });

    setScanResult(result);
    setHistoryItems(scannerInstance.getHistory());
    setIsScanning(false);

    if (ethicalViewOn) {
      ethicalEngine.apply(result.detections, container, result.risk_score, result.level);
    }
  };

  const handleToggleEthicalView = () => {
    const container =
      testContainerRef.current || document.getElementById('test-shop-container') || document.body;
    if (ethicalViewOn) {
      ethicalEngine.restore();
      setEthicalViewOn(false);
    } else {
      if (scanResult && scanResult.detections.length > 0) {
        ethicalEngine.apply(scanResult.detections, container, scanResult.risk_score, scanResult.level);
        setEthicalViewOn(true);
      }
    }
  };

  const handleLocateElement = (ref: string) => {
    const el = document.querySelector<HTMLElement>(`[data-dg-ref="${ref}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const origOutline = el.style.outline;
      el.style.outline = '3px solid var(--accent)';
      el.style.transition = 'outline 0.2s ease';
      setTimeout(() => {
        el.style.outline = origOutline;
      }, 1600);
    }
  };

  const handleToggleSellerQuestion = (detId: string) => {
    setCheckedSellerQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(detId)) next.delete(detId);
      else next.add(detId);
      return next;
    });
  };

  const handleExportJSON = () => {
    if (!scanResult) return;
    const jsonStr = JSON.stringify(scanResult, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `darkguard-scan-${scanResult.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = () => {
    if (!scanResult) return;
    const md = `# DarkGuard AI Scan Report
**Domain:** ${scanResult.domain}  
**Path:** ${scanResult.url_path}  
**Date:** ${new Date(scanResult.timestamp).toLocaleString()}  
**Risk Score:** ${scanResult.risk_score}/100 (${scanResult.level})  
**Model Version:** ${scanResult.model_version} (ML Verified)  

## Summary of Findings (${scanResult.detections.length})
${scanResult.detections
  .map(
    (d, i) => `### ${i + 1}. [${d.categoryId}] ${d.categoryName} (${d.severity === 3 ? 'Major' : d.severity === 2 ? 'Moderate' : 'Minor'} Severity)
- **Source:** ${d.source}
- **Confidence:** ${Math.round(d.confidence * 100)}%
- **Evidence:** "${d.evidenceSnippet}"
- **Observation:** ${d.aiExplanation || d.explanation}
- **Seller Question:** ${d.sellerQuestion || 'N/A'}
`
  )
  .join('\n')}

---
*Generated by DarkGuard AI Auditor. Screening only, not a legal certification.*
`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `darkguard-scan-${scanResult.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadExtension = async () => {
    setDownloadingZip(true);
    try {
      const blob = await generateExtensionZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'darkguard-ai-extension.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create extension zip:', err);
    } finally {
      setDownloadingZip(false);
    }
  };

  return (
    <div className="w-full glass-panel rounded-[24px] flex flex-col overflow-hidden">
      {/* Extension Simulator Header */}
      <div className="border-b border-[var(--line-card)] px-5 py-3.5 flex items-center justify-between gap-3 bg-gradient-to-r from-[var(--bg-bar-from)] to-[var(--bg-bar-to)]">
        <div className="min-w-0">
          <div className="font-display font-bold text-sm text-[var(--ink-900)] truncate">
            DarkGuard AI
          </div>
          <div className="text-[11px] text-[var(--ink-500)] truncate">
            TF-IDF Logistic ML · SHA-256 Verified
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setHistoryOpen(!historyOpen)}
            className="glass-control p-2 text-[var(--ink-700)] hover:text-[var(--ink-900)] rounded-full cursor-pointer"
            title="Scan History (last 20 scans)"
            aria-label="Toggle scan history"
          >
            <History className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleDownloadExtension}
            disabled={downloadingZip}
            className="glass-control px-3 py-1.5 text-[var(--ink-900)] text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            title="Download unpacked Chrome/Edge extension ZIP"
          >
            <Download className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="hidden sm:inline">
              {downloadingZip ? 'Packing...' : 'Export .zip'}
            </span>
          </button>
        </div>
      </div>

      {/* Target Domain Bar */}
      <div className="px-5 py-2.5 bg-[var(--bg-sunken)] border-b border-[var(--line-subtle)] flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 truncate">
          <Globe className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
          <span className="text-[var(--ink-700)] font-mono truncate">{currentDomain}</span>
        </div>
        <label className="flex items-center gap-1.5 text-[11px] text-[var(--ink-500)] hover:text-[var(--ink-900)] cursor-pointer shrink-0 select-none">
          <input
            type="checkbox"
            checked={aiExplainEnabled}
            onChange={(e) => setAiExplainEnabled(e.target.checked)}
            className="rounded border-[var(--line-strong)] accent-[#E6B85C] w-3.5 h-3.5"
          />
          <span>AI Rewrite</span>
        </label>
      </div>

      {/* History Drawer */}
      {historyOpen && (
        <div className="p-4 bg-[var(--bg-sunken)] border-b border-[var(--line-card)] text-xs ai-reveal-enter">
          <div className="flex items-center justify-between mb-3">
            <span className="font-display font-semibold text-sm text-[var(--ink-900)]">
              Local Scan History (Max 20)
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  scannerInstance.clearHistory();
                  setHistoryItems([]);
                }}
                className="text-[11px] text-[var(--rose-ink)] hover:underline cursor-pointer"
              >
                Clear history
              </button>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="text-[var(--ink-500)] hover:text-[var(--ink-900)] cursor-pointer p-1"
                aria-label="Close history"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {historyItems.length === 0 ? (
            <p className="text-[var(--ink-500)] py-2">No previous scans found in storage.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {historyItems.map((scan) => (
                <button
                  type="button"
                  key={scan.id}
                  onClick={() => {
                    setScanResult(scan);
                    setHistoryOpen(false);
                  }}
                  className="w-full text-left p-2.5 chrome-card rounded-[12px] cursor-pointer flex items-center justify-between"
                >
                  <div className="truncate pr-2">
                    <span className="font-semibold text-[var(--ink-900)] block truncate">
                      {scan.domain} {scan.url_path}
                    </span>
                    <span className="text-[11px] text-[var(--ink-500)] tabular">
                      {new Date(scan.timestamp).toLocaleTimeString()} · {scan.detections.length} issue(s)
                    </span>
                  </div>
                  <span
                    className={`text-xs font-mono font-semibold tabular shrink-0 ${
                      scan.risk_score >= 50
                        ? 'text-[var(--peach-ink)]'
                        : scan.risk_score >= 25
                        ? 'text-[var(--butter-ink)]'
                        : 'text-[var(--mint-ink)]'
                    }`}
                  >
                    {scan.risk_score} · {scan.level}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Extension Body */}
      <div className="p-5 sm:p-6 flex flex-col gap-6">
        {/* Ready State */}
        {!scanResult && !isScanning && (
          <div className="py-8 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-14 h-14 rounded-full bg-gradient-to-b from-[var(--bg-emblem-from)] to-[var(--bg-emblem-to)] border border-[var(--accent-border)] shadow-md flex items-center justify-center text-[var(--accent)] mb-4"
            >
              <Shield className="w-6 h-6" />
            </motion.div>
            <h3 className="font-display font-bold text-lg text-[var(--ink-900)] mb-1.5">
              Ready to Audit Current Page
            </h3>
            <p className="text-xs text-[var(--ink-500)] mb-6 leading-relaxed">
              Combines deterministic rule evidence with an on-device TF-IDF text classifier to flag fake urgency, misleading discounts, confirm shaming, and pre-selected extras.
            </p>
            <motion.button
              type="button"
              whileHover={{ y: -1.5, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.14 }}
              onClick={() => handleStartScan(false)}
              className="btn-primary-tactile w-full py-3 px-5 text-[#111318] font-semibold text-sm rounded-full flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Scan this page</span>
            </motion.button>
          </div>
        )}

        {/* Skeleton Loading State while scanning & generating AI responses */}
        {isScanning && (
          <AISkeletonLoader
            title="Auditing Page & Generating Insights"
            subtitle={scanStepMessage}
            secondsLeft={scanSecondsLeft}
            onFastForward={() => handleStartScan(true)}
          />
        )}

        {/* Results View */}
        {scanResult && !isScanning && (
          <div className="flex flex-col gap-5 ai-reveal-enter">
            {/* Top Score Ring Area */}
            <div className="chrome-card rounded-[20px] p-5 flex flex-col items-center justify-center">
              <ScoreRing
                score={scanResult.risk_score}
                level={scanResult.level}
                elementsChecked={scanResult.rawCandidatesCount}
              />
            </div>

            {/* Ethical View Reversible Switch */}
            <div className="chrome-card rounded-[18px] p-4 flex items-center justify-between gap-4">
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-display font-bold text-sm text-[var(--ink-900)]">
                    Ethical View
                  </span>
                  <span aria-hidden="true" className="text-[var(--ink-300)]">·</span>
                  <span className={ethicalViewOn ? 'text-[var(--mint-ink)] font-semibold' : 'text-[var(--ink-500)]'}>
                    {ethicalViewOn ? 'Active on page' : 'Original DOM'}
                  </span>
                </div>
                <span className="text-xs text-[var(--ink-500)] mt-0.5">
                  Annotate patterns with verified templates. Reversible.
                </span>
              </div>

              <motion.button
                type="button"
                whileHover={{ y: -1.5, scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.14 }}
                onClick={handleToggleEthicalView}
                className={`px-4 py-2 text-xs font-semibold rounded-full cursor-pointer whitespace-nowrap shrink-0 ${
                  ethicalViewOn
                    ? 'glass-control text-[var(--ink-900)]'
                    : 'btn-primary-tactile text-[#111318]'
                }`}
              >
                {ethicalViewOn ? 'Show original' : 'Apply Ethical View'}
              </motion.button>
            </div>

            {/* Re-Scan & Export Bar */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleStartScan(false)}
                className="glass-control px-3.5 py-1.5 text-[var(--ink-900)] text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Re-scan page</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="glass-control px-3 py-1.5 text-xs text-[var(--ink-700)] hover:text-[var(--ink-900)] rounded-full flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <FileJson className="w-3.5 h-3.5 text-[var(--ink-500)]" />
                  <span>JSON</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportMarkdown}
                  className="glass-control px-3 py-1.5 text-xs text-[var(--ink-700)] hover:text-[var(--ink-900)] rounded-full flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <FileText className="w-3.5 h-3.5 text-[var(--ink-500)]" />
                  <span>Markdown</span>
                </button>
              </div>
            </div>

            {/* Interactive Collapsible AI Audit Brief & Formatted Markdown Viewer */}
            <div className="chrome-card rounded-[18px] overflow-hidden">
              <button
                type="button"
                onClick={() => setBriefOpen((v) => !v)}
                className="w-full px-4 py-3 flex items-center justify-between gap-2 text-left hover:bg-[var(--hover-tint)] transition-colors cursor-pointer"
                aria-expanded={briefOpen}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Sparkles className="w-4 h-4 text-[var(--accent)] shrink-0" />
                  <span className="font-display font-semibold text-xs chrome-text-gradient truncate">
                    Formatted AI Audit Brief &amp; Inspector
                  </span>
                </div>
                {briefOpen ? (
                  <ChevronUp className="w-4 h-4 text-[var(--ink-500)] shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[var(--ink-500)] shrink-0" />
                )}
              </button>

              {briefOpen && (
                <div className="px-4 pb-4 pt-2 border-t border-[var(--line-subtle)] flex flex-col gap-3 ai-reveal-enter">
                  {/* View mode switcher */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBriefMode('formatted')}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                        briefMode === 'formatted'
                          ? 'bg-[#E6B85C] text-[#111318]'
                          : 'bg-[var(--bg-sunken)] text-[var(--ink-500)] hover:text-[var(--ink-900)]'
                      }`}
                    >
                      Formatted Brief
                    </button>
                    <button
                      type="button"
                      onClick={() => setBriefMode('json')}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                        briefMode === 'json'
                          ? 'bg-[#E6B85C] text-[#111318]'
                          : 'bg-[var(--bg-sunken)] text-[var(--ink-500)] hover:text-[var(--ink-900)]'
                      }`}
                    >
                      JSON Output
                    </button>
                  </div>

                  {/* Smooth-scrolling long response container */}
                  <div className="max-h-72 overflow-y-auto scroll-smooth pr-1">
                    {briefMode === 'formatted' ? (
                      <AITextRenderer
                        content={formattedAuditBrief}
                        showCopyButton
                        copyLabel="Copy brief"
                      />
                    ) : (
                      <AICodeBlock
                        code={JSON.stringify(
                          {
                            domain: scanResult.domain,
                            risk_score: scanResult.risk_score,
                            level: scanResult.level,
                            detections: scanResult.detections.map((d) => ({
                              id: d.categoryId,
                              name: d.categoryName,
                              confidence: d.confidence,
                              aiExplanation: d.aiExplanation || d.explanation,
                            })),
                          },
                          null,
                          2
                        )}
                        language="json"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Findings Section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="font-display font-bold text-sm text-[var(--ink-900)]">
                  Findings ({scanResult.detections.length})
                </h4>
                <span className="text-[11px] font-mono text-[var(--ink-500)] tabular">
                  {scanResult.scanDurationMs}ms
                </span>
              </div>

              {scanResult.detections.length === 0 ? (
                <div className="bg-[var(--mint-surface)] border border-[var(--mint-line)] rounded-[16px] p-5 text-center flex flex-col items-center">
                  <CheckCircle2 className="w-7 h-7 text-[var(--mint-ink)] mb-2" />
                  <p className="font-display font-semibold text-sm text-[var(--mint-ink)]">
                    No dark patterns detected
                  </p>
                  <p className="text-xs text-[var(--ink-700)] mt-1 leading-relaxed">
                    Pricing, countdown timers, decline options, and add-on checkboxes adhere to transparent design standards.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {scanResult.detections.map((det) => (
                    <FindingCard
                      key={det.id}
                      detection={det}
                      onLocate={handleLocateElement}
                      isSellerQuestionChecked={checkedSellerQuestions.has(det.id)}
                      onToggleSellerQuestion={() => handleToggleSellerQuestion(det.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Screening Disclaimer */}
            <div className="glass-recessed rounded-[14px] p-3 text-xs text-[var(--ink-700)] flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-[var(--ink-900)]">Disclaimer:</strong> DarkGuard AI is a screening tool, not a legal certification. Findings represent observable signals and do not constitute legal proof of deceptive intent.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
