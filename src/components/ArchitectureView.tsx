import React from 'react';
import { Shield, Cpu, Lock, CheckCircle2, ArrowRight } from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  return (
    <div className="w-full bg-white border border-[#E1E8F0] rounded-[24px] p-6 sm:p-8 flex flex-col gap-8 shadow-sm">
      <div>
        <div className="text-xs uppercase font-semibold text-[#5F6E80] tracking-wider mb-1">
          System Architecture & Technical Foundations
        </div>
        <h2 className="font-display font-bold text-2xl text-[#1F2A37]">
          Hybrid Detection with Clear Separation of Roles
        </h2>
        <p className="text-xs text-[#5F6E80] mt-1 max-w-2xl leading-relaxed">
          DarkGuard AI enforces strict architectural separation between text classification, deterministic rule evidence, and safe template transformations.
        </p>
      </div>

      {/* 3 Core Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-[#F6F9FC] border border-[#E1E8F0] flex flex-col">
          <div className="w-9 h-9 rounded-xl bg-[#DCEBFA] border border-[#9CC5EE] text-[#1D4E89] flex items-center justify-center font-bold text-sm mb-3">
            01
          </div>
          <h3 className="font-display font-bold text-base text-[#1F2A37] mb-1">
            Propose: Text Classifier (ML)
          </h3>
          <p className="text-xs text-[#5F6E80] leading-relaxed">
            One-vs-Rest Logistic Regression over sublinear TF-IDF word unigrams/bigrams and char 3-5 grams. Runs locally in content script in &lt; 5ms with SHA-256 checksum verification.
          </p>
          <div className="mt-4 pt-3 border-t border-[#E1E8F0] text-[11px] text-[#1D4E89] font-medium">
            Handles natural language nuance & decline phrasing.
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#F6F9FC] border border-[#E1E8F0] flex flex-col">
          <div className="w-9 h-9 rounded-xl bg-[#D9F2E6] border border-[#8FD1B0] text-[#14513A] flex items-center justify-center font-bold text-sm mb-3">
            02
          </div>
          <h3 className="font-display font-bold text-base text-[#1F2A37] mb-1">
            Verify: Deterministic Rules
          </h3>
          <p className="text-xs text-[#5F6E80] leading-relaxed">
            Checks concrete evidence: frozen countdown timers over a 10s window, discount percentage arithmetic mismatches, and pre-selected add-on checkboxes.
          </p>
          <div className="mt-4 pt-3 border-t border-[#E1E8F0] text-[11px] text-[#14513A] font-medium">
            Guarantees high precision. Rule evidence is primary.
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#F6F9FC] border border-[#E1E8F0] flex flex-col">
          <div className="w-9 h-9 rounded-xl bg-[#E8E3F8] border border-[#B9ABE8] text-[#4B3A8C] flex items-center justify-center font-bold text-sm mb-3">
            03
          </div>
          <h3 className="font-display font-bold text-base text-[#1F2A37] mb-1">
            Change: Approved Templates
          </h3>
          <p className="text-xs text-[#5F6E80] leading-relaxed">
            Ethical View injects only verified templates from <code>templates.json</code>. No generative model ever writes HTML, CSS, or scripts. 100% reversible via "Show original".
          </p>
          <div className="mt-4 pt-3 border-t border-[#E1E8F0] text-[11px] text-[#4B3A8C] font-medium">
            Protects prices, controls, and merchant checkout flows.
          </div>
        </div>
      </div>

      {/* Pipeline Diagram */}
      <div className="p-6 bg-[#F6F9FC] border border-[#E1E8F0] rounded-2xl flex flex-col gap-4">
        <h3 className="font-display font-bold text-sm text-[#1F2A37]">
          Content Script Pipeline Flow
        </h3>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="p-3 bg-white border border-[#E1E8F0] rounded-xl text-center min-w-[130px]">
            <span className="block font-bold text-[#1F2A37]">Scanner</span>
            <span className="text-[10px] text-[#5F6E80]">Extracts Candidates</span>
          </div>
          <ArrowRight className="w-4 h-4 text-[#9AA7B6] hidden md:block" />
          <div className="p-3 bg-white border border-[#E1E8F0] rounded-xl text-center min-w-[140px]">
            <span className="block font-bold text-[#1F2A37]">Rule Detectors</span>
            <span className="text-[10px] text-[#5F6E80]">DP-1 .. DP-4 Rules</span>
          </div>
          <ArrowRight className="w-4 h-4 text-[#9AA7B6] hidden md:block" />
          <div className="p-3 bg-white border border-[#E1E8F0] rounded-xl text-center min-w-[140px]">
            <span className="block font-bold text-[#1F2A37]">Text Classifier</span>
            <span className="text-[10px] text-[#5F6E80]">TF-IDF ML (&lt;5ms)</span>
          </div>
          <ArrowRight className="w-4 h-4 text-[#9AA7B6] hidden md:block" />
          <div className="p-3 bg-white border border-[#E1E8F0] rounded-xl text-center min-w-[130px]">
            <span className="block font-bold text-[#1F2A37]">Fusion</span>
            <span className="text-[10px] text-[#5F6E80]">Rule + ML Merging</span>
          </div>
          <ArrowRight className="w-4 h-4 text-[#9AA7B6] hidden md:block" />
          <div className="p-3 bg-white border border-[#E1E8F0] rounded-xl text-center min-w-[130px]">
            <span className="block font-bold text-[#1F2A37]">Risk Engine</span>
            <span className="text-[10px] text-[#5F6E80]">0-100 Score & Band</span>
          </div>
          <ArrowRight className="w-4 h-4 text-[#9AA7B6] hidden md:block" />
          <div className="p-3 bg-[#DCEBFA] border border-[#9CC5EE] rounded-xl text-center min-w-[130px]">
            <span className="block font-bold text-[#1D4E89]">Ethical View</span>
            <span className="text-[10px] text-[#1D4E89]">Reversible Overlay</span>
          </div>
        </div>
      </div>

      {/* Product Guarantees Section */}
      <div className="border border-[#E1E8F0] rounded-2xl p-6">
        <h3 className="font-display font-bold text-base text-[#1F2A37] mb-3">
          Ethical View Product Guarantees (PRD Section 9)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs text-[#3D4B5C]">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#14513A] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#1F2A37] block">No price changes</strong>
              Ethical View never edits, hides, or reformats any price.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#14513A] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#1F2A37] block">No form changes</strong>
              Never mutates checkbox state, input values, or selections.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#14513A] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#1F2A37] block">No blocked controls</strong>
              Buy, add-to-cart, and checkout controls stay fully clickable.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#14513A] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#1F2A37] block">Labeled, not deleted</strong>
              Suspicious elements receive a clear, non-destructive note.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#14513A] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#1F2A37] block">100% Reversible</strong>
              One click on "Show original" removes all annotations immediately.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#14513A] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#1F2A37] block">Neutral wording</strong>
              Describes what was observed; avoids preachiness or accusations.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
