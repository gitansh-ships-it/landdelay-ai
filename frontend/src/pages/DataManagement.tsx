import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Upload,
  Download,
  Database,
  RefreshCw,
  CheckCircle2,
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
            <div className="text-xs font-semibold text-[#687386] dark:text-[#94A3B8] uppercase tracking-wider">Total Stored Parcels</div>
            <div className="text-2xl font-bold text-[#172033] dark:text-[#F1F5F9] mt-1">{kpis?.total_cases || 0}</div>
            <div className="text-[11px] text-[#3563E9] mt-0.5 font-medium">Database registry records</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-[#3563E9]/10 border border-[#3563E9]/20 flex items-center justify-center text-[#3563E9] shadow-xs">
            <Database className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-[#687386] dark:text-[#94A3B8] uppercase tracking-wider">Verified Public Records</div>
            <div className="text-2xl font-bold text-[#19966B] mt-1">{kpis?.verified_cases_count || 0}</div>
            <div className="text-[11px] text-[#19966B] mt-0.5 font-medium">Government gazette sources</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-[#19966B]/10 border border-[#19966B]/20 flex items-center justify-center text-[#19966B] shadow-xs">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-[#687386] dark:text-[#94A3B8] uppercase tracking-wider">Synthetic Demo Records</div>
            <div className="text-2xl font-bold text-[#E9A23B] mt-1">{kpis?.synthetic_cases_count || 0}</div>
            <div className="text-[11px] text-[#E9A23B] mt-0.5 font-medium">Deterministic seed (seed=42)</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-[#E9A23B]/10 border border-[#E9A23B]/20 flex items-center justify-center text-[#E9A23B] shadow-xs">
            <Layers className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* CSV Ingestion Pipeline Card */}
      <div className="glass-panel p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E1E7EF] dark:border-[#1F2E45] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#172033] dark:text-[#F1F5F9] flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-[#3563E9]" />
              <span>CSV Ingestion & Validation Pipeline</span>
            </h3>
            <p className="text-xs text-[#687386] dark:text-[#94A3B8] mt-0.5">
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
          <div className="p-3 bg-[#ECFDF5] dark:bg-[#19966B]/15 border border-[#A7F3D0] dark:border-[#19966B]/30 text-[#065F46] dark:text-[#34D399] rounded-lg text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4 text-[#19966B]" />
            <span>{importResult}</span>
          </div>
        )}

        {/* Upload Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#172033] dark:text-[#F1F5F9] mb-1">Select Data Provenance Classification *</label>
              <select
                value={importSource}
                onChange={(e) => setImportSource(e.target.value as any)}
                className="glass-input w-full px-3 py-2"
              >
                <option value="VERIFIED_PUBLIC_DATA">VERIFIED_PUBLIC_DATA (Official Gazette / NHAI records)</option>
                <option value="SYNTHETIC_DEMO_DATA">SYNTHETIC_DEMO_DATA (Demonstration / Test simulation)</option>
              </select>
              <p className="text-[11px] text-[#687386] dark:text-[#94A3B8] mt-1">
                Data sources are permanently segregated to guarantee governance transparency.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-[#172033] dark:text-[#F1F5F9] mb-1">Choose CSV File *</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="glass-input w-full text-xs text-[#172033] dark:text-[#F1F5F9] file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#3563E9]/10 file:text-[#3563E9] hover:file:bg-[#3563E9]/20"
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

          <div className="p-4 bg-[#F9FAFB] dark:bg-[#0E1726] rounded-lg border border-[#E1E7EF] dark:border-[#1F2E45] text-xs space-y-2 text-[#172033] dark:text-[#F1F5F9]">
            <h5 className="font-bold flex items-center gap-1.5 text-[#172033] dark:text-[#F1F5F9]">
              <Info className="h-4 w-4 text-[#3563E9]" />
              <span>Statutory Schema Constraints</span>
            </h5>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-[#687386] dark:text-[#94A3B8]">
              <li><strong>Required headers:</strong> case_id, project_name, state, district, land_required_hectares, current_stage, planned_stage_date.</li>
              <li><strong>Coordinates:</strong> Leave empty if unverified. Never fabricate GPS coordinates.</li>
              <li><strong>Percentages:</strong> compensation_pending_pct strictly between 0 and 100.</li>
              <li><strong>Transactions:</strong> Imports execute atomically — zero partial corruption.</li>
            </ul>
          </div>
        </div>

        {/* Validation Report & Preview */}
        {preview && (
          <div className="space-y-4 pt-4 border-t border-[#E1E7EF] dark:border-[#1F2E45]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-[#172033] dark:text-[#F1F5F9]">Pre-Ingestion Validation Audit</h4>
                <p className="text-xs text-[#687386] dark:text-[#94A3B8]">
                  Total Rows: {preview.total_rows} • Valid: <span className="text-[#19966B] font-bold">{preview.valid_rows_count}</span> • Errors: <span className="text-[#DC3545] font-bold">{preview.invalid_rows_count}</span>
                </p>
              </div>

              {preview.valid_rows_count > 0 && preview.invalid_rows_count === 0 && (
                <button
                  onClick={handleConfirmImport}
                  disabled={isImporting}
                  className="px-4 py-2 bg-[#19966B] hover:bg-[#15805a] text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  {isImporting ? 'Ingesting Records...' : `Confirm & Ingest ${preview.valid_rows_count} Parcels`}
                </button>
              )}
            </div>

            {/* Error List */}
            {preview.errors.length > 0 && (
              <div className="p-4 bg-[#FEF2F2] dark:bg-[#DC3545]/15 border border-[#FECACA] dark:border-[#DC3545]/30 rounded-lg space-y-2 text-xs">
                <div className="font-bold text-[#DC3545] flex items-center gap-1.5">
                  <XCircle className="h-4 w-4 text-[#DC3545]" />
                  <span>Validation Blockers ({preview.errors.length} errors found)</span>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {preview.errors.map((err, i) => (
                    <div key={i} className="text-[11px] text-[#DC3545]">
                      Row {err.row_number} [{err.field}]: {err.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sample Records Table */}
            {preview.sample_records.length > 0 && (
              <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain rounded-lg border border-[#E1E7EF] dark:border-[#1F2E45]">
                <table className="w-full min-w-[620px] text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F9FAFB] dark:bg-[#0E1726] text-[#687386] dark:text-[#94A3B8] font-semibold text-[11px] border-b border-[#E1E7EF] dark:border-[#1F2E45]">
                      <th className="p-2.5 min-w-[100px] whitespace-nowrap">Case ID</th>
                      <th className="p-2.5 min-w-[160px]">Project</th>
                      <th className="p-2.5 min-w-[130px]">State / District</th>
                      <th className="p-2.5 min-w-[140px]">Stage</th>
                      <th className="p-2.5 min-w-[90px]">Land (ha)</th>
                      <th className="p-2.5 min-w-[100px]">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E1E7EF] dark:divide-[#1F2E45]">
                    {preview.sample_records.map((r, i) => (
                      <tr key={i} className="hover:bg-[#F5F7FA] dark:hover:bg-[#1A2A42]/50 transition-colors">
                        <td className="p-2.5 font-mono font-bold text-[#3563E9] whitespace-nowrap">{r.case_id}</td>
                        <td className="p-2.5 font-medium text-[#172033] dark:text-[#F1F5F9]">{r.project_name}</td>
                        <td className="p-2.5 text-[#687386] dark:text-[#94A3B8]">{r.district}, {r.state}</td>
                        <td className="p-2.5 text-[#172033] dark:text-[#F1F5F9]">{r.current_stage}</td>
                        <td className="p-2.5 font-mono text-[#172033] dark:text-[#F1F5F9]">{r.land_required_hectares}</td>
                        <td className="p-2.5 font-mono text-[10px] text-[#19966B] whitespace-nowrap">{r.data_source}</td>
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
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E1E7EF] dark:border-[#1F2E45] pb-4">
          <div>
            <h3 className="text-sm font-bold text-[#172033] dark:text-[#F1F5F9] flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-[#3563E9]" />
              <span>Synthetic Demonstration Data Management</span>
            </h3>
            <p className="text-xs text-[#687386] dark:text-[#94A3B8]">
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
          <div className="p-3 bg-[#ECFDF5] dark:bg-[#19966B]/15 border border-[#A7F3D0] dark:border-[#19966B]/30 text-[#065F46] dark:text-[#34D399] rounded-lg text-xs flex items-center gap-2 font-medium">
            <Check className="h-4 w-4 text-[#19966B]" />
            <span>{demoNotice}</span>
          </div>
        )}

        <div className="text-xs text-[#687386] dark:text-[#94A3B8] leading-relaxed bg-[#F9FAFB] dark:bg-[#0E1726] p-4 rounded-lg border border-[#E1E7EF] dark:border-[#1F2E45]">
          <p>
            <strong>Governance Notice:</strong> All synthetic records are tagged with <span className="font-mono bg-[#FFFBEB] dark:bg-[#E9A23B]/10 text-[#B45309] dark:text-[#FBBF24] border border-[#FDE68A] dark:border-[#E9A23B]/30 px-1.5 py-0.5 rounded text-[10px]">SYNTHETIC_DEMO_DATA</span>. Resetting completely clears the database and deterministically regenerates 250 simulated cases, realistic milestone schedules, and associated follow-up actions for reproducible evaluations.
          </p>
        </div>
      </div>
    </div>
  );
};
