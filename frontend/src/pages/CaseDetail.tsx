import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Building,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ListPlus,
  Scale,
  FileCheck2,
  FileX,
  History,
  TrendingUp,
  ShieldCheck,
  Edit3,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { AcquisitionCase, RiskAssessment, ActionItem } from '../types';
import { RiskBadge } from '../components/RiskBadge';

export const CaseDetail: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState<AcquisitionCase | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);

  // Quick Edit Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    land_acquired_hectares: 0,
    current_stage: '',
    compensation_pending_pct: 0,
    open_dispute_count: 0,
    documents_incomplete: false,
  });

  // Create Action Modal
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [actionForm, setActionForm] = useState({
    title: '',
    description: '',
    priority: 'HIGH',
    assigned_role: 'District Collector',
    due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
  });

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchDetail = async () => {
    if (!caseId) return;
    try {
      setLoading(true);
      const [c, r] = await Promise.all([
        api.getCase(caseId),
        api.getCaseRisk(caseId)
      ]);
      setCaseData(c);
      setRiskAssessment(r);
      setEditForm({
        land_acquired_hectares: c.land_acquired_hectares,
        current_stage: c.current_stage,
        compensation_pending_pct: c.compensation_pending_pct || 0,
        open_dispute_count: c.open_dispute_count,
        documents_incomplete: c.documents_incomplete,
      });
    } catch (err) {
      console.error('Failed to load case detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [caseId]);

  const handleUpdateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId) return;
    try {
      await api.updateCase(caseId, editForm);
      setIsEditOpen(false);
      fetchDetail();
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const handleCreateAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId) return;
    try {
      await api.createAction({
        case_id: caseId,
        ...actionForm
      });
      setIsActionOpen(false);
      setActionSuccess('Administrative directive created successfully!');
      setTimeout(() => setActionSuccess(null), 4000);
      fetchDetail();
    } catch (err: any) {
      alert(`Failed to create action: ${err.message}`);
    }
  };

  const handleAdoptRecommendation = (rec: any) => {
    setActionForm({
      title: rec.title,
      description: `Administrative directive initiated to address: ${rec.reason}`,
      priority: rec.priority || 'HIGH',
      assigned_role: rec.assigned_role || 'District Collector',
      due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    });
    setIsActionOpen(true);
  };

  if (loading || !caseData) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-500">
        <p className="text-sm">Retrieving acquisition parcel dossier...</p>
      </div>
    );
  }

  const progressPct = caseData.land_required_hectares > 0
    ? Math.min(100, Math.round((caseData.land_acquired_hectares / caseData.land_required_hectares) * 100))
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Back button & Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/cases')}
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-lg text-indigo-700">{caseData.case_id}</span>
              <RiskBadge category={caseData.risk_category} score={caseData.risk_score} size="md" />
              {caseData.data_source === 'SYNTHETIC_DEMO_DATA' ? (
                <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                  SYNTHETIC DEMO RECORD
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                  VERIFIED PUBLIC RECORD
                </span>
              )}
            </div>
            <h2 className="text-base font-semibold text-slate-900 mt-0.5">
              {caseData.project_name}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Update Parameters</span>
          </button>
          <button
            onClick={() => setIsActionOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
          >
            <ListPlus className="h-3.5 w-3.5" />
            <span>Assign Follow-up Action</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Grid: Overview & Risk Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section A: Case Overview Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs lg:col-span-2 space-y-5">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Building className="h-4 w-4 text-indigo-600" />
            <span>Parcel & Acquisition Status</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 border-y border-slate-100 text-xs">
            <div>
              <p className="text-slate-400 font-medium">Infrastructure Sector</p>
              <p className="font-semibold text-slate-900 mt-0.5">{caseData.project_type}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Jurisdiction</p>
              <p className="font-semibold text-slate-900 mt-0.5">{caseData.district}, {caseData.state}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Lifecycle Status</p>
              <p className="font-semibold text-slate-900 mt-0.5">{caseData.status}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Last Verified Update</p>
              <p className="font-semibold text-slate-900 mt-0.5">
                {new Date(caseData.last_updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Land Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700">Land Possession Handover:</span>
              <span className="font-mono font-bold text-slate-900">
                {caseData.land_acquired_hectares} ha / {caseData.land_required_hectares} ha ({progressPct}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Key Indicators Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-[11px] font-medium text-slate-500">Current Statutory Stage</div>
              <div className="text-xs font-bold text-slate-800 mt-1">{caseData.current_stage}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Target: {new Date(caseData.planned_stage_date).toLocaleDateString()}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-[11px] font-medium text-slate-500">Compensation Undisbursed</div>
              <div className="text-xs font-bold text-slate-800 mt-1 font-mono">
                {caseData.compensation_pending_pct ?? 0}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {(caseData.compensation_pending_pct ?? 0) > 40 ? 'Severe backlog' : 'Normal release'}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-[11px] font-medium text-slate-500">Recorded Boundary Disputes</div>
              <div className="text-xs font-bold text-slate-800 mt-1">
                {caseData.open_dispute_count > 0 ? (
                  <span className="text-amber-700">{caseData.open_dispute_count} active petitions</span>
                ) : (
                  <span className="text-emerald-700">No disputes logged</span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Revenue / SDM court</div>
            </div>
          </div>
        </div>

        {/* Section C: Transparent Risk Assessment */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span>Risk Evaluation</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              {riskAssessment?.score_type}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <div className="text-xs font-medium text-slate-500 uppercase">Computed Risk Score</div>
            <div className="text-4xl font-extrabold text-slate-900 mt-1 font-mono">
              {riskAssessment?.risk_score}
              <span className="text-xs text-slate-400 font-normal"> / 100</span>
            </div>
            <div className="mt-2">
              <RiskBadge
                category={riskAssessment?.risk_category || 'LOW'}
                size="md"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Freshness: {riskAssessment?.data_freshness_days} days since field inspection
            </p>
          </div>

          {/* Rule Warnings Banner */}
          {riskAssessment?.rule_warnings && riskAssessment.rule_warnings.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700">Triggered Statutory Warnings:</p>
              {riskAssessment.rule_warnings.map((warn, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0 mt-0.5" />
                  <span>{warn}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contributing Factors Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <h4 className="text-sm font-bold text-slate-900 mb-1">Risk Contributing Drivers & Weights</h4>
        <p className="text-xs text-slate-500 mb-4">
          Transparent breakdown of statutory milestone compliance, court injunctions, and treasury disbursement
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold uppercase text-[11px] border-b border-slate-200">
                <th className="py-2.5 px-4">Evaluation Factor</th>
                <th className="py-2.5 px-4">Impact Tier</th>
                <th className="py-2.5 px-4">Weighted Points</th>
                <th className="py-2.5 px-4">Observable Evidence / Condition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {riskAssessment?.contributing_factors.map((cf, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-semibold text-slate-800">{cf.factor}</td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      cf.impact === 'HIGH' ? 'bg-red-100 text-red-800' :
                      cf.impact === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {cf.impact}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-indigo-700">+{cf.weight_score} pts</td>
                  <td className="py-3 px-4 text-slate-600">{cf.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section B: Milestone Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <h4 className="text-sm font-bold text-slate-900 mb-1">Statutory Milestone Progression Timeline</h4>
        <p className="text-xs text-slate-500 mb-4">Chronological milestone deadlines and compliance verification</p>

        <div className="space-y-4">
          {caseData.milestones?.map((ms, index) => (
            <div
              key={ms.id}
              className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 transition-colors ${
                ms.status === 'COMPLETED' ? 'bg-emerald-50/30 border-emerald-200' :
                ms.status === 'OVERDUE' ? 'bg-red-50/40 border-red-200' :
                ms.status === 'IN_PROGRESS' ? 'bg-indigo-50/30 border-indigo-200' :
                'bg-slate-50 border-slate-200 opacity-75'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                  ms.status === 'COMPLETED' ? 'bg-emerald-600 text-white' :
                  ms.status === 'OVERDUE' ? 'bg-red-600 text-white' :
                  ms.status === 'IN_PROGRESS' ? 'bg-indigo-600 text-white' :
                  'bg-slate-300 text-slate-700'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <h5 className="font-semibold text-slate-900 text-xs">{ms.milestone_name}</h5>
                  <p className="text-[11px] text-slate-500">Stage: {ms.stage_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px]">Planned: </span>
                  <span className="font-medium text-slate-800">{new Date(ms.planned_date).toLocaleDateString()}</span>
                </div>
                {ms.actual_date && (
                  <div>
                    <span className="text-slate-400 text-[11px]">Actual: </span>
                    <span className="font-medium text-slate-800">{new Date(ms.actual_date).toLocaleDateString()}</span>
                  </div>
                )}
                {ms.days_overdue > 0 && (
                  <span className="text-red-700 font-bold bg-red-100 px-2 py-0.5 rounded text-[11px]">
                    +{ms.days_overdue}d Overdue
                  </span>
                )}
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase ${
                  ms.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                  ms.status === 'OVERDUE' ? 'bg-red-100 text-red-800 animate-pulse' :
                  ms.status === 'IN_PROGRESS' ? 'bg-indigo-100 text-indigo-800' :
                  'bg-slate-200 text-slate-700'
                }`}>
                  {ms.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section D: Recommended Actions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Recommended Administrative Actions</h4>
            <p className="text-xs text-slate-500">Non-binding decision-support recommendations generated by LandDelay AI</p>
          </div>
          <button
            onClick={() => setIsActionOpen(true)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
          >
            + Create Custom Action
          </button>
        </div>

        <div className="space-y-3">
          {riskAssessment?.recommended_actions && riskAssessment.recommended_actions.length > 0 ? (
            riskAssessment.recommended_actions.map((rec, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-900">{rec.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      rec.priority === 'HIGH' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {rec.priority} PRIORITY
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{rec.reason}</p>
                  <p className="text-[11px] text-slate-500">
                    Recommended Role: <span className="font-medium text-slate-700">{rec.assigned_role}</span>
                  </p>
                </div>

                <button
                  onClick={() => handleAdoptRecommendation(rec)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors"
                >
                  Adopt Directive
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 py-4 text-center">
              No urgent administrative follow-up required. Milestones are tracking within standard benchmarks.
            </p>
          )}
        </div>
      </div>

      {/* Section E: Audit Trail & Action History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Directives */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
          <h4 className="text-sm font-bold text-slate-900 mb-1">Directives Assigned to Parcel</h4>
          <p className="text-xs text-slate-500 mb-4">Ongoing tasks assigned to officers</p>

          <div className="space-y-3">
            {caseData.actions && caseData.actions.length > 0 ? (
              caseData.actions.map((act) => (
                <div key={act.action_id} className="p-3 rounded-lg border border-slate-100 bg-slate-50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{act.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      act.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {act.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">{act.description}</p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Officer: {act.assigned_role}</span>
                    <span>Due: {new Date(act.due_date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-3 text-center">No active actions assigned yet.</p>
            )}
          </div>
        </div>

        {/* Audit Log */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
          <h4 className="text-sm font-bold text-slate-900 mb-1">Statutory Audit Trail</h4>
          <p className="text-xs text-slate-500 mb-4">System and administrative event history</p>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {caseData.audit_logs && caseData.audit_logs.length > 0 ? (
              caseData.audit_logs.map((log) => (
                <div key={log.id} className="text-xs p-2.5 rounded bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono font-semibold text-indigo-600">{log.action_type}</span>
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-700 mt-1">{log.details}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-3 text-center">No audit records recorded.</p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Parameters Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Update Parcel Monitoring Records</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateCase} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Land Acquired (Hectares)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max={caseData.land_required_hectares}
                  value={editForm.land_acquired_hectares}
                  onChange={(e) => setEditForm({ ...editForm, land_acquired_hectares: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Current Statutory Stage</label>
                <select
                  value={editForm.current_stage}
                  onChange={(e) => setEditForm({ ...editForm, current_stage: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
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

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Compensation Pending (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editForm.compensation_pending_pct}
                  onChange={(e) => setEditForm({ ...editForm, compensation_pending_pct: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Open Dispute Count</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.open_dispute_count}
                  onChange={(e) => setEditForm({ ...editForm, open_dispute_count: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="incompleteEdit"
                  checked={editForm.documents_incomplete}
                  onChange={(e) => setEditForm({ ...editForm, documents_incomplete: e.target.checked })}
                  className="rounded text-indigo-600 border-slate-300"
                />
                <label htmlFor="incompleteEdit" className="text-slate-700 cursor-pointer">
                  Statutory gazette / revenue records incomplete
                </label>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  Apply & Recalculate Risk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Action Modal */}
      {isActionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Assign Administrative Directive</h3>
              <button onClick={() => setIsActionOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateAction} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Action Directive Title *</label>
                <input
                  type="text"
                  required
                  value={actionForm.title}
                  onChange={(e) => setActionForm({ ...actionForm, title: e.target.value })}
                  placeholder="e.g. Schedule Revenue Objection Conciliation"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Detailed Instructions *</label>
                <textarea
                  required
                  rows={3}
                  value={actionForm.description}
                  onChange={(e) => setActionForm({ ...actionForm, description: e.target.value })}
                  placeholder="Specify required follow-up, evidence, or officer mandate..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={actionForm.priority}
                    onChange={(e) => setActionForm({ ...actionForm, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Completion Date</label>
                  <input
                    type="date"
                    required
                    value={actionForm.due_date}
                    onChange={(e) => setActionForm({ ...actionForm, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Designated Officer Role</label>
                <select
                  value={actionForm.assigned_role}
                  onChange={(e) => setActionForm({ ...actionForm, assigned_role: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="District Collector">District Collector</option>
                  <option value="Land Acquisition Officer">Land Acquisition Officer</option>
                  <option value="Project Monitoring Officer">Project Monitoring Officer</option>
                  <option value="Valuation Officer">Valuation Officer</option>
                  <option value="Legal Counsel">Legal Counsel</option>
                </select>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsActionOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  Create Directive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
