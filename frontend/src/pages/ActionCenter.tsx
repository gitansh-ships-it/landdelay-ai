import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  AlertCircle,
  Plus,
  ExternalLink,
  CheckCircle2,
  Calendar,
  User,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { ActionItem } from '../types';
import { useTheme } from '../context/ThemeContext';

export const ActionCenter: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [actions, setActions] = useState<ActionItem[]>([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    case_id: '',
    title: '',
    description: '',
    priority: 'HIGH',
    assigned_role: 'District Collector',
    due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  });

  const fetchActions = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (roleFilter) params.assigned_role = roleFilter;

      const res = await api.getActions(params);
      setActions(res);
    } catch (err) {
      console.error('Failed to load actions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, [statusFilter, priorityFilter, roleFilter]);

  useEffect(() => {
    if (isModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsModalOpen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isModalOpen]);

  const handleStatusToggle = async (action: ActionItem) => {
    let nextStatus = 'IN_PROGRESS';
    if (action.status === 'OPEN') nextStatus = 'IN_PROGRESS';
    else if (action.status === 'IN_PROGRESS') nextStatus = 'COMPLETED';
    else if (action.status === 'COMPLETED') nextStatus = 'OPEN';

    try {
      await api.updateAction(action.action_id, { status: nextStatus });
      fetchActions();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handleCreateAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.case_id.trim()) {
      alert('Please specify a valid Case ID');
      return;
    }
    try {
      await api.createAction(createForm);
      setIsModalOpen(false);
      setCreateForm({
        case_id: '',
        title: '',
        description: '',
        priority: 'HIGH',
        assigned_role: 'District Collector',
        due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
      });
      fetchActions();
    } catch (err: any) {
      alert(`Creation error: ${err.message}`);
    }
  };

  const openCount = actions.filter(a => a.status === 'OPEN').length;
  const inProgressCount = actions.filter(a => a.status === 'IN_PROGRESS').length;
  const completedCount = actions.filter(a => a.status === 'COMPLETED').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Bar Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-[#687386] dark:text-[#94A3B8] uppercase tracking-wider">Open Directives</div>
            <div className="text-2xl font-bold text-[#172033] dark:text-[#F1F5F9] mt-1">{openCount}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-[#3563E9]/10 border border-[#3563E9]/20 flex items-center justify-center text-[#3563E9] shadow-xs">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-[#687386] dark:text-[#94A3B8] uppercase tracking-wider">In Progress</div>
            <div className="text-2xl font-bold text-[#E9A23B] mt-1">{inProgressCount}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-[#E9A23B]/10 border border-[#E9A23B]/20 flex items-center justify-center text-[#E9A23B] shadow-xs">
            <AlertCircle className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-[#687386] dark:text-[#94A3B8] uppercase tracking-wider">Completed / Resolved</div>
            <div className="text-2xl font-bold text-[#19966B] mt-1">{completedCount}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-[#19966B]/10 border border-[#19966B]/20 flex items-center justify-center text-[#19966B] shadow-xs">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filters & Actions Bar */}
      <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass-input text-xs px-3 py-1.5"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="glass-input text-xs px-3 py-1.5"
          >
            <option value="">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="glass-input text-xs px-3 py-1.5"
          >
            <option value="">All Assigned Roles</option>
            <option value="District Collector">District Collector</option>
            <option value="Land Acquisition Officer">Land Acquisition Officer</option>
            <option value="Project Monitoring Officer">Project Monitoring Officer</option>
            <option value="Valuation Officer">Valuation Officer</option>
            <option value="Legal Counsel">Legal Counsel</option>
          </select>

          {(statusFilter || priorityFilter || roleFilter) && (
            <button
              onClick={() => { setStatusFilter(''); setPriorityFilter(''); setRoleFilter(''); }}
              className="text-xs text-[#3563E9] hover:text-[#2B52C6] font-semibold px-2 transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="glass-btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Administrative Directive</span>
        </button>
      </div>

      {/* Actions List */}
      <div className="space-y-3">
        {loading ? (
          <div className="glass-panel p-12 text-center text-[#687386] dark:text-[#94A3B8]">
            Loading administrative actions...
          </div>
        ) : actions.length === 0 ? (
          <div className="glass-panel p-12 text-center text-[#687386] dark:text-[#94A3B8]">
            No administrative directives match current criteria.
          </div>
        ) : (
          actions.map((act) => (
            <div
              key={act.action_id}
              className={`p-5 rounded-xl border transition-colors flex flex-wrap items-center justify-between gap-4 ${
                act.status === 'COMPLETED'
                  ? 'bg-white/60 dark:bg-[#121E31]/60 border-[#E1E7EF] dark:border-[#1F2E45] opacity-75'
                  : 'glass-card hover:border-[#3563E9]'
              }`}
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                    act.priority === 'HIGH' ? 'bg-[#FEF2F2] dark:bg-[#DC3545]/15 text-[#DC3545] border border-[#FECACA] dark:border-[#DC3545]/30' :
                    act.priority === 'MEDIUM' ? 'bg-[#FFFBEB] dark:bg-[#E9A23B]/15 text-[#B45309] border border-[#FDE68A] dark:border-[#E9A23B]/30' :
                    'bg-slate-100 dark:bg-slate-800 text-[#687386] dark:text-[#94A3B8] border border-[#E1E7EF] dark:border-[#1F2E45]'
                  }`}>
                    {act.priority} PRIORITY
                  </span>
                  <span className="font-mono text-xs font-bold text-[#3563E9]">
                    {act.case_id}
                  </span>
                  {act.project_name && (
                    <span className="text-xs text-[#687386] dark:text-[#94A3B8]">
                      • {act.project_name} ({act.district})
                    </span>
                  )}
                </div>

                <h4 className={`text-sm font-bold ${act.status === 'COMPLETED' ? 'line-through text-[#687386] dark:text-[#94A3B8]' : 'text-[#172033] dark:text-[#F1F5F9]'}`}>
                  {act.title}
                </h4>
                <p className="text-xs text-[#687386] dark:text-[#94A3B8] leading-relaxed">{act.description}</p>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#687386] dark:text-[#94A3B8] pt-1">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3 text-[#3563E9]" />
                    <span>Role: <strong className="text-[#172033] dark:text-[#F1F5F9] font-semibold">{act.assigned_role}</strong></span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-[#3563E9]" />
                    <span>Target Due: <strong className="text-[#172033] dark:text-[#F1F5F9] font-semibold">{new Date(act.due_date).toLocaleDateString()}</strong></span>
                  </span>
                  {act.completed_at && (
                    <span className="text-[#19966B] font-semibold">
                      Completed: {new Date(act.completed_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleStatusToggle(act)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer ${
                    act.status === 'OPEN' ? 'bg-[#3563E9]/10 text-[#3563E9] border-[#3563E9]/30 hover:bg-[#3563E9]/20' :
                    act.status === 'IN_PROGRESS' ? 'bg-[#FFFBEB] dark:bg-[#E9A23B]/15 text-[#B45309] dark:text-[#FBBF24] border-[#FDE68A] dark:border-[#E9A23B]/30 hover:bg-amber-100' :
                    'bg-[#ECFDF5] dark:bg-[#19966B]/15 text-[#065F46] dark:text-[#34D399] border-[#A7F3D0] dark:border-[#19966B]/30 hover:bg-emerald-100'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Status: {act.status} (Toggle)</span>
                </button>

                <button
                  onClick={() => navigate(`/cases/${act.case_id}`)}
                  className="glass-btn-secondary p-1.5 rounded-lg"
                  title="Open case dossier"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && createPortal(
        <div
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#030C19]/65 backdrop-blur-xs p-4 modal-backdrop-enter"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-panel-elevated max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl modal-content-enter"
          >
            <div className="p-4 border-b border-[#E1E7EF] dark:border-[#1F2E45] flex items-center justify-between bg-white dark:bg-[#121E31]">
              <h3 className="text-sm font-bold text-[#172033] dark:text-[#F1F5F9]">Create Follow-up Action Directive</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#687386] hover:text-[#172033] dark:hover:text-white p-1 transition-colors cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateAction} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#172033] dark:text-[#F1F5F9] mb-1">Target Case ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LA-SYN-0001"
                  value={createForm.case_id}
                  onChange={(e) => setCreateForm({ ...createForm, case_id: e.target.value })}
                  className="glass-input w-full px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172033] dark:text-[#F1F5F9] mb-1">Directive Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Expedite Special Land Acquisition Officer Award Hearing"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="glass-input w-full px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172033] dark:text-[#F1F5F9] mb-1">Directive Instructions *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide precise administrative guidance..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="glass-input w-full px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div>
                  <label className="block font-semibold text-[#172033] dark:text-[#F1F5F9] mb-1">Priority</label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                    className="glass-input w-full px-3 py-2"
                  >
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#172033] dark:text-[#F1F5F9] mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={createForm.due_date}
                    onChange={(e) => setCreateForm({ ...createForm, due_date: e.target.value })}
                    className="glass-input w-full px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#172033] dark:text-[#F1F5F9] mb-1">Assigned Role</label>
                <select
                  value={createForm.assigned_role}
                  onChange={(e) => setCreateForm({ ...createForm, assigned_role: e.target.value })}
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
                  onClick={() => setIsModalOpen(false)}
                  className="glass-btn-secondary px-3 py-1.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="glass-btn-primary px-4 py-1.5"
                >
                  Save Directive
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
