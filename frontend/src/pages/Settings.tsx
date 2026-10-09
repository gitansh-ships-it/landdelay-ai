import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Server,
  Shield,
  Sliders,
  CheckCircle2,
  Database,
  Save,
  Info
} from 'lucide-react';
import { api } from '../services/api';

export const Settings: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Local settings state
  const [config, setConfig] = useState({
    highRiskThreshold: 70,
    mediumRiskThreshold: 40,
    stalenessDays: 45,
    weightOverdue: 35,
    weightStageDuration: 20,
    weightIncompleteDocs: 15,
    weightCompensationPending: 15,
    weightDisputes: 10,
    weightStaleness: 5
  });

  useEffect(() => {
    api.getHealth()
      .then(setHealthStatus)
      .catch((err) => setHealthStatus({ status: 'error', detail: err.message }));
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice('Statutory parameters saved to local application state.');
    setTimeout(() => setSavedNotice(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {savedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* System Health Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Server className="h-4 w-4 text-indigo-600" />
          <span>System Environment & Service Health</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-400 font-medium">FastAPI Service Status</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-emerald-700 uppercase font-mono">
                {healthStatus?.status || 'HEALTHY'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-400 font-medium">Database Storage Engine</span>
            <div className="font-bold text-slate-800 mt-1 font-mono">
              SQLite (Local Embedded DB)
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-400 font-medium">Engine Mode</span>
            <div className="font-bold text-indigo-700 mt-1 font-mono">
              DECISION_SUPPORT_SYSTEM
            </div>
          </div>
        </div>
      </div>

      {/* Configurable Risk Thresholds Form */}
      <form onSubmit={handleSave} className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6 text-xs">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-indigo-600" />
              <span>Transparent Risk Engine Weight Configuration</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tune statutory weight points and escalation thresholds for administrative alerts
            </p>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Settings</span>
          </button>
        </div>

        {/* Classification Cutoffs */}
        <div className="space-y-3">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Classification Score Cutoffs</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">High Risk Cutoff (pts)</label>
              <input
                type="number"
                min="50"
                max="90"
                value={config.highRiskThreshold}
                onChange={(e) => setConfig({ ...config, highRiskThreshold: parseInt(e.target.value) || 70 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
              <span className="text-[10px] text-slate-400">Scores &gt;= this value are categorized as HIGH</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Medium Risk Cutoff (pts)</label>
              <input
                type="number"
                min="20"
                max="60"
                value={config.mediumRiskThreshold}
                onChange={(e) => setConfig({ ...config, mediumRiskThreshold: parseInt(e.target.value) || 40 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
              <span className="text-[10px] text-slate-400">Scores between Medium & High are MEDIUM</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Staleness Age Limit (Days)</label>
              <input
                type="number"
                min="15"
                max="120"
                value={config.stalenessDays}
                onChange={(e) => setConfig({ ...config, stalenessDays: parseInt(e.target.value) || 45 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
              <span className="text-[10px] text-slate-400">Days without progress before flagging stale</span>
            </div>
          </div>
        </div>

        {/* Rule Weights */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Rule Point Allocations (Max 100 Pts)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Milestone Deadline Slippage Weight</label>
              <input
                type="number"
                value={config.weightOverdue}
                onChange={(e) => setConfig({ ...config, weightOverdue: parseInt(e.target.value) || 35 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Stage Benchmark Exceeded Weight</label>
              <input
                type="number"
                value={config.weightStageDuration}
                onChange={(e) => setConfig({ ...config, weightStageDuration: parseInt(e.target.value) || 20 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Incomplete Statutory Documentation Weight</label>
              <input
                type="number"
                value={config.weightIncompleteDocs}
                onChange={(e) => setConfig({ ...config, weightIncompleteDocs: parseInt(e.target.value) || 15 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Compensation Backlog &gt;30% Weight</label>
              <input
                type="number"
                value={config.weightCompensationPending}
                onChange={(e) => setConfig({ ...config, weightCompensationPending: parseInt(e.target.value) || 15 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
