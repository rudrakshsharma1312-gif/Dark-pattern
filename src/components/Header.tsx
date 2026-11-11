import React from 'react';
import { Shield, Download } from 'lucide-react';
import { generateExtensionZip } from '../extension-package/build-extension';

interface HeaderProps {
  currentTab: 'auditor' | 'evaluation' | 'architecture' | 'guide';
  onSelectTab: (tab: 'auditor' | 'evaluation' | 'architecture' | 'guide') => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onSelectTab }) => {
  const [downloading, setDownloading] = React.useState(false);

  const handleDownloadZip = async () => {
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
    <header className="w-full bg-[#FFFFFF] border-b border-[#E1E8F0] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element in display face, no subtext) */}
        <button
          onClick={() => onSelectTab('auditor')}
          className="flex items-center gap-2.5 text-left cursor-pointer shrink-0"
        >
          <div className="w-8 h-8 rounded-xl bg-[#DCEBFA] border border-[#9CC5EE] flex items-center justify-center text-[#1D4E89]">
            <Shield className="w-4 h-4 fill-current" />
          </div>
          <span className="font-display font-bold text-lg text-[#1F2A37] tracking-tight whitespace-nowrap">
            DarkGuard AI
          </span>
        </button>

        {/* Zone 2: 4-5 Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#5F6E80]">
          <button
            onClick={() => onSelectTab('auditor')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer hover:text-[#1F2A37] ${
              currentTab === 'auditor' ? 'text-[#1D4E89] font-semibold' : ''
            }`}
          >
            Live Auditor
          </button>
          <button
            onClick={() => onSelectTab('evaluation')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer hover:text-[#1F2A37] ${
              currentTab === 'evaluation' ? 'text-[#1D4E89] font-semibold' : ''
            }`}
          >
            Evaluation & Benchmark
          </button>
          <button
            onClick={() => onSelectTab('architecture')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer hover:text-[#1F2A37] ${
              currentTab === 'architecture' ? 'text-[#1D4E89] font-semibold' : ''
            }`}
          >
            System Architecture
          </button>
          <button
            onClick={() => onSelectTab('guide')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer hover:text-[#1F2A37] ${
              currentTab === 'guide' ? 'text-[#1D4E89] font-semibold' : ''
            }`}
          >
            Extension Guide
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={downloading}
            className="px-4 py-2 text-xs font-semibold text-[#1D4E89] bg-[#DCEBFA] border border-[#9CC5EE] rounded-xl hover:bg-[#c6dff8] transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading ? 'Packing .zip...' : 'Download Extension (.zip)'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
