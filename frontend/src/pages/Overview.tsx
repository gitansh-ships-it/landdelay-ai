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
  ListChecks
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
import { LoadingScreen } from '../components/LoadingScreen';

export const Overview: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { refreshTrigger } = useOutletContext<{ refreshTrigger: number }>() || { refreshTrigger: 0 };

  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
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
      setInitError(null);
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
      } else {
        const msg = (summarySettled.reason as Error)?.message || 'Failed to fetch summary';
        setInitError(msg);
      }

      if (chartsSettled.status === 'fulfilled') {
        setCharts(chartsSettled.value);
      }
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setInitError(err?.message || 'Network connection error');
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
  const enterpriseTooltipStyle = {
    backgroundColor: isDark ? '#121E31' : '#FFFFFF',
    borderColor: isDark ? '#1F2E45' : '#E1E7EF',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    color: isDark ? '#F1F5F9' : '#172033',
    fontSize: '12px',
    padding: '8px 12px'
  };

  if ((loading && !summary) || (initError && !summary)) {
    return (
      <LoadingScreen
        message="Preparing your workspace..."
        error={initError}
        onRetry={fetchData}
      />
    );
  }

  const kpis = summary?.kpis;
  const isZeroRecords = !kpis || kpis.total_cases === 0;

  // Monthly summary metrics for the progression header
  const totalStarted = charts?.monthly_progression?.reduce((acc, m) => acc + (m.cases_started || 0), 0) || 0;
  const totalDelayed = charts?.monthly_progression?.reduce((acc, m) => acc + (m.cases_delayed || 0), 0) || 0;
  const totalCompleted = charts?.monthly_progression?.reduce((acc, m) => acc + (m.cases_completed || 0), 0) || 0;

  // Color mapper for risk categories
  const getRiskColor = (name: string, fallback: string) => {
    const upper = name?.toUpperCase() || '';
    if (upper.includes('HIGH')) return '#DC3545';
    if (upper.includes('MED')) return '#E9A23B';
    if (upper.includes('LOW')) return '#19966B';
    return fallback;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Filters Bar */}
      <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-[#172033] dark:text-[#F1F5F9] font-semibold text-sm">
          <Filter className="h-4 w-4 text-[#3563E9]" />
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
              className="text-xs text-[#3563E9] hover:text-[#2B52C6] font-semibold px-2 py-1 transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {isZeroRecords ? (
        <div className="glass-panel p-12 text-center border-dashed">
          <ShieldAlert className="h-12 w-12 text-[#687386] mx-auto mb-4" />
          <h3 className="text-base font-bold text-[#172033] dark:text-[#F1F5F9]">No Acquisition Records Found</h3>
          <p className="text-sm text-[#687386] dark:text-[#94A3B8] mt-1 max-w-md mx-auto">
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
          {/* KPI Cards Row: 2-column compact on mobile, 5-column on desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4">
            {/* Total Cases */}
            <div className="glass-card p-3 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-[11px] font-semibold text-[#687386] dark:text-[#94A3B8] uppercase tracking-wider">Total Cases</p>
                <h3 className="text-xl sm:text-2xl font-bold text-[#172033] dark:text-[#F1F5F9] mt-0.5 sm:mt-1">{kpis.total_cases}</h3>
                <p className="text-[10px] sm:text-[11px] text-[#3563E9] mt-0.5 font-medium truncate">Active acquisitions</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-[#3563E9]/10 border border-[#3563E9]/20 flex items-center justify-center text-[#3563E9] shadow-xs shrink-0">
                <Building className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>

            {/* High Risk Cases */}
            <div className="glass-card p-3 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-[11px] font-semibold text-[#687386] dark:text-[#94A3B8] uppercase tracking-wider">High Risk</p>
                <h3 className="text-xl sm:text-2xl font-bold text-[#DC3545] mt-0.5 sm:mt-1">{kpis.high_risk_cases}</h3>
                <p className="text-[10px] sm:text-[11px] text-[#DC3545] mt-0.5 font-medium truncate">
                  {Math.round((kpis.high_risk_cases / kpis.total_cases) * 100)}% of total
                </p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-[#DC3545]/10 border border-[#DC3545]/20 flex items-center justify-center text-[#DC3545] shadow-xs shrink-0">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>

            {/* Overdue Milestones */}
            <div className="glass-card p-3 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-[11px] font-semibold text-[#687386] dark:text-[#94A3B8] uppercase tracking-wider">Overdue</p>
                <h3 className="text-xl sm:text-2xl font-bold text-[#E9A23B] mt-0.5 sm:mt-1">{kpis.overdue_milestones_cases}</h3>
                <p className="text-[10px] sm:text-[11px] text-[#E9A23B] mt-0.5 font-medium truncate">Deadline slip</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-[#E9A23B]/10 border border-[#E9A23B]/20 flex items-center justify-center text-[#E9A23B] shadow-xs shrink-0">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>

            {/* Acquisition Progress */}
            <div className="glass-card p-3 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-[11px] font-semibold text-[#687386] dark:text-[#94A3B8] uppercase tracking-wider">Acquisition</p>
                <h3 className="text-xl sm:text-2xl font-bold text-[#172033] dark:text-[#F1F5F9] mt-0.5 sm:mt-1">{kpis.avg_acquisition_progress_pct}%</h3>
                <p className="text-[10px] sm:text-[11px] text-[#19966B] mt-0.5 font-medium truncate">Land handed over</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-[#19966B]/10 border border-[#19966B]/20 flex items-center justify-center text-[#19966B] shadow-xs shrink-0">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>

            {/* Pending Actions */}
            <div className="glass-card p-3 sm:p-5 flex items-center justify-between col-span-2 sm:col-span-2 lg:col-span-1">
              <div>
                <p className="text-[10px] sm:text-[11px] font-semibold text-[#687386] dark:text-[#94A3B8] uppercase tracking-wider">Directives</p>
                <h3 className="text-xl sm:text-2xl font-bold text-[#172033] dark:text-[#F1F5F9] mt-0.5 sm:mt-1">{kpis.pending_actions_count}</h3>
                <p className="text-[10px] sm:text-[11px] text-[#687386] dark:text-[#94A3B8] mt-0.5 font-medium truncate">Actions queued</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-[#3563E9]/10 border border-[#3563E9]/20 flex items-center justify-center text-[#3563E9] shadow-xs shrink-0">
                <ListChecks className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
          </div>

          {/* Charts Row 1: Risk Distribution & Stage Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Risk Distribution Donut */}
            <div className="glass-panel p-6 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#172033] dark:text-[#F1F5F9] mb-0.5">Delay Risk Classification</h4>
                <p className="text-xs text-[#687386] dark:text-[#94A3B8] mb-4">Statutory rules-engine breakdown</p>
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
                      animationDuration={400}
                    >
                      {charts?.risk_distribution?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getRiskColor(entry.name, entry.color)} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={enterpriseTooltipStyle} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span className="text-xs text-[#172033] dark:text-[#F1F5F9] font-medium">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stage Distribution Bar Chart */}
            <div className="glass-panel p-6 lg:col-span-2 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#172033] dark:text-[#F1F5F9] mb-0.5">Acquisition Stage Distribution</h4>
                <p className="text-xs text-[#687386] dark:text-[#94A3B8] mb-4">Active cases per statutory stage with benchmark tracking</p>
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
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1F2E45' : '#E1E7EF'} />
                    <XAxis
                      dataKey="shortStage"
                      tick={{ fill: isDark ? '#94A3B8' : '#687386', fontSize: 10 }}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fill: isDark ? '#94A3B8' : '#687386', fontSize: 11 }} width={30} />
                    <RechartsTooltip contentStyle={enterpriseTooltipStyle} />
                    <Bar dataKey="count" name="Case Count" fill="#3563E9" radius={[4, 4, 0, 0]} animationDuration={400} />
                    <Bar dataKey="avg_delay_days" name="Avg Delay Days" fill="#E9A23B" radius={[4, 4, 0, 0]} animationDuration={400} />
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
                  <h4 className="text-sm font-bold text-[#172033] dark:text-[#F1F5F9] mb-0.5">Monthly Case Progression</h4>
                  <p className="text-xs text-[#687386] dark:text-[#94A3B8]">Milestone velocity: initiated, delayed, and completed</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#3563E9]/10 text-[#3563E9] border border-[#3563E9]/20">
                    Initiated: {totalStarted}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#DC3545]/10 text-[#DC3545] border border-[#DC3545]/20">
                    Delayed: {totalDelayed}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#19966B]/10 text-[#19966B] border border-[#19966B]/20">
                    Completed: {totalCompleted}
                  </span>
                </div>
              </div>
              <div className="h-64 sm:h-72 w-full min-w-0">
                {(!charts?.monthly_progression || charts.monthly_progression.length === 0) ? (
                  <div className="h-full flex flex-col items-center justify-center text-[#687386] dark:text-[#94A3B8] gap-2">
                    <p className="text-xs font-medium">No milestone progression recorded for the selected filter range.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                    <AreaChart
                      data={charts.monthly_progression}
                      margin={{ top: 10, right: 15, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="gradInitiated" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3563E9" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#3563E9" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="gradDelayed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#DC3545" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#DC3545" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#19966B" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#19966B" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1F2E45' : '#E1E7EF'} />
                      <XAxis dataKey="month" tick={{ fill: isDark ? '#94A3B8' : '#687386', fontSize: 11 }} />
                      <YAxis tick={{ fill: isDark ? '#94A3B8' : '#687386', fontSize: 11 }} width={30} />
                      <RechartsTooltip contentStyle={enterpriseTooltipStyle} />
                      <Area type="monotone" dataKey="cases_started" name="Initiated" stroke="#3563E9" strokeWidth={2} fill="url(#gradInitiated)" animationDuration={400} />
                      <Area type="monotone" dataKey="cases_delayed" name="Delayed" stroke="#DC3545" strokeWidth={2} fill="url(#gradDelayed)" animationDuration={400} />
                      <Area type="monotone" dataKey="cases_completed" name="Completed" stroke="#19966B" strokeWidth={2} fill="url(#gradCompleted)" animationDuration={400} />
                      <Legend
                        formatter={(value) => <span className="text-xs text-[#172033] dark:text-[#F1F5F9] font-medium">{value}</span>}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Top Projects List */}
            <div className="glass-panel p-6 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#172033] dark:text-[#F1F5F9] mb-0.5">Top Infrastructure Corridors</h4>
                <p className="text-xs text-[#687386] dark:text-[#94A3B8] mb-4">Highest land acquisition volume</p>
              </div>
              <div className="space-y-2.5">
                {charts?.top_projects?.map((proj) => (
                  <div
                    key={proj.project_id}
                    className="p-3 rounded-lg border border-[#E1E7EF] dark:border-[#1F2E45] bg-[#F9FAFB] dark:bg-[#0E1726] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs"
                  >
                    <div className="flex items-center justify-between text-xs gap-2">
                      <span className="font-semibold text-[#172033] dark:text-[#F1F5F9] truncate flex-1" title={proj.project_name}>
                        {proj.project_name}
                      </span>
                      <span className="text-[#687386] dark:text-[#94A3B8] font-mono text-[11px] shrink-0 font-medium">
                        {proj.total_cases} cases
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-[#687386] dark:text-[#94A3B8]">
                      <span className="font-medium">Progress: <strong className="text-[#172033] dark:text-[#F1F5F9] font-semibold">{proj.avg_progress}%</strong></span>
                      {proj.high_risk_count > 0 ? (
                        <span className="text-[#DC3545] font-semibold px-2 py-0.5 rounded-full bg-[#FEF2F2] dark:bg-[#DC3545]/15 text-[10px] border border-[#FECACA] dark:border-[#DC3545]/30">
                          {proj.high_risk_count} High Risk
                        </span>
                      ) : (
                        <span className="text-[#19966B] font-semibold px-2 py-0.5 rounded-full bg-[#ECFDF5] dark:bg-[#19966B]/15 text-[10px] border border-[#A7F3D0] dark:border-[#19966B]/30">
                          On Track
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[#3563E9] h-1.5 rounded-full transition-all duration-300"
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
            <div className="p-5 border-b border-[#E1E7EF] dark:border-[#1F2E45] flex items-center justify-between bg-white dark:bg-[#121E31]">
              <div>
                <h4 className="text-sm font-bold text-[#172033] dark:text-[#F1F5F9]">Recent High-Risk Acquisition Alerts</h4>
                <p className="text-xs text-[#687386] dark:text-[#94A3B8]">Parcels flagged by rules engine requiring administrative intervention</p>
              </div>
              <button
                onClick={() => navigate('/cases')}
                className="text-xs text-[#3563E9] hover:text-[#2B52C6] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View Full Registry</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Mobile Card List (< sm) */}
            <div className="sm:hidden divide-y divide-[#E1E7EF] dark:divide-[#1F2E45]">
              {charts?.recent_alerts?.map((alert) => (
                <div
                  key={alert.case_id}
                  onClick={() => navigate(`/cases/${alert.case_id}`)}
                  className="p-4 space-y-2.5 hover:bg-[#F5F7FA] dark:hover:bg-[#1A2A42]/40 transition-colors cursor-pointer active:bg-slate-100 dark:active:bg-slate-800"
                >
                  {/* Row 1: Case ID, Project Name, and Risk Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#3563E9]">{alert.case_id}</span>
                        <span className="text-[11px] text-[#687386] dark:text-[#94A3B8]">• {alert.district}</span>
                      </div>
                      <h5 className="font-semibold text-xs text-[#172033] dark:text-[#F1F5F9] mt-0.5 truncate">
                        {alert.project_name}
                      </h5>
                    </div>
                    <div className="shrink-0">
                      <RiskBadge category={alert.risk_category} score={alert.risk_score} size="sm" />
                    </div>
                  </div>

                  {/* Row 2: Current Stage */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#687386] dark:text-[#94A3B8] font-medium">Stage:</span>
                    <span className="font-semibold text-[#172033] dark:text-[#F1F5F9] truncate max-w-[220px]">
                      {alert.current_stage}
                    </span>
                  </div>

                  {/* Row 3: Primary Risk Trigger & Details Link */}
                  <div className="pt-1 flex items-center justify-between gap-2">
                    <span className="inline-block px-2.5 py-1 rounded-md bg-[#FEF2F2] dark:bg-[#DC3545]/15 text-[#DC3545] border border-[#FECACA] dark:border-[#DC3545]/30 text-[11px] font-medium leading-tight">
                      {alert.primary_warning}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/cases/${alert.case_id}`);
                      }}
                      className="text-xs text-[#3563E9] hover:text-[#2B52C6] font-semibold flex items-center gap-1 shrink-0 px-2 py-1 rounded hover:bg-[#3563E9]/10 transition-colors"
                    >
                      <span>Details</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop & Tablet Table (sm and up) */}
            <div className="hidden sm:block w-full min-w-0 overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[680px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F9FAFB] dark:bg-[#0E1726] text-[#687386] dark:text-[#94A3B8] uppercase font-semibold text-[11px] border-b border-[#E1E7EF] dark:border-[#1F2E45]">
                    <th className="py-3 px-4 min-w-[120px] whitespace-nowrap">Case ID</th>
                    <th className="py-3 px-4 min-w-[180px]">Project & Location</th>
                    <th className="py-3 px-4 min-w-[160px]">Current Stage</th>
                    <th className="py-3 px-4 min-w-[160px]">Primary Risk Trigger</th>
                    <th className="py-3 px-4 min-w-[100px]">Risk Level</th>
                    <th className="py-3 px-4 text-right min-w-[80px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E1E7EF] dark:divide-[#1F2E45]">
                  {charts?.recent_alerts?.map((alert) => (
                    <tr
                      key={alert.case_id}
                      className="hover:bg-[#F5F7FA] dark:hover:bg-[#1A2A42]/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#3563E9]">
                        {alert.case_id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#172033] dark:text-[#F1F5F9]">{alert.project_name}</div>
                        <div className="text-[11px] text-[#687386] dark:text-[#94A3B8]">{alert.district}</div>
                      </td>
                      <td className="py-3 px-4 text-[#172033] dark:text-[#F1F5F9] font-medium">{alert.current_stage}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-[#FEF2F2] dark:bg-[#DC3545]/15 text-[#DC3545] border border-[#FECACA] dark:border-[#DC3545]/30 text-[11px] font-medium">
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
