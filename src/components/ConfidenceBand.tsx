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
  const filledCount = Math.min(10, Math.max(1, Math.round((confidence * 10))));

  // Line colors per severity token
  // Minor: Butter (#EBD27A), Moderate: Peach (#F1A98F), Major: Rose (#E8A0B5)
  let fillColor = '#F1A98F'; // Moderate default
  if (severity === 1) fillColor = '#EBD27A';
  else if (severity === 3) fillColor = '#E8A0B5';

  if (isUncertain) {
    fillColor = '#EBD27A'; // Butter
  }

  return (
    <div
      className={`inline-flex items-center gap-2 text-xs select-none ${
        isUncertain
          ? 'p-1 rounded-md border border-dashed border-[#EBD27A] bg-[#FBF0C9]/40'
          : ''
      }`}
      role="meter"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Confidence ${percent} percent`}
    >
      <span className="text-[#5F6E80] text-[11px] font-medium tracking-wide">
        Confidence
      </span>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: totalSegments }).map((_, i) => {
          const isFilled = i < filledCount;
          return (
            <div
              key={i}
              className="w-2.5 h-3.5 rounded-2xs transition-all duration-200"
              style={{
                backgroundColor: isFilled ? fillColor : '#EDF2F8',
              }}
            />
          );
        })}
      </div>
      <span className="font-mono tabular text-[#1F2A37] font-semibold text-[11px]">
        {percent}%
      </span>
      {isUncertain && (
        <span className="text-[10px] uppercase font-semibold text-[#6B4E00] bg-[#FBF0C9] px-1.5 py-0.2 rounded">
          Uncertain
        </span>
      )}
    </div>
  );
};
