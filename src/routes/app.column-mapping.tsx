import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, PageContainer, PageHeader, Btn, Badge, Table, Th, Td, Select, EmptyState, formatDate } from "@/components/app/ui";
import { Sparkles, Info, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
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

const CANONICAL_FIELDS = [
  "transaction_id", "payment_id", "order_id", "settlement_id", "payout_id", "invoice_id", "utr",
  "gross_amount", "net_amount", "fee_amount", "tax_amount", "refund_amount",
  "credit_amount", "debit_amount", "amount", "balance",
  "transaction_date", "settlement_date", "invoice_date", "due_date",
  "currency", "status", "customer_email", "description", "narration", "reference", "gateway", "ignore"
];

// ── AI Suggestion Banner ──────────────────────────────────────────────────────
function AISuggestionBanner({ confidence, isNew }: { confidence: number; isNew: boolean }) {
  return (
    <>
      <style>{`
        @keyframes ai-border-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes ai-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes ai-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.7; }
          33% { transform: translateY(-4px) rotate(10deg); opacity: 1; }
          66% { transform: translateY(2px) rotate(-5deg); opacity: 0.8; }
        }
        @keyframes ai-scan {
          0% { top: 0%; opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes ai-glow-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0); }
          50% { box-shadow: 0 0 20px 4px rgba(124, 58, 237, 0.15); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ai-banner { animation: fade-in-up 0.4s ease-out, ai-glow-pulse 3s ease-in-out 0.4s infinite; }
        .ai-shimmer-bar { animation: ai-shimmer 2.5s ease-in-out infinite; }
        .ai-float-1 { animation: ai-float 3s ease-in-out infinite; }
        .ai-float-2 { animation: ai-float 3s ease-in-out 1s infinite; }
        .ai-float-3 { animation: ai-float 3s ease-in-out 2s infinite; }
        .ai-border { animation: ai-border-pulse 2s ease-in-out infinite; }
        .ai-scan-line { animation: ai-scan 3s ease-in-out infinite; }
      `}</style>
      <div
        className="ai-banner mb-5 relative overflow-hidden rounded-[14px] border"
        style={{
          background: "linear-gradient(135deg, rgba(124, 58, 237, 0.04) 0%, rgba(167, 139, 250, 0.06) 50%, rgba(99, 102, 241, 0.04) 100%)",
          borderColor: "rgba(124, 58, 237, 0.3)",
        }}
      >
        {/* Shimmer sweep */}
        <div
          className="ai-shimmer-bar absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(105deg, transparent 40%, rgba(167, 139, 250, 0.12) 50%, transparent 60%)",
            width: "60%",
          }}
        />

        {/* Scan line */}
        <div
          className="ai-scan-line absolute left-0 right-0 h-px pointer-events-none"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(124, 58, 237, 0.4), transparent)",
          }}
        />

        <div className="relative px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            {/* Animated icon cluster */}
            <div
              className="relative w-10 h-10 rounded-[12px] grid place-items-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #7C3AED22, #6366F122)", border: "1px solid rgba(124, 58, 237, 0.25)" }}
            >
              <Sparkles className="size-5 text-[#7C3AED]" style={{ filter: "drop-shadow(0 0 4px rgba(124,58,237,0.5))" }} />
              {/* Floating mini sparkles */}
              <span className="ai-float-1 absolute -top-1 -right-1 text-[8px]">✦</span>
              <span className="ai-float-2 absolute -bottom-1 -left-1 text-[6px] text-purple-400">✦</span>
              <span className="ai-float-3 absolute top-0 left-0 text-[5px] text-indigo-400">✦</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-[#1a1a2e]">AI suggestion ready</span>
                {isNew && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(124,58,237,0.12)", color: "#7C3AED" }}
                  >
                    NEW
                  </span>
                )}
              </div>
              <div className="text-[12.5px] text-muted-foreground mt-0.5">
                Confidence:{" "}
                <span style={{ color: confidence >= 80 ? "#059669" : confidence >= 60 ? "#D97706" : "#DC2626", fontWeight: 600 }}>
                  {confidence}%
                </span>
                {" "}&mdash; Review the mappings below and confirm when ready.
              </div>
            </div>
          </div>

          {/* Confidence ring */}
          <div className="flex items-center gap-3">
            <svg width="36" height="36" viewBox="0 0 36 36" className="flex-shrink-0">
              <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(124,58,237,0.1)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15" fill="none"
                stroke={confidence >= 80 ? "#059669" : confidence >= 60 ? "#D97706" : "#DC2626"}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${(confidence / 100) * 94.2} 94.2`}
                transform="rotate(-90 18 18)"
                style={{ transition: "stroke-dasharray 1s ease-out" }}
              />
              <text x="18" y="22" textAnchor="middle" fontSize="9" fontWeight="700" fill="#7C3AED">{confidence}%</text>
            </svg>
            <div
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: "rgba(124,58,237,0.1)", color: "#7C3AED", border: "1px solid rgba(124,58,237,0.2)" }}
            >
              ✦ AI Powered
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Thinking Banner (while AI is generating) ─────────────────────────────────
function AIThinkingBanner() {
  return (
    <>
      <style>{`
        @keyframes ai-think-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        .think-dot-1 { animation: ai-think-dot 1.4s ease-in-out infinite 0s; }
        .think-dot-2 { animation: ai-think-dot 1.4s ease-in-out infinite 0.2s; }
        .think-dot-3 { animation: ai-think-dot 1.4s ease-in-out infinite 0.4s; }
        @keyframes ai-sweep {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .ai-thinking-bar {
          background: linear-gradient(90deg, #e9d5ff 0%, #c4b5fd 25%, #7C3AED 50%, #c4b5fd 75%, #e9d5ff 100%);
          background-size: 200% 100%;
          animation: ai-sweep 2s linear infinite;
        }
      `}</style>
      <div
        className="mb-5 rounded-[14px] border overflow-hidden"
        style={{ borderColor: "rgba(124,58,237,0.2)", background: "rgba(124,58,237,0.03)" }}
      >
        <div className="h-0.5 ai-thinking-bar" />
        <div className="px-4 py-3.5 flex items-center gap-3.5">
          <div
            className="w-10 h-10 rounded-[12px] grid place-items-center flex-shrink-0"
            style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)" }}
          >
            <Sparkles className="size-5 text-[#7C3AED]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold text-[#1a1a2e]">AI is analysing your columns</span>
              <span className="flex items-center gap-1 ml-1">
                <span className="think-dot-1 w-1.5 h-1.5 rounded-full bg-[#7C3AED] inline-block" />
                <span className="think-dot-2 w-1.5 h-1.5 rounded-full bg-[#7C3AED] inline-block" />
                <span className="think-dot-3 w-1.5 h-1.5 rounded-full bg-[#7C3AED] inline-block" />
              </span>
            </div>
            <div className="text-[12.5px] text-muted-foreground mt-0.5">
              Matching your source columns to our canonical financial schema…
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


function ColumnMappingPage() {
  const { fileId } = Route.useSearch();
  const queryClient = useQueryClient();
  const [localMapping, setLocalMapping] = useState<Record<string, string>>({});
  // Track if the mapping was freshly suggested (so we always show ai_suggested_mapping_json)
  const freshSuggestRef = useRef(false);

  const { data: file } = useQuery({
    queryKey: ["upload", fileId],
    queryFn: () => uploadsApi.get(fileId),
    enabled: !!fileId,
  });

  const { data: mapping, isLoading: mappingLoading, error: mappingError } = useQuery({
    queryKey: ["mapping", fileId],
    queryFn: () => columnMappingsApi.get(fileId),
    enabled: !!fileId,
    retry: false,
  });

  const suggestMutation = useMutation({
    mutationFn: () => columnMappingsApi.suggest(fileId),
    onSuccess: (data) => {
      freshSuggestRef.current = true;
      // Use the fresh AI suggestion as the working mapping
      const freshMapping = data.ai_suggested_mapping_json || data.mapping_json || {};
      queryClient.setQueryData(["mapping", fileId], data);
      setLocalMapping(freshMapping);
      toast.success("AI suggestion ready. Review and confirm below.");
    },
    onError: (err: any) => {
      if (err?.status === 404) {
        toast.error("File has no parsed rows yet. Try re-uploading the file.");
      } else {
        toast.error(err?.error?.message || "AI suggestion failed. Please try again.");
      }
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (m: Record<string, string>) => columnMappingsApi.confirm(fileId, m),
    onSuccess: (data) => {
      freshSuggestRef.current = false;
      queryClient.setQueryData(["mapping", fileId], data);
      queryClient.invalidateQueries({ queryKey: ["upload", fileId] });
      queryClient.invalidateQueries({ queryKey: ["uploads"] });
      setLocalMapping(data.mapping_json || {});
      toast.success("Mapping confirmed — ready to normalize!");
    },
    onError: (err: any) => {
      if (err?.status === 409) {
        // Already confirmed — let them re-suggest to reset
        toast.info("Already confirmed. Click 'Suggest with AI' to re-map, or click 'Normalize file'.");
        queryClient.invalidateQueries({ queryKey: ["mapping", fileId] });
      } else {
        toast.error(err?.error?.message || "Failed to confirm mapping. Please try again.");
      }
    },
  });

  const normalizeMutation = useMutation({
    mutationFn: () => columnMappingsApi.normalize(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upload", fileId] });
      queryClient.invalidateQueries({ queryKey: ["uploads"] });
      toast.success("Normalization complete! File is ready for reconciliation.");
    },
    onError: (err: any) => {
      if (err?.status === 409) {
        toast.info("Already normalized. Re-suggest the mapping to re-run normalization.");
      } else {
        toast.error(err?.error?.message || "Normalization failed. Please try again.");
      }
    },
  });

  // Sync localMapping from server data
  // Prefer ai_suggested_mapping_json when freshly suggested, else use confirmed mapping_json
  useEffect(() => {
    if (!mapping) return;
    if (freshSuggestRef.current) return; // onSuccess already set it, don't overwrite
    const working =
      mapping.mapping_json && Object.keys(mapping.mapping_json).length > 0
        ? mapping.mapping_json
        : mapping.ai_suggested_mapping_json || {};
    setLocalMapping(working);
  }, [mapping]);

  // Auto-trigger suggest on 404 (new file, never suggested before)
  useEffect(() => {
    if (mappingError && (mappingError as any)?.status === 404 && !suggestMutation.isPending) {
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
      u => u.status === "PARSED" || u.status === "PENDING_MAPPING"
    );
    return (
      <PageContainer>
        <PageHeader
          title="Column Mapping"
          description="Map your uploaded file columns to our standard financial schema."
        />
        {pending.length > 0 ? (
          <div className="space-y-4">
            <div className="text-[13px] font-medium text-muted-foreground px-1">
              Files needing mapping ({pending.length})
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pending.map(u => (
                <Card key={u.id} className="hover:border-[#7C3AED]/40 transition-colors cursor-pointer group">
                  <Link to="/app/column-mapping" search={{ fileId: u.id }} className="block">
                    <div className="flex items-start justify-between mb-3">
                      <div className="font-semibold text-[14.5px] group-hover:text-[#7C3AED] transition-colors truncate pr-2">
                        {u.file_name}
                      </div>
                      <Badge tone="neutral">{u.file_category}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-[12px] text-muted-foreground">
                      <div>{(u.row_count ?? 0).toLocaleString()} rows</div>
                      <div>{formatDate(u.created_at)}</div>
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
                <Link to="/app/uploads"><Btn variant="secondary">Go to Uploads</Btn></Link>
                <Link to="/app/runs"><Btn>Create a run</Btn></Link>
              </div>
            }
          />
        )}
      </PageContainer>
    );
  }

  // ── Status helpers ──────────────────────────────────────────────────────────
  const isConfirmed = mapping?.status === "CONFIRMED";
  const isNormalized = file?.status === "NORMALIZED";
  const isNormalizing = file?.status === "NORMALIZING";
  const hasSuggestion = !!(mapping?.ai_suggested_mapping_json);
  const hasColumns = Object.keys(localMapping).length > 0;
  const isLoading = mappingLoading || suggestMutation.isPending;

  const bottomLabel = isConfirmed
    ? isNormalized
      ? "✓ File is normalized and ready for reconciliation."
      : "✓ Mapping confirmed. Click 'Normalize file' to proceed."
    : "Review column mappings and confirm to unlock normalization.";

  return (
    <PageContainer>
      <PageHeader
        title="Column Mapping"
        description={`Configure how columns in ${file?.file_name ?? "your file"} map to our standard fields.`}
        actions={
          <>
            <Btn
              variant="secondary"
              onClick={() => suggestMutation.mutate()}
              loading={suggestMutation.isPending}
              disabled={suggestMutation.isPending}
            >
              <Sparkles className="size-4" />
              {isConfirmed ? "Re-suggest" : "Suggest with AI"}
            </Btn>
            {isConfirmed || isNormalized || isNormalizing ? (
              <Btn
                onClick={() => normalizeMutation.mutate()}
                loading={normalizeMutation.isPending}
                disabled={isNormalizing}
              >
                {isNormalizing ? "Normalizing…" : isNormalized ? "Re-normalize" : "Normalize file"}
              </Btn>
            ) : (
              <Btn
                onClick={() => confirmMutation.mutate(localMapping)}
                loading={confirmMutation.isPending}
                disabled={!hasColumns || confirmMutation.isPending}
              >
                Confirm mapping
              </Btn>
            )}
          </>
        }
      />

      {/* AI Banner */}
      {suggestMutation.isPending && <AIThinkingBanner />}
      {!suggestMutation.isPending && hasSuggestion && (
        <AISuggestionBanner
          confidence={mapping!.ai_confidence_score ?? 0}
          isNew={freshSuggestRef.current || !isConfirmed}
        />
      )}

      {/* Confirmed state banner */}
      {isConfirmed && !suggestMutation.isPending && (
        <div
          className="mb-5 flex items-center gap-3 px-4 py-3 rounded-[12px] border"
          style={{ background: "rgba(5,150,105,0.04)", borderColor: "rgba(5,150,105,0.25)" }}
        >
          <CheckCircle2 className="size-5 text-emerald-600 flex-shrink-0" />
          <div>
            <div className="text-[13.5px] font-semibold text-emerald-800">Mapping confirmed</div>
            <div className="text-[12px] text-emerald-700">
              {isNormalized ? "File normalized and ready for reconciliation." :
                isNormalizing ? "Normalization in progress…" :
                  "Click 'Normalize file' to transform records into canonical format."}
            </div>
          </div>
          {isNormalized && <Badge tone="success" className="ml-auto">NORMALIZED</Badge>}
          {isNormalizing && <Loader2 className="size-4 animate-spin text-emerald-600 ml-auto" />}
        </div>
      )}

      {/* Mapping table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 border border-border rounded-[12px] bg-white">
          <div className="relative">
            <Loader2 className="size-8 animate-spin text-[#7C3AED]" />
            <Sparkles className="size-4 text-indigo-400 absolute -top-2 -right-2 animate-pulse" />
          </div>
          <div className="mt-3 text-[13px] text-muted-foreground">
            {suggestMutation.isPending ? "AI is mapping your columns…" : "Loading mapping…"}
          </div>
        </div>
      ) : hasColumns ? (
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
                <Td className="font-medium font-mono text-[13px]">{col}</Td>
                <Td>
                  <Select
                    value={mapped}
                    onChange={(e) => {
                      freshSuggestRef.current = false; // user is editing manually
                      setLocalMapping({ ...localMapping, [col]: e.target.value });
                    }}
                    className="max-w-[240px]"
                    disabled={isNormalized || isNormalizing}
                  >
                    {CANONICAL_FIELDS.map(f => (
                      <option key={f} value={f}>{f}</option>
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
      ) : (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-[12px]">
          <AlertCircle className="size-8 text-muted-foreground mb-3" />
          <div className="text-[14px] font-medium text-muted-foreground">No mapping available</div>
          <div className="text-[12.5px] text-muted-foreground mt-1">
            Click "Suggest with AI" to generate a mapping for this file.
          </div>
        </div>
      )}

      {/* Footer */}
      {hasColumns && !isLoading && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
            <Info className="size-3.5 flex-shrink-0" />
            {bottomLabel}
          </div>
          <div className="flex items-center gap-2">
            {isConfirmed || isNormalized || isNormalizing ? (
              <Btn
                onClick={() => normalizeMutation.mutate()}
                loading={normalizeMutation.isPending}
                disabled={isNormalizing}
                size="sm"
              >
                {isNormalizing ? "Normalizing…" : isNormalized ? "Re-normalize" : "Normalize file"}
              </Btn>
            ) : (
              <Btn
                onClick={() => confirmMutation.mutate(localMapping)}
                loading={confirmMutation.isPending}
                disabled={!hasColumns}
                size="sm"
              >
                Confirm mapping
              </Btn>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
