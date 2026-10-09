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

export const DataManagement: React.FC = () => {
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
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Stored Parcels</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{kpis?.total_cases || 0}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Database registry records</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Database className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verified Public Records</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{kpis?.verified_cases_count || 0}</div>
            <div className="text-[11px] text-emerald-600 mt-0.5">Government gazette sources</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Synthetic Demo Records</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">{kpis?.synthetic_cases_count || 0}</div>
            <div className="text-[11px] text-amber-600 mt-0.5">Deterministic seed (seed=42)</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Layers className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* CSV Ingestion Pipeline Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
              <span>CSV Ingestion & Validation Pipeline</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload statutory land acquisition rosters with automated schema checking and pre-import auditing
            </p>
          </div>

          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download CSV Template</span>
          </button>
        </div>

        {importResult && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{importResult}</span>
          </div>
        )}

        {/* Upload Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Data Provenance Classification *</label>
              <select
                value={importSource}
                onChange={(e) => setImportSource(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="VERIFIED_PUBLIC_DATA">VERIFIED_PUBLIC_DATA (Official Gazette / NHAI records)</option>
                <option value="SYNTHETIC_DEMO_DATA">SYNTHETIC_DEMO_DATA (Demonstration / Test simulation)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Data sources are permanently segregated to guarantee governance transparency.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Choose CSV File *</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>

            <button
              onClick={handleValidatePreview}
              disabled={!selectedFile || previewLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>{previewLoading ? 'Parsing & Auditing...' : 'Validate CSV & Preview'}</span>
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-600">
            <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Info className="h-4 w-4 text-indigo-600" />
              <span>Statutory Schema Constraints</span>
            </h5>
            <ul className="list-disc pl-4 space-y-1 text-[11px]">
              <li><strong>Required headers:</strong> case_id, project_name, state, district, land_required_hectares, current_stage, planned_stage_date.</li>
              <li><strong>Coordinates:</strong> Leave empty if unverified. Never fabricate GPS coordinates.</li>
              <li><strong>Percentages:</strong> compensation_pending_pct strictly between 0 and 100.</li>
              <li><strong>Transactions:</strong> Imports execute atomically — zero partial corruption.</li>
            </ul>
          </div>
        </div>

        {/* Validation Report & Preview */}
        {preview && (
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Pre-Ingestion Validation Audit</h4>
                <p className="text-xs text-slate-500">
                  Total Rows: {preview.total_rows} • Valid: <span className="text-emerald-700 font-bold">{preview.valid_rows_count}</span> • Errors: <span className="text-red-700 font-bold">{preview.invalid_rows_count}</span>
                </p>
              </div>

              {preview.valid_rows_count > 0 && preview.invalid_rows_count === 0 && (
                <button
                  onClick={handleConfirmImport}
                  disabled={isImporting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                >
                  {isImporting ? 'Ingesting Records...' : `Confirm & Ingest ${preview.valid_rows_count} Parcels`}
                </button>
              )}
            </div>

            {/* Error List */}
            {preview.errors.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-2 text-xs">
                <div className="font-bold text-red-900 flex items-center gap-1.5">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span>Validation Blockers ({preview.errors.length} errors found)</span>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {preview.errors.map((err, i) => (
                    <div key={i} className="text-[11px] text-red-800">
                      Row {err.row_number} [{err.field}]: {err.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sample Records Table */}
            {preview.sample_records.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-semibold text-[11px] border-b">
                      <th className="p-2">Case ID</th>
                      <th className="p-2">Project</th>
                      <th className="p-2">State / District</th>
                      <th className="p-2">Stage</th>
                      <th className="p-2">Land (ha)</th>
                      <th className="p-2">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preview.sample_records.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2 font-mono font-bold text-indigo-600">{r.case_id}</td>
                        <td className="p-2 font-medium">{r.project_name}</td>
                        <td className="p-2 text-slate-600">{r.district}, {r.state}</td>
                        <td className="p-2">{r.current_stage}</td>
                        <td className="p-2 font-mono">{r.land_required_hectares}</td>
                        <td className="p-2 font-mono text-[10px] text-emerald-700">{r.data_source}</td>
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-indigo-600" />
              <span>Synthetic Demonstration Data Management</span>
            </h3>
            <p className="text-xs text-slate-500">
              Deterministic generator initializing 250 realistic infrastructure corridors (seed=42)
            </p>
          </div>

          <button
            onClick={handleReseedDemo}
            disabled={isReseeding}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isReseeding ? 'animate-spin' : ''}`} />
            <span>{isReseeding ? 'Regenerating...' : 'Reset & Reseed Demo Data'}</span>
          </button>
        </div>

        {demoNotice && (
          <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-lg text-xs flex items-center gap-2">
            <Check className="h-4 w-4 text-indigo-600" />
            <span>{demoNotice}</span>
          </div>
        )}

        <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
          <p>
            <strong>Governance Notice:</strong> All synthetic records are tagged with <span className="font-mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px]">SYNTHETIC_DEMO_DATA</span>. Resetting completely clears the SQLite database and deterministically regenerates 250 simulated cases, realistic milestone schedules, and associated follow-up actions for reproducible evaluations.
          </p>
        </div>
      </div>
    </div>
  );
};
