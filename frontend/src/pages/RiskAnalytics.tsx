import React, { useState, useEffect } from 'react';
import {
  Sliders
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { api } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';
import { useTheme } from '../context/ThemeContext';

export const RiskAnalytics: React.FC = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<any[]>([]);

  // Interactive Risk Simulator State
  const [simState, setSimState] = useState({
    daysOverdue: 15,
    daysInStage: 80,
    stageBenchmark: 60,
    compPendingPct: 45,
    openDisputes: 2,
    docsIncomplete: true,
    staleDays: 30
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.getCases({ page: 1, page_size: 500 });
      setCases(res.items);
    } catch (err) {
      console.error('Failed to load risk cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isDark = theme === 'dark';
  const enterpriseTooltipStyle = {
    backgroundColor: isDark ? '#121E31' : '#FFFFFF',
    borderColor: isDark ? '#1F2E45' : '#E1E7EF',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    color: isDark ? '#F1F5F9' : '#172033',
    fontSize: '12px',
    padding: '8px 12px'
  };

  // Compute live aggregates from database records
  const riskRanges = [
    { range: '0-20', label: 'Minimal (0-20 pts)', count: 0, color: '#19966B' },
    { range: '21-40', label: 'Low (21-40 pts)', count: 0, color: '#19966B' },
    { range: '41-60', label: 'Medium (41-60 pts)', count: 0, color: '#E9A23B' },
    { range: '61-80', label: 'Elevated (61-80 pts)', count: 0, color: '#DC3545' },
    { range: '81-100', label: 'Critical (81-100 pts)', count: 0, color: '#DC3545' }
  ];

  cases.forEach(c => {
    const s = c.risk_score;
    if (s <= 20) riskRanges[0].count++;
    else if (s <= 40) riskRanges[1].count++;
    else if (s <= 60) riskRanges[2].count++;
    else if (s <= 80) riskRanges[3].count++;
    else riskRanges[4].count++;
  });

  // Rule Trigger Prevalence
  let overdueCount = 0;
  let compPendingCount = 0;
  let disputesCount = 0;
  let docsIncompleteCount = 0;

  cases.forEach(c => {
    if (c.delay_days > 0) overdueCount++;
    if ((c.compensation_pending_pct ?? 0) > 30) compPendingCount++;
    if (c.open_dispute_count > 0) disputesCount++;
    if (c.documents_incomplete) docsIncompleteCount++;
  });

  const ruleTriggersData = [
    { rule: 'Milestone Deadline Slippage', count: overdueCount, weight: '35 pts' },
    { rule: 'Compensation >30% Unreleased', count: compPendingCount, weight: '15 pts' },
    { rule: 'Active Land Disputes / Litigation', count: disputesCount, weight: '10 pts' },
    { rule: 'Missing Title / Gazette Documents', count: docsIncompleteCount, weight: '15 pts' },
  ];

  // Simulator Rule Engine calculation
  const calcSimRisk = () => {
    let score = 0;
    const warnings = [];

    if (simState.daysOverdue > 0) {
      const overdueWeight = simState.daysOverdue > 60 ? 40.0 : 35.0;
      score += overdueWeight;
      warnings.push(`Milestone deadline exceeded by ${simState.daysOverdue} days.`);
    }

    if (simState.daysInStage > simState.stageBenchmark) {
      const ratio = simState.daysInStage / simState.stageBenchmark;
      const stageWeight = Math.min(20.0, Math.max(5.0, 20.0 * (ratio - 1.0)));
      score += stageWeight;
      warnings.push(`Stage benchmark exceeded by ${simState.daysInStage - simState.stageBenchmark} days.`);
    }

    if (simState.docsIncomplete) {
      score += 15.0;
      warnings.push('Statutory title records incomplete.');
    }

    if (simState.compPendingPct > 30.0) {
      score += 15.0 * (simState.compPendingPct / 100.0);
      warnings.push(`${simState.compPendingPct}% compensation pending release.`);
    }

    if (simState.openDisputes > 0) {
      score += Math.min(15.0, simState.openDisputes * 5.0);
      warnings.push(`${simState.openDisputes} active dispute(s) recorded.`);
    }

    if (simState.staleDays > 45) {
      score += 5.0;
      warnings.push(`Record stale by ${simState.staleDays} days.`);
    }

    if (simState.daysOverdue >= 30 && score < 70) {
      score = 70.0;
      warnings.push('Automatic High Risk override triggered: overdue >= 30 days.');
    }

    const finalScore = Math.min(100.0, Math.max(0.0, Math.round(score * 10) / 10));
    const cat = finalScore >= 70 ? 'HIGH' : (finalScore >= 40 ? 'MEDIUM' : 'LOW');

    return { score: finalScore, category: cat as 'HIGH' | 'MEDIUM' | 'LOW', warnings };
  };

  const simResult = calcSimRisk();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Score Frequency Histogram */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-bold text-[#172033] dark:text-[#F1F5F9]">Portfolio Delay Risk Histogram</h4>
            <span className="text-xs text-[#687386] dark:text-[#94A3B8] font-mono">Sample: {cases.length} parcels (100% Coverage)</span>
          </div>
          <p className="text-xs text-[#687386] dark:text-[#94A3B8] mb-4">Distribution of transparent composite risk scores across portfolio</p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
              <BarChart data={riskRanges} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1F2E45' : '#E1E7EF'} />
                <XAxis dataKey="range" tick={{ fill: isDark ? '#94A3B8' : '#687386', fontSize: 11 }} interval={0} />
                <YAxis tick={{ fill: isDark ? '#94A3B8' : '#687386', fontSize: 11 }} width={30} />
                <Tooltip
                  contentStyle={enterpriseTooltipStyle}
                  formatter={(val: any, _name: any, item: any) => [`${val} cases`, item.payload.label || 'Risk Tier']}
                />
                <Bar dataKey="count" name="Case Count" fill="#3563E9" radius={[4, 4, 0, 0]} animationDuration={400} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rule Trigger Prevalence */}
        <div className="glass-panel p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 mb-1">
            <h4 className="text-sm font-bold text-[#172033] dark:text-[#F1F5F9]">Statutory Rule Trigger Frequency</h4>
            <span className="self-start sm:self-auto text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-[#3563E9]/10 text-[#3563E9] border border-[#3563E9]/20">
              Configured Engine v1.0
            </span>
          </div>
          <p className="text-xs text-[#687386] dark:text-[#94A3B8] mb-4">Number of active cases triggering specific statutory alerts</p>

          <div className="space-y-3">
            {ruleTriggersData.map((rt, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-[#E1E7EF] dark:border-[#1F2E45] bg-[#F9FAFB] dark:bg-[#0E1726]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <span className="font-semibold text-[#172033] dark:text-[#F1F5F9] leading-snug">{rt.rule}</span>
                  <span className="font-mono text-[#3563E9] font-bold shrink-0 self-start sm:self-auto">{rt.count} / {cases.length} cases</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-[#687386] dark:text-[#94A3B8]">
                  <span>Engine Weight: {rt.weight}</span>
                  <span className="font-medium text-[#172033] dark:text-[#F1F5F9]">{cases.length > 0 ? Math.round((rt.count / cases.length) * 100) : 0}% prevalence</span>
                </div>
                <div className="mt-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#3563E9] h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${cases.length > 0 ? Math.min(100, (rt.count / cases.length) * 100) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Risk Engine Simulator / Sandbox */}
      <div className="glass-panel p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E1E7EF] dark:border-[#1F2E45] pb-4">
          <div>
            <h4 className="text-sm font-bold text-[#172033] dark:text-[#F1F5F9] flex items-center gap-2">
              <Sliders className="h-4 w-4 text-[#3563E9] shrink-0" />
              <span>Interactive Transparent Risk Engine Simulator</span>
            </h4>
            <p className="text-xs text-[#687386] dark:text-[#94A3B8]">
              Simulate how specific statutory bottlenecks and mitigations impact the computed delay score
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold text-[#687386] dark:text-[#94A3B8]">Live Result:</span>
            <RiskBadge category={simResult.category} score={simResult.score} size="md" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls Column */}
          <div className="lg:col-span-2 space-y-5 text-xs">
            {/* Days Overdue Slider */}
            <div>
              <div className="flex justify-between font-semibold text-[#172033] dark:text-[#F1F5F9] mb-1">
                <span>Milestone Deadline Slippage:</span>
                <span className="font-mono text-[#3563E9] font-bold">{simState.daysOverdue} days</span>
              </div>
              <input
                type="range"
                min="0"
                max="120"
                value={simState.daysOverdue}
                onChange={(e) => setSimState({ ...simState, daysOverdue: parseInt(e.target.value) })}
                className="w-full accent-[#3563E9]"
              />
              <span className="text-[10px] text-[#687386] dark:text-[#94A3B8]">Rule threshold: &gt;0 days adds 35 pts; &gt;=30 days forces High Risk</span>
            </div>

            {/* Compensation Pending Slider */}
            <div>
              <div className="flex justify-between font-semibold text-[#172033] dark:text-[#F1F5F9] mb-1">
                <span>Undisbursed Compensation:</span>
                <span className="font-mono text-[#3563E9] font-bold">{simState.compPendingPct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={simState.compPendingPct}
                onChange={(e) => setSimState({ ...simState, compPendingPct: parseInt(e.target.value) })}
                className="w-full accent-[#3563E9]"
              />
              <span className="text-[10px] text-[#687386] dark:text-[#94A3B8]">Rule threshold: &gt;30% scales up to 15 pts</span>
            </div>

            {/* Active Disputes Slider */}
            <div>
              <div className="flex justify-between font-semibold text-[#172033] dark:text-[#F1F5F9] mb-1">
                <span>Active Boundary Contestation / Court Injunctions:</span>
                <span className="font-mono text-[#3563E9] font-bold">{simState.openDisputes} disputes</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                value={simState.openDisputes}
                onChange={(e) => setSimState({ ...simState, openDisputes: parseInt(e.target.value) })}
                className="w-full accent-[#3563E9]"
              />
              <span className="text-[10px] text-[#687386] dark:text-[#94A3B8]">Each litigation case adds 5 pts up to 15 pts max</span>
            </div>

            {/* Incomplete Docs Toggle */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F9FAFB] dark:bg-[#0E1726] border border-[#E1E7EF] dark:border-[#1F2E45]">
              <input
                type="checkbox"
                id="simDoc"
                checked={simState.docsIncomplete}
                onChange={(e) => setSimState({ ...simState, docsIncomplete: e.target.checked })}
                className="h-4 w-4 rounded text-[#3563E9] border-[#E1E7EF] dark:border-[#1F2E45] bg-white dark:bg-[#0E1726]"
              />
              <label htmlFor="simDoc" className="text-[#172033] dark:text-[#F1F5F9] font-medium cursor-pointer">
                Statutory Gazette / Land Title Documentation Incomplete (+15 pts)
              </label>
            </div>
          </div>

          {/* Result Card */}
          <div className="glass-card p-6 flex flex-col justify-between">
            <div>
              <div className="text-xs font-semibold text-[#687386] dark:text-[#94A3B8] uppercase tracking-wider">Simulated Output</div>
              <div className="text-4xl font-extrabold text-[#172033] dark:text-[#F1F5F9] mt-2 font-mono">
                {simResult.score} <span className="text-sm font-normal text-[#687386] dark:text-[#94A3B8]">/ 100</span>
              </div>
              <div className="mt-2">
                <RiskBadge category={simResult.category} size="md" />
              </div>

              <div className="mt-4 space-y-1.5">
                <p className="text-xs font-semibold text-[#172033] dark:text-[#F1F5F9]">Triggered Warnings:</p>
                {simResult.warnings.map((w, i) => (
                  <div key={i} className="text-[11px] text-[#DC3545] bg-[#FEF2F2] dark:bg-[#DC3545]/15 p-2 rounded-lg border border-[#FECACA] dark:border-[#DC3545]/30">
                    • {w}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E1E7EF] dark:border-[#1F2E45] text-[11px] text-[#687386] dark:text-[#94A3B8]">
              <p className="font-semibold text-[#172033] dark:text-[#F1F5F9]">Transparent Rule Principle:</p>
              Mathematical, audit-compliant rules prevent arbitrary decisions and ensure clear justification for all administrative escalations.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
