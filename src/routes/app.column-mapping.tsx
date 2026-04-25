import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, PageContainer, PageHeader, Btn, Badge, Table, Th, Td, Select, EmptyState, Modal, formatDate } from "@/components/app/ui";
import { Sparkles, CheckCircle2, Loader2, AlertCircle, Info, ArrowRight, RefreshCw, AlertTriangle } from "lucide-react";
import { columnMappingsApi, uploadsApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";

export const Route = createFileRoute("/app/column-mapping")({
  head: () => ({ meta: [{ title: "Column Mapping · ReconPilot" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    fileId: (search.fileId as string) || "",
  }),
  component: ColumnMappingPage,
});

const BANK_FIELDS = ["utr", "reference", "narration", "credit_amount", "debit_amount", "balance", "currency", "transaction_date"];
const PAYMENT_FIELDS = ["transaction_id", "payment_id", "order_id", "settlement_id", "payout_id", "invoice_id", "customer_email", "customer_id", "gross_amount", "fee_amount", "tax_amount", "refund_amount", "net_amount", "currency", "status", "gateway", "description", "transaction_date", "settlement_date"];
const BILLING_FIELDS = ["billing_system", "billing_transaction_id", "billing_invoice_id", "billing_customer_id", "billing_subscription_id", "transaction_id", "invoice_id", "subscription_id", "customer_id", "gateway", "gateway_transaction_id", "gateway_txn_id", "gross_amount", "net_amount", "currency", "status", "transaction_date"];
const INVOICE_FIELDS = ["invoice_id", "customer_id", "customer_email", "subscription_id", "payment_id", "gateway", "gross_amount", "net_amount", "currency", "status", "invoice_date", "due_date"];

const CATEGORY_FIELDS: Record<string, string[]> = {
  BANK_STATEMENT: BANK_FIELDS,
  STRIPE_REPORT: PAYMENT_FIELDS,
  RAZORPAY_REPORT: PAYMENT_FIELDS,
  CHARGEBEE_INVOICE_EXPORT: BILLING_FIELDS,
  CHARGEBEE_TRANSACTION_EXPORT: BILLING_FIELDS,
  INVOICE_EXPORT: INVOICE_FIELDS,
};

const ALL_CANONICAL_FIELDS = Array.from(new Set(Object.values(CATEGORY_FIELDS).flat()));

// ── Subtle AI pulse animation injected once ───────────────────────────────────
const AI_STYLES = `
  @keyframes rp-spin { to { transform: rotate(360deg); } }
  @keyframes rp-pulse-ring {
    0% { transform: scale(0.95); opacity: 0.7; }
    50% { transform: scale(1.05); opacity: 1; }
    100% { transform: scale(0.95); opacity: 0.7; }
  }
  @keyframes rp-dot {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
    40% { transform: scale(1); opacity: 1; }
  }
  @keyframes rp-slide-in {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .rp-slide-in { animation: rp-slide-in 0.3s ease-out both; }
  .rp-dot-1 { animation: rp-dot 1.2s ease-in-out infinite 0.0s; }
  .rp-dot-2 { animation: rp-dot 1.2s ease-in-out infinite 0.15s; }
  .rp-dot-3 { animation: rp-dot 1.2s ease-in-out infinite 0.30s; }
  .rp-pulse { animation: rp-pulse-ring 2s ease-in-out infinite; }
`;

// Step index: 0 = pending-suggest | 1 = suggesting | 2 = suggested | 3 = confirmed | 4 = normalizing | 5 = normalized
function getStep(
  isSuggesting: boolean,
  isConfirming: boolean,
  isNormalizing: boolean,
  hasSuggestion: boolean,
  isConfirmed: boolean,
  fileStatus: string | undefined,
): number {
  if (fileStatus === "NORMALIZED") return 5;
  if (fileStatus === "NORMALIZING" || isNormalizing) return 4;
  if (isConfirmed && !isConfirming) return 3;
  if (isConfirming) return 3; // show confirmed state while saving
  if (isSuggesting) return 1;
  if (hasSuggestion) return 2;
  return 0;
}

function ColumnMappingPage() {
  const { fileId } = Route.useSearch();
  const queryClient = useQueryClient();
  const [localMapping, setLocalMapping] = useState<Record<string, string>>({});
  const freshSuggestRef = useRef(false);
  // Re-normalize confirmation modal state
  const [showReNormalizeModal, setShowReNormalizeModal] = useState(false);

  const { data: file } = useQuery({
    queryKey: ["upload", fileId],
    queryFn: () => uploadsApi.get(fileId),
    enabled: !!fileId,
    refetchInterval: (q) =>
      q.state.data?.status === "NORMALIZING" ? 1500 : false,
  });

  const { data: mapping, isLoading: mappingLoading, error: mappingError } = useQuery({
    queryKey: ["mapping", fileId],
    queryFn: () => columnMappingsApi.get(fileId),
    enabled: !!fileId,
    retry: false,
  });

  // ── Mutations ───────────────────────────────────────────────────────────────
  const suggestMutation = useMutation({
    mutationFn: () => columnMappingsApi.suggest(fileId),
    onSuccess: (data) => {
      freshSuggestRef.current = true;
      queryClient.setQueryData(["mapping", fileId], data);
      queryClient.invalidateQueries({ queryKey: ["upload", fileId] });
      setLocalMapping(data.ai_suggested_mapping_json || data.mapping_json || {});
      toast.success("AI suggestion ready — review and confirm below.");
    },
    onError: (err: any) => {
      toast.error(err?.error?.message || "AI suggestion failed. Please try again.");
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (m: Record<string, string>) =>
      columnMappingsApi.confirm(fileId, m),
    onSuccess: (data) => {
      freshSuggestRef.current = false;
      queryClient.setQueryData(["mapping", fileId], data);
      queryClient.invalidateQueries({ queryKey: ["upload", fileId] });
      queryClient.invalidateQueries({ queryKey: ["uploads"] });
      setLocalMapping(data.mapping_json || {});
      toast.success("Mapping confirmed!");
    },
    onError: (err: any) => {
      toast.error(err?.error?.message || "Failed to confirm mapping. Please try again.");
    },
  });

  const normalizeMutation = useMutation({
    mutationFn: () => columnMappingsApi.normalize(fileId),
    onSuccess: async () => {
      // Immediately refetch so the UI switches to NORMALIZING then NORMALIZED state
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["upload", fileId] }),
        queryClient.refetchQueries({ queryKey: ["mapping", fileId] }),
      ]);
      queryClient.invalidateQueries({ queryKey: ["uploads"] });
      toast.success("Normalization complete! File is ready for reconciliation.");
    },
    onError: (err: any) => {
      queryClient.invalidateQueries({ queryKey: ["upload", fileId] });
      queryClient.invalidateQueries({ queryKey: ["mapping", fileId] });
      toast.error(err?.error?.message || "Normalization failed. Please try again.");
    },
  });

  // ── Sync localMapping from server ───────────────────────────────────────────
  useEffect(() => {
    if (!mapping) return;
    if (freshSuggestRef.current) return; // already set by onSuccess
    const working =
      mapping.mapping_json && Object.keys(mapping.mapping_json).length > 0
        ? mapping.mapping_json
        : mapping.ai_suggested_mapping_json || {};
    setLocalMapping(working);
  }, [mapping]);

  // Auto-suggest on 404 (file never mapped before)
  useEffect(() => {
    if (
      mappingError &&
      (mappingError as any)?.status === 404 &&
      !suggestMutation.isPending &&
      !suggestMutation.isSuccess
    ) {
      suggestMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mappingError]);

  // ── File picker (no fileId) ─────────────────────────────────────────────────
  const { data: allUploads } = useQuery({
    queryKey: ["uploads"],
    queryFn: () => uploadsApi.list(),
    enabled: !fileId,
  });

  if (!fileId) {
    const pending = (allUploads || []).filter(
      (u) => u.status === "PARSED" || u.status === "PENDING_MAPPING",
    );
    return (
      <PageContainer>
        <PageHeader
          title="Column Mapping"
          description="Map your uploaded file columns to our standard financial schema."
        />
        {pending.length > 0 ? (
          <div className="space-y-4">
            <p className="text-[13px] font-medium text-muted-foreground">
              Files needing mapping ({pending.length})
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pending.map((u) => (
                <Card
                  key={u.id}
                  className="hover:border-[#7C3AED]/40 transition-colors cursor-pointer group"
                >
                  <Link
                    to="/app/column-mapping"
                    search={{ fileId: u.id }}
                    className="block"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="font-semibold text-[14.5px] group-hover:text-[#7C3AED] transition-colors truncate pr-2">
                        {u.file_name}
                      </div>
                      <Badge tone="neutral">{u.file_category}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-[12px] text-muted-foreground">
                      <span>{(u.row_count ?? 0).toLocaleString()} rows</span>
                      <span>{formatDate(u.created_at)}</span>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            title="All files mapped!"
            description="Upload more files or proceed to create reconciliation runs."
            action={
              <div className="flex gap-3">
                <Link to="/app/uploads">
                  <Btn variant="secondary">Go to Uploads</Btn>
                </Link>
                <Link to="/app/runs">
                  <Btn>Create a run</Btn>
                </Link>
              </div>
            }
          />
        )}
      </PageContainer>
    );
  }

  // ── Derived state ───────────────────────────────────────────────────────────
  const isConfirmed = mapping?.status === "CONFIRMED";
  const isNormalized = file?.status === "NORMALIZED";
  const isNormalizing = file?.status === "NORMALIZING" || normalizeMutation.isPending;
  const hasSuggestion = !!(mapping?.ai_suggested_mapping_json);
  const hasColumns = Object.keys(localMapping).length > 0;
  const isLoadingTable = mappingLoading || suggestMutation.isPending;

  // Check if user has made manual edits since last save/suggestion
  const serverMapping = mapping?.mapping_json || mapping?.ai_suggested_mapping_json || {};
  const hasUnsavedChanges = JSON.stringify(localMapping) !== JSON.stringify(serverMapping);

  const step = getStep(
    suggestMutation.isPending,
    confirmMutation.isPending,
    isNormalizing,
    hasSuggestion,
    isConfirmed,
    file?.status,
  );

  return (
    <>
      <style>{AI_STYLES}</style>
      <PageContainer>
        {/* ── Header ── */}
        <PageHeader
          title="Column Mapping"
          description={`Configure how columns in ${file?.file_name ?? "your file"} map to our standard fields.`}
          actions={
            <div className="flex items-center gap-2">
              {/* Re-suggest available when not actively normalizing */}
              {!isNormalizing && (
                <Btn
                  variant="secondary"
                  onClick={() => suggestMutation.mutate()}
                  loading={suggestMutation.isPending}
                  disabled={suggestMutation.isPending}
                >
                  <Sparkles className="size-4" />
                  {isConfirmed || isNormalized ? "Re-suggest" : "Suggest with AI"}
                </Btn>
              )}

              {/* Primary action changes by step */}
              {(step <= 2 || hasUnsavedChanges) && !suggestMutation.isPending && hasColumns && !isNormalizing && (
                <Btn
                  onClick={() => confirmMutation.mutate(localMapping)}
                  loading={confirmMutation.isPending}
                  disabled={!hasColumns || confirmMutation.isPending}
                >
                  {isConfirmed || isNormalized ? "Save changes" : "Confirm mapping"}
                </Btn>
              )}
              {step === 3 && !hasUnsavedChanges && (
                <Btn
                  onClick={() => normalizeMutation.mutate()}
                  loading={isNormalizing}
                  disabled={isNormalizing}
                >
                  Normalize file
                </Btn>
              )}
              {step === 4 && (
                <Btn disabled loading>
                  Normalizing…
                </Btn>
              )}
              {step === 5 && !hasUnsavedChanges && (
                <Btn
                  variant="secondary"
                  onClick={() => setShowReNormalizeModal(true)}
                  disabled={isNormalizing}
                >
                  <RefreshCw className="size-4" />
                  Re-normalize
                </Btn>
              )}
            </div>
          }
        />

        {/* ── Progress steps ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-0 mb-6">
          {[
            { label: "AI Suggest", idx: 2 },
            { label: "Confirm", idx: 3 },
            { label: "Normalize", idx: 5 },
          ].map((s, i, arr) => {
            const done = step >= s.idx;
            const active = step === s.idx - 1 || (s.idx === 2 && step === 1);
            return (
              <div key={s.label} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full grid place-items-center text-[11px] font-bold transition-all ${done
                      ? "bg-[#7C3AED] text-white"
                      : active
                        ? "border-2 border-[#7C3AED] text-[#7C3AED]"
                        : "border-2 border-[#E5E5E5] text-[#B0B0B0]"
                      }`}
                  >
                    {done ? <CheckCircle2 className="size-3.5" /> : i + 1}
                  </div>
                  <span
                    className={`text-[12.5px] font-medium ${done ? "text-[#7C3AED]" : active ? "text-[#1a1a2e]" : "text-[#B0B0B0]"
                      }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight className="size-3.5 text-[#D1D5DB] mx-3" />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Status banner ───────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="rp-slide-in mb-5 flex items-center gap-3 px-4 py-3.5 rounded-[12px] border border-[#7C3AED]/20 bg-purple-50/40">
            <div className="rp-pulse w-8 h-8 rounded-full bg-[#7C3AED]/10 grid place-items-center flex-shrink-0">
              <Sparkles className="size-4 text-[#7C3AED]" />
            </div>
            <div>
              <div className="text-[13.5px] font-semibold">AI is analysing your columns</div>
              <div className="flex items-center gap-1 mt-1">
                <span className="rp-dot-1 w-1.5 h-1.5 rounded-full bg-[#7C3AED] inline-block" />
                <span className="rp-dot-2 w-1.5 h-1.5 rounded-full bg-[#7C3AED] inline-block" />
                <span className="rp-dot-3 w-1.5 h-1.5 rounded-full bg-[#7C3AED] inline-block" />
                <span className="text-[12px] text-muted-foreground ml-1">
                  Matching your columns to canonical fields…
                </span>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="rp-slide-in mb-5 flex items-center justify-between px-4 py-3.5 rounded-[12px] border border-[#7C3AED]/25 bg-purple-50/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#7C3AED]/10 grid place-items-center flex-shrink-0">
                <Sparkles className="size-4 text-[#7C3AED]" />
              </div>
              <div>
                <div className="text-[13.5px] font-semibold">Suggestion ready</div>
                <div className="text-[12px] text-muted-foreground">
                  Confidence:{" "}
                  <span className="font-semibold text-[#7C3AED]">
                    {mapping?.ai_confidence_score ?? "—"}%
                  </span>
                  {" · "}Review the mappings below, adjust if needed, then confirm.
                </div>
              </div>
            </div>
            <Badge tone="purple">AI Suggestion</Badge>
          </div>
        )}

        {step === 3 && (
          <div className="rp-slide-in mb-5 flex items-center justify-between px-4 py-3.5 rounded-[12px] border border-emerald-200 bg-emerald-50/40">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-5 text-emerald-600 flex-shrink-0" />
              <div>
                <div className="text-[13.5px] font-semibold text-emerald-800">Mapping confirmed</div>
                <div className="text-[12px] text-emerald-700">
                  Click <strong>Normalize file</strong> to transform records into canonical format.
                </div>
              </div>
            </div>
            <Badge tone="success">CONFIRMED</Badge>
          </div>
        )}

        {step === 4 && (
          <div className="rp-slide-in mb-5 flex items-center gap-3 px-4 py-3.5 rounded-[12px] border border-blue-200 bg-blue-50/40">
            <Loader2 className="size-5 text-blue-600 animate-spin flex-shrink-0" />
            <div>
              <div className="text-[13.5px] font-semibold text-blue-800">Normalization in progress</div>
              <div className="text-[12px] text-blue-700">
                Transforming source rows into the canonical financial schema…
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="rp-slide-in mb-5 flex items-center justify-between px-4 py-3.5 rounded-[12px] border border-emerald-200 bg-emerald-50/40">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-5 text-emerald-600 flex-shrink-0" />
              <div>
                <div className="text-[13.5px] font-semibold text-emerald-800">Normalized</div>
                <div className="text-[12px] text-emerald-700">
                  File is ready for reconciliation.{" "}
                  <Link to="/app/runs" className="underline font-medium">Create a run →</Link>
                  {" · "}
                  <button
                    className="underline font-medium text-emerald-700 hover:text-emerald-900"
                    onClick={() => setShowReNormalizeModal(true)}
                  >
                    Re-normalize
                  </button>
                </div>
              </div>
            </div>
            <Badge tone="success">NORMALIZED</Badge>
          </div>
        )}

        {/* ── Table (loading / empty / populated) ───────────────────────── */}
        {isLoadingTable ? (
          <div className="flex flex-col items-center justify-center py-24 rounded-[12px] border border-border bg-white">
            <div className="rp-pulse w-12 h-12 rounded-full bg-[#7C3AED]/8 grid place-items-center mb-4">
              <Sparkles className="size-5 text-[#7C3AED]" />
            </div>
            <p className="text-[13px] text-muted-foreground">
              {suggestMutation.isPending
                ? "AI is mapping your columns…"
                : "Loading column mapping…"}
            </p>
          </div>
        ) : !hasColumns ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-[12px] border border-dashed border-border">
            <AlertCircle className="size-7 text-muted-foreground mb-3" />
            <p className="text-[13.5px] font-medium text-muted-foreground">No mapping available</p>
            <p className="text-[12.5px] text-muted-foreground mt-1">
              Click "Suggest with AI" to generate mappings for this file.
            </p>
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Source column</Th>
                <Th>Canonical field</Th>
                <Th className="text-right">Status</Th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(localMapping).map(([col, mapped]) => (
                <tr key={col} className="hover:bg-[#FAFAFA] transition-colors">
                  <Td className="font-mono text-[13px] font-medium">{col}</Td>
                  <Td>
                    <Select
                      value={mapped}
                      onChange={(e) => {
                        freshSuggestRef.current = false;
                        setLocalMapping({ ...localMapping, [col]: e.target.value });
                      }}
                      className="max-w-[240px]"
                      disabled={isNormalizing}
                    >
                      {(file?.file_category ? CATEGORY_FIELDS[file.file_category] || [] : ALL_CANONICAL_FIELDS).concat("ignore").map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </Select>
                  </Td>
                  <Td className="text-right">
                    <Badge tone={mapped === "ignore" ? "neutral" : "success"}>
                      {mapped === "ignore" ? "Ignored" : "Mapped"}
                    </Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        {/* ── Footer hint ─────────────────────────────────────────────────── */}
        {hasColumns && !isLoadingTable && (
          <div className="mt-3 flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <Info className="size-3.5 flex-shrink-0" />
            {step <= 2
              ? "Adjust any incorrect mappings above, then click Confirm mapping."
              : step === 3
                ? "Mapping confirmed. Click Normalize file to process the records."
                : step === 4
                  ? "Normalization running — this may take a moment."
                  : "File is normalized. You can re-suggest and re-normalize if you need to fix mappings."}
          </div>
        )}

        {/* ── Re-normalize confirmation modal ──────────────────────────────── */}
        <Modal
          open={showReNormalizeModal}
          onClose={() => setShowReNormalizeModal(false)}
          title="Re-normalize file?"
          footer={
            <div className="flex justify-end gap-2">
              <Btn variant="secondary" onClick={() => setShowReNormalizeModal(false)}>
                Cancel
              </Btn>
              <Btn
                onClick={() => {
                  setShowReNormalizeModal(false);
                  normalizeMutation.mutate();
                }}
                loading={normalizeMutation.isPending}
              >
                <RefreshCw className="size-4" />
                Yes, re-normalize
              </Btn>
            </div>
          }
        >
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-[10px] bg-amber-50 border border-amber-200">
              <AlertTriangle className="size-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-[13px] text-amber-800">
                <strong>This will delete all existing canonical rows</strong> for this file and re-process them from scratch.
              </div>
            </div>
            <p className="text-[13px] text-muted-foreground">
              Use this if you've changed the column mappings above and need to re-apply them.
              Any reconciliation runs that used this file's canonical data may need to be re-run.
            </p>
          </div>
        </Modal>
      </PageContainer>
    </>
  );
}
