import React from 'react';
import { motion } from 'motion/react';
import { Download, Sun, Moon } from 'lucide-react';

export type ThemeMode = 'dark' | 'light';

interface HeaderProps {
  currentTab: 'auditor' | 'evaluation' | 'architecture' | 'guide';
  onSelectTab: (tab: 'auditor' | 'evaluation' | 'architecture' | 'guide') => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

const NAV_ITEMS: Array<{ id: HeaderProps['currentTab']; label: string }> = [
  { id: 'auditor', label: 'Live Auditor' },
  { id: 'evaluation', label: 'Evaluation & Benchmark' },
  { id: 'architecture', label: 'System Architecture' },
  { id: 'guide', label: 'Extension Guide' },
];

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="w-full bg-[var(--bg-header)] backdrop-blur-xl border-b border-[var(--line-card)] shadow-[0_6px_24px_rgba(0,0,0,0.16)] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Single text element wordmark */}
        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onSelectTab('auditor')}
          className="font-brand text-base sm:text-lg text-[var(--ink-900)] whitespace-nowrap shrink-0 cursor-pointer hover:opacity-85 transition-opacity"
        >
          DarkGuard AI
        </motion.button>

        {/* Zone 2: 4 Clean single-line navigation links with sliding accent underline */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium h-full">
          {NAV_ITEMS.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <motion.button
                key={item.id}
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.14 }}
                onClick={() => onSelectTab(item.id)}
                className={`relative h-full flex items-center whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[var(--accent)] font-semibold'
                    : 'text-[var(--ink-500)] hover:text-[var(--ink-900)]'
                }`}
              >
                <span>{item.label}</span>
                {isActive && (
                  <motion.span
                    layoutId="header-active-tab"
                    transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                    aria-hidden="true"
                    className="absolute bottom-2.5 left-0 right-0 h-[2.5px] rounded-full bg-[var(--accent)]"
                  />
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Zone 3: Theme Toggle + 1 Primary Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          <motion.button
            type="button"
            whileHover={{ y: -1.5, scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.14 }}
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-pressed={theme === 'light'}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="glass-control px-3 py-2 text-xs font-semibold text-[var(--ink-900)] rounded-full whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="hidden sm:inline">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="hidden sm:inline">Dark Mode</span>
              </>
            )}
          </motion.button>

          <motion.a
            href="downloads/darkguard-extension.zip"
            download="darkguard-extension.zip"
            whileHover={{ y: -1.5, scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.14 }}
            className="btn-primary-tactile px-4 py-2 text-xs font-semibold text-[#111318] rounded-full whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer no-underline"
            title="Download ready-to-load extension ZIP"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              Download Extension (.zip)
            </span>
            <span className="sm:hidden">
              .zip
            </span>
          </motion.a>
        </div>
      </div>

      {/* Compact mobile navigation row */}
      <nav className="md:hidden border-t border-[var(--line-subtle)] px-4 py-2 flex items-center gap-5 overflow-x-auto text-xs font-medium">
        {NAV_ITEMS.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <motion.button
              key={item.id}
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelectTab(item.id)}
              className={`relative py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                isActive ? 'text-[var(--accent)] font-semibold' : 'text-[var(--ink-500)]'
              }`}
            >
              <span>{item.label}</span>
              {isActive && (
                <motion.span
                  layoutId="header-active-tab-mobile"
                  transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-[var(--accent)]"
                />
              )}
            </motion.button>
          );
        })}
      </nav>
    </header>
  );
};
