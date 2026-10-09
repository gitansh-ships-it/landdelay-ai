import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  TrendingUp,
  FileCheck2,
  ListChecks,
  Filter,
  ArrowRight,
  ShieldAlert,
  Building,
  RefreshCw
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area
} from 'recharts';
import { api } from '../services/api';
import { DashboardSummary, DashboardCharts } from '../types';
import { RiskBadge } from '../components/RiskBadge';

export const Overview: React.FC = () => {
  const navigate = useNavigate();
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

      const [summaryRes, chartsRes] = await Promise.all([
        api.getDashboardSummary(cleanedFilters),
        api.getDashboardCharts(cleanedFilters)
      ]);

      setSummary(summaryRes);
      setCharts(chartsRes);
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

  if (loading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Computing live acquisition analytics...</p>
      </div>
    );
  }

  const kpis = summary?.kpis;
  const isZeroRecords = !kpis || kpis.total_cases === 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
          <Filter className="h-4 w-4 text-indigo-600" />
          <span>Filter Records:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search Project..."
            value={filters.project}
            onChange={(e) => handleFilterChange('project', e.target.value)}
            className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-40"
          />

          <input
            type="text"
            placeholder="District..."
            value={filters.district}
            onChange={(e) => handleFilterChange('district', e.target.value)}
            className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-36"
          />

          <select
            value={filters.stage}
            onChange={(e) => handleFilterChange('stage', e.target.value)}
            className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
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
            className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
          >
            <option value="">All Risk Levels</option>
            <option value="HIGH">High Risk Only</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </select>

          {(filters.project || filters.district || filters.stage || filters.risk_category) && (
            <button
              onClick={clearFilters}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {isZeroRecords ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <ShieldAlert className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-base font-bold text-slate-800">No Acquisition Records Found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            The database matches no records with current filter settings, or has not been seeded yet.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
            >
              Clear Filters
            </button>
            <button
              onClick={() => navigate('/data')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg"
            >
              Import Data / Seed Demo
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Cases</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{kpis.total_cases}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Active acquisitions</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Building className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">High Risk Cases</p>
                <h3 className="text-2xl font-bold text-red-600 mt-1">{kpis.high_risk_cases}</h3>
                <p className="text-[11px] text-red-500 mt-0.5">
                  {Math.round((kpis.high_risk_cases / kpis.total_cases) * 100)}% of total volume
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Overdue Milestones</p>
                <h3 className="text-2xl font-bold text-amber-600 mt-1">{kpis.overdue_milestones_cases}</h3>
                <p className="text-[11px] text-amber-600 mt-0.5">Deadline slippage</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Acquisition Progress</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{kpis.avg_acquisition_progress_pct}%</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Avg land handed over</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Actions</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{kpis.pending_actions_count}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Directives queued</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                <ListChecks className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Charts Row 1: Risk Distribution & Stage Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Risk Distribution Donut */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h4 className="text-sm font-bold text-slate-900 mb-1">Delay Risk Classification</h4>
              <p className="text-xs text-slate-500 mb-4">Transparent rules-engine evaluated distribution</p>
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
                    <RechartsTooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stage Distribution Bar Chart */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs lg:col-span-2">
              <h4 className="text-sm font-bold text-slate-900 mb-1">Acquisition Stage Distribution</h4>
              <p className="text-xs text-slate-500 mb-4">Active cases per statutory stage with benchmark tracking</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={charts?.stage_distribution?.map(s => ({
                      ...s,
                      shortStage: s.stage.split(' ')[0] + ' ' + (s.stage.split(' ')[1] || '')
                    })) || []}
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="shortStage" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11 }} />
                    <RechartsTooltip />
                    <Bar dataKey="count" name="Case Count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="avg_delay_days" name="Avg Delay Days" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2: Monthly Timeline & Top Projects */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Progression Area Chart */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs lg:col-span-2">
              <h4 className="text-sm font-bold text-slate-900 mb-1">Monthly Case Progression</h4>
              <p className="text-xs text-slate-500 mb-4">Case milestones initiated, completed, and delayed</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={charts?.monthly_progression || []}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <RechartsTooltip />
                    <Area type="monotone" dataKey="cases_started" name="Initiated" stroke="#4f46e5" fill="#e0e7ff" />
                    <Area type="monotone" dataKey="cases_delayed" name="Delayed" stroke="#ef4444" fill="#fee2e2" />
                    <Area type="monotone" dataKey="cases_completed" name="Completed" stroke="#10b981" fill="#d1fae5" />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Projects List */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h4 className="text-sm font-bold text-slate-900 mb-1">Top Infrastructure Corridors</h4>
              <p className="text-xs text-slate-500 mb-4">Projects with highest land acquisition volume</p>
              <div className="space-y-3.5">
                {charts?.top_projects?.map((proj) => (
                  <div key={proj.project_id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-100/70 transition-colors">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900 truncate max-w-[180px]">{proj.project_name}</span>
                      <span className="text-slate-500 font-mono">{proj.total_cases} cases</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600">
                      <span>Progress: {proj.avg_progress}%</span>
                      {proj.high_risk_count > 0 && (
                        <span className="text-red-600 font-semibold">{proj.high_risk_count} High Risk</span>
                      )}
                    </div>
                    <div className="mt-1.5 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, proj.avg_progress)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Risk Alerts Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Recent High-Risk Acquisition Alerts</h4>
                <p className="text-xs text-slate-500">Parcels flagged by rules engine requiring administrative intervention</p>
              </div>
              <button
                onClick={() => navigate('/cases')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <span>View Full Registry</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
                    <th className="py-3 px-4">Case ID</th>
                    <th className="py-3 px-4">Project & Location</th>
                    <th className="py-3 px-4">Current Stage</th>
                    <th className="py-3 px-4">Primary Risk Trigger</th>
                    <th className="py-3 px-4">Risk Level</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {charts?.recent_alerts?.map((alert) => (
                    <tr key={alert.case_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                        {alert.case_id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{alert.project_name}</div>
                        <div className="text-[11px] text-slate-500">{alert.district}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{alert.current_stage}</td>
                      <td className="py-3 px-4 text-slate-700">
                        <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 text-[11px]">
                          {alert.primary_warning}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <RiskBadge category={alert.risk_category} score={alert.risk_score} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => navigate(`/cases/${alert.case_id}`)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
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
