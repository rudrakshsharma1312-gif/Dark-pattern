import React from 'react';
import { SeverityLevel } from '../types';

interface ConfidenceBandProps {
  confidence: number; // 0 to 1
  severity: SeverityLevel;
  isUncertain?: boolean;
}

export const ConfidenceBand: React.FC<ConfidenceBandProps> = ({
  confidence,
  severity,
  isUncertain = false,
}) => {
  const percent = Math.round(confidence * 100);
  const totalSegments = 10;
  const filledCount = Math.min(10, Math.max(1, Math.round(confidence * 10)));

  let fillColor = 'var(--peach-ink)'; // Moderate
  if (severity === 1) fillColor = 'var(--butter-ink)'; // Minor
  else if (severity === 3) fillColor = 'var(--rose-ink)'; // Major

  if (isUncertain) {
    fillColor = 'var(--butter-ink)';
  }

  return (
    <div
      className={`inline-flex items-center gap-2 text-xs select-none ${
        isUncertain
          ? 'px-2 py-1 rounded-lg border border-dashed border-[var(--butter-line)] bg-[var(--butter-surface)]'
          : ''
      }`}
      role="meter"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Confidence ${percent} percent`}
    >
      <span className="text-[var(--ink-500)] text-[11px] font-medium tracking-wide">
        Confidence
      </span>
      <div className="flex items-center gap-1">
        {Array.from({ length: totalSegments }).map((_, i) => {
          const isFilled = i < filledCount;
          return (
            <div
              key={i}
              className="w-2 h-3 rounded-[2px] transition-all duration-200"
              style={{
                backgroundColor: isFilled ? fillColor : 'var(--band-track)',
              }}
            />
          );
        })}
      </div>
      <span className="font-mono tabular text-[var(--ink-900)] font-semibold text-[11px]">
        {percent}%
      </span>
      {isUncertain && (
        <span className="text-[11px] font-medium text-[var(--butter-ink)]">
          · Uncertain
        </span>
      )}
    </div>
  );
};
