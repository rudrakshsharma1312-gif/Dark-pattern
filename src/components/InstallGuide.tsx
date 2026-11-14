import React from 'react';
import { motion } from 'motion/react';
import { Download, ShieldCheck, Terminal } from 'lucide-react';

export const InstallGuide: React.FC = () => {
  return (
    <div className="w-full glass-panel rounded-[24px] p-6 sm:p-8 flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--line-card)] pb-6">
        <div>
          <div className="text-xs font-medium text-[var(--ink-500)] mb-1">
            Manifest V3 Extension Setup
          </div>
          <h2 className="font-display font-bold text-2xl text-[var(--ink-900)]">
            Install DarkGuard AI in Chrome &amp; Edge
          </h2>
          <div className="w-8 h-[2.5px] bg-[var(--accent)] rounded-full mt-2" aria-hidden="true" />
          <p className="text-xs text-[var(--ink-500)] mt-2">
            Run the auditor directly inside your browser as an unpacked developer extension.
          </p>
        </div>

        <motion.a
          href="downloads/darkguard-extension.zip"
          download="darkguard-extension.zip"
          whileHover={{ y: -1.5, scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.14 }}
          className="btn-primary-tactile px-5 py-3 text-[#111318] font-semibold text-xs rounded-full flex items-center gap-2 self-start md:self-auto cursor-pointer whitespace-nowrap shrink-0 no-underline"
          title="Download ready-to-load extension ZIP"
        >
          <Download className="w-4 h-4" />
          <span>Download Extension (.zip)</span>
        </motion.a>
      </div>

      {/* Two Supported Install Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="chrome-card p-5 rounded-[18px] flex flex-col border border-[var(--accent-border)] bg-[var(--accent-soft)]/20">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[var(--accent)] mb-2">
            <Download className="w-4 h-4" />
            <span>Method A: Website Download (.zip)</span>
          </div>
          <h3 className="font-display font-bold text-sm text-[var(--ink-900)] mb-1">
            Download, Unzip &amp; Load Unpacked
          </h3>
          <ol className="text-xs text-[var(--ink-700)] list-decimal list-inside space-y-1.5 mt-2 leading-relaxed">
            <li>Download <code className="text-[var(--accent)]">darkguard-extension.zip</code> and extract it to a folder.</li>
            <li>In Chrome or Brave, navigate to <code className="text-[var(--accent)]">chrome://extensions</code> (or <code className="text-[var(--accent)]">edge://extensions</code> in Edge).</li>
            <li>Toggle ON <strong>Developer mode</strong> in the top-right corner.</li>
            <li>Click <strong>Load unpacked</strong> and select the unzipped directory.</li>
          </ol>
        </div>

        <div className="chrome-card p-5 rounded-[18px] flex flex-col border border-[var(--line-card)] bg-[var(--bg-sunken)]">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[var(--mint-ink)] mb-2">
            <Terminal className="w-4 h-4" />
            <span>Method B: From Clone (30 Seconds — Zero Build)</span>
          </div>
          <h3 className="font-display font-bold text-sm text-[var(--ink-900)] mb-1">
            Select extension-dist/ Directly
          </h3>
          <ol className="text-xs text-[var(--ink-700)] list-decimal list-inside space-y-1.5 mt-2 leading-relaxed">
            <li>Clone the repository: <code className="text-[var(--accent)]">git clone &lt;repo-url&gt;</code></li>
            <li>Open <code className="text-[var(--accent)]">chrome://extensions</code> and enable <strong>Developer mode</strong>.</li>
            <li>Click <strong>Load unpacked</strong> and select the <code className="text-[var(--accent)] font-bold">extension-dist</code> folder inside the clone.</li>
            <li><strong className="text-rose-600">CRITICAL:</strong> Do NOT select the repo root (root has no manifest).</li>
          </ol>
        </div>
      </div>

      {/* Permissions Breakdown & Security Boundaries */}
      <div className="glass-recessed rounded-[18px] p-6">
        <h3 className="font-display font-bold text-base text-[var(--ink-900)] mb-2">
          Extension Permissions &amp; Privacy Architecture (TRD Section 2)
        </h3>
        <p className="text-xs text-[var(--ink-500)] mb-4">
          DarkGuard AI follows the principle of least privilege. It never reads personal data, form values, or checkout inputs.
        </p>
        <div className="space-y-2.5 text-xs text-[var(--ink-700)]">
          <div className="flex items-start gap-2.5 bg-[var(--bg-tile)] p-3 rounded-[12px] border border-[var(--line-subtle)]">
            <span className="font-mono text-[var(--accent)] font-bold shrink-0">activeTab:</span>
            <span>Grants temporary access to the current tab only when the user explicitly clicks the extension.</span>
          </div>
          <div className="flex items-start gap-2.5 bg-[var(--bg-tile)] p-3 rounded-[12px] border border-[var(--line-subtle)]">
            <span className="font-mono text-[var(--mint-ink)] font-bold shrink-0">scripting:</span>
            <span>Allows injection of the candidate extractor and Ethical View overlay.</span>
          </div>
          <div className="flex items-start gap-2.5 bg-[var(--bg-tile)] p-3 rounded-[12px] border border-[var(--line-subtle)]">
            <span className="font-mono text-[var(--peach-ink)] font-bold shrink-0">storage:</span>
            <span>Persists scan history locally in <code className="text-[var(--ink-900)]">chrome.storage.local</code> (maximum 20 scans, no cloud sync).</span>
          </div>
        </div>
      </div>
    </div>
  );
};
