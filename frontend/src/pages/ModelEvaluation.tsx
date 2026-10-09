import React, { useState, useEffect } from 'react';
import {
  Cpu,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Layers,
  Sparkles,
  Info,
  Sliders,
  Send
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { api } from '../services/api';
import { ModelEvaluationResponse, PredictionResponse } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { useTheme } from '../context/ThemeContext';

export const ModelEvaluation: React.FC = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [evaluation, setEvaluation] = useState<ModelEvaluationResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ML Prediction Sandbox state
  const [sandboxForm, setSandboxForm] = useState({
    project_type: 'Highway',
    state: 'Maharashtra',
    district: 'Thane',
    land_required_hectares: 35.0,
    current_stage: 'Survey & Boundary Demarcation',
    days_in_stage: 55,
    compensation_pending_pct: 35.0,
    open_dispute_count: 1,
    documents_incomplete: true
  });
  const [predLoading, setPredLoading] = useState(false);
  const [predResult, setPredResult] = useState<PredictionResponse | null>(null);

  const fetchModel = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await api.getModelEvaluation();
      setEvaluation(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Evaluation data not available yet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModel();
  }, []);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setPredLoading(true);
      const res = await api.predictDelay(sandboxForm);
      setPredResult(res);
    } catch (err: any) {
      alert(`Prediction failed: ${err.message}`);
    } finally {
      setPredLoading(false);
    }
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

  const baseline = evaluation?.baseline_logistic_regression;
  const comparison = evaluation?.comparison_random_forest;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Persistent Prominent Synthetic Disclaimer Banner */}
      <div className="bg-amber-500/10 dark:bg-amber-400/10 border border-amber-300/40 dark:border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
          <div className="font-extrabold uppercase tracking-wider text-[11px] text-amber-800 dark:text-amber-300">
            Mandatory Governance Disclosure
          </div>
          <div className="font-semibold mt-0.5">
            SYNTHETIC-DATA EVALUATION — NOT EVIDENCE OF REAL-WORLD PREDICTIVE PERFORMANCE.
          </div>
          <p className="mt-1 text-amber-800/90 dark:text-amber-300/80 text-[11px]">
            Metrics on this screen reflect performance against simulated and synthetic training distributions. LandDelay AI strictly adheres to data integrity guidelines: predictions serve as decision-support heuristics and must not be treated as automated administrative determinations or legal judgments.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="glass-panel p-12 text-center text-slate-500 dark:text-slate-400">
          Calculating transparent model evaluation metrics...
        </div>
      ) : errorMsg || !baseline ? (
        <div className="glass-panel p-12 text-center text-slate-500 dark:text-slate-400">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{errorMsg || 'Insufficient dataset records for training.'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Please seed demonstration data or upload a CSV file in Data Management.</p>
        </div>
      ) : (
        <>
          {/* Metadata Card */}
          <div className="glass-panel p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 text-xs">
            <div>
              <p className="text-slate-400 dark:text-slate-500 font-medium">Target Definition</p>
              <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">Stage Deadline Slippage (delayed = 1)</p>
            </div>
            <div>
              <p className="text-slate-400 dark:text-slate-500 font-medium">Usable Records</p>
              <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {baseline.total_records} ({baseline.train_count} train / {baseline.test_count} test)
              </p>
            </div>
            <div>
              <p className="text-slate-400 dark:text-slate-500 font-medium">Validation Methodology</p>
              <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{baseline.validation_method}</p>
            </div>
            <div>
              <p className="text-slate-400 dark:text-slate-500 font-medium">Validation Status</p>
              <p className="font-bold text-amber-600 dark:text-amber-400 mt-0.5 font-mono">{baseline.validation_status}</p>
            </div>
          </div>

          {/* Model Comparison Table */}
          <div className="w-full min-w-0 glass-panel overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-sky-100/60 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
                  <span>Supervised Classifier Performance Metrics</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Baseline Logistic Regression with L2 regularization vs Decision Tree / Ensemble comparison
                </p>
              </div>
              <div className="sm:hidden text-[11px] text-sky-600 dark:text-sky-400 font-medium flex items-center gap-1 pt-0.5">
                <span>← Scroll horizontally for full comparison →</span>
              </div>
            </div>

            <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[720px] text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-sky-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 uppercase font-semibold text-[11px] border-b border-sky-100/60 dark:border-white/10">
                    <th className="py-3 px-4 min-w-[190px]">Evaluation Metric</th>
                    <th className="py-3 px-4 min-w-[160px] text-sky-600 dark:text-sky-400 font-bold whitespace-nowrap">Baseline: Logistic Regression</th>
                    <th className="py-3 px-4 min-w-[160px] text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap">Comparison: Tree Ensemble</th>
                    <th className="py-3 px-4 min-w-[210px] text-slate-500 dark:text-slate-400 font-normal">Ideal Value / Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100/40 dark:divide-white/5">
                  <tr className="hover:bg-sky-50/30 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">Accuracy</td>
                    <td className="py-3 px-4 font-mono font-bold text-sky-600 dark:text-sky-400 whitespace-nowrap">{(baseline.accuracy * 100).toFixed(1)}%</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {comparison ? `${(comparison.accuracy * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">Proportion of all correct predictions</td>
                  </tr>
                  <tr className="hover:bg-sky-50/30 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">Precision (Delay Detection)</td>
                    <td className="py-3 px-4 font-mono font-bold text-sky-600 dark:text-sky-400 whitespace-nowrap">{(baseline.precision * 100).toFixed(1)}%</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {comparison ? `${(comparison.precision * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">Minimizes false alarms for project officers</td>
                  </tr>
                  <tr className="hover:bg-sky-50/30 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">Recall (Delay Coverage)</td>
                    <td className="py-3 px-4 font-mono font-bold text-sky-600 dark:text-sky-400 whitespace-nowrap">{(baseline.recall * 100).toFixed(1)}%</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {comparison ? `${(comparison.recall * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">Catches all emerging milestones slipping schedule</td>
                  </tr>
                  <tr className="hover:bg-sky-50/30 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">F1 Score (Balanced)</td>
                    <td className="py-3 px-4 font-mono font-bold text-sky-600 dark:text-sky-400 whitespace-nowrap">{baseline.f1_score.toFixed(3)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {comparison ? comparison.f1_score.toFixed(3) : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">Harmonic mean of precision and recall</td>
                  </tr>
                  <tr className="hover:bg-sky-50/30 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">Brier Score Loss</td>
                    <td className="py-3 px-4 font-mono font-bold text-sky-600 dark:text-sky-400 whitespace-nowrap">{baseline.brier_score ?? '—'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {comparison ? comparison.brier_score : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">Probability calibration error (closer to 0 is better)</td>
                  </tr>
                  <tr className="hover:bg-sky-50/30 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">PR-AUC</td>
                    <td className="py-3 px-4 font-mono font-bold text-sky-600 dark:text-sky-400 whitespace-nowrap">{baseline.pr_auc ?? '—'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {comparison ? comparison.pr_auc : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">Area under Precision-Recall curve</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Grid: Confusion Matrix & Feature Importances */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Confusion Matrix Card */}
            <div className="glass-panel p-4 sm:p-6 space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Holdout Confusion Matrix (Test Set)</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Evaluating {baseline.test_count} unseen test records against true statutory outcomes
              </p>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 text-center text-xs">
                <div className="p-3 sm:p-4 bg-emerald-500/10 dark:bg-emerald-400/10 border border-emerald-400/25 rounded-2xl">
                  <div className="text-[10px] sm:text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold uppercase">True Negatives (TN)</div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-emerald-900 dark:text-emerald-100 font-mono mt-1">
                    {baseline.confusion_matrix[0][0]}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-emerald-700 dark:text-emerald-400 mt-1">Correctly on-time</div>
                </div>

                <div className="p-3 sm:p-4 bg-rose-500/10 dark:bg-rose-400/10 border border-rose-400/25 rounded-2xl">
                  <div className="text-[10px] sm:text-[11px] text-rose-800 dark:text-rose-300 font-semibold uppercase">False Positives (FP)</div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-rose-900 dark:text-rose-100 font-mono mt-1">
                    {baseline.confusion_matrix[0][1]}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-rose-700 dark:text-rose-400 mt-1">Falsely delayed</div>
                </div>

                <div className="p-3 sm:p-4 bg-amber-500/10 dark:bg-amber-400/10 border border-amber-400/25 rounded-2xl">
                  <div className="text-[10px] sm:text-[11px] text-amber-800 dark:text-amber-300 font-semibold uppercase">False Negatives (FN)</div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-amber-900 dark:text-amber-100 font-mono mt-1">
                    {baseline.confusion_matrix[1][0]}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-amber-700 dark:text-amber-400 mt-1">Missed delayed</div>
                </div>

                <div className="p-3 sm:p-4 bg-sky-500/10 dark:bg-sky-400/10 border border-sky-400/25 rounded-2xl">
                  <div className="text-[10px] sm:text-[11px] text-sky-800 dark:text-sky-300 font-semibold uppercase">True Positives (TP)</div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-sky-900 dark:text-sky-100 font-mono mt-1">
                    {baseline.confusion_matrix[1][1]}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-sky-700 dark:text-sky-400 mt-1">Correctly delayed</div>
                </div>
              </div>
            </div>

            {/* Feature Importance Bar Chart */}
            <div className="glass-panel p-4 sm:p-6 w-full min-w-0">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">Pre-Outcome Feature Drivers</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Relative influence of administrative variables on delay classification
              </p>

              <div className="h-64 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={evaluation?.feature_importance || []}
                    margin={{ top: 5, right: 15, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(2,132,199,0.08)'} />
                    <XAxis type="number" domain={[0, 0.4]} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }} />
                    <YAxis dataKey="feature" type="category" tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }} width={105} />
                    <Tooltip contentStyle={glassTooltipStyle} />
                    <Bar dataKey="importance" name="Weight" fill="#0284c7" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Interactive ML Prediction Sandbox */}
          <div className="glass-panel p-4 sm:p-6 space-y-4">
            <div className="border-b border-sky-100/60 dark:border-white/10 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  <span>Real-Time ML Delay Prediction Sandbox</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Simulate pre-outcome parameters and compute delay probability using the trained pipeline
                </p>
              </div>
            </div>

            <form onSubmit={handlePredict} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Infrastructure Sector</label>
                <select
                  value={sandboxForm.project_type}
                  onChange={(e) => setSandboxForm({ ...sandboxForm, project_type: e.target.value })}
                  className="glass-input w-full px-3 py-2"
                >
                  <option value="Highway">Highway</option>
                  <option value="Railway">Railway</option>
                  <option value="Metro Rail">Metro Rail</option>
                  <option value="Power & Energy">Power & Energy</option>
                  <option value="Airport">Airport</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Land Required (ha)</label>
                <input
                  type="number"
                  step="0.1"
                  value={sandboxForm.land_required_hectares}
                  onChange={(e) => setSandboxForm({ ...sandboxForm, land_required_hectares: parseFloat(e.target.value) || 0 })}
                  className="glass-input w-full px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Days Elapsed in Stage</label>
                <input
                  type="number"
                  value={sandboxForm.days_in_stage}
                  onChange={(e) => setSandboxForm({ ...sandboxForm, days_in_stage: parseInt(e.target.value) || 0 })}
                  className="glass-input w-full px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Undisbursed Compensation (%)</label>
                <input
                  type="number"
                  value={sandboxForm.compensation_pending_pct}
                  onChange={(e) => setSandboxForm({ ...sandboxForm, compensation_pending_pct: parseFloat(e.target.value) || 0 })}
                  className="glass-input w-full px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Open Boundary Contestation Count</label>
                <input
                  type="number"
                  min="0"
                  value={sandboxForm.open_dispute_count}
                  onChange={(e) => setSandboxForm({ ...sandboxForm, open_dispute_count: parseInt(e.target.value) || 0 })}
                  className="glass-input w-full px-3 py-2"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="sbDocs"
                  checked={sandboxForm.documents_incomplete}
                  onChange={(e) => setSandboxForm({ ...sandboxForm, documents_incomplete: e.target.checked })}
                  className="rounded text-sky-600 border-sky-300 dark:border-slate-600 bg-white/70 dark:bg-slate-900"
                />
                <label htmlFor="sbDocs" className="text-slate-700 dark:text-slate-300 cursor-pointer font-medium">
                  Title Dossier Incomplete
                </label>
              </div>

              <div className="sm:col-span-3 flex justify-end">
                <button
                  type="submit"
                  disabled={predLoading}
                  className="glass-btn-primary text-xs px-4 py-2 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{predLoading ? 'Computing Probability...' : 'Compute Delay Probability'}</span>
                </button>
              </div>
            </form>

            {predResult && (
              <div className="p-4 bg-white/40 dark:bg-slate-800/40 border border-sky-100/60 dark:border-white/5 rounded-2xl mt-4 space-y-2 text-xs animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="font-bold text-slate-900 dark:text-white">
                    Predicted Delay Probability: <span className="font-mono text-sky-600 dark:text-sky-400 text-sm">{(predResult.probability * 100).toFixed(1)}%</span>
                  </div>
                  <RiskBadge category={predResult.risk_category as any} size="md" />
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300">
                  Classification Target: <span className="font-semibold">{predResult.predicted_delayed ? 'LIKELY DELAYED (Positive)' : 'ON SCHEDULE (Negative)'}</span>
                </div>
                <div className="space-y-1 pt-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Top Predictive Associations:</span>
                  {predResult.top_contributing_factors.map((f: any, i: number) => (
                    <div key={i} className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                      <span>{f.factor} — <em className="text-slate-500 dark:text-slate-400">{f.impact}</em></span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
