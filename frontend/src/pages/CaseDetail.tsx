import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building,
  AlertTriangle,
  CheckCircle2,
  ListPlus,
  Edit3,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { AcquisitionCase, RiskAssessment } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { useTheme } from '../context/ThemeContext';
import { createPortal } from 'react-dom';

export const CaseDetail: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();

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

  // Lock background scroll and listen for Escape key when modal is active
  useEffect(() => {
    if (isEditOpen || isActionOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsEditOpen(false);
          setIsActionOpen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = prevOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isEditOpen, isActionOpen]);

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
      <div className="flex flex-col items-center justify-center h-96 text-[#687386] dark:text-[#94A3B8]">
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
            className="glass-btn-secondary p-2 rounded-lg text-[#687386] dark:text-[#94A3B8]"
            title="Back to Registry"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold text-lg text-[#3563E9]">{caseData.case_id}</span>
              <RiskBadge category={caseData.risk_category} score={caseData.risk_score} size="md" />
              {caseData.data_source === 'SYNTHETIC_DEMO_DATA' ? (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FFFBEB] dark:bg-[#E9A23B]/10 text-[#B45309] dark:text-[#FBBF24] border border-[#FDE68A] dark:border-[#E9A23B]/30 font-mono font-medium">
                  SYNTHETIC DEMO RECORD
                </span>
              ) : (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#ECFDF5] dark:bg-[#19966B]/10 text-[#065F46] dark:text-[#34D399] border border-[#A7F3D0] dark:border-[#19966B]/30 font-mono font-medium">
                  VERIFIED PUBLIC RECORD
                </span>
              )}
            </div>
            <h2 className="text-base font-semibold text-[#172033] dark:text-[#F1F5F9] mt-0.5">
              {caseData.project_name}
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsEditOpen(true)}
            className="glass-btn-secondary text-xs px-3 py-2 flex items-center gap-1.5"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Update Parameters</span>
          </button>
          <button
            onClick={() => setIsActionOpen(true)}
            className="glass-btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5"
          >
            <ListPlus className="h-3.5 w-3.5" />
            <span>Assign Follow-up Action</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-[#ECFDF5] dark:bg-[#19966B]/15 border border-[#A7F3D0] dark:border-[#19966B]/30 text-[#065F46] dark:text-[#34D399] rounded-lg text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-[#19966B]" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Grid: Overview & Risk Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section A: Case Overview Card */}
        <div className="glass-panel p-6 lg:col-span-2 space-y-5">
          <h3 className="text-sm font-bold text-[#172033] dark:text-[#F1F5F9] uppercase tracking-wider flex items-center gap-2">
            <Building className="h-4 w-4 text-[#3563E9]" />
            <span>Parcel & Acquisition Status</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 py-2 border-y border-[#E1E7EF] dark:border-[#1F2E45] text-xs">
            <div>
              <p className="text-[#687386] dark:text-[#94A3B8] font-medium">Infrastructure Sector</p>
              <p className="font-semibold text-[#172033] dark:text-[#F1F5F9] mt-0.5">{caseData.project_type}</p>
            </div>
            <div>
              <p className="text-[#687386] dark:text-[#94A3B8] font-medium">Jurisdiction</p>
              <p className="font-semibold text-[#172033] dark:text-[#F1F5F9] mt-0.5">{caseData.district}, {caseData.state}</p>
            </div>
            <div>
              <p className="text-[#687386] dark:text-[#94A3B8] font-medium">Lifecycle Status</p>
              <p className="font-semibold text-[#172033] dark:text-[#F1F5F9] mt-0.5">{caseData.status}</p>
            </div>
            <div>
              <p className="text-[#687386] dark:text-[#94A3B8] font-medium">Last Verified Update</p>
              <p className="font-semibold text-[#172033] dark:text-[#F1F5F9] mt-0.5">
                {new Date(caseData.last_updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Land Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-[#172033] dark:text-[#F1F5F9]">Land Possession Handover:</span>
              <span className="font-mono font-bold text-[#172033] dark:text-[#F1F5F9]">
                {caseData.land_acquired_hectares} ha / {caseData.land_required_hectares} ha ({progressPct}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#3563E9] h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Key Indicators Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 bg-[#F9FAFB] dark:bg-[#0E1726] border border-[#E1E7EF] dark:border-[#1F2E45] rounded-lg">
              <div className="text-[11px] font-medium text-[#687386] dark:text-[#94A3B8]">Current Statutory Stage</div>
              <div className="text-xs font-bold text-[#172033] dark:text-[#F1F5F9] mt-1">{caseData.current_stage}</div>
              <div className="text-[10px] text-[#687386] dark:text-[#94A3B8] mt-0.5">
                Target: {new Date(caseData.planned_stage_date).toLocaleDateString()}
              </div>
            </div>

            <div className="p-3 bg-[#F9FAFB] dark:bg-[#0E1726] border border-[#E1E7EF] dark:border-[#1F2E45] rounded-lg">
              <div className="text-[11px] font-medium text-[#687386] dark:text-[#94A3B8]">Compensation Undisbursed</div>
              <div className="text-xs font-bold text-[#172033] dark:text-[#F1F5F9] mt-1 font-mono">
                {caseData.compensation_pending_pct ?? 0}%
              </div>
              <div className="text-[10px] text-[#687386] dark:text-[#94A3B8] mt-0.5">
                {(caseData.compensation_pending_pct ?? 0) > 40 ? 'Severe backlog' : 'Normal release'}
              </div>
            </div>

            <div className="p-3 bg-[#F9FAFB] dark:bg-[#0E1726] border border-[#E1E7EF] dark:border-[#1F2E45] rounded-lg">
              <div className="text-[11px] font-medium text-[#687386] dark:text-[#94A3B8]">Recorded Boundary Disputes</div>
              <div className="text-xs font-bold text-[#172033] dark:text-[#F1F5F9] mt-1">
                {caseData.open_dispute_count > 0 ? (
                  <span className="text-[#E9A23B]">{caseData.open_dispute_count} active petitions</span>
                ) : (
                  <span className="text-[#19966B]">No disputes logged</span>
                )}
              </div>
              <div className="text-[10px] text-[#687386] dark:text-[#94A3B8] mt-0.5">Revenue / SDM court</div>
            </div>
          </div>
        </div>

        {/* Section C: Transparent Risk Assessment */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#172033] dark:text-[#F1F5F9] uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[#E9A23B]" />
              <span>Risk Evaluation</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#3563E9]/10 text-[#3563E9] border border-[#3563E9]/20 font-semibold">
              {riskAssessment?.score_type}
            </span>
          </div>

          <div className="p-4 bg-[#F9FAFB] dark:bg-[#0E1726] rounded-lg border border-[#E1E7EF] dark:border-[#1F2E45] text-center">
            <div className="text-xs font-medium text-[#687386] dark:text-[#94A3B8] uppercase">Computed Risk Score</div>
            <div className="text-4xl font-extrabold text-[#172033] dark:text-[#F1F5F9] mt-1 font-mono">
              {riskAssessment?.risk_score}
              <span className="text-xs text-[#687386] dark:text-[#94A3B8] font-normal"> / 100</span>
            </div>
            <div className="mt-2">
              <RiskBadge
                category={riskAssessment?.risk_category || 'LOW'}
                size="md"
              />
            </div>
            <p className="text-[11px] text-[#687386] dark:text-[#94A3B8] mt-2">
              Freshness: {riskAssessment?.data_freshness_days} days since field inspection
            </p>
          </div>

          {/* Rule Warnings Banner */}
          {riskAssessment?.rule_warnings && riskAssessment.rule_warnings.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#172033] dark:text-[#F1F5F9]">Triggered Statutory Warnings:</p>
              {riskAssessment.rule_warnings.map((warn, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-[#FEF2F2] dark:bg-[#DC3545]/15 border border-[#FECACA] dark:border-[#DC3545]/30 text-[#DC3545] text-xs flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-[#DC3545] shrink-0 mt-0.5" />
                  <span>{warn}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contributing Factors Table */}
      <div className="glass-panel p-6">
        <h4 className="text-sm font-bold text-[#172033] dark:text-[#F1F5F9] mb-0.5">Risk Contributing Drivers & Weights</h4>
        <p className="text-xs text-[#687386] dark:text-[#94A3B8] mb-4">
          Transparent breakdown of statutory milestone compliance, court injunctions, and treasury disbursement
        </p>

        <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[640px] text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] dark:bg-[#0E1726] text-[#687386] dark:text-[#94A3B8] font-semibold uppercase text-[11px] border-b border-[#E1E7EF] dark:border-[#1F2E45]">
                <th className="py-2.5 px-4 min-w-[160px]">Evaluation Factor</th>
                <th className="py-2.5 px-4 min-w-[100px]">Impact Tier</th>
                <th className="py-2.5 px-4 min-w-[120px]">Weighted Points</th>
                <th className="py-2.5 px-4 min-w-[240px]">Observable Evidence / Condition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E7EF] dark:divide-[#1F2E45]">
              {riskAssessment?.contributing_factors.map((cf, idx) => (
                <tr key={idx} className="hover:bg-[#F5F7FA] dark:hover:bg-[#1A2A42]/50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-[#172033] dark:text-[#F1F5F9]">{cf.factor}</td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      cf.impact === 'HIGH' ? 'bg-[#FEF2F2] dark:bg-[#DC3545]/15 text-[#DC3545] border border-[#FECACA] dark:border-[#DC3545]/30' :
                      cf.impact === 'MEDIUM' ? 'bg-[#FFFBEB] dark:bg-[#E9A23B]/15 text-[#B45309] border border-[#FDE68A] dark:border-[#E9A23B]/30' :
                      'bg-[#ECFDF5] dark:bg-[#19966B]/15 text-[#065F46] border border-[#A7F3D0] dark:border-[#19966B]/30'
                    }`}>
                      {cf.impact}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-[#3563E9]">+{cf.weight_score} pts</td>
                  <td className="py-3 px-4 text-[#687386] dark:text-[#94A3B8]">{cf.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section B: Milestone Timeline */}
      <div className="glass-panel p-6">
        <h4 className="text-sm font-bold text-[#172033] dark:text-[#F1F5F9] mb-0.5">Statutory Milestone Progression Timeline</h4>
        <p className="text-xs text-[#687386] dark:text-[#94A3B8] mb-4">Chronological milestone deadlines and compliance verification</p>

        <div className="space-y-3">
          {caseData.milestones?.map((ms, index) => (
            <div
              key={ms.id}
              className={`p-4 rounded-lg border flex flex-wrap items-center justify-between gap-4 transition-colors ${
                ms.status === 'COMPLETED' ? 'bg-[#ECFDF5] dark:bg-[#19966B]/10 border-[#A7F3D0] dark:border-[#19966B]/25' :
                ms.status === 'OVERDUE' ? 'bg-[#FEF2F2] dark:bg-[#DC3545]/10 border-[#FECACA] dark:border-[#DC3545]/25' :
                ms.status === 'IN_PROGRESS' ? 'bg-[#3563E9]/5 dark:bg-[#3563E9]/10 border-[#3563E9]/25' :
                'bg-[#F9FAFB] dark:bg-[#0E1726] border-[#E1E7EF] dark:border-[#1F2E45]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                  ms.status === 'COMPLETED' ? 'bg-[#19966B] text-white' :
                  ms.status === 'OVERDUE' ? 'bg-[#DC3545] text-white' :
                  ms.status === 'IN_PROGRESS' ? 'bg-[#3563E9] text-white' :
                  'bg-slate-200 dark:bg-slate-700 text-[#687386] dark:text-[#94A3B8]'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <h5 className="font-semibold text-[#172033] dark:text-[#F1F5F9] text-xs">{ms.milestone_name}</h5>
                  <p className="text-[11px] text-[#687386] dark:text-[#94A3B8]">Stage: {ms.stage_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-xs">
                <div>
                  <span className="text-[#687386] dark:text-[#94A3B8] text-[11px]">Planned: </span>
                  <span className="font-medium text-[#172033] dark:text-[#F1F5F9]">{new Date(ms.planned_date).toLocaleDateString()}</span>
                </div>
                {ms.actual_date && (
                  <div>
                    <span className="text-[#687386] dark:text-[#94A3B8] text-[11px]">Actual: </span>
                    <span className="font-medium text-[#172033] dark:text-[#F1F5F9]">{new Date(ms.actual_date).toLocaleDateString()}</span>
                  </div>
                )}
                {ms.days_overdue > 0 && (
                  <span className="text-[#DC3545] font-bold bg-[#FEF2F2] dark:bg-[#DC3545]/15 px-2 py-0.5 rounded-md text-[11px] border border-[#FECACA] dark:border-[#DC3545]/30">
                    +{ms.days_overdue}d Overdue
                  </span>
                )}
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase ${
                  ms.status === 'COMPLETED' ? 'bg-[#ECFDF5] dark:bg-[#19966B]/15 text-[#065F46] dark:text-[#34D399] border border-[#A7F3D0] dark:border-[#19966B]/30' :
                  ms.status === 'OVERDUE' ? 'bg-[#FEF2F2] dark:bg-[#DC3545]/15 text-[#DC3545] border border-[#FECACA] dark:border-[#DC3545]/30' :
                  ms.status === 'IN_PROGRESS' ? 'bg-[#3563E9]/10 text-[#3563E9] border border-[#3563E9]/20' :
                  'bg-slate-100 dark:bg-slate-800 text-[#687386] dark:text-[#94A3B8]'
                }`}>
                  {ms.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section D: Recommended Actions */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-sm font-bold text-[#172033] dark:text-[#F1F5F9]">Recommended Administrative Actions</h4>
            <p className="text-xs text-[#687386] dark:text-[#94A3B8]">Non-binding decision-support recommendations generated by LandDelay AI</p>
          </div>
          <button
            onClick={() => setIsActionOpen(true)}
            className="text-xs text-[#3563E9] hover:text-[#2B52C6] font-semibold transition-colors cursor-pointer"
          >
            + Create Custom Action
          </button>
        </div>

        <div className="space-y-3">
          {riskAssessment?.recommended_actions && riskAssessment.recommended_actions.length > 0 ? (
            riskAssessment.recommended_actions.map((rec, i) => (
              <div key={i} className="p-4 bg-[#F9FAFB] dark:bg-[#0E1726] rounded-lg border border-[#E1E7EF] dark:border-[#1F2E45] flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-[#172033] dark:text-[#F1F5F9]">{rec.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      rec.priority === 'HIGH' ? 'bg-[#FEF2F2] dark:bg-[#DC3545]/15 text-[#DC3545] border border-[#FECACA] dark:border-[#DC3545]/30' : 'bg-[#FFFBEB] dark:bg-[#E9A23B]/15 text-[#B45309] border border-[#FDE68A] dark:border-[#E9A23B]/30'
                    }`}>
                      {rec.priority} PRIORITY
                    </span>
                  </div>
                  <p className="text-xs text-[#687386] dark:text-[#94A3B8]">{rec.reason}</p>
                  <p className="text-[11px] text-[#687386] dark:text-[#94A3B8]">
                    Recommended Role: <span className="font-medium text-[#172033] dark:text-[#F1F5F9]">{rec.assigned_role}</span>
                  </p>
                </div>

                <button
                  onClick={() => handleAdoptRecommendation(rec)}
                  className="glass-btn-primary text-xs px-3 py-1.5 shrink-0"
                >
                  Adopt Directive
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-[#687386] dark:text-[#94A3B8] py-4 text-center">
              No urgent administrative follow-up required. Milestones are tracking within standard benchmarks.
            </p>
          )}
        </div>
      </div>

      {/* Section E: Audit Trail & Action History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Directives */}
        <div className="glass-panel p-6">
          <h4 className="text-sm font-bold text-[#172033] dark:text-[#F1F5F9] mb-0.5">Directives Assigned to Parcel</h4>
          <p className="text-xs text-[#687386] dark:text-[#94A3B8] mb-4">Ongoing tasks assigned to officers</p>

          <div className="space-y-3">
            {caseData.actions && caseData.actions.length > 0 ? (
              caseData.actions.map((act) => (
                <div key={act.action_id} className="p-3 rounded-lg border border-[#E1E7EF] dark:border-[#1F2E45] bg-[#F9FAFB] dark:bg-[#0E1726]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#172033] dark:text-[#F1F5F9]">{act.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      act.status === 'COMPLETED' ? 'bg-[#ECFDF5] dark:bg-[#19966B]/15 text-[#065F46] border border-[#A7F3D0] dark:border-[#19966B]/30' : 'bg-[#3563E9]/10 text-[#3563E9] border border-[#3563E9]/20'
                    }`}>
                      {act.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#687386] dark:text-[#94A3B8] mt-1">{act.description}</p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-[#687386] dark:text-[#94A3B8]">
                    <span>Officer: {act.assigned_role}</span>
                    <span>Due: {new Date(act.due_date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#687386] dark:text-[#94A3B8] py-3 text-center">No active actions assigned yet.</p>
            )}
          </div>
        </div>

        {/* Audit Log */}
        <div className="glass-panel p-6">
          <h4 className="text-sm font-bold text-[#172033] dark:text-[#F1F5F9] mb-0.5">Statutory Audit Trail</h4>
          <p className="text-xs text-[#687386] dark:text-[#94A3B8] mb-4">System and administrative event history</p>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {caseData.audit_logs && caseData.audit_logs.length > 0 ? (
              caseData.audit_logs.map((log) => (
                <div key={log.id} className="text-xs p-2.5 rounded-lg bg-[#F9FAFB] dark:bg-[#0E1726] border border-[#E1E7EF] dark:border-[#1F2E45]">
                  <div className="flex items-center justify-between text-[11px] text-[#687386] dark:text-[#94A3B8]">
                    <span className="font-mono font-semibold text-[#3563E9]">{log.action_type}</span>
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-[#172033] dark:text-[#F1F5F9] mt-1">{log.details}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#687386] dark:text-[#94A3B8] py-3 text-center">No audit records recorded.</p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Parameters Modal */}
      {isEditOpen && createPortal(
        <div
          onClick={() => setIsEditOpen(false)}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#030C19]/65 backdrop-blur-xs p-4 modal-backdrop-enter"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-panel-elevated max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl modal-content-enter"
          >
            <div className="p-4 border-b border-[#E1E7EF] dark:border-[#1F2E45] flex items-center justify-between bg-white dark:bg-[#121E31]">
              <h3 className="text-sm font-bold text-[#172033] dark:text-[#F1F5F9]">Update Parcel Monitoring Records</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-[#687386] hover:text-[#172033] dark:hover:text-white p-1 transition-colors cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateCase} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#172033] dark:text-[#F1F5F9] mb-1">Land Acquired (Hectares)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max={caseData.land_required_hectares}
                  value={editForm.land_acquired_hectares}
                  onChange={(e) => setEditForm({ ...editForm, land_acquired_hectares: parseFloat(e.target.value) || 0 })}
                  className="glass-input w-full px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172033] dark:text-[#F1F5F9] mb-1">Current Statutory Stage</label>
                <select
                  value={editForm.current_stage}
                  onChange={(e) => setEditForm({ ...editForm, current_stage: e.target.value })}
                  className="glass-input w-full px-3 py-2"
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
                <label className="block font-semibold text-[#172033] dark:text-[#F1F5F9] mb-1">Compensation Pending (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editForm.compensation_pending_pct}
                  onChange={(e) => setEditForm({ ...editForm, compensation_pending_pct: parseFloat(e.target.value) || 0 })}
                  className="glass-input w-full px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172033] dark:text-[#F1F5F9] mb-1">Open Dispute Count</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.open_dispute_count}
                  onChange={(e) => setEditForm({ ...editForm, open_dispute_count: parseInt(e.target.value) || 0 })}
                  className="glass-input w-full px-3 py-2"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="incompleteEdit"
                  checked={editForm.documents_incomplete}
                  onChange={(e) => setEditForm({ ...editForm, documents_incomplete: e.target.checked })}
                  className="rounded text-[#3563E9] border-[#E1E7EF] dark:border-[#1F2E45] bg-white dark:bg-[#0E1726]"
                />
                <label htmlFor="incompleteEdit" className="text-[#172033] dark:text-[#F1F5F9] cursor-pointer">
                  Statutory gazette / revenue records incomplete
                </label>
              </div>

              <div className="pt-4 border-t border-[#E1E7EF] dark:border-[#1F2E45] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="glass-btn-secondary px-3 py-1.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="glass-btn-primary px-4 py-1.5"
                >
                  Apply & Recalculate Risk
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Create Action Modal */}
      {isActionOpen && createPortal(
        <div
          onClick={() => setIsActionOpen(false)}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#030C19]/65 backdrop-blur-xs p-4 modal-backdrop-enter"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-panel-elevated max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl modal-content-enter"
          >
            <div className="p-4 border-b border-[#E1E7EF] dark:border-[#1F2E45] flex items-center justify-between bg-white dark:bg-[#121E31]">
              <h3 className="text-sm font-bold text-[#172033] dark:text-[#F1F5F9]">Assign Administrative Directive</h3>
              <button onClick={() => setIsActionOpen(false)} className="text-[#687386] hover:text-[#172033] dark:hover:text-white p-1 transition-colors cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateAction} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#172033] dark:text-[#F1F5F9] mb-1">Action Directive Title *</label>
                <input
                  type="text"
                  required
                  value={actionForm.title}
                  onChange={(e) => setActionForm({ ...actionForm, title: e.target.value })}
                  placeholder="e.g. Schedule Revenue Objection Conciliation"
                  className="glass-input w-full px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172033] dark:text-[#F1F5F9] mb-1">Detailed Instructions *</label>
                <textarea
                  required
                  rows={3}
                  value={actionForm.description}
                  onChange={(e) => setActionForm({ ...actionForm, description: e.target.value })}
                  placeholder="Specify required follow-up, evidence, or officer mandate..."
                  className="glass-input w-full px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#172033] dark:text-[#F1F5F9] mb-1">Priority</label>
                  <select
                    value={actionForm.priority}
                    onChange={(e) => setActionForm({ ...actionForm, priority: e.target.value })}
                    className="glass-input w-full px-3 py-2"
                  >
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#172033] dark:text-[#F1F5F9] mb-1">Target Completion Date</label>
                  <input
                    type="date"
                    required
                    value={actionForm.due_date}
                    onChange={(e) => setActionForm({ ...actionForm, due_date: e.target.value })}
                    className="glass-input w-full px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#172033] dark:text-[#F1F5F9] mb-1">Designated Officer Role</label>
                <select
                  value={actionForm.assigned_role}
                  onChange={(e) => setActionForm({ ...actionForm, assigned_role: e.target.value })}
                  className="glass-input w-full px-3 py-2"
                >
                  <option value="District Collector">District Collector</option>
                  <option value="Land Acquisition Officer">Land Acquisition Officer</option>
                  <option value="Project Monitoring Officer">Project Monitoring Officer</option>
                  <option value="Valuation Officer">Valuation Officer</option>
                  <option value="Legal Counsel">Legal Counsel</option>
                </select>
              </div>

              <div className="pt-4 border-t border-[#E1E7EF] dark:border-[#1F2E45] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsActionOpen(false)}
                  className="glass-btn-secondary px-3 py-1.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="glass-btn-primary px-4 py-1.5"
                >
                  Create Directive
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
