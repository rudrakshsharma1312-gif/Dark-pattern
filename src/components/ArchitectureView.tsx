import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  return (
    <div className="w-full glass-panel rounded-[24px] p-6 sm:p-8 flex flex-col gap-8">
      <div>
        <div className="text-xs font-medium text-[var(--ink-500)] mb-1">
          System Architecture &amp; Technical Foundations
        </div>
        <h2 className="font-display font-bold text-2xl text-[var(--ink-900)]">
          Hybrid Detection with Clear Separation of Roles
        </h2>
        <div className="w-8 h-[2.5px] bg-[var(--accent)] rounded-full mt-2.5" aria-hidden="true" />
        <p className="text-xs text-[var(--ink-500)] mt-2.5 max-w-2xl leading-relaxed">
          DarkGuard AI enforces strict architectural separation between text classification, deterministic rule evidence, and safe template transformations.
        </p>
      </div>

      {/* 3 Core Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="chrome-card p-5 rounded-[18px] flex flex-col">
          <div className="text-xs font-mono font-bold text-[var(--accent)] mb-2">01.</div>
          <h3 className="font-display font-bold text-base text-[var(--ink-900)] mb-1.5">
            Propose: Text Classifier (ML)
          </h3>
          <p className="text-xs text-[var(--ink-500)] leading-relaxed">
            One-vs-Rest Logistic Regression over sublinear TF-IDF word unigrams/bigrams and char 3-5 grams. Runs locally in content script in &lt; 5ms with SHA-256 checksum verification.
          </p>
          <div className="mt-4 pt-3 border-t border-[var(--line-subtle)] text-[11px] text-[var(--accent)] font-medium">
            Handles natural language nuance &amp; decline phrasing.
          </div>
        </div>

        <div className="chrome-card p-5 rounded-[18px] flex flex-col">
          <div className="text-xs font-mono font-bold text-[var(--mint-ink)] mb-2">02.</div>
          <h3 className="font-display font-bold text-base text-[var(--ink-900)] mb-1.5">
            Verify: Deterministic Rules
          </h3>
          <p className="text-xs text-[var(--ink-500)] leading-relaxed">
            Checks concrete evidence: frozen countdown timers over a 10s window, discount percentage arithmetic mismatches, and pre-selected add-on checkboxes.
          </p>
          <div className="mt-4 pt-3 border-t border-[var(--line-subtle)] text-[11px] text-[var(--mint-ink)] font-medium">
            Guarantees high precision. Rule evidence is primary.
          </div>
        </div>

        <div className="chrome-card p-5 rounded-[18px] flex flex-col">
          <div className="text-xs font-mono font-bold text-[var(--peach-ink)] mb-2">03.</div>
          <h3 className="font-display font-bold text-base text-[var(--ink-900)] mb-1.5">
            Change: Approved Templates
          </h3>
          <p className="text-xs text-[var(--ink-500)] leading-relaxed">
            Ethical View injects only verified templates from <code className="text-[var(--accent)]">templates.json</code>. No generative model ever writes HTML, CSS, or scripts. 100% reversible via &ldquo;Show original&rdquo;.
          </p>
          <div className="mt-4 pt-3 border-t border-[var(--line-subtle)] text-[11px] text-[var(--peach-ink)] font-medium">
            Protects prices, controls, and merchant checkout flows.
          </div>
        </div>
      </div>

      {/* Pipeline Diagram */}
      <div className="p-6 glass-recessed rounded-[18px] flex flex-col gap-4">
        <h3 className="font-display font-bold text-sm text-[var(--ink-900)]">
          Content Script Pipeline Flow
        </h3>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="chrome-card p-3 rounded-[12px] text-center min-w-[128px]">
            <span className="block font-bold text-[var(--ink-900)]">Scanner</span>
            <span className="text-[10px] text-[var(--ink-500)]">Extracts Candidates</span>
          </div>
          <ArrowRight className="w-4 h-4 text-[var(--accent)] hidden md:block" />
          <div className="chrome-card p-3 rounded-[12px] text-center min-w-[138px]">
            <span className="block font-bold text-[var(--ink-900)]">Rule Detectors</span>
            <span className="text-[10px] text-[var(--ink-500)]">DP-1 .. DP-4 Rules</span>
          </div>
          <ArrowRight className="w-4 h-4 text-[var(--accent)] hidden md:block" />
          <div className="chrome-card p-3 rounded-[12px] text-center min-w-[138px]">
            <span className="block font-bold text-[var(--ink-900)]">Text Classifier</span>
            <span className="text-[10px] text-[var(--ink-500)]">TF-IDF ML (&lt;5ms)</span>
          </div>
          <ArrowRight className="w-4 h-4 text-[var(--accent)] hidden md:block" />
          <div className="chrome-card p-3 rounded-[12px] text-center min-w-[128px]">
            <span className="block font-bold text-[var(--ink-900)]">Fusion</span>
            <span className="text-[10px] text-[var(--ink-500)]">Rule + ML Merging</span>
          </div>
          <ArrowRight className="w-4 h-4 text-[var(--accent)] hidden md:block" />
          <div className="chrome-card p-3 rounded-[12px] text-center min-w-[128px]">
            <span className="block font-bold text-[var(--ink-900)]">Risk Engine</span>
            <span className="text-[10px] text-[var(--ink-500)]">0-100 Score &amp; Band</span>
          </div>
          <ArrowRight className="w-4 h-4 text-[var(--accent)] hidden md:block" />
          <div className="p-3 bg-gradient-to-br from-[#F0CA78] to-[#C68E32] border border-[#FFE8B3]/45 shadow-sm rounded-[12px] text-center min-w-[128px] text-[#111318]">
            <span className="block font-bold">Ethical View</span>
            <span className="text-[10px] text-[#111318]/80 font-semibold">Reversible Overlay</span>
          </div>
        </div>
      </div>

      {/* Product Guarantees Section */}
      <div className="chrome-card rounded-[18px] p-6">
        <h3 className="font-display font-bold text-base text-[var(--ink-900)] mb-4">
          Ethical View Product Guarantees (PRD Section 9)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 text-xs text-[var(--ink-500)]">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[var(--ink-900)] block mb-0.5">No price changes</strong>
              Ethical View never edits, hides, or reformats any price.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[var(--ink-900)] block mb-0.5">No form changes</strong>
              Never mutates checkbox state, input values, or selections.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[var(--ink-900)] block mb-0.5">No blocked controls</strong>
              Buy, add-to-cart, and checkout controls stay fully clickable.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[var(--mint-ink)] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[var(--ink-900)] block mb-0.5">Labeled, not deleted</strong>
              Suspicious elements receive a clear, non-destructive note.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[var(--mint-ink)] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[var(--ink-900)] block mb-0.5">100% Reversible</strong>
              One click on &ldquo;Show original&rdquo; removes all annotations immediately.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[var(--mint-ink)] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[var(--ink-900)] block mb-0.5">Neutral wording</strong>
              Describes what was observed; avoids preachiness or accusations.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
