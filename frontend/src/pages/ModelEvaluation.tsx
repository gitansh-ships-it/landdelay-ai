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

export const ModelEvaluation: React.FC = () => {
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

  const baseline = evaluation?.baseline_logistic_regression;
  const comparison = evaluation?.comparison_random_forest;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Persistent Prominent Synthetic Disclaimer Banner */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex items-start gap-3 shadow-xs">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <div className="font-extrabold uppercase tracking-wider text-[11px] text-amber-800">
            Mandatory Governance Disclosure
          </div>
          <div className="font-semibold mt-0.5">
            SYNTHETIC-DATA EVALUATION — NOT EVIDENCE OF REAL-WORLD PREDICTIVE PERFORMANCE.
          </div>
          <p className="mt-1 text-amber-800/90 text-[11px]">
            Metrics on this screen reflect performance against simulated and synthetic training distributions. LandDelay AI strictly adheres to data integrity guidelines: predictions serve as decision-support heuristics and must not be treated as automated administrative determinations or legal judgments.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 text-center text-slate-500 rounded-xl border border-slate-200">
          Calculating transparent model evaluation metrics...
        </div>
      ) : errorMsg || !baseline ? (
        <div className="bg-white p-12 text-center text-slate-500 rounded-xl border border-slate-200">
          <p className="text-sm font-semibold text-slate-700">{errorMsg || 'Insufficient dataset records for training.'}</p>
          <p className="text-xs text-slate-500 mt-1">Please seed demonstration data or upload a CSV file in Data Management.</p>
        </div>
      ) : (
        <>
          {/* Metadata Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-slate-400 font-medium">Target Definition</p>
              <p className="font-bold text-slate-800 mt-0.5">Stage Deadline Slippage (delayed = 1)</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Usable Records</p>
              <p className="font-bold text-slate-800 mt-0.5">
                {baseline.total_records} ({baseline.train_count} train / {baseline.test_count} test)
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Validation Methodology</p>
              <p className="font-bold text-slate-800 mt-0.5">{baseline.validation_method}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Validation Status</p>
              <p className="font-bold text-amber-700 mt-0.5 font-mono">{baseline.validation_status}</p>
            </div>
          </div>

          {/* Model Comparison Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-indigo-600" />
                <span>Supervised Classifier Performance Metrics</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Baseline Logistic Regression with L2 regularization vs Decision Tree / Ensemble comparison
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
                    <th className="py-3 px-4">Evaluation Metric</th>
                    <th className="py-3 px-4 text-indigo-700 font-bold">Baseline: Logistic Regression</th>
                    <th className="py-3 px-4 text-slate-700 font-bold">Comparison: Tree Ensemble</th>
                    <th className="py-3 px-4 text-slate-500 font-normal">Ideal Value / Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800">Accuracy</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{(baseline.accuracy * 100).toFixed(1)}%</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {comparison ? `${(comparison.accuracy * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">Proportion of all correct predictions</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800">Precision (Delay Detection)</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{(baseline.precision * 100).toFixed(1)}%</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {comparison ? `${(comparison.precision * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">Minimizes false alarms for project officers</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800">Recall (Delay Coverage)</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{(baseline.recall * 100).toFixed(1)}%</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {comparison ? `${(comparison.recall * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">Catches all emerging milestones slipping schedule</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800">F1 Score (Balanced)</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{baseline.f1_score.toFixed(3)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {comparison ? comparison.f1_score.toFixed(3) : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">Harmonic mean of precision and recall</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800">Brier Score Loss</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{baseline.brier_score ?? '—'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {comparison ? comparison.brier_score : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">Probability calibration error (closer to 0 is better)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800">PR-AUC</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{baseline.pr_auc ?? '—'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {comparison ? comparison.pr_auc : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">Area under Precision-Recall curve</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Grid: Confusion Matrix & Feature Importances */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Confusion Matrix Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h4 className="text-sm font-bold text-slate-900">Holdout Confusion Matrix (Test Set)</h4>
              <p className="text-xs text-slate-500">
                Evaluating {baseline.test_count} unseen test records against true statutory outcomes
              </p>

              <div className="grid grid-cols-2 gap-3 text-center text-xs">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="text-[11px] text-emerald-800 font-semibold uppercase">True Negatives (TN)</div>
                  <div className="text-3xl font-extrabold text-emerald-900 font-mono mt-1">
                    {baseline.confusion_matrix[0][0]}
                  </div>
                  <div className="text-[10px] text-emerald-700 mt-1">Correctly identified on-time</div>
                </div>

                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="text-[11px] text-red-800 font-semibold uppercase">False Positives (FP)</div>
                  <div className="text-3xl font-extrabold text-red-900 font-mono mt-1">
                    {baseline.confusion_matrix[0][1]}
                  </div>
                  <div className="text-[10px] text-red-700 mt-1">On-time flagged as delayed</div>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="text-[11px] text-amber-800 font-semibold uppercase">False Negatives (FN)</div>
                  <div className="text-3xl font-extrabold text-amber-900 font-mono mt-1">
                    {baseline.confusion_matrix[1][0]}
                  </div>
                  <div className="text-[10px] text-amber-700 mt-1">Delayed missed by model</div>
                </div>

                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <div className="text-[11px] text-indigo-800 font-semibold uppercase">True Positives (TP)</div>
                  <div className="text-3xl font-extrabold text-indigo-900 font-mono mt-1">
                    {baseline.confusion_matrix[1][1]}
                  </div>
                  <div className="text-[10px] text-indigo-700 mt-1">Correctly caught delayed</div>
                </div>
              </div>
            </div>

            {/* Feature Importance Bar Chart */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h4 className="text-sm font-bold text-slate-900 mb-1">Pre-Outcome Feature Drivers</h4>
              <p className="text-xs text-slate-500 mb-4">
                Relative influence of administrative variables on delay classification
              </p>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={evaluation?.feature_importance || []}
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" domain={[0, 0.4]} tick={{ fontSize: 10 }} />
                    <YAxis dataKey="feature" type="category" tick={{ fontSize: 10 }} width={120} />
                    <Tooltip />
                    <Bar dataKey="importance" name="Weight" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Interactive ML Prediction Sandbox */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  <span>Real-Time ML Delay Prediction Sandbox</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Simulate pre-outcome parameters and compute delay probability using the trained pipeline
                </p>
              </div>
            </div>

            <form onSubmit={handlePredict} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Infrastructure Sector</label>
                <select
                  value={sandboxForm.project_type}
                  onChange={(e) => setSandboxForm({ ...sandboxForm, project_type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Highway">Highway</option>
                  <option value="Railway">Railway</option>
                  <option value="Metro Rail">Metro Rail</option>
                  <option value="Power & Energy">Power & Energy</option>
                  <option value="Airport">Airport</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Land Required (ha)</label>
                <input
                  type="number"
                  step="0.1"
                  value={sandboxForm.land_required_hectares}
                  onChange={(e) => setSandboxForm({ ...sandboxForm, land_required_hectares: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Days Elapsed in Stage</label>
                <input
                  type="number"
                  value={sandboxForm.days_in_stage}
                  onChange={(e) => setSandboxForm({ ...sandboxForm, days_in_stage: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Undisbursed Compensation (%)</label>
                <input
                  type="number"
                  value={sandboxForm.compensation_pending_pct}
                  onChange={(e) => setSandboxForm({ ...sandboxForm, compensation_pending_pct: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Open Boundary Contestation Count</label>
                <input
                  type="number"
                  min="0"
                  value={sandboxForm.open_dispute_count}
                  onChange={(e) => setSandboxForm({ ...sandboxForm, open_dispute_count: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="sbDocs"
                  checked={sandboxForm.documents_incomplete}
                  onChange={(e) => setSandboxForm({ ...sandboxForm, documents_incomplete: e.target.checked })}
                  className="rounded text-indigo-600 border-slate-300"
                />
                <label htmlFor="sbDocs" className="text-slate-700 cursor-pointer font-medium">
                  Title Dossier Incomplete
                </label>
              </div>

              <div className="sm:col-span-3 flex justify-end">
                <button
                  type="submit"
                  disabled={predLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{predLoading ? 'Computing Probability...' : 'Compute Delay Probability'}</span>
                </button>
              </div>
            </form>

            {predResult && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mt-4 space-y-2 text-xs animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900">
                    Predicted Delay Probability: <span className="font-mono text-indigo-700 text-sm">{(predResult.probability * 100).toFixed(1)}%</span>
                  </div>
                  <RiskBadge category={predResult.risk_category as any} size="md" />
                </div>
                <div className="text-[11px] text-slate-600">
                  Classification Target: <span className="font-semibold">{predResult.predicted_delayed ? 'LIKELY DELAYED (Positive)' : 'ON SCHEDULE (Negative)'}</span>
                </div>
                <div className="space-y-1 pt-1">
                  <span className="font-semibold text-slate-700">Top Predictive Associations:</span>
                  {predResult.top_contributing_factors.map((f: any, i: number) => (
                    <div key={i} className="text-[11px] text-slate-600 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      <span>{f.factor} — <em className="text-slate-500">{f.impact}</em></span>
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
