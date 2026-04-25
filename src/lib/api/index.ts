import { apiClient } from "./client";
import * as T from "./types";

/**
 * AUTH API
 */
export const authApi = {
  getMe: () => apiClient.get<T.AuthContext>("/api/auth/me"),
  devLogin: (data: { email: string; full_name?: string }) => 
    apiClient.post<{ access_token: string }>("/api/auth/dev-login", data),
  logout: () => apiClient.post("/api/auth/logout"),
};

/**
 * WORKSPACES API
 */
export const workspacesApi = {
  list: () => apiClient.get<T.Workspace[]>("/api/workspaces"),
  get: (id: string) => apiClient.get<T.Workspace>(`/api/workspaces/${id}`),
};

/**
 * UPLOADS API
 */
export const uploadsApi = {
  list: (params?: { file_category?: string; page?: number }) => {
    const q = new URLSearchParams();
    if (params?.file_category) q.append("file_category", params.file_category);
    if (params?.page) q.append("page", params.page.toString());
    const queryStr = q.toString() ? `?${q.toString()}` : "";
    return apiClient.get<T.UploadedFile[]>(`/api/uploads${queryStr}`);
  },
  upload: (file: File, category: string) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("file_category", category);
    return apiClient.post<T.UploadedFile>("/api/uploads", fd);
  },
  get: (id: string) => apiClient.get<T.UploadedFile>(`/api/uploads/${id}`),
  delete: (id: string) => apiClient.delete(`/api/uploads/${id}`),
  getPreview: (id: string, n = 20) => apiClient.get<T.PreviewResponse>(`/api/uploads/${id}/preview?n=${n}`),
};

/**
 * COLUMN MAPPINGS API
 */
export const columnMappingsApi = {
  get: (fileId: string) => apiClient.get<T.ColumnMapping>(`/api/column-mappings/${fileId}`),
  suggest: (fileId: string) => apiClient.post<T.ColumnMapping>(`/api/column-mappings/${fileId}/suggest`),
  confirm: (fileId: string, mapping?: Record<string, string>) => 
    apiClient.post<T.ColumnMapping>(`/api/column-mappings/${fileId}/confirm`, { mapping }),
  normalize: (fileId: string) => apiClient.post<T.UploadedFile>(`/api/column-mappings/${fileId}/normalize`),
  getRows: (fileId: string, page = 1) => 
    apiClient.get<any[]>(`/api/column-mappings/${fileId}/rows?page=${page}`),
};

/**
 * RECONCILIATION RUNS API
 */
export const reconciliationRunsApi = {
  list: (page = 1) => apiClient.get<T.ReconciliationRun[]>(`/api/reconciliation-runs?page=${page}`),
  create: (data: { name: string; uploaded_file_ids: string[] }) => 
    apiClient.post<T.ReconciliationRun>("/api/reconciliation-runs", data),
  get: (id: string) => apiClient.get<T.ReconciliationRun>(`/api/reconciliation-runs/${id}`),
  execute: (id: string) => apiClient.post<T.ReconciliationRun>(`/api/reconciliation-runs/${id}/run`),
  listMatches: (runId: string, params?: { status?: string; page?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.append("status", params.status);
    if (params?.page) q.append("page", params.page.toString());
    return apiClient.get<T.MatchCandidate[]>(`/api/reconciliation-runs/${runId}/matches?${q.toString()}`);
  },
  listExceptions: (runId: string, params?: { status?: string; page?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.append("status", params.status);
    if (params?.page) q.append("page", params.page.toString());
    return apiClient.get<T.ExceptionItem[]>(`/api/reconciliation-runs/${runId}/exceptions?${q.toString()}`);
  },
  reviewMatch: (runId: string, matchId: string, action: string, note?: string) =>
    apiClient.post(`/api/reconciliation-runs/${runId}/matches/${matchId}/review`, { action, note }),
  resolveException: (runId: string, exceptionId: string, status: string, note?: string) =>
    apiClient.post(`/api/reconciliation-runs/${runId}/exceptions/${exceptionId}/resolve`, { status, note }),
  explainException: (runId: string, exceptionId: string, force = false) =>
    apiClient.post<any>(`/api/reconciliation-runs/${runId}/exceptions/${exceptionId}/explain?force_refresh=${force}`),
  explainAll: (runId: string) => apiClient.post(`/api/reconciliation-runs/${runId}/explain-all`),
  getSummary: (runId: string) => apiClient.get<T.RunSummary>(`/api/reconciliation-runs/${runId}/summary`),
};

/**
 * EXPORTS API
 */
export const exportsApi = {
  create: (runId: string, scope = "FULL") => 
    apiClient.post<{ job_id: string }>(`/api/reconciliation-runs/${runId}/export?scope=${scope}`),
  list: (runId: string) => apiClient.get<any[]>(`/api/reconciliation-runs/${runId}/export`),
  getDownloadUrl: (runId: string, jobId: string) => 
    `${import.meta.env.VITE_API_BASE_URL}/api/reconciliation-runs/${runId}/export/${jobId}/download`,
};

export * from "./types";
