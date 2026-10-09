import React from 'react';
import { RiskCategory } from '../types';

interface RiskBadgeProps {
  category: RiskCategory;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ category, score, size = 'md' }) => {
  const styles = {
    HIGH: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
    MEDIUM: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    LOW: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  };

  const dots = {
    HIGH: 'bg-red-500 animate-pulse',
    MEDIUM: 'bg-amber-500',
    LOW: 'bg-emerald-500',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3 py-1.5 font-bold',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border shadow-sm ${styles[category]} ${sizeClasses[size]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dots[category]}`} />
      <span>{category} RISK</span>
      {score !== undefined && (
        <span className="opacity-75 font-mono">({Math.round(score)})</span>
      )}
    </span>
  );
};
