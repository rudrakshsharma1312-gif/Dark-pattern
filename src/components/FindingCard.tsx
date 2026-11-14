import React, { useState } from 'react';
import { Detection } from '../types';
import { ConfidenceBand } from './ConfidenceBand';
import { AITextRenderer, AICodeBlock } from './AITextRenderer';
import {
  CheckSquare,
  Square,
  Eye,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';

interface FindingCardProps {
  detection: Detection;
  onLocate?: (ref: string) => void;
  isSellerQuestionChecked?: boolean;
  onToggleSellerQuestion?: () => void;
}

export const FindingCard: React.FC<FindingCardProps> = ({
  detection,
  onLocate,
  isSellerQuestionChecked = false,
  onToggleSellerQuestion,
}) => {
  const [copiedNote, setCopiedNote] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  const severityLabel =
    detection.severity === 3 ? 'Major' : detection.severity === 2 ? 'Moderate' : 'Minor';

  const severityTextClass =
    detection.severity === 3
      ? 'text-[var(--rose-ink)]'
      : detection.severity === 2
      ? 'text-[var(--peach-ink)]'
      : 'text-[var(--butter-ink)]';

  const sourceLabel =
    detection.source === 'rule+ml'
      ? 'Rule + ML Verified'
      : detection.source === 'ml'
      ? 'ML Signal'
      : 'Rule Evidence';

  const observationText = detection.aiExplanation || detection.explanation;

  const handleCopyNote = async () => {
    try {
      await navigator.clipboard.writeText(observationText);
      setCopiedNote(true);
      setTimeout(() => setCopiedNote(false), 1600);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const verificationPayload = JSON.stringify(
    {
      category: detection.categoryId,
      source: detection.source,
      confidence: Number(detection.confidence.toFixed(2)),
      ...(detection.details ? { details: detection.details } : {}),
    },
    null,
    2
  );

  return (
    <article
      className="chrome-card rounded-[20px] p-4 flex flex-col gap-3.5 ai-reveal-enter"
      data-testid="finding-card"
    >
      {/* Header & Locate Action */}
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-semibold text-base chrome-text-gradient leading-snug">
            {detection.categoryName}
          </h3>
          {onLocate && (
            <button
              type="button"
              onClick={() => onLocate(detection.candidateRef)}
              className="glass-control text-[var(--ink-900)] px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap"
              title="Highlight element on page"
            >
              <Eye className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Locate</span>
            </button>
          )}
        </div>

        {/* Clean unboxed metadata */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={`font-semibold ${severityTextClass}`}>
            {severityLabel} severity
          </span>
          <span aria-hidden="true" className="text-[var(--ink-300)]">·</span>
          <span className="text-[var(--ink-500)]">{sourceLabel}</span>
          {detection.source === 'rule+ml' && (
            <>
              <span aria-hidden="true" className="text-[var(--ink-300)]">·</span>
              <span className="text-[var(--mint-ink)] font-medium">Second opinion agrees</span>
            </>
          )}
        </div>
      </div>

      {/* Quoted Evidence Snippet */}
      {detection.evidenceSnippet && (
        <blockquote className="bg-[var(--bg-sunken)] border border-[var(--line-card)] rounded-[14px] px-3.5 py-2.5 text-xs text-[var(--ink-900)] font-mono break-words leading-relaxed">
          <div className="text-[11px] font-sans font-medium text-[var(--ink-500)] mb-0.5">
            Detected UI string
          </div>
          &ldquo;{detection.evidenceSnippet}&rdquo;
        </blockquote>
      )}

      {/* Confidence band */}
      <div className="pt-0.5">
        <ConfidenceBand
          confidence={detection.confidence}
          severity={detection.severity}
          isUncertain={detection.isUncertain}
        />
      </div>

      {/* Stylish Interactive AI Observation Card */}
      <div className="glass-recessed rounded-[16px] p-3.5 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[var(--line-subtle)]">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="font-display font-semibold text-xs chrome-text-gradient">
              {detection.aiExplanation ? 'AI Observation Note' : 'Observation Note'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyNote}
            className="glass-control px-2.5 py-0.5 rounded-full text-[11px] font-medium text-[var(--ink-900)] inline-flex items-center gap-1 cursor-pointer"
            title="Copy observation note"
          >
            {copiedNote ? (
              <>
                <Check className="w-3 h-3 text-[var(--mint-ink)]" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-[var(--ink-500)]" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        <AITextRenderer
          content={observationText}
          animateReveal={Boolean(detection.aiExplanation)}
          compact
        />
      </div>

      {/* Expandable / Collapsible Technical Verification Details */}
      <div className="border-t border-[var(--line-subtle)] pt-2">
        <button
          type="button"
          onClick={() => setDetailsExpanded((v) => !v)}
          className="w-full flex items-center justify-between text-xs font-medium text-[var(--ink-500)] hover:text-[var(--ink-900)] transition-colors cursor-pointer py-1"
          aria-expanded={detailsExpanded}
        >
          <span>Technical verification &amp; metadata</span>
          {detailsExpanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        {detailsExpanded && (
          <div className="mt-2 ai-reveal-enter">
            <AICodeBlock code={verificationPayload} language="json" />
          </div>
        )}
      </div>

      {/* Checkable Seller Question */}
      {detection.sellerQuestion && (
        <div className="pt-2.5 border-t border-[var(--line-subtle)]">
          <button
            type="button"
            onClick={onToggleSellerQuestion}
            className="w-full text-left flex items-start gap-2.5 text-xs text-[var(--ink-700)] hover:text-[var(--ink-900)] cursor-pointer group"
          >
            {isSellerQuestionChecked ? (
              <CheckSquare className="w-4 h-4 text-[var(--mint-ink)] shrink-0 mt-0.5" />
            ) : (
              <Square className="w-4 h-4 text-[var(--ink-300)] shrink-0 mt-0.5 group-hover:text-[var(--accent)]" />
            )}
            <div>
              <span className="font-semibold text-[var(--ink-900)] block mb-0.5">
                Question to ask seller
              </span>
              <span className={isSellerQuestionChecked ? 'line-through text-[var(--ink-300)]' : 'text-[var(--ink-500)]'}>
                &ldquo;{detection.sellerQuestion}&rdquo;
              </span>
            </div>
          </button>
        </div>
      )}
    </article>
  );
};
