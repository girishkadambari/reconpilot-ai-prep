/**
 * SettleProof API v0.3 Types
 * Synchronized with backend openapi.json
 */

export interface ApiResponse<T> {
  data: T;
  request_id: string;
  pagination?: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
  stats?: Record<string, any>;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details: Record<string, any>;
  };
  request_id: string;
}

// -- Auth --

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  active_workspace_id: string | null;
  role: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  role: string; // Current user's role
  status: string;
  created_at: string;
}

export interface WorkspaceMember {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string;
  role: string;
  status: string;
  joined_at: string | null;
}

export interface AuthContext {
  user: User;
  active_workspace: Workspace;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

// -- Uploads --

export type FileCategory =
  | "CHARGEBEE_TRANSACTION_EXPORT"
  | "CHARGEBEE_INVOICE_EXPORT"
  | "RAZORPAY_REPORT"
  | "STRIPE_REPORT"
  | "BANK_STATEMENT"
  | "INVOICE_EXPORT"
  | "RAZORPAY_SETTLEMENT"
  | "STRIPE_PAYOUT";

export type NormalizationStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface UploadedFile {
  id: string;
  workspace_id: string;
  file_name: string;
  file_category: FileCategory;
  status: string;
  row_count: number | null;
  created_at: string;
}

export interface PreviewResponse {
  file_id: string;
  file_name: string;
  file_category: string;
  column_names: string[];
  rows: Record<string, any>[];
  total_rows: number;
  preview_count: number;
}

// -- Column Mapping --

export interface ColumnMapping {
  id: string;
  uploaded_file_id: string;
  mapping_json: Record<string, string>;
  ai_suggested_mapping_json: Record<string, string>;
  ai_confidence_score: number;
  status: "PENDING_REVIEW" | "CONFIRMED";
  created_at: string;
}

// -- Reconciliation --

export type RunStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface ReconciliationRun {
  id: string;
  workspace_id: string;
  name: string;
  status: RunStatus;
  total_source_rows: number;
  total_target_rows: number;
  matched_count: number;
  match_rate: number;
  exception_count: number;
  created_at: string;
  completed_at: string | null;
}

export interface MatchCandidate {
  id: string;
  run_id: string;
  source_id: string;
  target_id: string;
  confidence: number;
  match_strategy: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export interface ExceptionItem {
  id: string;
  run_id: string;
  file_role: "SOURCE" | "TARGET";
  exception_type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  amount: number;
  currency: string;
  status: "OPEN" | "RESOLVED" | "IGNORED";
  ai_explanation: string | null;
  note: string | null;
}

export interface RunSummary {
  headline: string;
  summary: string;
  risk_level: string;
  key_findings: string[];
  recommended_actions: string[];
  requires_immediate_attention: boolean;
}
