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
    <header className="h-16 bg-white/65 dark:bg-slate-900/60 backdrop-blur-glass border-b border-white/60 dark:border-white/10 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-glass dark:shadow-glass-dark transition-colors duration-300">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors"
            title="Toggle Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div>
          <h2 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">{title}</h2>
          {subtitle && <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 font-medium">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Reset Feedback Notification */}
        {resetMsg && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl animate-fade-in backdrop-blur-xs">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{resetMsg}</span>
          </div>
        )}

        {/* Data Provenance Pill */}
        {isSyntheticActive ? (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 rounded-full text-[11px] sm:text-xs font-semibold backdrop-blur-xs">
            <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="hidden sm:inline">SYNTHETIC DEMO MODE</span>
            <span className="sm:hidden">DEMO</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 rounded-full text-[11px] sm:text-xs font-semibold backdrop-blur-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">VERIFIED PUBLIC DATA</span>
            <span className="sm:hidden">VERIFIED</span>
          </div>
        )}

        {/* System Online Status */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-mono backdrop-blur-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>API v1.0</span>
        </div>

        {/* Dark/Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Serene Light Mode' : 'Switch to Deep Navy Dark Mode'}
          className="p-2 bg-white/60 dark:bg-slate-800/60 hover:bg-white/90 dark:hover:bg-slate-800 border border-white/80 dark:border-slate-700/60 rounded-xl text-slate-700 dark:text-slate-200 transition-all shadow-xs hover:shadow-glass hover:scale-105 active:scale-95"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
          ) : (
            <Moon className="h-4 w-4 text-sky-600 transition-transform duration-300 rotate-0 hover:-rotate-12" />
          )}
        </button>

        {/* Quick Reseed / Reset Button */}
        <button
          onClick={handleReset}
          disabled={isResetting}
          title="Reset and reseed 250 deterministic demonstration cases"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 dark:bg-slate-800/90 hover:bg-slate-900 dark:hover:bg-slate-700 text-white text-[11px] sm:text-xs font-medium rounded-xl transition-all shadow-xs disabled:opacity-50 border border-white/10 active:scale-95"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isResetting ? 'Resetting...' : 'Reseed Demo'}</span>
          <span className="sm:hidden">Reset</span>
        </button>
      </div>
    </header>
  );
};
