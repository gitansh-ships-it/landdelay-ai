import React, { useState } from 'react';
import {
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Menu,
  Sun,
  Moon
} from 'lucide-react';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  title: string;
  mobileTitle?: string;
  subtitle?: string;
  onDataReset?: () => void;
  isSyntheticActive?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  mobileTitle,
  subtitle,
  onDataReset,
  isSyntheticActive = true,
  onToggleSidebar
}) => {
  const { theme, toggleTheme } = useTheme();
  const [isResetting, setIsResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  const handleReset = async () => {
    const key = window.prompt(
      "Admin Authorization Required\n\nEnter Admin Key to authorize database reset (local default: landdelay-admin-secret-2026):"
    );
    if (!key) {
      return;
    }
    if (!window.confirm("Confirm reset? This will regenerate 250 deterministic synthetic demonstration cases with seed=42.")) {
      return;
    }
    try {
      setIsResetting(true);
      setResetMsg(null);
      await api.resetDemoData(key);
      setResetMsg("Demo database re-seeded successfully!");
      if (onDataReset) onDataReset();
      setTimeout(() => setResetMsg(null), 4000);
    } catch (err: any) {
      alert(`Reset error: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const displayMobileTitle = mobileTitle || title;

  return (
    <header className="bg-white dark:bg-[#121E31] border-b border-[#E1E7EF] dark:border-[#1F2E45] px-3.5 sm:px-6 sticky top-0 z-30 shadow-xs flex-shrink-0">
      {/* Desktop & Tablet Layout (sm and up: single flex row) */}
      <div className="hidden sm:flex h-16 items-center justify-between">
        {/* Left section: Mobile menu + Page Title / Subtitle */}
        <div className="flex items-center gap-3 min-w-0">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 text-[#687386] dark:text-[#94A3B8] hover:text-[#172033] dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#172033] dark:text-[#F1F5F9] tracking-tight truncate">{title}</h2>
            {subtitle && <p className="text-xs text-[#687386] dark:text-[#94A3B8] font-normal truncate">{subtitle}</p>}
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {resetMsg && (
            <div className="flex items-center gap-1.5 text-xs text-[#065F46] dark:text-[#34D399] bg-[#ECFDF5] dark:bg-[#19966B]/15 border border-[#A7F3D0] dark:border-[#19966B]/30 px-2.5 py-1 rounded-md animate-fade-in shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="truncate max-w-[120px] sm:max-w-none">{resetMsg}</span>
            </div>
          )}

          {isSyntheticActive ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FFFBEB] dark:bg-[#E9A23B]/10 border border-[#FDE68A] dark:border-[#E9A23B]/30 text-[#B45309] dark:text-[#FBBF24] rounded-md text-xs font-semibold shrink-0">
              <AlertCircle className="h-3.5 w-3.5 text-[#E9A23B] shrink-0" />
              <span>SYNTHETIC DEMO</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#ECFDF5] dark:bg-[#19966B]/10 border border-[#A7F3D0] dark:border-[#19966B]/30 text-[#065F46] dark:text-[#34D399] rounded-md text-xs font-semibold shrink-0">
              <ShieldCheck className="h-3.5 w-3.5 text-[#19966B] shrink-0" />
              <span>VERIFIED PUBLIC</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F5F7FA] dark:bg-[#0B1320] border border-[#E1E7EF] dark:border-[#1F2E45] text-[#172033] dark:text-[#94A3B8] rounded-md text-xs font-mono shrink-0">
            <span className="h-2 w-2 rounded-full bg-[#19966B]" />
            <span>API v1.0</span>
          </div>

          <button
            onClick={handleReset}
            disabled={isResetting}
            title="Reset and reseed 250 deterministic demonstration cases"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 dark:bg-[#121E31] dark:hover:bg-[#1A2A42] text-[#172033] dark:text-[#F1F5F9] text-xs font-medium rounded-lg transition-colors border border-[#E1E7EF] dark:border-[#1F2E45] shadow-xs disabled:opacity-50 cursor-pointer shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#3563E9] ${isResetting ? 'animate-spin' : ''}`} />
            <span>{isResetting ? 'Resetting...' : 'Reseed Demo'}</span>
          </button>

          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 bg-white hover:bg-slate-50 dark:bg-[#121E31] dark:hover:bg-[#1A2A42] border border-[#E1E7EF] dark:border-[#1F2E45] rounded-lg text-[#687386] dark:text-[#94A3B8] hover:text-[#172033] dark:hover:text-white transition-colors shadow-xs cursor-pointer shrink-0"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-[#E9A23B]" />
            ) : (
              <Moon className="h-4 w-4 text-[#3563E9]" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Layout (<sm: two dedicated, compact rows) */}
      <div className="sm:hidden py-2 space-y-1.5">
        {/* Row 1: [Hamburger] [Readable Title] [Theme Toggle] */}
        <div className="flex items-center justify-between gap-2 h-9">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="p-1.5 text-[#687386] dark:text-[#94A3B8] hover:text-[#172033] dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Open Navigation Menu"
                aria-label="Open Navigation Menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            <h2 className="text-sm font-bold text-[#172033] dark:text-[#F1F5F9] tracking-tight truncate">
              {displayMobileTitle}
            </h2>
          </div>

          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-1.5 bg-white hover:bg-slate-50 dark:bg-[#121E31] dark:hover:bg-[#1A2A42] border border-[#E1E7EF] dark:border-[#1F2E45] rounded-lg text-[#687386] dark:text-[#94A3B8] hover:text-[#172033] dark:hover:text-white transition-colors shadow-xs cursor-pointer shrink-0"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-[#E9A23B]" />
            ) : (
              <Moon className="h-4 w-4 text-[#3563E9]" />
            )}
          </button>
        </div>

        {/* Row 2: [SYNTHETIC DEMO Badge] [Reseed Demo Button] */}
        <div className="flex items-center justify-between gap-2 pt-0.5 border-t border-[#E1E7EF]/60 dark:border-[#1F2E45]/60 text-xs">
          <div className="flex items-center gap-1.5 shrink-0">
            {isSyntheticActive ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FFFBEB] dark:bg-[#E9A23B]/10 border border-[#FDE68A] dark:border-[#E9A23B]/30 text-[#B45309] dark:text-[#FBBF24] rounded text-[10px] font-bold tracking-wide">
                <AlertCircle className="h-3 w-3 text-[#E9A23B] shrink-0" />
                <span>SYNTHETIC DEMO</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#ECFDF5] dark:bg-[#19966B]/10 border border-[#A7F3D0] dark:border-[#19966B]/30 text-[#065F46] dark:text-[#34D399] rounded text-[10px] font-bold tracking-wide">
                <ShieldCheck className="h-3 w-3 text-[#19966B] shrink-0" />
                <span>VERIFIED PUBLIC</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {resetMsg && (
              <span className="text-[10px] text-[#065F46] dark:text-[#34D399] font-medium truncate max-w-[100px]">
                {resetMsg}
              </span>
            )}
            <button
              onClick={handleReset}
              disabled={isResetting}
              title="Reset and reseed 250 deterministic demonstration cases"
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 dark:bg-[#121E31] dark:hover:bg-[#1A2A42] text-[#172033] dark:text-[#F1F5F9] text-[11px] font-medium rounded border border-[#E1E7EF] dark:border-[#1F2E45] shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`h-3 w-3 text-[#3563E9] ${isResetting ? 'animate-spin' : ''}`} />
              <span>{isResetting ? 'Resetting...' : 'Reseed Demo'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
