import React, { useState, useEffect } from 'react';
import { ScanResult, Detection } from '../types';
import { ScoreRing } from './ScoreRing';
import { FindingCard } from './FindingCard';
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
  AlertTriangle,
  Play,
  Cpu,
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

  // Initialize ethical view engine with toggle callback
  const [ethicalEngine] = useState(() => new EthicalViewEngine((state) => {
    setEthicalViewOn(state === 'ON');
  }));

  // Load history on mount
  useEffect(() => {
    setHistoryItems(scannerInstance.getHistory());
  }, []);

  const handleStartScan = async (fastForwardTimer = false) => {
    setIsScanning(true);
    setScanStepMessage('Extracting visible candidate elements...');
    setScanSecondsLeft(fastForwardTimer ? 0 : 3); // realistic 3s observation for interactive preview

    // Countdown simulation for observation window
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

    setScanStepMessage('Running text classifier ML inference...');
    await new Promise((r) => setTimeout(r, 100));

    // Execute scan
    const container = testContainerRef.current || document.getElementById('test-shop-container') || document.body;
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

    // If Ethical View was already ON, re-apply with new detections
    if (ethicalViewOn) {
      ethicalEngine.apply(result.detections, container, result.risk_score, result.level);
    }
  };

  const handleToggleEthicalView = () => {
    const container = testContainerRef.current || document.getElementById('test-shop-container') || document.body;
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
      el.style.outline = '4px solid #5B9BE0';
      el.style.transition = 'outline 0.3s ease';
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
    <div className="w-full bg-[#FFFFFF] border border-[#E1E8F0] rounded-[24px] shadow-sm flex flex-col overflow-hidden">
      {/* Extension Simulator Chrome Header */}
      <div className="bg-[#F6F9FC] border-b border-[#E1E8F0] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#DCEBFA] border border-[#9CC5EE] flex items-center justify-center text-[#1D4E89]">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-sm text-[#1F2A37]">
                DarkGuard AI
              </span>
              <span className="text-[10px] font-mono font-semibold bg-[#EDF2F8] text-[#5F6E80] px-1.5 py-0.2 rounded">
                v0.3.0
              </span>
            </div>
            <div className="text-[11px] text-[#5F6E80] flex items-center gap-1">
              <Cpu className="w-3 h-3 text-[#14513A]" />
              <span>TF-IDF Logistic ML · SHA-256 Valid</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setHistoryOpen(!historyOpen)}
            className="p-1.5 text-[#5F6E80] hover:text-[#1F2A37] hover:bg-[#EDF2F8] rounded-lg transition-colors cursor-pointer"
            title="Scan History (last 20 scans)"
          >
            <History className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleDownloadExtension}
            disabled={downloadingZip}
            className="px-2.5 py-1.5 bg-white border border-[#C9D4E0] hover:bg-[#F6F9FC] text-[#1F2A37] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            title="Download unpacked Chrome/Edge extension ZIP"
          >
            <Download className="w-3.5 h-3.5 text-[#1D4E89]" />
            <span className="hidden sm:inline">
              {downloadingZip ? 'Packaging...' : 'Download Extension (.zip)'}
            </span>
          </button>
        </div>
      </div>

      {/* Target Domain Bar */}
      <div className="px-4 py-2 bg-white border-b border-[#E1E8F0] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 truncate">
          <span className="w-2 h-2 rounded-full bg-[#14513A]" />
          <span className="text-[#3D4B5C] font-mono truncate">{currentDomain}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <label className="flex items-center gap-1 text-[11px] text-[#5F6E80] cursor-pointer">
            <input
              type="checkbox"
              checked={aiExplainEnabled}
              onChange={(e) => setAiExplainEnabled(e.target.checked)}
              className="rounded border-[#C9D4E0] text-[#1D4E89] w-3 h-3"
            />
            <span>AI Rewrite</span>
          </label>
        </div>
      </div>

      {/* History Drawer Modal */}
      {historyOpen && (
        <div className="p-4 bg-[#F6F9FC] border-b border-[#E1E8F0] text-xs animate-in slide-in-from-top duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="font-display font-bold text-sm text-[#1F2A37]">
              Local Scan History (Max 20 scans)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  scannerInstance.clearHistory();
                  setHistoryItems([]);
                }}
                className="text-[11px] text-[#8A2845] hover:underline cursor-pointer"
              >
                Clear history
              </button>
              <button
                onClick={() => setHistoryOpen(false)}
                className="text-[#5F6E80] hover:text-[#1F2A37] font-bold ml-2"
              >
                ✕
              </button>
            </div>
          </div>

          {historyItems.length === 0 ? (
            <p className="text-[#5F6E80] italic py-2">No previous scans found in storage.</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {historyItems.map((scan) => (
                <div
                  key={scan.id}
                  onClick={() => {
                    setScanResult(scan);
                    setHistoryOpen(false);
                  }}
                  className="p-2.5 bg-white border border-[#E1E8F0] rounded-xl hover:border-[#9CC5EE] cursor-pointer flex items-center justify-between transition-colors shadow-2xs"
                >
                  <div className="truncate pr-2">
                    <span className="font-semibold text-[#1F2A37] block truncate">
                      {scan.domain} {scan.url_path}
                    </span>
                    <span className="text-[10px] text-[#5F6E80]">
                      {new Date(scan.timestamp).toLocaleTimeString()} · {scan.detections.length} issue(s)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        scan.risk_score >= 50
                          ? 'bg-[#FCE0D6] text-[#8A3A1F]'
                          : scan.risk_score >= 25
                          ? 'bg-[#FBF0C9] text-[#6B4E00]'
                          : 'bg-[#D9F2E6] text-[#14513A]'
                      }`}
                    >
                      {scan.risk_score} ({scan.level})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Extension Body */}
      <div className="p-4 sm:p-6 flex flex-col gap-6">
        {/* If no scan run yet */}
        {!scanResult && !isScanning && (
          <div className="py-8 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-[#DCEBFA] border border-[#9CC5EE] flex items-center justify-center text-[#1D4E89] mb-4">
              <Shield className="w-7 h-7" />
            </div>
            <h3 className="font-display font-bold text-lg text-[#1F2A37] mb-1">
              Ready to Audit Current Page
            </h3>
            <p className="text-xs text-[#5F6E80] mb-5 leading-relaxed">
              DarkGuard AI combines rule evidence with a TF-IDF text classifier to detect fake urgency, misleading discounts, confirm shaming, and pre-selected extras.
            </p>
            <button
              type="button"
              onClick={() => handleStartScan(false)}
              className="w-full py-3 bg-[#DCEBFA] border border-[#9CC5EE] hover:bg-[#c6dff8] text-[#1D4E89] font-bold text-sm rounded-[14px] transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Scan this page</span>
            </button>
          </div>
        )}

        {/* Scan In-Progress State */}
        {isScanning && (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 border-3 border-[#EDF2F8] border-t-[#1D4E89] rounded-full animate-spin mb-4" />
            <h3 className="font-display font-semibold text-base text-[#1F2A37] mb-1">
              Auditing Page Elements
            </h3>
            <p className="text-xs text-[#5F6E80] mb-3">{scanStepMessage}</p>
            {scanSecondsLeft > 0 && (
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#1D4E89] bg-[#DCEBFA] px-2.5 py-1 rounded-full">
                  Observing countdown stability: {scanSecondsLeft}s
                </span>
                <button
                  type="button"
                  onClick={() => handleStartScan(true)}
                  className="text-xs text-[#1D4E89] hover:underline cursor-pointer font-medium mt-1"
                >
                  Skip observation wait (fast-forward)
                </button>
              </div>
            )}
          </div>
        )}

        {/* Scan Results View */}
        {scanResult && !isScanning && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            {/* Top Score Ring Area */}
            <div className="bg-[#F6F9FC] border border-[#E1E8F0] rounded-[20px] p-5 flex flex-col items-center justify-center">
              <ScoreRing
                score={scanResult.risk_score}
                level={scanResult.level}
                elementsChecked={scanResult.rawCandidatesCount}
              />
            </div>

            {/* Ethical View Reversible Switch */}
            <div className="bg-white border border-[#E1E8F0] rounded-[16px] p-4 flex items-center justify-between shadow-2xs">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-sm text-[#1F2A37]">
                    Ethical View
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      ethicalViewOn
                        ? 'bg-[#D9F2E6] text-[#14513A]'
                        : 'bg-[#EDF2F8] text-[#5F6E80]'
                    }`}
                  >
                    {ethicalViewOn ? 'ACTIVE ON PAGE' : 'ORIGINAL DOM'}
                  </span>
                </div>
                <span className="text-xs text-[#5F6E80] mt-0.5">
                  Annotate deceptive patterns with approved templates. 100% reversible.
                </span>
              </div>

              <button
                type="button"
                onClick={handleToggleEthicalView}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  ethicalViewOn
                    ? 'bg-[#1D4E89] text-white shadow-sm'
                    : 'bg-[#DCEBFA] border border-[#9CC5EE] text-[#1D4E89] hover:bg-[#c6dff8]'
                }`}
              >
                {ethicalViewOn ? 'Show original' : 'Apply Ethical View'}
              </button>
            </div>

            {/* Re-Scan Bar */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleStartScan(false)}
                className="px-3 py-1.5 bg-[#EDF2F8] hover:bg-[#E1E8F0] text-[#1F2A37] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-scan page</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="px-2.5 py-1.5 text-xs text-[#1D4E89] hover:bg-[#DCEBFA]/50 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <FileJson className="w-3.5 h-3.5" />
                  <span>JSON</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportMarkdown}
                  className="px-2.5 py-1.5 text-xs text-[#1D4E89] hover:bg-[#DCEBFA]/50 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Markdown</span>
                </button>
              </div>
            </div>

            {/* Findings Section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="font-display font-bold text-sm text-[#1F2A37]">
                  Findings ({scanResult.detections.length})
                </h4>
                <span className="text-[11px] text-[#5F6E80]">
                  Scan took {scanResult.scanDurationMs}ms
                </span>
              </div>

              {scanResult.detections.length === 0 ? (
                <div className="bg-[#D9F2E6]/40 border border-[#8FD1B0] rounded-[16px] p-5 text-center flex flex-col items-center">
                  <CheckCircle2 className="w-8 h-8 text-[#14513A] mb-2" />
                  <p className="font-display font-semibold text-sm text-[#14513A]">
                    No dark patterns detected
                  </p>
                  <p className="text-xs text-[#3D4B5C] mt-1">
                    The pricing, countdown timers, decline options, and checkboxes on this page adhere to transparent design standards.
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

            {/* Mandatory Disclaimer Banner per Section 6.9 */}
            <div className="bg-[#E8E3F8] border border-[#B9ABE8] rounded-[16px] p-3 text-xs text-[#1F2A37] flex items-start gap-2">
              <Shield className="w-4 h-4 text-[#4B3A8C] shrink-0 mt-0.5" />
              <p className="text-[#3D4B5C] leading-relaxed">
                <strong>Disclaimer:</strong> DarkGuard AI is a screening tool, not a legal certification. Findings represent observable signals and do not constitute legal proof of deceptive intent.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
