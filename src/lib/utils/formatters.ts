/**
 * User-friendly mapping for API Enums
 */

export const FILE_CATEGORY_LABELS: Record<string, string> = {
  CHARGEBEE_TRANSACTION_EXPORT: "Chargebee Transactions",
  CHARGEBEE_INVOICE_EXPORT: "Chargebee Invoices",
  RAZORPAY_REPORT: "Razorpay Payments",
  STRIPE_REPORT: "Stripe Payments",
  BANK_STATEMENT: "Bank Statement",
  INVOICE_EXPORT: "Generic Invoices",
  RAZORPAY_SETTLEMENT: "Razorpay Settlements",
  STRIPE_PAYOUT: "Stripe Payouts",
};

export const NORMALIZATION_STATUS_LABELS: Record<string, string> = {
  PENDING: "Waiting",
  PROCESSING: "Analyzing...",
  COMPLETED: "Ready",
  FAILED: "Error",
};

export const RUN_STATUS_LABELS: Record<string, string> = {
  PENDING: "Initialized",
  PROCESSING: "Worker Active",
  COMPLETED: "Resolved",
  FAILED: "Failed",
};

export const EXCEPTION_TYPE_LABELS: Record<string, string> = {
  MISSING_INVOICE: "Missing Customer Invoice",
  MISSING_PAYMENT: "Missing Payment Record",
  MISSING_SETTLEMENT: "Payment not Settled",
  MISSING_BANK_CREDIT: "Bank Credit not found",
  AMOUNT_MISMATCH: "Amount Discrepancy",
  FEE_MISMATCH: "Processing Fee Mismatch",
  TAX_MISMATCH: "Tax Calculation Difference",
  REFUND_MISMATCH: "Refund Amount Deviation",
  DUPLICATE_PAYMENT: "Potential Duplicate Entry",
  DELAYED_SETTLEMENT: "Delayed Gateway Payout",
  UNKNOWN_BANK_CREDIT: "Unidentified Bank Credit",
  OFFLINE_PAYMENT_CANDIDATE: "Likely Offline Payment",
  CHARGEBACK_OR_DISPUTE: "Customer Chargeback",
  CURRENCY_MISMATCH: "FX Rate Discrepancy",
  NEEDS_MANUAL_REVIEW: "Manual Verification Required",
  NET_SETTLEMENT_DIFF: "Net Settlement Variance",
};

export const SEVERITY_LABELS: Record<string, string> = {
  LOW: "Trace",
  MEDIUM: "Minor",
  HIGH: "Major",
  CRITICAL: "Immediate Action",
};

export const EXCEPTION_STATUS_LABELS: Record<string, string> = {
  OPEN: "Needs Attention",
  RESOLVED: "Archived",
  IGNORED: "Dismissed",
};

export const EVENT_TYPE_LABELS: Record<string, string> = {
  WORKSPACE_WORKSPACE_CREATED: "Workspace created",
  UPLOAD_FILE_UPLOADED: "File uploaded",
  UPLOAD_FILE_DELETED: "File deleted",
  COLUMN_MAPPING_REVIEWED: "Columns mapped",
  RECONCILIATION_RUN_STARTED: "Manual run started",
  RECONCILIATION_RUN_COMPLETED: "Matching complete",
  EXPORT_GENERATED: "Report exported",
};

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  WORKSPACE: "Workspace",
  UPLOADED_FILE: "Source Data",
  COLUMN_MAPPING: "Mapping Schema",
  RECONCILIATION_RUN: "Audit Run",
  EXCEPTION: "Discrepancy",
};

export function formatLabel(key: string, mapper: Record<string, string>): string {
  if (!key) return "";
  return mapper[key] || key.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export function formatCurrency(amount: number, currency: string = "USD"): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(Number(amount));
}
