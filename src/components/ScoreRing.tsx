import React, { useEffect, useState } from 'react';
import { RiskLevel } from '../types';

interface ScoreRingProps {
  score: number; // 0-100
  level: RiskLevel;
  elementsChecked?: number;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  level,
  elementsChecked = 12,
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 850;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(easeOut * score));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [score]);

  // High-contrast theme-aware semantic colors
  let ringColor = 'var(--mint-ink)'; // Low (Jade Emerald)
  let levelColor = 'text-[var(--mint-ink)]';
  let headline = 'Looks sound in what we checked';

  if (score >= 75) {
    ringColor = 'var(--rose-ink)'; // Very high (Rose Crimson)
    levelColor = 'text-[var(--rose-ink)]';
    headline = 'Significant concerns found';
  } else if (score >= 50) {
    ringColor = 'var(--peach-ink)'; // High (Burnished Copper)
    levelColor = 'text-[var(--peach-ink)]';
    headline = 'Several concerns to follow up';
  } else if (score >= 25) {
    ringColor = 'var(--butter-ink)'; // Moderate (Champagne Amber)
    levelColor = 'text-[var(--butter-ink)]';
    headline = 'A few things worth checking';
  }

  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center text-center select-none">
      <div className="relative w-[160px] h-[160px] flex items-center justify-center">
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
          aria-hidden="true"
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--ring-track)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Active progress ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-300 ease-out"
          />
        </svg>

        {/* Center score readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-display font-bold text-4xl text-[var(--ink-900)] tabular leading-none">
            {animatedScore}
          </span>
          <span className="text-[11px] font-medium text-[var(--ink-500)] mt-1.5 tracking-wider uppercase">
            Risk Score
          </span>
        </div>
      </div>

      {/* Band headline & unboxed metadata */}
      <h3 className="font-display font-semibold text-base text-[var(--ink-900)] mt-3">
        {headline}
      </h3>

      <div className="flex items-center gap-2 mt-1.5 text-xs">
        <span className="text-[var(--ink-500)] tabular">
          {elementsChecked} elements checked
        </span>
        <span aria-hidden="true" className="text-[var(--ink-300)]">·</span>
        <span className={`font-semibold ${levelColor}`}>
          {level} risk
        </span>
      </div>

      <p className="text-[11px] text-[var(--ink-500)] mt-2">
        Screening only, not a certification.
      </p>
    </div>
  );
};
