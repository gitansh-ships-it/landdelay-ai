import React from 'react';
import { RiskCategory } from '../types';

interface RiskBadgeProps {
  category: RiskCategory;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ category, score, size = 'md' }) => {
  const styles = {
    HIGH: 'bg-[#FEF2F2] dark:bg-[#DC3545]/15 text-[#DC3545] dark:text-[#F87171] border-[#FECACA] dark:border-[#DC3545]/30',
    MEDIUM: 'bg-[#FFFBEB] dark:bg-[#E9A23B]/15 text-[#B45309] dark:text-[#FBBF24] border-[#FDE68A] dark:border-[#E9A23B]/30',
    LOW: 'bg-[#ECFDF5] dark:bg-[#19966B]/15 text-[#065F46] dark:text-[#34D399] border-[#A7F3D0] dark:border-[#19966B]/30',
  };

  const dots = {
    HIGH: 'bg-[#DC3545]',
    MEDIUM: 'bg-[#E9A23B]',
    LOW: 'bg-[#19966B]',
  };

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-xs px-3 py-1.5 font-bold',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border shadow-xs ${styles[category]} ${sizeClasses[size]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dots[category]}`} />
      <span>{category} RISK</span>
      {score !== undefined && (
        <span className="opacity-80 font-mono text-[11px]">({Math.round(score)})</span>
      )}
    </span>
  );
};
