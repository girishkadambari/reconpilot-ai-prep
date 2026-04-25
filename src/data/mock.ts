// Mock data structured around the API envelope { data, request_id, pagination }
export type ApiEnvelope<T> = { data: T; request_id: string; pagination?: { page: number; page_size: number; total: number } };

export const reqId = () => "req_" + Math.random().toString(36).slice(2, 10);

export type User = { id: string; full_name: string; email: string; avatar_initials: string };
export type Workspace = { id: string; name: string; role: "OWNER" | "ADMIN" | "MEMBER" | "ACCOUNTANT" | "VIEWER"; active?: boolean };

export const currentUser: User = {
  id: "u_1", full_name: "Aman Verma", email: "aman@northwind.io", avatar_initials: "AV",
};

export const workspaces: Workspace[] = [
  { id: "w_1", name: "Northwind Payments", role: "OWNER", active: true },
  { id: "w_2", name: "Acme Holdings", role: "ADMIN" },
];

export type FileCategory =
  | "STRIPE_REPORT" | "RAZORPAY_REPORT" | "CHARGEBEE_INVOICE_EXPORT"
  | "CHARGEBEE_TRANSACTION_EXPORT" | "BANK_STATEMENT" | "INVOICE_EXPORT";

export type UploadStatus = "PARSED" | "NORMALIZED" | "PARSE_FAILED" | "PARSING";

export type UploadedFile = {
  id: string;
  file_name: string;
  file_category: FileCategory;
  status: UploadStatus;
  rows: number;
  uploaded_at: string;
};

export const uploads: UploadedFile[] = [
  { id: "f_1", file_name: "stripe_payouts_oct.csv", file_category: "STRIPE_REPORT", status: "NORMALIZED", rows: 1842, uploaded_at: "2025-04-22T10:14:00Z" },
  { id: "f_2", file_name: "razorpay_settlements_oct.csv", file_category: "RAZORPAY_REPORT", status: "NORMALIZED", rows: 932, uploaded_at: "2025-04-22T10:18:00Z" },
  { id: "f_3", file_name: "hdfc_current_account_oct.xlsx", file_category: "BANK_STATEMENT", status: "PARSED", rows: 412, uploaded_at: "2025-04-22T11:02:00Z" },
  { id: "f_4", file_name: "chargebee_invoices_oct.csv", file_category: "CHARGEBEE_INVOICE_EXPORT", status: "NORMALIZED", rows: 612, uploaded_at: "2025-04-22T11:30:00Z" },
  { id: "f_5", file_name: "chargebee_txn_oct.csv", file_category: "CHARGEBEE_TRANSACTION_EXPORT", status: "PARSED", rows: 1204, uploaded_at: "2025-04-22T11:32:00Z" },
  { id: "f_6", file_name: "invoice_export_oct.xlsx", file_category: "INVOICE_EXPORT", status: "PARSE_FAILED", rows: 0, uploaded_at: "2025-04-22T11:45:00Z" },
];

export type RunStatus = "DRAFT" | "RUNNING" | "COMPLETED" | "FAILED";
export type Run = {
  id: string; name: string; status: RunStatus;
  files: number; matched: number; exceptions: number;
  match_rate: number; created_at: string;
  total_records?: number; matched_amount?: number; unmatched_amount?: number;
};

export const runs: Run[] = [
  { id: "r_1", name: "October close — Stripe + HDFC", status: "COMPLETED", files: 3, matched: 1684, exceptions: 47, match_rate: 0.973, created_at: "2025-04-23T09:14:00Z", total_records: 1731, matched_amount: 4821300, unmatched_amount: 92450 },
  { id: "r_2", name: "Razorpay settlements Q3", status: "COMPLETED", files: 2, matched: 902, exceptions: 30, match_rate: 0.968, created_at: "2025-04-21T14:00:00Z", total_records: 932, matched_amount: 1240900, unmatched_amount: 38200 },
  { id: "r_3", name: "Chargebee invoice tie-out", status: "RUNNING", files: 2, matched: 0, exceptions: 0, match_rate: 0, created_at: "2025-04-25T08:02:00Z" },
  { id: "r_4", name: "September month-end", status: "FAILED", files: 4, matched: 0, exceptions: 0, match_rate: 0, created_at: "2025-04-01T07:30:00Z" },
];

export type ExceptionType =
  | "MISSING_INVOICE" | "MISSING_PAYMENT" | "MISSING_SETTLEMENT" | "MISSING_BANK_CREDIT"
  | "AMOUNT_MISMATCH" | "FEE_MISMATCH" | "TAX_MISMATCH" | "REFUND_MISMATCH"
  | "DUPLICATE_PAYMENT" | "DELAYED_SETTLEMENT" | "UNKNOWN_BANK_CREDIT"
  | "OFFLINE_PAYMENT_CANDIDATE" | "CHARGEBACK_OR_DISPUTE" | "CURRENCY_MISMATCH"
  | "NEEDS_MANUAL_REVIEW" | "NET_SETTLEMENT_DIFF";

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ExceptionStatus = "OPEN" | "RESOLVED" | "WAIVED";

export type Exception = {
  id: string;
  type: ExceptionType;
  severity: Severity;
  amount: number;
  currency: string;
  explanation: string;
  suggested_action: string;
  status: ExceptionStatus;
  reference?: string;
};

export const exceptions: Exception[] = [
  { id: "e_1", type: "REFUND_MISMATCH", severity: "HIGH", amount: 4250, currency: "INR", explanation: "Refund logged in Stripe but no offsetting bank debit found within 5 business days.", suggested_action: "Check HDFC statement for delayed clearing", status: "OPEN", reference: "ch_3PqKL..." },
  { id: "e_2", type: "MISSING_BANK_CREDIT", severity: "CRITICAL", amount: 18900, currency: "INR", explanation: "Razorpay reports successful settlement, no matching credit on bank statement.", suggested_action: "Open ticket with Razorpay support", status: "OPEN", reference: "set_KQz..." },
  { id: "e_3", type: "AMOUNT_MISMATCH", severity: "MEDIUM", amount: 320, currency: "INR", explanation: "Net amount differs by ₹320 — likely FX rounding on multi-currency invoice.", suggested_action: "Verify FX rate used at settlement", status: "OPEN", reference: "inv_8821" },
  { id: "e_4", type: "DUPLICATE_PAYMENT", severity: "HIGH", amount: 7500, currency: "INR", explanation: "Two identical charges within 90 seconds for same customer.", suggested_action: "Refund duplicate and notify customer", status: "OPEN", reference: "cus_PrA1..." },
  { id: "e_5", type: "OFFLINE_PAYMENT_CANDIDATE", severity: "LOW", amount: 12000, currency: "INR", explanation: "Bank credit with reference 'NEFT INV-9921' has no matching gateway record.", suggested_action: "Tag as offline payment against invoice 9921", status: "OPEN", reference: "UTR8821..." },
  { id: "e_6", type: "FEE_MISMATCH", severity: "LOW", amount: 18, currency: "INR", explanation: "Stripe fee differs from expected by ₹18.", suggested_action: "Acceptable variance — waive", status: "RESOLVED", reference: "ch_3Pq..." },
  { id: "e_7", type: "DELAYED_SETTLEMENT", severity: "MEDIUM", amount: 9400, currency: "INR", explanation: "Settlement scheduled for T+2 arrived on T+5.", suggested_action: "Note for cashflow forecasting", status: "OPEN", reference: "set_LM2..." },
  { id: "e_8", type: "UNKNOWN_BANK_CREDIT", severity: "MEDIUM", amount: 3200, currency: "INR", explanation: "Bank credit cannot be traced to any gateway or invoice.", suggested_action: "Manual review", status: "OPEN", reference: "UTR9931..." },
];

export type Match = {
  id: string;
  source_type: string;
  target_type: string;
  amount: number;
  confidence: number;
  strategy: string;
  status: "AUTO_MATCHED" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";
};

export const matches: Match[] = [
  { id: "m_1", source_type: "STRIPE_CHARGE", target_type: "BANK_CREDIT", amount: 12500, confidence: 98, strategy: "exact_amount+date", status: "AUTO_MATCHED" },
  { id: "m_2", source_type: "RAZORPAY_PAYMENT", target_type: "INVOICE", amount: 4200, confidence: 95, strategy: "reference_id", status: "AUTO_MATCHED" },
  { id: "m_3", source_type: "STRIPE_PAYOUT", target_type: "BANK_CREDIT", amount: 88450, confidence: 88, strategy: "amount+window", status: "PENDING_REVIEW" },
  { id: "m_4", source_type: "CHARGEBEE_TXN", target_type: "INVOICE", amount: 1820, confidence: 76, strategy: "fuzzy_reference", status: "PENDING_REVIEW" },
  { id: "m_5", source_type: "BANK_DEBIT", target_type: "STRIPE_REFUND", amount: 2400, confidence: 92, strategy: "exact_amount+date", status: "APPROVED" },
];

export type ColumnMappingRow = {
  source_column: string;
  sample_value: string;
  canonical_field: string;
  confidence: number;
  mapping_source: "AI" | "USER" | "DEFAULT";
};

export const columnMapping: ColumnMappingRow[] = [
  { source_column: "id", sample_value: "ch_3PqKLm2eZv...", canonical_field: "transaction_id", confidence: 99, mapping_source: "AI" },
  { source_column: "amount", sample_value: "12500", canonical_field: "amount_minor", confidence: 98, mapping_source: "AI" },
  { source_column: "currency", sample_value: "INR", canonical_field: "currency", confidence: 99, mapping_source: "AI" },
  { source_column: "fee", sample_value: "212", canonical_field: "fee_minor", confidence: 94, mapping_source: "AI" },
  { source_column: "net", sample_value: "12288", canonical_field: "net_amount_minor", confidence: 92, mapping_source: "AI" },
  { source_column: "created", sample_value: "2025-04-22 10:14:00", canonical_field: "transaction_date", confidence: 96, mapping_source: "AI" },
  { source_column: "description", sample_value: "Subscription — Pro plan", canonical_field: "description", confidence: 71, mapping_source: "AI" },
  { source_column: "customer_email", sample_value: "ops@acme.io", canonical_field: "counterparty_email", confidence: 88, mapping_source: "AI" },
];

export const canonicalFields = [
  "transaction_id", "amount_minor", "currency", "fee_minor", "net_amount_minor",
  "transaction_date", "settlement_date", "description", "counterparty_email",
  "reference", "invoice_id", "customer_id", "ignore"
];

export const filePreviewRows = [
  { id: "ch_3PqKLm2eZv1", amount: 12500, currency: "INR", fee: 212, net: 12288, created: "2025-04-22 10:14:00", description: "Subscription — Pro plan" },
  { id: "ch_3PqKLm9eZv2", amount: 4200, currency: "INR", fee: 86, net: 4114, created: "2025-04-22 10:18:00", description: "One-time charge" },
  { id: "ch_3PqKLm4eZv3", amount: 88450, currency: "INR", fee: 1248, net: 87202, created: "2025-04-22 10:22:00", description: "Subscription — Enterprise" },
  { id: "ch_3PqKLm7eZv4", amount: 1820, currency: "INR", fee: 38, net: 1782, created: "2025-04-22 10:30:00", description: "Add-on" },
  { id: "ch_3PqKLm8eZv5", amount: 2400, currency: "INR", fee: 52, net: 2348, created: "2025-04-22 10:42:00", description: "Refund offset" },
];

export type ExportJob = {
  id: string; name: string; scope: "FULL" | "MATCHES_ONLY" | "EXCEPTIONS_ONLY";
  status: "QUEUED" | "RUNNING" | "READY" | "FAILED"; run: string; created_at: string;
};

export const exportJobs: ExportJob[] = [
  { id: "x_1", name: "October close — Full report", scope: "FULL", status: "READY", run: "October close — Stripe + HDFC", created_at: "2025-04-23T10:00:00Z" },
  { id: "x_2", name: "Exceptions only — Q3", scope: "EXCEPTIONS_ONLY", status: "READY", run: "Razorpay settlements Q3", created_at: "2025-04-21T15:00:00Z" },
  { id: "x_3", name: "Matches only — October", scope: "MATCHES_ONLY", status: "RUNNING", run: "October close — Stripe + HDFC", created_at: "2025-04-25T08:30:00Z" },
];

export type ActivityItem = { id: string; kind: "upload" | "mapping" | "run" | "exception" | "export"; text: string; when: string };
export const activity: ActivityItem[] = [
  { id: "a_1", kind: "export", text: "Report exported — October close", when: "12 min ago" },
  { id: "a_2", kind: "exception", text: "Exception resolved — Refund mismatch ₹4,250", when: "1 h ago" },
  { id: "a_3", kind: "run", text: "Reconciliation completed — 97.3% match rate", when: "3 h ago" },
  { id: "a_4", kind: "mapping", text: "Mapping confirmed — stripe_payouts_oct.csv", when: "5 h ago" },
  { id: "a_5", kind: "upload", text: "File uploaded — hdfc_current_account_oct.xlsx", when: "Yesterday" },
];

export const integrations = [
  { name: "Stripe", status: "available", note: "Upload-based" },
  { name: "Razorpay", status: "available", note: "Upload-based" },
  { name: "Chargebee", status: "available", note: "Upload-based" },
  { name: "Cashfree", status: "coming_soon" },
  { name: "PayU", status: "coming_soon" },
  { name: "Zoho Books", status: "coming_soon" },
  { name: "Tally", status: "coming_soon" },
  { name: "QuickBooks", status: "coming_soon" },
  { name: "Xero", status: "coming_soon" },
];

export const serviceHealth = [
  { name: "API", status: "operational" },
  { name: "Ready", status: "operational" },
  { name: "Database", status: "operational" },
  { name: "Storage", status: "operational" },
  { name: "AI Provider", status: "degraded" },
];

export const members = [
  { id: "m_1", name: "Aman Verma", email: "aman@northwind.io", role: "OWNER" },
  { id: "m_2", name: "Priya Shah", email: "priya@northwind.io", role: "ADMIN" },
  { id: "m_3", name: "Rahul Iyer", email: "rahul@northwind.io", role: "ACCOUNTANT" },
  { id: "m_4", name: "Maya Khan", email: "maya@northwind.io", role: "MEMBER" },
  { id: "m_5", name: "Audit Bot", email: "audit@external.io", role: "VIEWER" },
];
