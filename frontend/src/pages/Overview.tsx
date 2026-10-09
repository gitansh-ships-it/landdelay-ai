import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  TrendingUp,
  Filter,
  ArrowRight,
  ShieldAlert,
  Building,
  RefreshCw,
  ListChecks,
  Sparkles
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area
} from 'recharts';
import { api } from '../services/api';
import { DashboardSummary, DashboardCharts } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { useTheme } from '../context/ThemeContext';

export const Overview: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { refreshTrigger } = useOutletContext<{ refreshTrigger: number }>() || { refreshTrigger: 0 };

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);

  // Filters
  const [filters, setFilters] = useState({
    project: '',
    district: '',
    stage: '',
    risk_category: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const cleanedFilters: Record<string, string> = {};
      Object.entries(filters).forEach(([k, v]) => {
        if (v) cleanedFilters[k] = v;
      });

      const [summarySettled, chartsSettled] = await Promise.allSettled([
        api.getDashboardSummary(cleanedFilters),
        api.getDashboardCharts(cleanedFilters)
      ]);

      if (summarySettled.status === 'fulfilled') {
        setSummary(summarySettled.value);
      }
      if (chartsSettled.status === 'fulfilled') {
        setCharts(chartsSettled.value);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters, refreshTrigger]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ project: '', district: '', stage: '', risk_category: '' });
  };

  const isDark = theme === 'dark';
  const glassTooltipStyle = {
    backgroundColor: isDark ? 'rgba(15, 28, 48, 0.95)' : 'rgba(255, 255, 255, 0.94)',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.85)',
    borderRadius: '12px',
    boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.5)' : '0 8px 32px rgba(18, 100, 179, 0.12)',
    backdropFilter: 'blur(16px)',
    color: isDark ? '#E2EEF9' : '#18344D',
    fontSize: '12px'
  };

  if (loading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <RefreshCw className="h-8 w-8 text-[#1687E8] animate-spin" />
        <p className="text-sm text-[#607D95] dark:text-slate-400 font-medium">Computing live acquisition analytics...</p>
      </div>
    );
  }

  const kpis = summary?.kpis;
  const isZeroRecords = !kpis || kpis.total_cases === 0;

  // Monthly summary metrics for the progression header
  const totalStarted = charts?.monthly_progression?.reduce((acc, m) => acc + (m.cases_started || 0), 0) || 0;
  const totalDelayed = charts?.monthly_progression?.reduce((acc, m) => acc + (m.cases_delayed || 0), 0) || 0;
  const totalCompleted = charts?.monthly_progression?.reduce((acc, m) => acc + (m.cases_completed || 0), 0) || 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Filters Bar */}
      <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-[#18344D] dark:text-slate-200 font-semibold text-sm">
          <Filter className="h-4 w-4 text-[#1687E8]" />
          <span>Filter Corridors:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search Project..."
            value={filters.project}
            onChange={(e) => handleFilterChange('project', e.target.value)}
            className="glass-input text-xs px-3 py-1.5 w-40"
          />

          <input
            type="text"
            placeholder="District..."
            value={filters.district}
            onChange={(e) => handleFilterChange('district', e.target.value)}
            className="glass-input text-xs px-3 py-1.5 w-36"
          />

          <select
            value={filters.stage}
            onChange={(e) => handleFilterChange('stage', e.target.value)}
            className="glass-input text-xs px-3 py-1.5"
          >
            <option value="">All Stages</option>
            <option value="Preliminary Notification">Preliminary Notification</option>
            <option value="Survey & Boundary Demarcation">Survey & Demarcation</option>
            <option value="Public Hearing & Objections">Public Hearing</option>
            <option value="Declaration & Final Scheme">Declaration</option>
            <option value="Valuation & Award Determination">Valuation & Award</option>
            <option value="Compensation Disbursement">Compensation</option>
            <option value="Possession & Physical Handover">Possession & Handover</option>
          </select>

          <select
            value={filters.risk_category}
            onChange={(e) => handleFilterChange('risk_category', e.target.value)}
            className="glass-input text-xs px-3 py-1.5"
          >
            <option value="">All Risk Levels</option>
            <option value="HIGH">High Risk Only</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </select>

          {(filters.project || filters.district || filters.stage || filters.risk_category) && (
            <button
              onClick={clearFilters}
              className="text-xs text-[#1687E8] hover:text-[#1264B3] dark:text-sky-400 dark:hover:text-sky-300 font-semibold px-2 py-1 transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {isZeroRecords ? (
        <div className="glass-panel p-12 text-center border-dashed">
          <ShieldAlert className="h-12 w-12 text-[#607D95] mx-auto mb-4" />
          <h3 className="text-base font-bold text-[#18344D] dark:text-slate-100">No Acquisition Records Found</h3>
          <p className="text-sm text-[#607D95] dark:text-slate-400 mt-1 max-w-md mx-auto">
            The database matches no records with current filter settings, or has not been seeded yet.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={clearFilters}
              className="glass-btn-secondary text-xs px-4 py-2"
            >
              Clear Filters
            </button>
            <button
              onClick={() => navigate('/data')}
              className="glass-btn-primary text-xs px-4 py-2"
            >
              Import Data / Seed Demo
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Cases */}
            <div className="glass-card flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-[#607D95] dark:text-[#A8BED2] uppercase tracking-wider">Total Cases</p>
                <h3 className="text-2xl font-bold text-[#18344D] dark:text-[#EDF6FF] mt-1">{kpis.total_cases}</h3>
                <p className="text-[11px] text-[#1687E8] dark:text-[#56B4F5] mt-0.5">Active acquisitions</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-[#1687E8]/10 dark:bg-sky-500/15 border border-[#1687E8]/20 flex items-center justify-center text-[#1264B3] dark:text-[#56B4F5] shadow-xs">
                <Building className="h-5 w-5" />
              </div>
            </div>

            {/* High Risk Cases */}
            <div className="glass-card flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-[#607D95] dark:text-[#A8BED2] uppercase tracking-wider">High Risk Cases</p>
                <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{kpis.high_risk_cases}</h3>
                <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                  {Math.round((kpis.high_risk_cases / kpis.total_cases) * 100)}% of total volume
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-400/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-xs">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>

            {/* Overdue Milestones */}
            <div className="glass-card flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-[#607D95] dark:text-[#A8BED2] uppercase tracking-wider">Overdue Milestones</p>
                <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{kpis.overdue_milestones_cases}</h3>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">Deadline slippage</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
                <Clock className="h-5 w-5" />
              </div>
            </div>

            {/* Acquisition Progress */}
            <div className="glass-card flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-[#607D95] dark:text-[#A8BED2] uppercase tracking-wider">Acquisition Progress</p>
                <h3 className="text-2xl font-bold text-[#18344D] dark:text-[#EDF6FF] mt-1">{kpis.avg_acquisition_progress_pct}%</h3>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">Avg land handed over</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>

            {/* Pending Actions */}
            <div className="glass-card flex items-center justify-between sm:col-span-2 lg:col-span-1">
              <div>
                <p className="text-[11px] font-semibold text-[#607D95] dark:text-[#A8BED2] uppercase tracking-wider">Pending Actions</p>
                <h3 className="text-2xl font-bold text-[#18344D] dark:text-[#EDF6FF] mt-1">{kpis.pending_actions_count}</h3>
                <p className="text-[11px] text-[#607D95] dark:text-[#A8BED2] mt-0.5">Directives queued</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-[#1264B3]/10 border border-[#1264B3]/20 flex items-center justify-center text-[#1264B3] dark:text-sky-300 shadow-xs">
                <ListChecks className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Charts Row 1: Risk Distribution & Stage Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Risk Distribution Donut */}
            <div className="glass-panel p-6 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#18344D] dark:text-[#EDF6FF] mb-0.5">Delay Risk Classification</h4>
                <p className="text-xs text-[#607D95] dark:text-[#A8BED2] mb-4">Statutory rules-engine breakdown</p>
              </div>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts?.risk_distribution || []}
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="name"
                      animationDuration={500}
                      animationEasing="ease-out"
                    >
                      {charts?.risk_distribution?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={glassTooltipStyle} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span className="text-xs text-[#18344D] dark:text-[#EDF6FF] font-medium">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stage Distribution Bar Chart */}
            <div className="glass-panel p-6 lg:col-span-2 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#18344D] dark:text-[#EDF6FF] mb-0.5">Acquisition Stage Distribution</h4>
                <p className="text-xs text-[#607D95] dark:text-[#A8BED2] mb-4">Active cases per statutory stage with benchmark tracking</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={charts?.stage_distribution?.map(s => ({
                      ...s,
                      shortStage: s.stage.split(' ')[0] + ' ' + (s.stage.split(' ')[1] || '')
                    })) || []}
                    margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(22,135,232,0.08)'} />
                    <XAxis
                      dataKey="shortStage"
                      tick={{ fill: isDark ? '#A8BED2' : '#607D95', fontSize: 10 }}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fill: isDark ? '#A8BED2' : '#607D95', fontSize: 11 }} width={30} />
                    <RechartsTooltip contentStyle={glassTooltipStyle} />
                    <Bar dataKey="count" name="Case Count" fill="#1687E8" radius={[6, 6, 0, 0]} animationDuration={450} animationEasing="ease-out" />
                    <Bar dataKey="avg_delay_days" name="Avg Delay Days" fill="#f59e0b" radius={[6, 6, 0, 0]} animationDuration={450} animationEasing="ease-out" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2: Monthly Timeline & Top Projects */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Progression Area Chart with Header Summary Strip */}
            <div className="glass-panel p-6 lg:col-span-2 flex flex-col justify-between">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <h4 className="text-sm font-bold text-[#18344D] dark:text-[#EDF6FF] mb-0.5">Monthly Case Progression</h4>
                  <p className="text-xs text-[#607D95] dark:text-[#A8BED2]">Milestone velocity: initiated, delayed, and completed</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#1687E8]/10 text-[#1264B3] dark:text-[#56B4F5] border border-[#1687E8]/20">
                    Initiated: {totalStarted}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-400/20">
                    Delayed: {totalDelayed}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-400/20">
                    Completed: {totalCompleted}
                  </span>
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={charts?.monthly_progression || []}
                    margin={{ top: 10, right: 15, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="gradInitiated" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1687E8" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#1687E8" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="gradDelayed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(22,135,232,0.08)'} />
                    <XAxis dataKey="month" tick={{ fill: isDark ? '#A8BED2' : '#607D95', fontSize: 11 }} />
                    <YAxis tick={{ fill: isDark ? '#A8BED2' : '#607D95', fontSize: 11 }} width={30} />
                    <RechartsTooltip contentStyle={glassTooltipStyle} />
                    <Area type="monotone" dataKey="cases_started" name="Initiated" stroke="#1687E8" strokeWidth={2} fill="url(#gradInitiated)" animationDuration={500} animationEasing="ease-out" />
                    <Area type="monotone" dataKey="cases_delayed" name="Delayed" stroke="#ef4444" strokeWidth={2} fill="url(#gradDelayed)" animationDuration={500} animationEasing="ease-out" />
                    <Area type="monotone" dataKey="cases_completed" name="Completed" stroke="#10b981" strokeWidth={2} fill="url(#gradCompleted)" animationDuration={500} animationEasing="ease-out" />
                    <Legend
                      formatter={(value) => <span className="text-xs text-[#18344D] dark:text-[#EDF6FF] font-medium">{value}</span>}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Projects List */}
            <div className="glass-panel p-6 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#18344D] dark:text-white mb-0.5">Top Infrastructure Corridors</h4>
                <p className="text-xs text-[#607D95] dark:text-slate-400 mb-4">Highest land acquisition volume</p>
              </div>
              <div className="space-y-2.5">
                {charts?.top_projects?.map((proj) => (
                  <div
                    key={proj.project_id}
                    className="p-3 rounded-xl border border-white/80 dark:border-white/10 bg-white/45 dark:bg-slate-800/40 hover:bg-white/75 dark:hover:bg-slate-800/70 transition-all duration-200 shadow-xs"
                  >
                    <div className="flex items-center justify-between text-xs gap-2">
                      <span className="font-semibold text-[#18344D] dark:text-slate-100 truncate flex-1" title={proj.project_name}>
                        {proj.project_name}
                      </span>
                      <span className="text-[#607D95] dark:text-slate-400 font-mono text-[11px] shrink-0 font-medium">
                        {proj.total_cases} cases
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-[#607D95] dark:text-slate-300">
                      <span className="font-medium">Progress: <strong className="text-[#18344D] dark:text-white font-semibold">{proj.avg_progress}%</strong></span>
                      {proj.high_risk_count > 0 ? (
                        <span className="text-rose-600 dark:text-rose-400 font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-[10px] border border-rose-400/20">
                          {proj.high_risk_count} High Risk
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-[10px] border border-emerald-400/20">
                          On Track
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 w-full bg-[#DDEFFF] dark:bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#1687E8] to-[#1264B3] h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, proj.avg_progress)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Risk Alerts Table */}
          <div className="glass-data-surface">
            <div className="p-5 border-b border-[#DDEFFF] dark:border-white/10 flex items-center justify-between bg-white/40 dark:bg-black/20">
              <div>
                <h4 className="text-sm font-bold text-[#18344D] dark:text-white">Recent High-Risk Acquisition Alerts</h4>
                <p className="text-xs text-[#607D95] dark:text-slate-400">Parcels flagged by rules engine requiring administrative intervention</p>
              </div>
              <button
                onClick={() => navigate('/cases')}
                className="text-xs text-[#1687E8] hover:text-[#1264B3] dark:text-sky-400 dark:hover:text-sky-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View Full Registry</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[680px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#EAF6FF]/80 dark:bg-slate-800/60 text-[#607D95] dark:text-slate-300 uppercase font-semibold text-[11px] border-b border-[#DDEFFF] dark:border-white/10">
                    <th className="py-3 px-4 min-w-[120px] whitespace-nowrap">Case ID</th>
                    <th className="py-3 px-4 min-w-[180px]">Project & Location</th>
                    <th className="py-3 px-4 min-w-[160px]">Current Stage</th>
                    <th className="py-3 px-4 min-w-[160px]">Primary Risk Trigger</th>
                    <th className="py-3 px-4 min-w-[100px]">Risk Level</th>
                    <th className="py-3 px-4 text-right min-w-[80px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDEFFF]/60 dark:divide-white/5">
                  {charts?.recent_alerts?.map((alert) => (
                    <tr
                      key={alert.case_id}
                      className="hover:bg-[#EAF6FF]/50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#1687E8] dark:text-sky-400">
                        {alert.case_id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#18344D] dark:text-slate-100">{alert.project_name}</div>
                        <div className="text-[11px] text-[#607D95] dark:text-slate-400">{alert.district}</div>
                      </td>
                      <td className="py-3 px-4 text-[#18344D] dark:text-slate-300 font-medium">{alert.current_stage}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-400/25 text-[11px] font-medium">
                          {alert.primary_warning}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <RiskBadge category={alert.risk_category} score={alert.risk_score} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => navigate(`/cases/${alert.case_id}`)}
                          className="glass-btn-secondary text-xs px-2.5 py-1 cursor-pointer"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
