import React, { useState } from 'react';
import { RefreshCw, ShieldCheck, Database, AlertCircle, CheckCircle2, Menu } from 'lucide-react';
import { api } from '../services/api';

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
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            title="Toggle Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div>
          <h2 className="text-sm sm:text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
          {subtitle && <p className="hidden sm:block text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Reset Feedback Notification */}
        {resetMsg && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-md animate-fade-in">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{resetMsg}</span>
          </div>
        )}

        {/* Data Provenance Pill */}
        {isSyntheticActive ? (
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-[11px] sm:text-xs font-semibold shadow-xs">
            <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span className="hidden sm:inline">SYNTHETIC DEMO MODE</span>
            <span className="sm:hidden">DEMO</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-[11px] sm:text-xs font-semibold shadow-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span className="hidden sm:inline">VERIFIED PUBLIC DATA</span>
            <span className="sm:hidden">VERIFIED</span>
          </div>
        )}

        {/* System Online Status */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-xs font-mono">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>API v1.0.0</span>
        </div>

        {/* Quick Reseed / Reset Button */}
        <button
          onClick={handleReset}
          disabled={isResetting}
          title="Reset and reseed 250 deterministic demonstration cases"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-[11px] sm:text-xs font-medium rounded-lg transition-colors shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isResetting ? 'Resetting...' : 'Reseed Demo'}</span>
          <span className="sm:hidden">Reset</span>
        </button>
      </div>
    </header>
  );
};
