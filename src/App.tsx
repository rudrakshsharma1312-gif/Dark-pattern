import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { Header, ThemeMode } from './components/Header';
import { TestShop, PRODUCTS } from './components/TestShop';
import { ExtensionSimulator } from './components/ExtensionSimulator';
import { EvalDashboard } from './components/EvalDashboard';
import { ArchitectureView } from './components/ArchitectureView';
import { InstallGuide } from './components/InstallGuide';
import { ArrowRight } from 'lucide-react';

function getInitialTheme(): ThemeMode {
  if (typeof document !== 'undefined') {
    const attr = document.documentElement.dataset.theme;
    if (attr === 'light' || attr === 'dark') return attr;
  }
  if (typeof window !== 'undefined') {
    try {
      const saved = window.localStorage.getItem('darkguard-theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore storage failure
    }
  }
  return 'dark';
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<'auditor' | 'evaluation' | 'architecture' | 'guide'>('auditor');
  const [selectedProductId, setSelectedProductId] = useState<string>(PRODUCTS[0].id);
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const testShopContainerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem('darkguard-theme', theme);
    } catch {
      // ignore storage failure
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const selectedProduct = PRODUCTS.find((p) => p.id === selectedProductId) || PRODUCTS[0];

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--ink-700)] flex flex-col font-sans relative overflow-x-clip selection:bg-[var(--accent-soft)] selection:text-[var(--ink-900)]">
        {/* Theme-aware Metallic Backdrop */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 overflow-hidden app-backdrop"
        >
          <div className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] animate-chrome-drift opacity-55 app-dot-grid" />
        </div>

        {/* 3-Zone Top Navigation Bar */}
        <Header
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />

        {/* Main Viewport Container with Smooth Tab Transition */}
        <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-10 flex flex-col gap-8">
          <AnimatePresence mode="wait">
            {currentTab === 'auditor' && (
              <motion.div
                key="auditor"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-8"
              >
                {/* Contextual Hero Surface — Metallic & Multi-Accent Bar Motif */}
                <section className="glass-panel rounded-[24px] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden">
                  <div className="max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--ink-500)] mb-2.5">
                      <span>Chrome &amp; Edge Auditor</span>
                      <span aria-hidden="true">·</span>
                      <span>Hybrid Rule + TF-IDF ML</span>
                      <span aria-hidden="true">·</span>
                      <span>On-Device Privacy</span>
                    </div>
                    <h1 className="font-display font-extrabold text-3xl sm:text-4xl chrome-text-gradient tracking-[-0.035em] leading-[1.04] text-balance">
                      Intelligent Auditor for Deceptive E-Commerce Design
                    </h1>
                    <div className="w-10 h-[2.5px] bg-[var(--accent)] rounded-full mt-3.5" aria-hidden="true" />
                    <p className="text-xs sm:text-sm text-[var(--ink-500)] mt-3 leading-relaxed max-w-xl">
                      DarkGuard AI audits product pages for fake urgency, misleading discounts, confirm shaming, and pre-selected extras. Experience the live auditor on planted and clean shopping pages below.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
                    {/* 4-color metallic accent bars: Champagne Gold, Emerald, Terracotta Copper, Rose */}
                    <div className="hidden md:flex items-end gap-1.5 h-10 pr-2" aria-hidden="true">
                      <span className="w-1.5 h-10 rounded-full bg-[var(--accent)]" />
                      <span className="w-1.5 h-7 rounded-full bg-[var(--mint-ink)]" />
                      <span className="w-1.5 h-8 rounded-full bg-[var(--peach-ink)]" />
                      <span className="w-1.5 h-5 rounded-full bg-[var(--rose-ink)]" />
                    </div>
                    <motion.button
                      type="button"
                      whileHover={{ y: -1.5, scale: 1.015 }}
                      whileTap={{ scale: 0.96 }}
                      transition={{ duration: 0.14 }}
                      onClick={() => setCurrentTab('evaluation')}
                      className="btn-primary-tactile px-5 py-2.5 text-[#111318] text-xs font-semibold rounded-full flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0 group"
                    >
                      <span>View 30-Page Benchmark</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#111318] transition-transform duration-150 group-hover:translate-x-0.5" />
                    </motion.button>
                  </div>
                </section>

                {/* Split Screen Layout: Left = Mock E-Commerce Shop, Right = Extension Runner Simulator */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left Column: Mock Shop (7 cols on desktop) */}
                  <div className="lg:col-span-7 flex flex-col gap-3">
                    <div className="flex items-center justify-between px-1">
                      <span className="font-display font-semibold text-sm text-[var(--ink-900)]">
                        Test Storefront
                      </span>
                      <span className="text-xs text-[var(--ink-500)] tabular">
                        {selectedProduct.name.split(' ')[0]} · {selectedProduct.isPlanted ? 'Planted' : 'Clean'}
                      </span>
                    </div>

                    <div ref={testShopContainerRef as React.RefObject<HTMLDivElement>}>
                      <TestShop
                        selectedProductId={selectedProductId}
                        onSelectProduct={setSelectedProductId}
                      />
                    </div>
                  </div>

                  {/* Right Column: Extension Simulator (5 cols on desktop) */}
                  <div className="lg:col-span-5 lg:sticky lg:top-20 flex flex-col gap-3">
                    <div className="flex items-center justify-between px-1">
                      <span className="font-display font-semibold text-sm text-[var(--ink-900)]">
                        Extension Popup Simulator
                      </span>
                      <span className="text-xs text-[var(--ink-500)]">
                        Manifest V3 Engine
                      </span>
                    </div>

                    <ExtensionSimulator
                      testContainerRef={testShopContainerRef}
                      currentDomain="demo.darkguard.shop"
                      currentPath={`/products/${selectedProduct.id}`}
                      onOpenGuide={() => setCurrentTab('guide')}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {currentTab === 'evaluation' && (
              <motion.div
                key="evaluation"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <EvalDashboard />
              </motion.div>
            )}

            {currentTab === 'architecture' && (
              <motion.div
                key="architecture"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <ArchitectureView />
              </motion.div>
            )}

            {currentTab === 'guide' && (
              <motion.div
                key="guide"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <InstallGuide />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Quiet Footer */}
        <footer className="relative z-10 mt-auto border-t border-[var(--line-card)] bg-[var(--bg-footer)] backdrop-blur-md py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--ink-500)]">
            <div className="flex items-center gap-2">
              <span className="font-brand text-xs text-[var(--ink-900)]">DarkGuard AI</span>
              <span aria-hidden="true">·</span>
              <span>Screening tool for deceptive e-commerce design</span>
            </div>

            <div className="flex items-center gap-6">
              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setCurrentTab('architecture')}
                className="hover:text-[var(--accent)] transition-colors cursor-pointer whitespace-nowrap"
              >
                PRD &amp; TRD Specs
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setCurrentTab('evaluation')}
                className="hover:text-[var(--accent)] transition-colors cursor-pointer whitespace-nowrap"
              >
                Model Card v1
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setCurrentTab('guide')}
                className="hover:text-[var(--accent)] transition-colors cursor-pointer whitespace-nowrap"
              >
                Install Extension
              </motion.button>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
