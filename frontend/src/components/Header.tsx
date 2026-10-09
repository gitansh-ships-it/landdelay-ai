import React, { useState } from 'react';
import {
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Menu,
  Sun,
  Moon,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onDataReset?: () => void;
  isSyntheticActive?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onDataReset,
  isSyntheticActive = true,
  onToggleSidebar
}) => {
  const { theme, toggleTheme } = useTheme();
  const [isResetting, setIsResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  // Desktop header collapse state (persisted in localStorage)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('landdelay_header_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    try {
      localStorage.setItem('landdelay_header_collapsed', String(collapsed));
    } catch {}
  };

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

  return (
    <>
      <header
        className={`bg-white/55 dark:bg-[#0c1829]/75 backdrop-blur-glass border-b border-white/80 dark:border-white/10 px-3 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between sticky top-0 z-30 shadow-glass dark:shadow-glass-dark transition-all duration-300 gap-2 sm:gap-0 ${
          isCollapsed
            ? 'h-auto sm:h-16 lg:h-0 lg:min-h-0 lg:py-0 lg:opacity-0 lg:overflow-hidden lg:border-b-0 lg:pointer-events-none'
            : 'min-h-16 py-2.5 sm:py-0 sm:h-16'
        }`}
      >
        {/* Top row on mobile / Left group on desktop */}
        <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-2.5 sm:gap-3 min-w-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="lg:hidden p-2 text-[#607D95] dark:text-slate-300 hover:text-[#18344D] dark:hover:text-white rounded-xl hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer shrink-0"
                title="Open Navigation Menu"
                aria-label="Open Navigation Menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg font-bold text-[#18344D] dark:text-white tracking-tight truncate">{title}</h2>
              {subtitle && <p className="hidden sm:block text-xs text-[#607D95] dark:text-slate-400 font-medium truncate">{subtitle}</p>}
            </div>
          </div>

          {/* Theme toggle directly visible in mobile top row */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Serene Light Mode' : 'Switch to Deep Navy Dark Mode'}
            className="sm:hidden p-2 bg-white/70 dark:bg-slate-800/60 hover:bg-white/95 dark:hover:bg-slate-800 border border-white/80 dark:border-slate-700/60 rounded-xl text-[#18344D] dark:text-slate-200 transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-[#1687E8]" />
            )}
          </button>
        </div>

        {/* Second row on mobile / Right controls on desktop */}
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto min-w-0">
          {/* Reset Feedback Notification */}
          {resetMsg && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl animate-fade-in backdrop-blur-xs shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="truncate max-w-[140px] sm:max-w-none">{resetMsg}</span>
            </div>
          )}

          {/* Data Provenance Pill */}
          {isSyntheticActive ? (
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 rounded-full text-[11px] sm:text-xs font-semibold backdrop-blur-xs shrink-0">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>SYNTHETIC DEMO</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 rounded-full text-[11px] sm:text-xs font-semibold backdrop-blur-xs shrink-0">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>VERIFIED PUBLIC</span>
            </div>
          )}

          {/* System Online Status (Hidden on mobile) */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#1687E8]/10 border border-[#1687E8]/20 text-[#1264B3] dark:text-blue-300 rounded-xl text-xs font-mono backdrop-blur-xs shrink-0">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>API v1.0</span>
          </div>

          {/* Dark/Light Mode Toggle (Desktop only) */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Serene Light Mode' : 'Switch to Deep Navy Dark Mode'}
            className="hidden sm:flex p-2 bg-white/70 dark:bg-slate-800/60 hover:bg-white/95 dark:hover:bg-slate-800 border border-white/80 dark:border-slate-700/60 rounded-xl text-[#18344D] dark:text-slate-200 transition-all shadow-xs hover:shadow-glass hover:scale-105 active:scale-95 cursor-pointer shrink-0"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
            ) : (
              <Moon className="h-4 w-4 text-[#1687E8] transition-transform duration-300 rotate-0 hover:-rotate-12" />
            )}
          </button>

          {/* Quick Reseed / Reset Button */}
          <button
            onClick={handleReset}
            disabled={isResetting}
            title="Reset and reseed 250 deterministic demonstration cases"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/70 hover:bg-white/95 dark:bg-slate-800/90 dark:hover:bg-slate-700 text-[#18344D] dark:text-white text-[11px] sm:text-xs font-medium rounded-xl transition-all shadow-xs hover:shadow-glass disabled:opacity-50 border border-white/80 dark:border-white/10 active:scale-95 cursor-pointer shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#1687E8] dark:text-sky-400 ${isResetting ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isResetting ? 'Resetting...' : 'Reseed Demo'}</span>
            <span className="sm:hidden">{isResetting ? 'Resetting...' : 'Reseed'}</span>
          </button>

          {/* Collapse Header Button (Desktop View) */}
          <button
            onClick={() => toggleCollapse(true)}
            title="Collapse Header (Maximize Workspace View)"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-white/70 dark:bg-slate-800/60 hover:bg-white/95 dark:hover:bg-slate-800 border border-white/80 dark:border-slate-700/60 text-[#18344D] dark:text-slate-200 text-xs font-semibold rounded-xl transition-all shadow-xs hover:shadow-glass hover:scale-105 active:scale-95 cursor-pointer shrink-0"
          >
            <ChevronUp className="h-3.5 w-3.5 text-[#1687E8] dark:text-sky-400" />
            <span>Collapse</span>
          </button>
        </div>
      </header>

      {/* Floating Collapsed Header Island (Desktop View) */}
      {isCollapsed && (
        <div className="fixed top-3 right-6 z-40 hidden lg:flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/80 dark:bg-[#0c1829]/85 backdrop-blur-glass border border-white/85 dark:border-white/10 shadow-glass-lg text-xs animate-fadeIn transition-all text-[#18344D] dark:text-white">
          <div className="flex items-center gap-2 pr-3 border-r border-[#DDEFFF] dark:border-slate-700/80">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-[#18344D] dark:text-white max-w-[200px] truncate">
              {title}
            </span>
          </div>

          {/* Provenance Indicator */}
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#1687E8]/10 text-[#1264B3] dark:text-sky-300 border border-[#1687E8]/20">
            <span>{isSyntheticActive ? 'DEMO' : 'LIVE'}</span>
          </div>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-1.5 text-[#607D95] dark:text-slate-300 hover:text-[#18344D] dark:hover:text-white rounded-xl hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="h-3.5 w-3.5 text-amber-400" />
            ) : (
              <Moon className="h-3.5 w-3.5 text-[#1687E8]" />
            )}
          </button>

          {/* Quick Reseed */}
          <button
            onClick={handleReset}
            disabled={isResetting}
            title="Reset and reseed demo cases"
            className="p-1.5 text-[#607D95] dark:text-slate-300 hover:text-[#18344D] dark:hover:text-white rounded-xl hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#1687E8] dark:text-sky-400 ${isResetting ? 'animate-spin' : ''}`} />
          </button>

          {/* Expand Header Action */}
          <button
            onClick={() => toggleCollapse(false)}
            title="Expand Header"
            className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-[#1687E8] to-[#1264B3] hover:from-[#1479d4] hover:to-[#0f5499] text-white rounded-xl font-semibold shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ChevronDown className="h-3.5 w-3.5" />
            <span>Expand</span>
          </button>
        </div>
      )}
    </>
  );
};
