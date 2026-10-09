import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  Clock,
  AlertCircle,
  Filter,
  Plus,
  ArrowUpDown,
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
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Open Directives</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{openCount}</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-sky-500/10 dark:bg-sky-400/15 border border-sky-400/20 flex items-center justify-center text-sky-600 dark:text-sky-400 shadow-xs">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">In Progress</div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{inProgressCount}</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 dark:bg-amber-400/15 border border-amber-400/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
            <AlertCircle className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Completed / Resolved</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{completedCount}</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/15 border border-emerald-400/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
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
              className="text-xs text-sky-600 dark:text-sky-400 font-semibold hover:text-sky-700 dark:hover:text-sky-300 px-2 transition-colors"
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
          <div className="glass-panel p-12 text-center text-slate-500 dark:text-slate-400">
            Loading administrative actions...
          </div>
        ) : actions.length === 0 ? (
          <div className="glass-panel p-12 text-center text-slate-500 dark:text-slate-400">
            No administrative directives match current criteria.
          </div>
        ) : (
          actions.map((act) => (
            <div
              key={act.action_id}
              className={`p-5 rounded-2xl border transition-all duration-200 flex flex-wrap items-center justify-between gap-4 ${
                act.status === 'COMPLETED'
                  ? 'bg-white/40 dark:bg-slate-900/40 border-sky-100/40 dark:border-white/5 opacity-70'
                  : 'glass-card hover:border-sky-300/50 dark:hover:border-white/20'
              }`}
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                    act.priority === 'HIGH' ? 'bg-rose-100/80 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40' :
                    act.priority === 'MEDIUM' ? 'bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40' :
                    'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}>
                    {act.priority} PRIORITY
                  </span>
                  <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
                    {act.case_id}
                  </span>
                  {act.project_name && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      • {act.project_name} ({act.district})
                    </span>
                  )}
                </div>

                <h4 className={`text-sm font-bold ${act.status === 'COMPLETED' ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                  {act.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{act.description}</p>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3 text-sky-500/70" />
                    <span>Role: <strong className="text-slate-700 dark:text-slate-200 font-semibold">{act.assigned_role}</strong></span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-sky-500/70" />
                    <span>Target Due: <strong className="text-slate-700 dark:text-slate-200 font-semibold">{new Date(act.due_date).toLocaleDateString()}</strong></span>
                  </span>
                  {act.completed_at && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Completed: {new Date(act.completed_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleStatusToggle(act)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 shadow-xs ${
                    act.status === 'OPEN' ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/50 hover:bg-sky-100' :
                    act.status === 'IN_PROGRESS' ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/50 hover:bg-amber-100' :
                    'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/50 hover:bg-emerald-100'
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
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4">
          <div className="glass-panel-elevated max-w-lg w-full overflow-hidden shadow-glass-lg animate-fade-in">
            <div className="p-4 border-b border-sky-100/60 dark:border-white/10 flex items-center justify-between bg-sky-50/40 dark:bg-slate-800/40">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create Follow-up Action Directive</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateAction} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Case ID *</label>
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
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Directive Title *</label>
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
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Directive Instructions *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide precise administrative guidance..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="glass-input w-full px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
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
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
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
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Assigned Role</label>
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

              <div className="pt-4 border-t border-sky-100/60 dark:border-white/10 flex justify-end gap-2">
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
        </div>
      )}
    </div>
  );
};
