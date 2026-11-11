import React, { useState, useRef } from 'react';
import { Header } from './components/Header';
import { TestShop, PRODUCTS } from './components/TestShop';
import { ExtensionSimulator } from './components/ExtensionSimulator';
import { EvalDashboard } from './components/EvalDashboard';
import { ArchitectureView } from './components/ArchitectureView';
import { InstallGuide } from './components/InstallGuide';
import { Shield, Sparkles, CheckCircle, ExternalLink, ArrowRight } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'auditor' | 'evaluation' | 'architecture' | 'guide'>('auditor');
  const [selectedProductId, setSelectedProductId] = useState<string>(PRODUCTS[0].id);
  const testShopContainerRef = useRef<HTMLElement | null>(null);

  const selectedProduct = PRODUCTS.find((p) => p.id === selectedProductId) || PRODUCTS[0];

  return (
    <div className="min-h-screen bg-[#F6F9FC] text-[#3D4B5C] flex flex-col font-sans selection:bg-[#DCEBFA] selection:text-[#1D4E89]">
      {/* 3-Zone Top Navigation Bar */}
      <Header currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8 flex flex-col gap-8">
        {/* Tab 1: Live Auditor & Test Shop */}
        {currentTab === 'auditor' && (
          <div className="flex flex-col gap-6">
            {/* Contextual Introduction */}
            <div className="bg-white border border-[#E1E8F0] rounded-[24px] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#DCEBFA] text-[#1D4E89] border border-[#9CC5EE]">
                    Chrome & Edge Auditor
                  </span>
                  <span className="text-xs text-[#5F6E80]">·</span>
                  <span className="text-xs text-[#5F6E80]">Hybrid Rule + TF-IDF ML</span>
                </div>
                <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#1F2A37] tracking-tight leading-tight">
                  Intelligent Auditor for Deceptive E-Commerce Design
                </h1>
                <p className="text-xs sm:text-sm text-[#5F6E80] mt-2 leading-relaxed">
                  DarkGuard AI audits product pages for fake urgency, misleading discounts, confirm shaming, and pre-selected extras. Experience the live auditor on planted and clean shopping pages below.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setCurrentTab('evaluation')}
                  className="px-4 py-2.5 bg-white border border-[#C9D4E0] hover:bg-[#F6F9FC] text-[#1F2A37] text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>View 30-Page Benchmark</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#5F6E80]" />
                </button>
              </div>
            </div>

            {/* Split Screen Layout: Left = Mock E-Commerce Shop, Right = Extension Runner Simulator */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Mock Shop (7 cols on desktop) */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1D4E89]" />
                    <span className="font-display font-semibold text-sm text-[#1F2A37]">
                      Test Storefront
                    </span>
                  </div>
                  <span className="text-xs text-[#5F6E80]">
                    Current: <strong>{selectedProduct.name.split(' ')[0]}</strong> ({selectedProduct.isPlanted ? 'Planted' : 'Clean'})
                  </span>
                </div>

                <div ref={testShopContainerRef as any}>
                  <TestShop
                    selectedProductId={selectedProductId}
                    onSelectProduct={setSelectedProductId}
                  />
                </div>
              </div>

              {/* Right Column: Extension Simulator (5 cols on desktop) */}
              <div className="lg:col-span-5 sticky top-20 flex flex-col gap-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#8FD1B0]" />
                    <span className="font-display font-semibold text-sm text-[#1F2A37]">
                      Extension Popup Simulator
                    </span>
                  </div>
                  <span className="text-xs text-[#5F6E80]">
                    Manifest V3 Engine
                  </span>
                </div>

                <ExtensionSimulator
                  testContainerRef={testShopContainerRef}
                  currentDomain="demo.darkguard.shop"
                  currentPath={`/products/${selectedProduct.id}`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Evaluation & Ablation Platform */}
        {currentTab === 'evaluation' && <EvalDashboard />}

        {/* Tab 3: System Architecture */}
        {currentTab === 'architecture' && <ArchitectureView />}

        {/* Tab 4: Extension Installation Guide */}
        {currentTab === 'guide' && <InstallGuide />}
      </main>

      {/* Quiet, Clean Footer */}
      <footer className="mt-auto border-t border-[#E1E8F0] bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#5F6E80]">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-[#1F2A37]">DarkGuard AI</span>
            <span>·</span>
            <span>Screening tool for deceptive e-commerce design</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentTab('architecture')}
              className="hover:text-[#1F2A37] transition-colors cursor-pointer"
            >
              PRD & TRD Specs
            </button>
            <button
              onClick={() => setCurrentTab('evaluation')}
              className="hover:text-[#1F2A37] transition-colors cursor-pointer"
            >
              Model Card v1
            </button>
            <button
              onClick={() => setCurrentTab('guide')}
              className="hover:text-[#1F2A37] transition-colors cursor-pointer"
            >
              Install Extension
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
