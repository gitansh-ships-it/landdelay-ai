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

export const ActionCenter: React.FC = () => {
  const navigate = useNavigate();

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
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Open Directives</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{openCount}</div>
          </div>
          <div className="h-9 w-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Progress</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">{inProgressCount}</div>
          </div>
          <div className="h-9 w-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 font-bold">
            <AlertCircle className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed / Resolved</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{completedCount}</div>
          </div>
          <div className="h-9 w-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filters & Actions Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-indigo-500"
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
              className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 px-2"
            >
              Reset
            </button>
          )}
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Administrative Directive</span>
        </button>
      </div>

      {/* Actions List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white p-12 text-center text-slate-500 rounded-xl border border-slate-200">
            Loading administrative actions...
          </div>
        ) : actions.length === 0 ? (
          <div className="bg-white p-12 text-center text-slate-500 rounded-xl border border-slate-200">
            No administrative directives match current criteria.
          </div>
        ) : (
          actions.map((act) => (
            <div
              key={act.action_id}
              className={`p-5 rounded-xl border bg-white shadow-xs transition-colors flex flex-wrap items-center justify-between gap-4 ${
                act.status === 'COMPLETED' ? 'border-slate-200 opacity-70' : 'border-slate-200 hover:border-indigo-200'
              }`}
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    act.priority === 'HIGH' ? 'bg-red-100 text-red-800 border border-red-200' :
                    act.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                    'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {act.priority} PRIORITY
                  </span>
                  <span className="font-mono text-xs font-bold text-indigo-600">
                    {act.case_id}
                  </span>
                  {act.project_name && (
                    <span className="text-xs text-slate-500">
                      • {act.project_name} ({act.district})
                    </span>
                  )}
                </div>

                <h4 className={`text-sm font-bold ${act.status === 'COMPLETED' ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                  {act.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">{act.description}</p>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3 text-slate-400" />
                    <span>Role: <strong className="text-slate-700 font-semibold">{act.assigned_role}</strong></span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    <span>Target Due: <strong className="text-slate-700 font-semibold">{new Date(act.due_date).toLocaleDateString()}</strong></span>
                  </span>
                  {act.completed_at && (
                    <span className="text-emerald-700 font-semibold">
                      Completed: {new Date(act.completed_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleStatusToggle(act)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                    act.status === 'OPEN' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' :
                    act.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100' :
                    'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Status: {act.status} (Toggle)</span>
                </button>

                <button
                  onClick={() => navigate(`/cases/${act.case_id}`)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md border border-slate-200 hover:bg-slate-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Create Follow-up Action Directive</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateAction} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Case ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LA-SYN-0001"
                  value={createForm.case_id}
                  onChange={(e) => setCreateForm({ ...createForm, case_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Directive Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Expedite Special Land Acquisition Officer Award Hearing"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Directive Instructions *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide precise administrative guidance..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={createForm.due_date}
                    onChange={(e) => setCreateForm({ ...createForm, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Role</label>
                <select
                  value={createForm.assigned_role}
                  onChange={(e) => setCreateForm({ ...createForm, assigned_role: e.target.value })}
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
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
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
