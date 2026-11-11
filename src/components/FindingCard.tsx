import React from 'react';
import { Detection } from '../types';
import { ConfidenceBand } from './ConfidenceBand';
import { ExternalLink, CheckSquare, Square, Eye } from 'lucide-react';

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
  // Severity pastel mapping
  const severityLabel =
    detection.severity === 3 ? 'Major' : detection.severity === 2 ? 'Moderate' : 'Minor';
  
  const severityChipStyle =
    detection.severity === 3
      ? 'bg-[#F9DCE4] border-[#E8A0B5] text-[#8A2845]'
      : detection.severity === 2
      ? 'bg-[#FCE0D6] border-[#F1A98F] text-[#8A3A1F]'
      : 'bg-[#FBF0C9] border-[#EBD27A] text-[#6B4E00]';

  return (
    <article
      className="bg-white border border-[#E1E8F0] rounded-[20px] p-4 flex flex-col gap-3 transition-all hover:border-[#C9D4E0] shadow-2xs"
      data-testid="finding-card"
    >
      {/* Evidence snippet if present */}
      {detection.evidenceSnippet && (
        <div className="bg-[#EDF2F8] border border-[#E1E8F0] rounded-[12px] p-2.5 text-xs text-[#3D4B5C] font-mono break-words">
          <div className="text-[10px] uppercase font-bold text-[#5F6E80] mb-0.5 tracking-wider">
            Detected UI String
          </div>
          &ldquo;{detection.evidenceSnippet}&rdquo;
        </div>
      )}

      {/* Header and chips */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-semibold text-base text-[#1F2A37] leading-snug">
            {detection.categoryName}
          </h3>
          {onLocate && (
            <button
              type="button"
              onClick={() => onLocate(detection.candidateRef)}
              className="text-[#1D4E89] hover:bg-[#DCEBFA]/60 p-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
              title="Highlight element on page"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Locate</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${severityChipStyle}`}
          >
            {severityLabel}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#EDF2F8] border border-[#C9D4E0] text-[#3D4B5C]">
            {detection.source === 'rule+ml'
              ? 'Rule + ML Verified'
              : detection.source === 'ml'
              ? 'ML Signal'
              : 'Rule Evidence'}
          </span>
        </div>
      </div>

      {/* Confidence band */}
      <div className="pt-0.5">
        <ConfidenceBand
          confidence={detection.confidence}
          severity={detection.severity}
          isUncertain={detection.isUncertain}
        />
      </div>

      {/* Agent Note (Lavender fill & line) */}
      <div className="bg-[#E8E3F8] border border-[#B9ABE8] rounded-xl p-3 text-xs text-[#1F2A37] leading-relaxed">
        <div className="flex items-center gap-1.5 font-semibold text-[#4B3A8C] mb-1">
          <span>✦</span>
          <span>Observation note</span>
        </div>
        <p className="text-[#3D4B5C]">
          {detection.aiExplanation || detection.explanation}
        </p>
      </div>

      {/* Second opinion chip */}
      {detection.source === 'rule+ml' && (
        <div className="inline-flex items-center gap-1.5 text-xs text-[#14513A] bg-[#D9F2E6] border border-[#8FD1B0] px-2.5 py-1 rounded-lg self-start font-medium">
          <span>✓</span>
          <span>Second opinion agrees (Classifier + Rule match)</span>
        </div>
      )}

      {/* Checkable Seller Question */}
      {detection.sellerQuestion && (
        <div className="pt-2 border-t border-[#E1E8F0]">
          <button
            type="button"
            onClick={onToggleSellerQuestion}
            className="w-full text-left flex items-start gap-2 text-xs text-[#3D4B5C] hover:text-[#1F2A37] cursor-pointer group"
          >
            {isSellerQuestionChecked ? (
              <CheckSquare className="w-4 h-4 text-[#14513A] shrink-0 mt-0.5" />
            ) : (
              <Square className="w-4 h-4 text-[#5F6E80] shrink-0 mt-0.5 group-hover:text-[#1F2A37]" />
            )}
            <div>
              <span className="font-semibold text-[#1F2A37] block mb-0.5">
                Question to ask seller:
              </span>
              <span className={isSellerQuestionChecked ? 'line-through text-[#9AA7B6]' : ''}>
                &ldquo;{detection.sellerQuestion}&rdquo;
              </span>
            </div>
          </button>
        </div>
      )}
    </article>
  );
};
