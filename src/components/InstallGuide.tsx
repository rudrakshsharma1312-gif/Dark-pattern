import React, { useState } from 'react';
import { Download, CheckCircle2, Chrome, Terminal, Shield, FolderArchive } from 'lucide-react';
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
    <div className="w-full bg-white border border-[#E1E8F0] rounded-[24px] p-6 sm:p-8 flex flex-col gap-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E1E8F0] pb-6">
        <div>
          <div className="text-xs uppercase font-semibold text-[#5F6E80] tracking-wider mb-1">
            Manifest V3 Extension Setup
          </div>
          <h2 className="font-display font-bold text-2xl text-[#1F2A37]">
            Install DarkGuard AI in Chrome & Edge
          </h2>
          <p className="text-xs text-[#5F6E80] mt-1">
            Run the auditor directly inside your browser as an unpacked developer extension.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="px-5 py-3 bg-[#DCEBFA] border border-[#9CC5EE] hover:bg-[#c6dff8] text-[#1D4E89] font-bold text-xs rounded-xl flex items-center gap-2 self-start md:self-auto transition-colors cursor-pointer shadow-2xs"
        >
          <Download className="w-4 h-4" />
          <span>{downloading ? 'Creating ZIP Package...' : 'Download Extension (.zip)'}</span>
        </button>
      </div>

      {/* 4 Step Visual Flow */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#F6F9FC] border border-[#E1E8F0] flex flex-col">
          <div className="text-xs font-mono font-bold text-[#1D4E89] mb-2">Step 01</div>
          <h3 className="font-display font-bold text-sm text-[#1F2A37] mb-1">
            Download & Unzip
          </h3>
          <p className="text-xs text-[#5F6E80] leading-relaxed">
            Download <code>darkguard-ai-extension.zip</code> and extract the contents to a folder on your computer.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#F6F9FC] border border-[#E1E8F0] flex flex-col">
          <div className="text-xs font-mono font-bold text-[#1D4E89] mb-2">Step 02</div>
          <h3 className="font-display font-bold text-sm text-[#1F2A37] mb-1">
            Open Extensions Page
          </h3>
          <p className="text-xs text-[#5F6E80] leading-relaxed">
            In Chrome navigate to <code>chrome://extensions</code> (or <code>edge://extensions</code> in Microsoft Edge).
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#F6F9FC] border border-[#E1E8F0] flex flex-col">
          <div className="text-xs font-mono font-bold text-[#1D4E89] mb-2">Step 03</div>
          <h3 className="font-display font-bold text-sm text-[#1F2A37] mb-1">
            Developer Mode
          </h3>
          <p className="text-xs text-[#5F6E80] leading-relaxed">
            Toggle the <strong>Developer mode</strong> switch in the upper-right corner of the extensions manager.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#F6F9FC] border border-[#E1E8F0] flex flex-col">
          <div className="text-xs font-mono font-bold text-[#1D4E89] mb-2">Step 04</div>
          <h3 className="font-display font-bold text-sm text-[#1F2A37] mb-1">
            Load Unpacked
          </h3>
          <p className="text-xs text-[#5F6E80] leading-relaxed">
            Click <strong>Load unpacked</strong> in the top-left toolbar and select your extracted directory.
          </p>
        </div>
      </div>

      {/* Permissions Breakdown & Security Boundaries */}
      <div className="border border-[#E1E8F0] rounded-2xl p-6 bg-[#F6F9FC]">
        <h3 className="font-display font-bold text-base text-[#1F2A37] mb-2">
          Extension Permissions & Privacy Architecture (TRD Section 2)
        </h3>
        <p className="text-xs text-[#5F6E80] mb-4">
          DarkGuard AI follows the principle of least privilege. It never reads personal data, form values, or checkout inputs.
        </p>
        <div className="space-y-2 text-xs text-[#3D4B5C]">
          <div className="flex items-start gap-2 bg-white p-3 rounded-xl border border-[#E1E8F0]">
            <span className="font-mono text-[#1D4E89] font-bold shrink-0">activeTab:</span>
            <span>Grants temporary access to the current tab only when the user explicitly clicks the extension.</span>
          </div>
          <div className="flex items-start gap-2 bg-white p-3 rounded-xl border border-[#E1E8F0]">
            <span className="font-mono text-[#1D4E89] font-bold shrink-0">scripting:</span>
            <span>Allows injection of the candidate extractor and Ethical View overlay.</span>
          </div>
          <div className="flex items-start gap-2 bg-white p-3 rounded-xl border border-[#E1E8F0]">
            <span className="font-mono text-[#1D4E89] font-bold shrink-0">storage:</span>
            <span>Persists scan history locally in <code>chrome.storage.local</code> (maximum 20 scans, no cloud sync).</span>
          </div>
        </div>
      </div>
    </div>
  );
};
