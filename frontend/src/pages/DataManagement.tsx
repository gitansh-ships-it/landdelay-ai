import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Upload,
  Download,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  ShieldCheck,
  Info,
  Layers,
  Check,
  XCircle
} from 'lucide-react';
import { api } from '../services/api';
import { ImportPreviewResponse, DashboardKPIs } from '../types';
import { useTheme } from '../context/ThemeContext';

export const DataManagement: React.FC = () => {
  const { theme } = useTheme();
  const { setRefreshTrigger } = useOutletContext<{ setRefreshTrigger: React.Dispatch<React.SetStateAction<number>> }>() || {};

  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [importSource, setImportSource] = useState<'VERIFIED_PUBLIC_DATA' | 'SYNTHETIC_DEMO_DATA'>('VERIFIED_PUBLIC_DATA');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  // Demo controls state
  const [isReseeding, setIsReseeding] = useState(false);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  const fetchKpis = async () => {
    try {
      const summary = await api.getDashboardSummary();
      if (summary) setKpis(summary.kpis);
    } catch (err) {
      console.error('Failed to fetch KPIs:', err);
    }
  };

  useEffect(() => {
    fetchKpis();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setPreview(null);
      setImportResult(null);
    }
  };

  const handleValidatePreview = async () => {
    if (!selectedFile) return;
    try {
      setPreviewLoading(true);
      setImportResult(null);
      const res = await api.previewCSV(selectedFile);
      setPreview(res);
      if (res.data_source_detected === 'VERIFIED_PUBLIC_DATA' || res.data_source_detected === 'SYNTHETIC_DEMO_DATA') {
        setImportSource(res.data_source_detected as any);
      }
    } catch (err: any) {
      alert(`CSV Parsing Failed: ${err.message}`);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!preview || preview.sample_records.length === 0) return;
    try {
      setIsImporting(true);
      const res = await api.confirmCSV(importSource, preview.sample_records);
      setImportResult(res.message);
      setPreview(null);
      setSelectedFile(null);
      fetchKpis();
      if (setRefreshTrigger) setRefreshTrigger((prev: number) => prev + 1);
    } catch (err: any) {
      alert(`Import transaction aborted: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    window.location.href = `${api.getBaseUrl()}/import/template`;
  };

  const handleReseedDemo = async () => {
    const key = window.prompt(
      "Admin Authorization Required\n\nEnter Admin Key to authorize database reset (local default: landdelay-admin-secret-2026):"
    );
    if (!key) return;

    if (!window.confirm("Confirm reset? This will regenerate 250 deterministic synthetic cases using seed=42.")) return;
    try {
      setIsReseeding(true);
      setDemoNotice(null);
      const res = await api.resetDemoData(key);
      setDemoNotice(res.message);
      fetchKpis();
      if (setRefreshTrigger) setRefreshTrigger((prev: number) => prev + 1);
    } catch (err: any) {
      alert(`Reset error: ${err.message}`);
    } finally {
      setIsReseeding(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Current Data Provenance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Stored Parcels</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{kpis?.total_cases || 0}</div>
            <div className="text-[11px] text-sky-600 dark:text-sky-400 mt-0.5">Database registry records</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-sky-500/10 dark:bg-sky-400/15 border border-sky-400/20 flex items-center justify-center text-sky-600 dark:text-sky-400 shadow-xs">
            <Database className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Verified Public Records</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{kpis?.verified_cases_count || 0}</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">Government gazette sources</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/15 border border-emerald-400/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Synthetic Demo Records</div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{kpis?.synthetic_cases_count || 0}</div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">Deterministic seed (seed=42)</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 dark:bg-amber-400/15 border border-amber-400/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
            <Layers className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* CSV Ingestion Pipeline Card */}
      <div className="glass-panel p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-sky-100/60 dark:border-white/10 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              <span>CSV Ingestion & Validation Pipeline</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Upload statutory land acquisition rosters with automated schema checking and pre-import auditing
            </p>
          </div>

          <button
            onClick={handleDownloadTemplate}
            className="glass-btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download CSV Template</span>
          </button>
        </div>

        {importResult && (
          <div className="p-3 bg-emerald-50/90 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{importResult}</span>
          </div>
        )}

        {/* Upload Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Data Provenance Classification *</label>
              <select
                value={importSource}
                onChange={(e) => setImportSource(e.target.value as any)}
                className="glass-input w-full px-3 py-2"
              >
                <option value="VERIFIED_PUBLIC_DATA">VERIFIED_PUBLIC_DATA (Official Gazette / NHAI records)</option>
                <option value="SYNTHETIC_DEMO_DATA">SYNTHETIC_DEMO_DATA (Demonstration / Test simulation)</option>
              </select>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Data sources are permanently segregated to guarantee governance transparency.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Choose CSV File *</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="glass-input w-full text-xs text-slate-600 dark:text-slate-300 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-500/10 file:text-sky-700 dark:file:text-sky-300 hover:file:bg-sky-500/20"
              />
            </div>

            <button
              onClick={handleValidatePreview}
              disabled={!selectedFile || previewLoading}
              className="glass-btn-primary text-xs px-4 py-2 disabled:opacity-50 flex items-center gap-2"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>{previewLoading ? 'Parsing & Auditing...' : 'Validate CSV & Preview'}</span>
            </button>
          </div>

          <div className="p-4 bg-sky-500/10 dark:bg-sky-400/10 rounded-2xl border border-sky-200/50 dark:border-sky-500/20 text-xs space-y-2 text-slate-700 dark:text-slate-300">
            <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Info className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              <span>Statutory Schema Constraints</span>
            </h5>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
              <li><strong>Required headers:</strong> case_id, project_name, state, district, land_required_hectares, current_stage, planned_stage_date.</li>
              <li><strong>Coordinates:</strong> Leave empty if unverified. Never fabricate GPS coordinates.</li>
              <li><strong>Percentages:</strong> compensation_pending_pct strictly between 0 and 100.</li>
              <li><strong>Transactions:</strong> Imports execute atomically — zero partial corruption.</li>
            </ul>
          </div>
        </div>

        {/* Validation Report & Preview */}
        {preview && (
          <div className="space-y-4 pt-4 border-t border-sky-100/60 dark:border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Pre-Ingestion Validation Audit</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Total Rows: {preview.total_rows} • Valid: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{preview.valid_rows_count}</span> • Errors: <span className="text-rose-600 dark:text-rose-400 font-bold">{preview.invalid_rows_count}</span>
                </p>
              </div>

              {preview.valid_rows_count > 0 && preview.invalid_rows_count === 0 && (
                <button
                  onClick={handleConfirmImport}
                  disabled={isImporting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  {isImporting ? 'Ingesting Records...' : `Confirm & Ingest ${preview.valid_rows_count} Parcels`}
                </button>
              )}
            </div>

            {/* Error List */}
            {preview.errors.length > 0 && (
              <div className="p-4 bg-rose-50/80 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-800/50 rounded-xl space-y-2 text-xs">
                <div className="font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                  <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  <span>Validation Blockers ({preview.errors.length} errors found)</span>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {preview.errors.map((err, i) => (
                    <div key={i} className="text-[11px] text-rose-800 dark:text-rose-300">
                      Row {err.row_number} [{err.field}]: {err.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sample Records Table */}
            {preview.sample_records.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-sky-100/60 dark:border-white/10">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-sky-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 font-semibold text-[11px] border-b border-sky-100/60 dark:border-white/10">
                      <th className="p-2.5">Case ID</th>
                      <th className="p-2.5">Project</th>
                      <th className="p-2.5">State / District</th>
                      <th className="p-2.5">Stage</th>
                      <th className="p-2.5">Land (ha)</th>
                      <th className="p-2.5">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sky-100/40 dark:divide-white/5">
                    {preview.sample_records.map((r, i) => (
                      <tr key={i} className="hover:bg-sky-50/40 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-2.5 font-mono font-bold text-sky-600 dark:text-sky-400">{r.case_id}</td>
                        <td className="p-2.5 font-medium text-slate-900 dark:text-slate-100">{r.project_name}</td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-300">{r.district}, {r.state}</td>
                        <td className="p-2.5 text-slate-700 dark:text-slate-300">{r.current_stage}</td>
                        <td className="p-2.5 font-mono text-slate-900 dark:text-slate-100">{r.land_required_hectares}</td>
                        <td className="p-2.5 font-mono text-[10px] text-emerald-600 dark:text-emerald-400">{r.data_source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Synthetic Demonstration Controls Card */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-sky-100/60 dark:border-white/10 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              <span>Synthetic Demonstration Data Management</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Deterministic generator initializing 250 realistic infrastructure corridors (seed=42)
            </p>
          </div>

          <button
            onClick={handleReseedDemo}
            disabled={isReseeding}
            className="glass-btn-secondary text-xs px-3.5 py-2 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isReseeding ? 'animate-spin' : ''}`} />
            <span>{isReseeding ? 'Regenerating...' : 'Reset & Reseed Demo Data'}</span>
          </button>
        </div>

        {demoNotice && (
          <div className="p-3 bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-800/50 text-sky-800 dark:text-sky-300 rounded-xl text-xs flex items-center gap-2 font-medium">
            <Check className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            <span>{demoNotice}</span>
          </div>
        )}

        <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white/40 dark:bg-slate-800/40 p-4 rounded-xl border border-sky-100/60 dark:border-white/5">
          <p>
            <strong>Governance Notice:</strong> All synthetic records are tagged with <span className="font-mono bg-amber-500/10 dark:bg-amber-400/10 text-amber-700 dark:text-amber-300 border border-amber-300/30 px-1.5 py-0.5 rounded-md text-[10px]">SYNTHETIC_DEMO_DATA</span>. Resetting completely clears the database and deterministically regenerates 250 simulated cases, realistic milestone schedules, and associated follow-up actions for reproducible evaluations.
          </p>
        </div>
      </div>
    </div>
  );
};
