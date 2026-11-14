import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Download } from 'lucide-react';
import { generateExtensionZip } from '../extension-package/build-extension';

export const InstallGuide: React.FC = () => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await generateExtensionZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'darkguard-ai-extension.zip';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

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

        <motion.button
          type="button"
          whileHover={{ y: -1.5, scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.14 }}
          onClick={handleDownload}
          disabled={downloading}
          className="btn-primary-tactile px-5 py-3 text-[#111318] font-semibold text-xs rounded-full flex items-center gap-2 self-start md:self-auto cursor-pointer whitespace-nowrap shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>{downloading ? 'Creating ZIP Package...' : 'Download Extension (.zip)'}</span>
        </motion.button>
      </div>

      {/* 4 Step Visual Flow */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="chrome-card p-4 rounded-[18px] flex flex-col">
          <div className="text-xs font-mono font-bold text-[var(--accent)] mb-2">Step 01</div>
          <h3 className="font-display font-bold text-sm text-[var(--ink-900)] mb-1">
            Download &amp; Unzip
          </h3>
          <p className="text-xs text-[var(--ink-500)] leading-relaxed">
            Download <code className="text-[var(--accent)]">darkguard-ai-extension.zip</code> and extract the contents to a folder on your computer.
          </p>
        </div>

        <div className="chrome-card p-4 rounded-[18px] flex flex-col">
          <div className="text-xs font-mono font-bold text-[var(--peach-ink)] mb-2">Step 02</div>
          <h3 className="font-display font-bold text-sm text-[var(--ink-900)] mb-1">
            Open Extensions Page
          </h3>
          <p className="text-xs text-[var(--ink-500)] leading-relaxed">
            In Chrome navigate to <code className="text-[var(--accent)]">chrome://extensions</code> (or <code className="text-[var(--accent)]">edge://extensions</code> in Microsoft Edge).
          </p>
        </div>

        <div className="chrome-card p-4 rounded-[18px] flex flex-col">
          <div className="text-xs font-mono font-bold text-[var(--mint-ink)] mb-2">Step 03</div>
          <h3 className="font-display font-bold text-sm text-[var(--ink-900)] mb-1">
            Developer Mode
          </h3>
          <p className="text-xs text-[var(--ink-500)] leading-relaxed">
            Toggle the <strong className="text-[var(--ink-900)]">Developer mode</strong> switch in the upper-right corner of the extensions manager.
          </p>
        </div>

        <div className="chrome-card p-4 rounded-[18px] flex flex-col">
          <div className="text-xs font-mono font-bold text-[var(--rose-ink)] mb-2">Step 04</div>
          <h3 className="font-display font-bold text-sm text-[var(--ink-900)] mb-1">
            Load Unpacked
          </h3>
          <p className="text-xs text-[var(--ink-500)] leading-relaxed">
            Click <strong className="text-[var(--ink-900)]">Load unpacked</strong> in the top-left toolbar and select your extracted directory.
          </p>
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
