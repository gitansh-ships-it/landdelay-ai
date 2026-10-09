import {
  DashboardSummary, DashboardCharts, CaseListResponse, AcquisitionCase,
  RiskAssessment, ActionItem, ModelEvaluationResponse, MapResponse,
  ImportPreviewResponse, PredictionResponse
} from '../types';

// Read API URL from Vite environment variable (e.g., https://landdelay-backend.onrender.com)
// If not specified, default to relative '/api' which uses local Vite proxy or Vercel rewrites
const envApiUrl = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').trim();
const cleanUrl = envApiUrl.replace(/\/+$/, '');
const API_BASE = cleanUrl
  ? (cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`)
  : '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errMsg = `Request failed: ${res.statusText}`;
    try {
      const err = await res.json();
      errMsg = err.detail || errMsg;
    } catch (_) {}
    throw new Error(errMsg);
  }
  const data = await res.json();
  return data as T;
}

export const api = {
  // Base URL introspection
  getBaseUrl: () => API_BASE,

  // Health
  getHealth: () => fetch(`${API_BASE}/health`).then(res => handleResponse<any>(res)),

  // Dashboard
  getDashboardSummary: (filters?: Record<string, string>): Promise<DashboardSummary> => {
    const params = new URLSearchParams(filters);
    return fetch(`${API_BASE}/dashboard/summary?${params.toString()}`).then(res => handleResponse<DashboardSummary>(res));
  },

  getDashboardCharts: (filters?: Record<string, string>): Promise<DashboardCharts> => {
    const params = new URLSearchParams(filters);
    return fetch(`${API_BASE}/dashboard/charts?${params.toString()}`).then(res => handleResponse<DashboardCharts>(res));
  },

  // Cases
  getCases: (params?: Record<string, any>): Promise<CaseListResponse> => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          query.append(k, String(v));
        }
      });
    }
    return fetch(`${API_BASE}/cases?${query.toString()}`).then(res => handleResponse<CaseListResponse>(res));
  },

  getCase: (caseId: string): Promise<AcquisitionCase> =>
    fetch(`${API_BASE}/cases/${encodeURIComponent(caseId)}`).then(res => handleResponse<AcquisitionCase>(res)),

  createCase: (payload: any): Promise<AcquisitionCase> =>
    fetch(`${API_BASE}/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(res => handleResponse<AcquisitionCase>(res)),

  updateCase: (caseId: string, payload: any): Promise<AcquisitionCase> =>
    fetch(`${API_BASE}/cases/${encodeURIComponent(caseId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(res => handleResponse<AcquisitionCase>(res)),

  getCaseRisk: (caseId: string): Promise<RiskAssessment> =>
    fetch(`${API_BASE}/cases/${encodeURIComponent(caseId)}/risk`).then(res => handleResponse<RiskAssessment>(res)),

  // Actions
  getActions: (params?: Record<string, any>): Promise<ActionItem[]> => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v) query.append(k, String(v));
      });
    }
    return fetch(`${API_BASE}/actions?${query.toString()}`).then(res => handleResponse<ActionItem[]>(res));
  },

  createAction: (payload: any): Promise<ActionItem> =>
    fetch(`${API_BASE}/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(res => handleResponse<ActionItem>(res)),

  updateAction: (actionId: string, payload: any): Promise<ActionItem> =>
    fetch(`${API_BASE}/actions/${encodeURIComponent(actionId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(res => handleResponse<ActionItem>(res)),

  // Map
  getMapCases: (params?: Record<string, any>): Promise<MapResponse> => {
    const query = new URLSearchParams(params);
    return fetch(`${API_BASE}/map/cases?${query.toString()}`).then(res => handleResponse<MapResponse>(res));
  },

  // Projects
  getProjects: (): Promise<any[]> =>
    fetch(`${API_BASE}/projects`).then(res => handleResponse<any[]>(res)),

  getProject: (projectId: string): Promise<any> =>
    fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}`).then(res => handleResponse<any>(res)),

  // Model Evaluation & Prediction
  getModelEvaluation: (): Promise<ModelEvaluationResponse> =>
    fetch(`${API_BASE}/model/evaluation`).then(res => handleResponse<ModelEvaluationResponse>(res)),

  predictDelay: (payload: any): Promise<PredictionResponse> =>
    fetch(`${API_BASE}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(res => handleResponse<PredictionResponse>(res)),

  // Demo Controls - requires administrative key parameter, never hardcoded in bundle
  seedDemoData: (adminKey?: string): Promise<any> => {
    const headers: Record<string, string> = {};
    if (adminKey) headers['X-Admin-Key'] = adminKey;
    return fetch(`${API_BASE}/demo/seed`, {
      method: 'POST',
      headers
    }).then(res => handleResponse<any>(res));
  },

  resetDemoData: (adminKey?: string): Promise<any> => {
    const headers: Record<string, string> = {};
    if (adminKey) headers['X-Admin-Key'] = adminKey;
    return fetch(`${API_BASE}/demo/reset`, {
      method: 'POST',
      headers
    }).then(res => handleResponse<any>(res));
  },

  // CSV Import
  previewCSV: (file: File): Promise<ImportPreviewResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${API_BASE}/import/preview`, {
      method: 'POST',
      body: formData
    }).then(res => handleResponse<ImportPreviewResponse>(res));
  },

  confirmCSV: (data_source: string, records: any[]): Promise<any> =>
    fetch(`${API_BASE}/import/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data_source, records })
    }).then(res => handleResponse<any>(res)),
};
