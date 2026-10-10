import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Sparkles,
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
  const enterpriseTooltipStyle = {
    backgroundColor: isDark ? '#121E31' : '#FFFFFF',
    borderColor: isDark ? '#1F2E45' : '#E1E7EF',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    color: isDark ? '#F1F5F9' : '#172033',
    fontSize: '12px',
    padding: '8px 12px'
  };

  const baseline = evaluation?.baseline_logistic_regression;
  const comparison = evaluation?.comparison_random_forest;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Persistent Prominent Synthetic Disclaimer Banner */}
      <div className="bg-[#FFFBEB] dark:bg-[#E9A23B]/10 border border-[#FDE68A] dark:border-[#E9A23B]/30 rounded-xl p-4 flex items-start gap-3 shadow-xs">
        <AlertTriangle className="h-5 w-5 text-[#E9A23B] shrink-0 mt-0.5" />
        <div className="text-xs text-[#B45309] dark:text-[#FBBF24] leading-relaxed">
          <div className="font-extrabold uppercase tracking-wider text-[11px]">
            Mandatory Governance Disclosure
          </div>
          <div className="font-semibold mt-0.5">
            SYNTHETIC-DATA EVALUATION — NOT EVIDENCE OF REAL-WORLD PREDICTIVE PERFORMANCE.
          </div>
          <p className="mt-1 text-[11px] text-[#B45309]/90 dark:text-[#FBBF24]/80">
            Metrics on this screen reflect performance against simulated and synthetic training distributions. LandDelay AI strictly adheres to data integrity guidelines: predictions serve as decision-support heuristics and must not be treated as automated administrative determinations or legal judgments.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="glass-panel p-12 text-center text-[#687386] dark:text-[#94A3B8]">
          Calculating transparent model evaluation metrics...
        </div>
      ) : errorMsg || !baseline ? (
        <div className="glass-panel p-12 text-center text-[#687386] dark:text-[#94A3B8]">
          <p className="text-sm font-semibold text-[#172033] dark:text-[#F1F5F9]">{errorMsg || 'Insufficient dataset records for training.'}</p>
          <p className="text-xs text-[#687386] dark:text-[#94A3B8] mt-1">Please seed demonstration data or upload a CSV file in Data Management.</p>
        </div>
      ) : (
        <>
          {/* Metadata Card */}
          <div className="glass-panel p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 text-xs">
            <div>
              <p className="text-[#687386] dark:text-[#94A3B8] font-medium">Target Definition</p>
              <p className="font-bold text-[#172033] dark:text-[#F1F5F9] mt-0.5">Stage Deadline Slippage (delayed = 1)</p>
            </div>
            <div>
              <p className="text-[#687386] dark:text-[#94A3B8] font-medium">Usable Records</p>
              <p className="font-bold text-[#172033] dark:text-[#F1F5F9] mt-0.5">
                {baseline.total_records} ({baseline.train_count} train / {baseline.test_count} test)
              </p>
            </div>
            <div>
              <p className="text-[#687386] dark:text-[#94A3B8] font-medium">Validation Methodology</p>
              <p className="font-bold text-[#172033] dark:text-[#F1F5F9] mt-0.5">{baseline.validation_method}</p>
            </div>
            <div>
              <p className="text-[#687386] dark:text-[#94A3B8] font-medium">Validation Status</p>
              <p className="font-bold text-[#E9A23B] mt-0.5 font-mono">{baseline.validation_status}</p>
            </div>
          </div>

          {/* Model Comparison Table */}
          <div className="w-full min-w-0 glass-panel overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#E1E7EF] dark:border-[#1F2E45] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
              <div>
                <h3 className="text-sm font-bold text-[#172033] dark:text-[#F1F5F9] flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-[#3563E9] shrink-0" />
                  <span>Supervised Classifier Performance Metrics</span>
                </h3>
                <p className="text-xs text-[#687386] dark:text-[#94A3B8] mt-0.5">
                  Baseline Logistic Regression with L2 regularization vs Decision Tree / Ensemble comparison
                </p>
              </div>
              <div className="sm:hidden text-[11px] text-[#3563E9] font-medium flex items-center gap-1 pt-0.5">
                <span>← Scroll horizontally for full comparison →</span>
              </div>
            </div>

            <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[720px] text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F9FAFB] dark:bg-[#0E1726] text-[#687386] dark:text-[#94A3B8] uppercase font-semibold text-[11px] border-b border-[#E1E7EF] dark:border-[#1F2E45]">
                    <th className="py-3 px-4 min-w-[190px]">Evaluation Metric</th>
                    <th className="py-3 px-4 min-w-[160px] text-[#3563E9] font-bold whitespace-nowrap">Baseline: Logistic Regression</th>
                    <th className="py-3 px-4 min-w-[160px] text-[#172033] dark:text-[#F1F5F9] font-bold whitespace-nowrap">Comparison: Tree Ensemble</th>
                    <th className="py-3 px-4 min-w-[210px] text-[#687386] dark:text-[#94A3B8] font-normal">Ideal Value / Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E1E7EF] dark:divide-[#1F2E45]">
                  <tr className="hover:bg-[#F5F7FA] dark:hover:bg-[#1A2A42]/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#172033] dark:text-[#F1F5F9] whitespace-nowrap">Accuracy</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#3563E9] whitespace-nowrap">{(baseline.accuracy * 100).toFixed(1)}%</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#172033] dark:text-[#F1F5F9] whitespace-nowrap">
                      {comparison ? `${(comparison.accuracy * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-3 px-4 text-[#687386] dark:text-[#94A3B8] text-[11px]">Proportion of all correct predictions</td>
                  </tr>
                  <tr className="hover:bg-[#F5F7FA] dark:hover:bg-[#1A2A42]/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#172033] dark:text-[#F1F5F9] whitespace-nowrap">Precision (Delay Detection)</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#3563E9] whitespace-nowrap">{(baseline.precision * 100).toFixed(1)}%</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#172033] dark:text-[#F1F5F9] whitespace-nowrap">
                      {comparison ? `${(comparison.precision * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-3 px-4 text-[#687386] dark:text-[#94A3B8] text-[11px]">Minimizes false alarms for project officers</td>
                  </tr>
                  <tr className="hover:bg-[#F5F7FA] dark:hover:bg-[#1A2A42]/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#172033] dark:text-[#F1F5F9] whitespace-nowrap">Recall (Delay Coverage)</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#3563E9] whitespace-nowrap">{(baseline.recall * 100).toFixed(1)}%</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#172033] dark:text-[#F1F5F9] whitespace-nowrap">
                      {comparison ? `${(comparison.recall * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-3 px-4 text-[#687386] dark:text-[#94A3B8] text-[11px]">Catches all emerging milestones slipping schedule</td>
                  </tr>
                  <tr className="hover:bg-[#F5F7FA] dark:hover:bg-[#1A2A42]/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#172033] dark:text-[#F1F5F9] whitespace-nowrap">F1 Score (Balanced)</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#3563E9] whitespace-nowrap">{baseline.f1_score.toFixed(3)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#172033] dark:text-[#F1F5F9] whitespace-nowrap">
                      {comparison ? comparison.f1_score.toFixed(3) : '—'}
                    </td>
                    <td className="py-3 px-4 text-[#687386] dark:text-[#94A3B8] text-[11px]">Harmonic mean of precision and recall</td>
                  </tr>
                  <tr className="hover:bg-[#F5F7FA] dark:hover:bg-[#1A2A42]/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#172033] dark:text-[#F1F5F9] whitespace-nowrap">Brier Score Loss</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#3563E9] whitespace-nowrap">{baseline.brier_score ?? '—'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#172033] dark:text-[#F1F5F9] whitespace-nowrap">
                      {comparison ? comparison.brier_score : '—'}
                    </td>
                    <td className="py-3 px-4 text-[#687386] dark:text-[#94A3B8] text-[11px]">Probability calibration error (closer to 0 is better)</td>
                  </tr>
                  <tr className="hover:bg-[#F5F7FA] dark:hover:bg-[#1A2A42]/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#172033] dark:text-[#F1F5F9] whitespace-nowrap">PR-AUC</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#3563E9] whitespace-nowrap">{baseline.pr_auc ?? '—'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#172033] dark:text-[#F1F5F9] whitespace-nowrap">
                      {comparison ? comparison.pr_auc : '—'}
                    </td>
                    <td className="py-3 px-4 text-[#687386] dark:text-[#94A3B8] text-[11px]">Area under Precision-Recall curve</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Grid: Confusion Matrix & Feature Importances */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Confusion Matrix Card */}
            <div className="glass-panel p-4 sm:p-6 space-y-4">
              <h4 className="text-sm font-bold text-[#172033] dark:text-[#F1F5F9]">Holdout Confusion Matrix (Test Set)</h4>
              <p className="text-xs text-[#687386] dark:text-[#94A3B8]">
                Evaluating {baseline.test_count} unseen test records against true statutory outcomes
              </p>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 text-center text-xs">
                <div className="p-3 sm:p-4 bg-[#ECFDF5] dark:bg-[#19966B]/15 border border-[#A7F3D0] dark:border-[#19966B]/30 rounded-lg">
                  <div className="text-[10px] sm:text-[11px] text-[#065F46] dark:text-[#34D399] font-semibold uppercase">True Negatives (TN)</div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#065F46] dark:text-[#34D399] font-mono mt-1">
                    {baseline.confusion_matrix[0][0]}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-[#065F46] dark:text-[#34D399] mt-1">Correctly on-time</div>
                </div>

                <div className="p-3 sm:p-4 bg-[#FEF2F2] dark:bg-[#DC3545]/15 border border-[#FECACA] dark:border-[#DC3545]/30 rounded-lg">
                  <div className="text-[10px] sm:text-[11px] text-[#DC3545] font-semibold uppercase">False Positives (FP)</div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#DC3545] font-mono mt-1">
                    {baseline.confusion_matrix[0][1]}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-[#DC3545] mt-1">Falsely delayed</div>
                </div>

                <div className="p-3 sm:p-4 bg-[#FFFBEB] dark:bg-[#E9A23B]/15 border border-[#FDE68A] dark:border-[#E9A23B]/30 rounded-lg">
                  <div className="text-[10px] sm:text-[11px] text-[#B45309] dark:text-[#FBBF24] font-semibold uppercase">False Negatives (FN)</div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#B45309] dark:text-[#FBBF24] font-mono mt-1">
                    {baseline.confusion_matrix[1][0]}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-[#B45309] dark:text-[#FBBF24] mt-1">Missed delayed</div>
                </div>

                <div className="p-3 sm:p-4 bg-[#3563E9]/10 border border-[#3563E9]/20 rounded-lg">
                  <div className="text-[10px] sm:text-[11px] text-[#3563E9] font-semibold uppercase">True Positives (TP)</div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#3563E9] font-mono mt-1">
                    {baseline.confusion_matrix[1][1]}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-[#3563E9] mt-1">Correctly delayed</div>
                </div>
              </div>
            </div>

            {/* Feature Importance Bar Chart */}
            <div className="glass-panel p-4 sm:p-6 w-full min-w-0">
              <h4 className="text-sm font-bold text-[#172033] dark:text-[#F1F5F9] mb-0.5">Pre-Outcome Feature Drivers</h4>
              <p className="text-xs text-[#687386] dark:text-[#94A3B8] mb-4">
                Relative influence of administrative variables on delay classification
              </p>

              <div className="h-64 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={evaluation?.feature_importance || []}
                    margin={{ top: 5, right: 15, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1F2E45' : '#E1E7EF'} />
                    <XAxis type="number" domain={[0, 0.4]} tick={{ fill: isDark ? '#94A3B8' : '#687386', fontSize: 10 }} />
                    <YAxis dataKey="feature" type="category" tick={{ fill: isDark ? '#94A3B8' : '#687386', fontSize: 10 }} width={105} />
                    <Tooltip contentStyle={enterpriseTooltipStyle} />
                    <Bar dataKey="importance" name="Weight" fill="#3563E9" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Interactive ML Prediction Sandbox */}
          <div className="glass-panel p-4 sm:p-6 space-y-4">
            <div className="border-b border-[#E1E7EF] dark:border-[#1F2E45] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div>
                <h4 className="text-sm font-bold text-[#172033] dark:text-[#F1F5F9] flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#3563E9]" />
                  <span>Real-Time ML Delay Prediction Sandbox</span>
                </h4>
                <p className="text-xs text-[#687386] dark:text-[#94A3B8]">
                  Simulate pre-outcome parameters and compute delay probability using the trained pipeline
                </p>
              </div>
            </div>

            <form onSubmit={handlePredict} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-[#172033] dark:text-[#F1F5F9] mb-1">Infrastructure Sector</label>
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
                <label className="block font-semibold text-[#172033] dark:text-[#F1F5F9] mb-1">Land Required (ha)</label>
                <input
                  type="number"
                  step="0.1"
                  value={sandboxForm.land_required_hectares}
                  onChange={(e) => setSandboxForm({ ...sandboxForm, land_required_hectares: parseFloat(e.target.value) || 0 })}
                  className="glass-input w-full px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172033] dark:text-[#F1F5F9] mb-1">Days Elapsed in Stage</label>
                <input
                  type="number"
                  value={sandboxForm.days_in_stage}
                  onChange={(e) => setSandboxForm({ ...sandboxForm, days_in_stage: parseInt(e.target.value) || 0 })}
                  className="glass-input w-full px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172033] dark:text-[#F1F5F9] mb-1">Undisbursed Compensation (%)</label>
                <input
                  type="number"
                  value={sandboxForm.compensation_pending_pct}
                  onChange={(e) => setSandboxForm({ ...sandboxForm, compensation_pending_pct: parseFloat(e.target.value) || 0 })}
                  className="glass-input w-full px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172033] dark:text-[#F1F5F9] mb-1">Open Boundary Contestation Count</label>
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
                  className="rounded text-[#3563E9] border-[#E1E7EF] dark:border-[#1F2E45] bg-white dark:bg-[#0E1726]"
                />
                <label htmlFor="sbDocs" className="text-[#172033] dark:text-[#F1F5F9] cursor-pointer font-medium">
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
              <div className="p-4 bg-[#F9FAFB] dark:bg-[#0E1726] border border-[#E1E7EF] dark:border-[#1F2E45] rounded-lg mt-4 space-y-2 text-xs animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="font-bold text-[#172033] dark:text-[#F1F5F9]">
                    Predicted Delay Probability: <span className="font-mono text-[#3563E9] text-sm">{(predResult.probability * 100).toFixed(1)}%</span>
                  </div>
                  <RiskBadge category={predResult.risk_category as any} size="md" />
                </div>
                <div className="text-[11px] text-[#687386] dark:text-[#94A3B8]">
                  Classification Target: <span className="font-semibold">{predResult.predicted_delayed ? 'LIKELY DELAYED (Positive)' : 'ON SCHEDULE (Negative)'}</span>
                </div>
                <div className="space-y-1 pt-1">
                  <span className="font-semibold text-[#172033] dark:text-[#F1F5F9]">Top Predictive Associations:</span>
                  {predResult.top_contributing_factors.map((f: any, i: number) => (
                    <div key={i} className="text-[11px] text-[#687386] dark:text-[#94A3B8] flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#3563E9]" />
                      <span>{f.factor} — <em className="text-[#687386] dark:text-[#94A3B8]">{f.impact}</em></span>
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
