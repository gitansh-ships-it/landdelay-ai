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

export const Cases: React.FC = () => {
  const navigate = useNavigate();
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
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Case ID, Project, District..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={stageFilter}
            onChange={(e) => { setStageFilter(e.target.value); setCurrentPage(1); }}
            className="text-xs px-2.5 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-indigo-500"
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
            className="text-xs px-2.5 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            className="text-xs px-2.5 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-indigo-500"
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
            className="text-xs px-2.5 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Sources</option>
            <option value="SYNTHETIC_DEMO_DATA">Synthetic Demo Data</option>
            <option value="VERIFIED_PUBLIC_DATA">Verified Public Data</option>
          </select>

          <button
            onClick={handleExportCSV}
            title="Export filtered cases as CSV"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Case</span>
          </button>
        </div>
      </div>

      {/* Cases Registry Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
                <th
                  onClick={() => handleSort('case_id')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/70 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Case ID</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Project & Location</th>
                <th className="py-3 px-4">Stage</th>
                <th
                  onClick={() => handleSort('land_required_hectares')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/70 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Land (ha)</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('delay_days')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/70 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Delay</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Indicators</th>
                <th
                  onClick={() => handleSort('risk_score')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/70 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Risk Level</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Data Source</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    Loading acquisition cases...
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No matching cases found.
                  </td>
                </tr>
              ) : (
                data.items.map((c) => (
                  <tr
                    key={c.case_id}
                    onClick={() => navigate(`/cases/${c.case_id}`)}
                    className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 whitespace-nowrap">
                      {c.case_id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {c.project_name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {c.district}, {c.state} • <span className="font-medium text-slate-600">{c.project_type}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-medium">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {c.current_stage}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-900 font-mono">
                        {c.land_acquired_hectares} / {c.land_required_hectares}
                      </div>
                      <div className="w-16 bg-slate-200 rounded-full h-1 mt-1">
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
                        <span className="font-semibold text-red-600 font-mono">
                          +{c.delay_days}d late
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium font-mono">On schedule</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {c.documents_incomplete ? (
                          <span title="Documentation Incomplete" className="p-1 rounded bg-red-100 text-red-700">
                            <FileX className="h-3 w-3" />
                          </span>
                        ) : (
                          <span title="Documentation Complete" className="p-1 rounded bg-slate-100 text-slate-400">
                            <FileCheck2 className="h-3 w-3" />
                          </span>
                        )}
                        {c.open_dispute_count > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                            {c.open_dispute_count} disp
                          </span>
                        )}
                        {c.compensation_pending_pct !== null && (c.compensation_pending_pct ?? 0) > 30 && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-mono">
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
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          SYNTHETIC
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
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
                        className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors inline-flex items-center gap-1"
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
        <div className="p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 bg-slate-50/50">
          <div className="flex items-center gap-3">
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
              className="px-2 py-1 border border-slate-300 rounded bg-white"
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
              className="p-1.5 border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-semibold text-slate-800">
              Page {data.page} of {data.total_pages}
            </span>
            <button
              disabled={currentPage >= data.total_pages}
              onClick={() => setCurrentPage(prev => Math.min(data.total_pages, prev + 1))}
              className="p-1.5 border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* New Case Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-xl w-full overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">Register Acquisition Parcel</h3>
                <p className="text-xs text-slate-500">Record a new infrastructure land acquisition case</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Case ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LA-REG-901"
                    value={newCase.case_id}
                    onChange={(e) => setNewCase({ ...newCase, case_id: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Project Sector</label>
                  <select
                    value={newCase.project_type}
                    onChange={(e) => setNewCase({ ...newCase, project_type: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={newCase.project_name}
                  onChange={(e) => setNewCase({ ...newCase, project_name: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={newCase.state}
                    onChange={(e) => setNewCase({ ...newCase, state: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">District</label>
                  <input
                    type="text"
                    required
                    value={newCase.district}
                    onChange={(e) => setNewCase({ ...newCase, district: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Land Required (Hectares)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={newCase.land_required_hectares}
                    onChange={(e) => setNewCase({ ...newCase, land_required_hectares: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Stage</label>
                  <select
                    value={newCase.current_stage}
                    onChange={(e) => setNewCase({ ...newCase, current_stage: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Planned Stage Date</label>
                  <input
                    type="date"
                    required
                    value={newCase.planned_stage_date}
                    onChange={(e) => setNewCase({ ...newCase, planned_stage_date: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Open Disputes Count</label>
                  <input
                    type="number"
                    min="0"
                    value={newCase.open_dispute_count}
                    onChange={(e) => setNewCase({ ...newCase, open_dispute_count: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="docCheck"
                  checked={newCase.documents_incomplete}
                  onChange={(e) => setNewCase({ ...newCase, documents_incomplete: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="docCheck" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Statutory gazette / revenue title documentation is incomplete
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
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
