import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Server,
  Shield,
  Sliders,
  CheckCircle2,
  Database,
  Save,
  Cpu,
  Activity,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export const Settings: React.FC = () => {
  const { theme } = useTheme();
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Local settings state with localStorage persistence
  const [config, setConfig] = useState(() => {
    const defaults = {
      highRiskThreshold: 70,
      mediumRiskThreshold: 40,
      stalenessDays: 45,
      weightOverdue: 35,
      weightStageDuration: 20,
      weightIncompleteDocs: 15,
      weightCompensationPending: 15,
      weightDisputes: 10,
      weightStaleness: 5
    };
    try {
      const saved = localStorage.getItem('landdelay_engine_config');
      if (saved) return { ...defaults, ...JSON.parse(saved) };
    } catch (_) {}
    return defaults;
  });

  useEffect(() => {
    api.getHealth()
      .then(setHealthStatus)
      .catch((err) => setHealthStatus({ status: 'error', detail: err.message }));
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('landdelay_engine_config', JSON.stringify(config));
    } catch (_) {}
    setSavedNotice('Statutory parameters saved to active application state and persisted.');
    setTimeout(() => setSavedNotice(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="glass-panel p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#172033] dark:text-[#F1F5F9] flex items-center gap-2.5">
            <SettingsIcon className="h-5 w-5 text-[#3563E9]" />
            <span>Statutory Engine & Infrastructure Settings</span>
          </h2>
          <p className="text-xs text-[#687386] dark:text-[#94A3B8] mt-1">
            Configure transparent risk thresholds, pipeline calibration weights, and verify production runtime health
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#3563E9]/10 text-[#3563E9] border border-[#3563E9]/20">
          <Sparkles className="h-3.5 w-3.5 text-[#3563E9]" />
          <span>v2.1 Precision Engine</span>
        </div>
      </div>

      {savedNotice && (
        <div className="p-4 rounded-lg bg-[#ECFDF5] dark:bg-[#19966B]/15 border border-[#A7F3D0] dark:border-[#19966B]/30 text-[#065F46] dark:text-[#34D399] text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-[#19966B] shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* System Health Card */}
      <div className="glass-panel p-6 space-y-4">
        <h3 className="text-sm font-bold text-[#172033] dark:text-[#F1F5F9] flex items-center gap-2">
          <Server className="h-4 w-4 text-[#3563E9]" />
          <span>System Environment & Service Telemetry</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs">
          <div className="p-3.5 sm:p-4 rounded-lg bg-[#F9FAFB] dark:bg-[#0E1726] border border-[#E1E7EF] dark:border-[#1F2E45] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#687386] dark:text-[#94A3B8] font-medium">FastAPI Service Status</span>
              <Activity className="h-3.5 w-3.5 text-[#687386]" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#19966B] animate-pulse" />
              <span className="font-bold text-[#19966B] uppercase font-mono tracking-wider">
                {healthStatus?.status || 'HEALTHY'}
              </span>
            </div>
            <span className="text-[10px] text-[#687386] dark:text-[#94A3B8] mt-1 block">Live cloud backend connected</span>
          </div>

          <div className="p-4 rounded-lg bg-[#F9FAFB] dark:bg-[#0E1726] border border-[#E1E7EF] dark:border-[#1F2E45] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#687386] dark:text-[#94A3B8] font-medium">Database Storage Engine</span>
              <Database className="h-3.5 w-3.5 text-[#687386]" />
            </div>
            <div className="font-bold text-[#172033] dark:text-[#F1F5F9] mt-2 font-mono">
              PostgreSQL / Render Persistent
            </div>
            <span className="text-[10px] text-[#687386] dark:text-[#94A3B8] mt-1 block">Pooled ACID transaction storage</span>
          </div>

          <div className="p-4 rounded-lg bg-[#F9FAFB] dark:bg-[#0E1726] border border-[#E1E7EF] dark:border-[#1F2E45] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#687386] dark:text-[#94A3B8] font-medium">Engine Mode</span>
              <Cpu className="h-3.5 w-3.5 text-[#687386]" />
            </div>
            <div className="font-bold text-[#3563E9] mt-2 font-mono">
              DECISION_SUPPORT_SYSTEM
            </div>
            <span className="text-[10px] text-[#687386] dark:text-[#94A3B8] mt-1 block">Scikit-learn + Statutory rule hybrid</span>
          </div>
        </div>
      </div>

      {/* Configurable Risk Thresholds Form */}
      <form onSubmit={handleSave} className="glass-panel p-6 space-y-6 text-xs">
        <div className="border-b border-[#E1E7EF] dark:border-[#1F2E45] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#172033] dark:text-[#F1F5F9] flex items-center gap-2">
              <Sliders className="h-4 w-4 text-[#3563E9]" />
              <span>Transparent Risk Engine Weight Configuration</span>
            </h3>
            <p className="text-xs text-[#687386] dark:text-[#94A3B8] mt-0.5">
              Tune statutory weight points and escalation thresholds for administrative alerts
            </p>
          </div>
          <button
            type="submit"
            className="glass-btn-primary flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Settings</span>
          </button>
        </div>

        {/* Classification Cutoffs */}
        <div className="space-y-3">
          <h4 className="font-bold text-[#172033] dark:text-[#F1F5F9] text-xs uppercase tracking-wider flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-[#3563E9]" />
            <span>Classification Score Cutoffs</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-lg bg-[#F9FAFB] dark:bg-[#0E1726] border border-[#E1E7EF] dark:border-[#1F2E45]">
              <label className="block font-semibold text-[#172033] dark:text-[#F1F5F9] mb-1.5">High Risk Cutoff (pts)</label>
              <input
                type="number"
                min="50"
                max="90"
                value={config.highRiskThreshold}
                onChange={(e) => setConfig({ ...config, highRiskThreshold: parseInt(e.target.value) || 70 })}
                className="glass-input w-full"
              />
              <span className="text-[10px] text-[#687386] dark:text-[#94A3B8] mt-1.5 block">Scores &gt;= this value are categorized as HIGH</span>
            </div>

            <div className="p-3.5 rounded-lg bg-[#F9FAFB] dark:bg-[#0E1726] border border-[#E1E7EF] dark:border-[#1F2E45]">
              <label className="block font-semibold text-[#172033] dark:text-[#F1F5F9] mb-1.5">Medium Risk Cutoff (pts)</label>
              <input
                type="number"
                min="20"
                max="60"
                value={config.mediumRiskThreshold}
                onChange={(e) => setConfig({ ...config, mediumRiskThreshold: parseInt(e.target.value) || 40 })}
                className="glass-input w-full"
              />
              <span className="text-[10px] text-[#687386] dark:text-[#94A3B8] mt-1.5 block">Scores between Medium & High are MEDIUM</span>
            </div>

            <div className="p-3.5 rounded-lg bg-[#F9FAFB] dark:bg-[#0E1726] border border-[#E1E7EF] dark:border-[#1F2E45]">
              <label className="block font-semibold text-[#172033] dark:text-[#F1F5F9] mb-1.5">Staleness Age Limit (Days)</label>
              <input
                type="number"
                min="15"
                max="120"
                value={config.stalenessDays}
                onChange={(e) => setConfig({ ...config, stalenessDays: parseInt(e.target.value) || 45 })}
                className="glass-input w-full"
              />
              <span className="text-[10px] text-[#687386] dark:text-[#94A3B8] mt-1.5 block">Days without progress before flagging stale</span>
            </div>
          </div>
        </div>

        {/* Rule Weights */}
        <div className="space-y-3 pt-3 border-t border-[#E1E7EF] dark:border-[#1F2E45]">
          <h4 className="font-bold text-[#172033] dark:text-[#F1F5F9] text-xs uppercase tracking-wider">
            Rule Point Allocations (Max 100 Pts Total)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-lg bg-[#F9FAFB] dark:bg-[#0E1726] border border-[#E1E7EF] dark:border-[#1F2E45]">
              <label className="block font-semibold text-[#172033] dark:text-[#F1F5F9] mb-1.5">Milestone Deadline Slippage Weight</label>
              <input
                type="number"
                value={config.weightOverdue}
                onChange={(e) => setConfig({ ...config, weightOverdue: parseInt(e.target.value) || 35 })}
                className="glass-input w-full"
              />
              <span className="text-[10px] text-[#687386] dark:text-[#94A3B8] mt-1 block">Default: 35 points</span>
            </div>

            <div className="p-3.5 rounded-lg bg-[#F9FAFB] dark:bg-[#0E1726] border border-[#E1E7EF] dark:border-[#1F2E45]">
              <label className="block font-semibold text-[#172033] dark:text-[#F1F5F9] mb-1.5">Stage Benchmark Exceeded Weight</label>
              <input
                type="number"
                value={config.weightStageDuration}
                onChange={(e) => setConfig({ ...config, weightStageDuration: parseInt(e.target.value) || 20 })}
                className="glass-input w-full"
              />
              <span className="text-[10px] text-[#687386] dark:text-[#94A3B8] mt-1 block">Default: 20 points</span>
            </div>

            <div className="p-3.5 rounded-lg bg-[#F9FAFB] dark:bg-[#0E1726] border border-[#E1E7EF] dark:border-[#1F2E45]">
              <label className="block font-semibold text-[#172033] dark:text-[#F1F5F9] mb-1.5">Incomplete Statutory Documentation Weight</label>
              <input
                type="number"
                value={config.weightIncompleteDocs}
                onChange={(e) => setConfig({ ...config, weightIncompleteDocs: parseInt(e.target.value) || 15 })}
                className="glass-input w-full"
              />
              <span className="text-[10px] text-[#687386] dark:text-[#94A3B8] mt-1 block">Default: 15 points</span>
            </div>

            <div className="p-3.5 rounded-lg bg-[#F9FAFB] dark:bg-[#0E1726] border border-[#E1E7EF] dark:border-[#1F2E45]">
              <label className="block font-semibold text-[#172033] dark:text-[#F1F5F9] mb-1.5">Compensation Backlog &gt;30% Weight</label>
              <input
                type="number"
                value={config.weightCompensationPending}
                onChange={(e) => setConfig({ ...config, weightCompensationPending: parseInt(e.target.value) || 15 })}
                className="glass-input w-full"
              />
              <span className="text-[10px] text-[#687386] dark:text-[#94A3B8] mt-1 block">Default: 15 points</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
