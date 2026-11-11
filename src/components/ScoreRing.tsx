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
    // 900ms ease-out animation per Design System section 9
    let startTimestamp: number | null = null;
    const duration = 850;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // ease-out curve: 1 - (1 - progress)^3
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(easeOut * score));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [score]);

  // Color mapping per design system
  // Low (0-24): Mint (#8FD1B0)
  // Moderate (25-49): Butter (#EBD27A)
  // High (50-74): Peach (#F1A98F)
  // Very high (75-100): Rose (#E8A0B5)
  let ringColor = '#8FD1B0'; // Mint
  let headline = 'Looks sound in what we checked';

  if (score >= 75) {
    ringColor = '#E8A0B5'; // Rose
    headline = 'Significant concerns found';
  } else if (score >= 50) {
    ringColor = '#F1A98F'; // Peach
    headline = 'Several concerns to follow up';
  } else if (score >= 25) {
    ringColor = '#EBD27A'; // Butter
    headline = 'A few things worth checking';
  }

  // SVG calculations for 160px ring, 14px stroke
  const size = 160;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2; // (160 - 14)/2 = 73
  const circumference = 2 * Math.PI * radius; // ~458.67
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
            stroke="#EDF2F8"
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
          <span className="font-display font-bold text-4xl text-[#1F2A37] tabular leading-none">
            {animatedScore}
          </span>
          <span className="text-[11px] font-medium text-[#5F6E80] mt-1 tracking-wider uppercase">
            Risk Score
          </span>
        </div>
      </div>

      {/* Band headline & level */}
      <h3 className="font-display font-semibold text-base text-[#1F2A37] mt-3">
        {headline}
      </h3>

      <div className="flex items-center gap-2 mt-1.5">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EDF2F8] text-[#3D4B5C]">
          {elementsChecked} elements checked
        </span>
        <span className="text-xs text-[#5F6E80] font-medium">·</span>
        <span className="text-xs font-semibold text-[#1F2A37]">
          {level} risk
        </span>
      </div>

      <p className="text-[11px] text-[#9AA7B6] mt-2">
        Screening only, not a certification.
      </p>
    </div>
  );
};
