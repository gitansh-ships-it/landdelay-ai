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
    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.92)',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(186, 230, 253, 0.7)',
    borderRadius: '12px',
    boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.4)' : '0 8px 32px rgba(2, 132, 199, 0.12)',
    backdropFilter: 'blur(12px)',
    color: isDark ? '#f1f5f9' : '#0f172a',
    fontSize: '12px'
  };

  if (loading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <RefreshCw className="h-8 w-8 text-sky-500 animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Computing live acquisition analytics...</p>
      </div>
    );
  }

  const kpis = summary?.kpis;
  const isZeroRecords = !kpis || kpis.total_cases === 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Filters Bar */}
      <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold text-sm">
          <Filter className="h-4 w-4 text-sky-600 dark:text-sky-400" />
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
              className="text-xs text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-semibold px-2 py-1 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {isZeroRecords ? (
        <div className="glass-panel p-12 text-center border-dashed">
          <ShieldAlert className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">No Acquisition Records Found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Cases */}
            <div className="glass-card p-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Cases</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{kpis.total_cases}</h3>
                <p className="text-[11px] text-sky-600 dark:text-sky-400 mt-0.5">Active acquisitions</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-sky-500/10 dark:bg-sky-400/15 border border-sky-400/20 flex items-center justify-center text-sky-600 dark:text-sky-400 shadow-xs">
                <Building className="h-5 w-5" />
              </div>
            </div>

            {/* High Risk Cases */}
            <div className="glass-card p-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">High Risk Cases</p>
                <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{kpis.high_risk_cases}</h3>
                <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-0.5">
                  {Math.round((kpis.high_risk_cases / kpis.total_cases) * 100)}% of total volume
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-rose-500/10 dark:bg-rose-400/15 border border-rose-400/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-xs">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>

            {/* Overdue Milestones */}
            <div className="glass-card p-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Overdue Milestones</p>
                <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{kpis.overdue_milestones_cases}</h3>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">Deadline slippage</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-amber-500/10 dark:bg-amber-400/15 border border-amber-400/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
                <Clock className="h-5 w-5" />
              </div>
            </div>

            {/* Acquisition Progress */}
            <div className="glass-card p-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Acquisition Progress</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{kpis.avg_acquisition_progress_pct}%</h3>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">Avg land handed over</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/15 border border-emerald-400/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>

            {/* Pending Actions */}
            <div className="glass-card p-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Actions</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{kpis.pending_actions_count}</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Directives queued</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-sky-600/10 dark:bg-sky-400/10 border border-sky-400/20 flex items-center justify-center text-sky-700 dark:text-sky-300 shadow-xs">
                <ListChecks className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Charts Row 1: Risk Distribution & Stage Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Risk Distribution Donut */}
            <div className="glass-panel p-6">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">Delay Risk Classification</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Transparent statutory rules-engine breakdown</p>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts?.risk_distribution || []}
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="name"
                    >
                      {charts?.risk_distribution?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={glassTooltipStyle} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stage Distribution Bar Chart */}
            <div className="glass-panel p-6 lg:col-span-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">Acquisition Stage Distribution</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Active cases per statutory stage with benchmark tracking</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={charts?.stage_distribution?.map(s => ({
                      ...s,
                      shortStage: s.stage.split(' ')[0] + ' ' + (s.stage.split(' ')[1] || '')
                    })) || []}
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(2,132,199,0.08)'} />
                    <XAxis
                      dataKey="shortStage"
                      tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }} />
                    <RechartsTooltip contentStyle={glassTooltipStyle} />
                    <Bar dataKey="count" name="Case Count" fill="#0284c7" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="avg_delay_days" name="Avg Delay Days" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2: Monthly Timeline & Top Projects */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Progression Area Chart */}
            <div className="glass-panel p-6 lg:col-span-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">Monthly Case Progression</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Case milestones initiated, completed, and delayed</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={charts?.monthly_progression || []}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="gradInitiated" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="gradDelayed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(2,132,199,0.08)'} />
                    <XAxis dataKey="month" tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }} />
                    <YAxis tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }} />
                    <RechartsTooltip contentStyle={glassTooltipStyle} />
                    <Area type="monotone" dataKey="cases_started" name="Initiated" stroke="#0284c7" strokeWidth={2} fill="url(#gradInitiated)" />
                    <Area type="monotone" dataKey="cases_delayed" name="Delayed" stroke="#f43f5e" strokeWidth={2} fill="url(#gradDelayed)" />
                    <Area type="monotone" dataKey="cases_completed" name="Completed" stroke="#10b981" strokeWidth={2} fill="url(#gradCompleted)" />
                    <Legend
                      formatter={(value) => <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{value}</span>}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Projects List */}
            <div className="glass-panel p-6">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">Top Infrastructure Corridors</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Projects with highest land acquisition volume</p>
              <div className="space-y-3">
                {charts?.top_projects?.map((proj) => (
                  <div
                    key={proj.project_id}
                    className="p-3 rounded-xl border border-sky-100/60 dark:border-white/5 bg-white/40 dark:bg-slate-800/40 hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[180px]">{proj.project_name}</span>
                      <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">{proj.total_cases} cases</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                      <span>Progress: {proj.avg_progress}%</span>
                      {proj.high_risk_count > 0 && (
                        <span className="text-rose-600 dark:text-rose-400 font-semibold">{proj.high_risk_count} High Risk</span>
                      )}
                    </div>
                    <div className="mt-1.5 w-full bg-slate-200/70 dark:bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-sky-500 to-blue-600 h-1.5 rounded-full transition-all duration-300 shadow-xs"
                        style={{ width: `${Math.min(100, proj.avg_progress)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Risk Alerts Table */}
          <div className="glass-panel overflow-hidden">
            <div className="p-5 border-b border-sky-100/60 dark:border-white/10 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Recent High-Risk Acquisition Alerts</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Parcels flagged by rules engine requiring administrative intervention</p>
              </div>
              <button
                onClick={() => navigate('/cases')}
                className="text-xs text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-semibold flex items-center gap-1 transition-colors"
              >
                <span>View Full Registry</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-sky-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 uppercase font-semibold text-[11px] border-b border-sky-100/60 dark:border-white/10">
                    <th className="py-3 px-4">Case ID</th>
                    <th className="py-3 px-4">Project & Location</th>
                    <th className="py-3 px-4">Current Stage</th>
                    <th className="py-3 px-4">Primary Risk Trigger</th>
                    <th className="py-3 px-4">Risk Level</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100/40 dark:divide-white/5">
                  {charts?.recent_alerts?.map((alert) => (
                    <tr
                      key={alert.case_id}
                      className="hover:bg-sky-50/40 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-sky-600 dark:text-sky-400">
                        {alert.case_id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 dark:text-slate-100">{alert.project_name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{alert.district}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{alert.current_stage}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-rose-50/90 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/50 text-[11px] font-medium">
                          {alert.primary_warning}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <RiskBadge category={alert.risk_category} score={alert.risk_score} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => navigate(`/cases/${alert.case_id}`)}
                          className="glass-btn-secondary text-xs px-2.5 py-1"
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
