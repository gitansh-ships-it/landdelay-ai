import React from 'react';
import { RiskCategory } from '../types';

interface RiskBadgeProps {
  category: RiskCategory;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ category, score, size = 'md' }) => {
  const styles = {
    HIGH: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
    MEDIUM: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    LOW: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  };

  const dots = {
    HIGH: 'bg-rose-500 animate-pulse',
    MEDIUM: 'bg-amber-500',
    LOW: 'bg-emerald-500',
  };

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-xs px-3 py-1.5 font-bold',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border backdrop-blur-xs shadow-xs ${styles[category]} ${sizeClasses[size]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dots[category]}`} />
      <span>{category} RISK</span>
      {score !== undefined && (
        <span className="opacity-80 font-mono text-[11px]">({Math.round(score)})</span>
      )}
    </span>
  );
};
