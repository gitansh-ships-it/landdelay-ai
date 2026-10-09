import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ExternalLink,
  ShieldAlert,
  FileCheck2,
  FileX,
  X,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { AcquisitionCase, CaseListResponse, RiskCategory } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { useTheme } from '../context/ThemeContext';

export const Cases: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { refreshTrigger } = useOutletContext<{ refreshTrigger: number }>() || { refreshTrigger: 0 };

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CaseListResponse>({
    items: [],
    total: 0,
    page: 1,
    page_size: 15,
    total_pages: 1
  });

  // Query state
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [sortBy, setSortBy] = useState('last_updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // New Case Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [newCase, setNewCase] = useState({
    case_id: '',
    project_id: 'PRJ-NHAI-001',
    project_name: 'Delhi-Mumbai Expressway Package 14',
    project_type: 'Highway',
    state: 'Maharashtra',
    district: 'Thane',
    land_required_hectares: 25.0,
    land_acquired_hectares: 0.0,
    current_stage: 'Survey & Boundary Demarcation',
    stage_entry_date: new Date().toISOString().split('T')[0],
    planned_stage_date: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
    compensation_pending_pct: 20.0,
    open_dispute_count: 0,
    documents_incomplete: false,
    data_source: 'SYNTHETIC_DEMO_DATA',
    verification_status: 'DEMO'
  });

  const fetchCases = async () => {
    try {
      setLoading(true);
      const res = await api.getCases({
        page: currentPage,
        page_size: pageSize,
        search,
        stage: stageFilter,
        risk_category: riskFilter,
        project_type: typeFilter,
        data_source: sourceFilter,
        sort_by: sortBy,
        sort_order: sortOrder
      });
      setData(res);
    } catch (err) {
      console.error('Failed to fetch cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [
    currentPage, pageSize, search, stageFilter,
    riskFilter, typeFilter, sourceFilter,
    sortBy, sortOrder, refreshTrigger
  ]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    if (!data.items.length) return;
    const headers = [
      'case_id', 'project_name', 'project_type', 'state', 'district',
      'current_stage', 'land_required_ha', 'land_acquired_ha', 'delay_days',
      'risk_category', 'risk_score', 'compensation_pending_pct',
      'open_disputes', 'documents_incomplete', 'data_source'
    ];
    const rows = data.items.map(c => [
      c.case_id, `"${c.project_name}"`, c.project_type, c.state, c.district,
      `"${c.current_stage}"`, c.land_required_hectares, c.land_acquired_hectares,
      c.delay_days, c.risk_category, c.risk_score, c.compensation_pending_pct ?? 0,
      c.open_dispute_count, c.documents_incomplete, c.data_source
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `landdelay_cases_page_${currentPage}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!newCase.case_id.trim()) {
      setModalError('Case ID is required');
      return;
    }
    try {
      setCreateSubmitting(true);
      await api.createCase(newCase);
      setIsModalOpen(false);
      // Reset form
      setNewCase({
        case_id: '',
        project_id: 'PRJ-NHAI-001',
        project_name: 'Delhi-Mumbai Expressway Package 14',
        project_type: 'Highway',
        state: 'Maharashtra',
        district: 'Thane',
        land_required_hectares: 25.0,
        land_acquired_hectares: 0.0,
        current_stage: 'Survey & Boundary Demarcation',
        stage_entry_date: new Date().toISOString().split('T')[0],
        planned_stage_date: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
        compensation_pending_pct: 20.0,
        open_dispute_count: 0,
        documents_incomplete: false,
        data_source: 'SYNTHETIC_DEMO_DATA',
        verification_status: 'DEMO'
      });
      fetchCases();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create case');
    } finally {
      setCreateSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Action & Search Bar */}
      <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="h-4 w-4 text-sky-500/70 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Case ID, Project, District..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="glass-input w-full text-xs pl-9 pr-4 py-2"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={stageFilter}
            onChange={(e) => { setStageFilter(e.target.value); setCurrentPage(1); }}
            className="glass-input text-xs px-2.5 py-2"
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
            value={riskFilter}
            onChange={(e) => { setRiskFilter(e.target.value); setCurrentPage(1); }}
            className="glass-input text-xs px-2.5 py-2"
          >
            <option value="">All Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            className="glass-input text-xs px-2.5 py-2"
          >
            <option value="">All Sectors</option>
            <option value="Highway">Highway</option>
            <option value="Railway">Railway</option>
            <option value="Metro Rail">Metro Rail</option>
            <option value="Power & Energy">Power & Energy</option>
            <option value="Airport">Airport</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value); setCurrentPage(1); }}
            className="glass-input text-xs px-2.5 py-2"
          >
            <option value="">All Sources</option>
            <option value="SYNTHETIC_DEMO_DATA">Synthetic Demo Data</option>
            <option value="VERIFIED_PUBLIC_DATA">Verified Public Data</option>
          </select>

          <button
            onClick={handleExportCSV}
            title="Export filtered cases as CSV"
            className="glass-btn-secondary text-xs px-3 py-2 flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="glass-btn-primary text-xs px-3 py-2 flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Case</span>
          </button>
        </div>
      </div>

      {/* Cases Registry Table */}
      <div className="w-full min-w-0 glass-panel overflow-hidden">
        <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[860px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-sky-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 uppercase font-semibold text-[11px] border-b border-sky-100/60 dark:border-white/10">
                <th
                  onClick={() => handleSort('case_id')}
                  className="py-3 px-4 min-w-[120px] cursor-pointer hover:bg-sky-100/40 dark:hover:bg-slate-700/40 select-none transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Case ID</span>
                    <ArrowUpDown className="h-3 w-3 text-sky-500/70" />
                  </div>
                </th>
                <th className="py-3 px-4 min-w-[180px]">Project & Location</th>
                <th className="py-3 px-4 min-w-[150px]">Stage</th>
                <th
                  onClick={() => handleSort('land_required_hectares')}
                  className="py-3 px-4 min-w-[110px] cursor-pointer hover:bg-sky-100/40 dark:hover:bg-slate-700/40 select-none transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Land (ha)</span>
                    <ArrowUpDown className="h-3 w-3 text-sky-500/70" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('delay_days')}
                  className="py-3 px-4 min-w-[90px] cursor-pointer hover:bg-sky-100/40 dark:hover:bg-slate-700/40 select-none transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Delay</span>
                    <ArrowUpDown className="h-3 w-3 text-sky-500/70" />
                  </div>
                </th>
                <th className="py-3 px-4 min-w-[110px]">Indicators</th>
                <th
                  onClick={() => handleSort('risk_score')}
                  className="py-3 px-4 min-w-[110px] cursor-pointer hover:bg-sky-100/40 dark:hover:bg-slate-700/40 select-none transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Risk Level</span>
                    <ArrowUpDown className="h-3 w-3 text-sky-500/70" />
                  </div>
                </th>
                <th className="py-3 px-4 min-w-[110px]">Data Source</th>
                <th className="py-3 px-4 min-w-[70px] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100/40 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    Loading acquisition cases...
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    No matching cases found.
                  </td>
                </tr>
              ) : (
                data.items.map((c) => (
                  <tr
                    key={c.case_id}
                    onClick={() => navigate(`/cases/${c.case_id}`)}
                    className="hover:bg-sky-50/40 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-sky-600 dark:text-sky-400 whitespace-nowrap">
                      {c.case_id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                        {c.project_name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {c.district}, {c.state} • <span className="font-medium text-slate-600 dark:text-slate-300">{c.project_type}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-medium">
                      <span className="px-2 py-0.5 rounded-md bg-sky-50/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-sky-100 dark:border-white/10">
                        {c.current_stage}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-900 dark:text-slate-100 font-mono">
                        {c.land_acquired_hectares} / {c.land_required_hectares}
                      </div>
                      <div className="w-16 bg-slate-200/70 dark:bg-slate-700/70 rounded-full h-1 mt-1 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-1 rounded-full"
                          style={{
                            width: `${Math.min(100, (c.land_acquired_hectares / (c.land_required_hectares || 1)) * 100)}%`
                          }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {c.delay_days > 0 ? (
                        <span className="font-semibold text-rose-600 dark:text-rose-400 font-mono">
                          +{c.delay_days}d late
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium font-mono">On schedule</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {c.documents_incomplete ? (
                          <span title="Documentation Incomplete" className="p-1 rounded bg-rose-100/80 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                            <FileX className="h-3 w-3" />
                          </span>
                        ) : (
                          <span title="Documentation Complete" className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-400">
                            <FileCheck2 className="h-3 w-3" />
                          </span>
                        )}
                        {c.open_dispute_count > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[10px]">
                            {c.open_dispute_count} disp
                          </span>
                        )}
                        {c.compensation_pending_pct !== null && (c.compensation_pending_pct ?? 0) > 30 && (
                          <span className="px-1.5 py-0.5 rounded bg-sky-100/80 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 text-[10px] font-mono">
                            {c.compensation_pending_pct}% comp
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <RiskBadge category={c.risk_category} score={c.risk_score} size="sm" />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {c.data_source === 'SYNTHETIC_DEMO_DATA' ? (
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-amber-50/80 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/50">
                          SYNTHETIC
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/50">
                          VERIFIED
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/cases/${c.case_id}`);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 hover:bg-sky-50 dark:hover:bg-slate-800 rounded transition-colors inline-flex items-center gap-1"
                      >
                        <span>View</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-sky-100/60 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 bg-sky-50/30 dark:bg-slate-800/20">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 sm:gap-3">
            <span>
              Showing {(data.page - 1) * data.page_size + 1} to{' '}
              {Math.min(data.page * data.page_size, data.total)} of {data.total} records
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="glass-input px-2 py-1"
            >
              <option value={10}>10 per page</option>
              <option value={15}>15 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="glass-btn-secondary p-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Page {data.page} of {data.total_pages}
            </span>
            <button
              disabled={currentPage >= data.total_pages}
              onClick={() => setCurrentPage(prev => Math.min(data.total_pages, prev + 1))}
              className="glass-btn-secondary p-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* New Case Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 modal-backdrop-enter">
          <div className="glass-panel-elevated max-w-xl w-full overflow-hidden shadow-glass-lg modal-content-enter">
            <div className="p-5 border-b border-sky-100/60 dark:border-white/10 flex items-center justify-between bg-sky-50/40 dark:bg-slate-800/40">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Register Acquisition Parcel</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Record a new infrastructure land acquisition case</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {modalError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 rounded-xl text-xs">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Case ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LA-REG-901"
                    value={newCase.case_id}
                    onChange={(e) => setNewCase({ ...newCase, case_id: e.target.value })}
                    className="glass-input w-full text-xs px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Project Sector</label>
                  <select
                    value={newCase.project_type}
                    onChange={(e) => setNewCase({ ...newCase, project_type: e.target.value })}
                    className="glass-input w-full text-xs px-3 py-2"
                  >
                    <option value="Highway">Highway</option>
                    <option value="Railway">Railway</option>
                    <option value="Metro Rail">Metro Rail</option>
                    <option value="Power & Energy">Power & Energy</option>
                    <option value="Airport">Airport</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={newCase.project_name}
                  onChange={(e) => setNewCase({ ...newCase, project_name: e.target.value })}
                  className="glass-input w-full text-xs px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={newCase.state}
                    onChange={(e) => setNewCase({ ...newCase, state: e.target.value })}
                    className="glass-input w-full text-xs px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">District</label>
                  <input
                    type="text"
                    required
                    value={newCase.district}
                    onChange={(e) => setNewCase({ ...newCase, district: e.target.value })}
                    className="glass-input w-full text-xs px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Land Required (Hectares)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={newCase.land_required_hectares}
                    onChange={(e) => setNewCase({ ...newCase, land_required_hectares: parseFloat(e.target.value) || 0 })}
                    className="glass-input w-full text-xs px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Current Stage</label>
                  <select
                    value={newCase.current_stage}
                    onChange={(e) => setNewCase({ ...newCase, current_stage: e.target.value })}
                    className="glass-input w-full text-xs px-3 py-2"
                  >
                    <option value="Preliminary Notification">Preliminary Notification</option>
                    <option value="Survey & Boundary Demarcation">Survey & Boundary Demarcation</option>
                    <option value="Public Hearing & Objections">Public Hearing & Objections</option>
                    <option value="Declaration & Final Scheme">Declaration & Final Scheme</option>
                    <option value="Valuation & Award Determination">Valuation & Award Determination</option>
                    <option value="Compensation Disbursement">Compensation Disbursement</option>
                    <option value="Possession & Physical Handover">Possession & Physical Handover</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Planned Stage Date</label>
                  <input
                    type="date"
                    required
                    value={newCase.planned_stage_date}
                    onChange={(e) => setNewCase({ ...newCase, planned_stage_date: e.target.value })}
                    className="glass-input w-full text-xs px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Open Disputes Count</label>
                  <input
                    type="number"
                    min="0"
                    value={newCase.open_dispute_count}
                    onChange={(e) => setNewCase({ ...newCase, open_dispute_count: parseInt(e.target.value) || 0 })}
                    className="glass-input w-full text-xs px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="docCheck"
                  checked={newCase.documents_incomplete}
                  onChange={(e) => setNewCase({ ...newCase, documents_incomplete: e.target.checked })}
                  className="rounded border-sky-300 dark:border-slate-600 text-sky-600 focus:ring-sky-500 bg-white/70 dark:bg-slate-900"
                />
                <label htmlFor="docCheck" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                  Statutory gazette / revenue title documentation is incomplete
                </label>
              </div>

              <div className="pt-4 border-t border-sky-100/60 dark:border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="glass-btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="glass-btn-primary text-xs px-4 py-2 disabled:opacity-50"
                >
                  {createSubmitting ? 'Registering...' : 'Save Case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
