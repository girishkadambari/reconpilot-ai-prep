import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, PageContainer, PageHeader, Btn, Badge, Stat, Tabs, Table, Th, Td, Drawer, severityTone, statusTone, EmptyState, formatDate } from "@/components/app/ui";
import { Sparkles, Play, Download, ArrowLeft, AlertTriangle, Loader2 } from "lucide-react";
import { reconciliationRunsApi, exportsApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/app/runs/$runId")({
  head: () => ({ meta: [{ title: "Run detail · ReconPilot" }] }),
  component: RunDetail,
});

function RunDetail() {
  const { runId } = Route.useParams();
  const [tab, setTab] = useState("summary");
  const [drawer, setDrawer] = useState<{ kind: "match" | "exception"; id: string } | null>(null);
  
  const queryClient = useQueryClient();

  const { data: run, isLoading: runLoading } = useQuery({
    queryKey: ["run", runId],
    queryFn: () => reconciliationRunsApi.get(runId),
  });

  const { data: summary } = useQuery({
    queryKey: ["run-summary", runId],
    queryFn: () => reconciliationRunsApi.getSummary(runId),
    enabled: !!run && run.status === "COMPLETED",
  });

  const { data: matches } = useQuery({
    queryKey: ["run-matches", runId],
    queryFn: () => reconciliationRunsApi.listMatches(runId),
    enabled: tab === "matches",
  });

  const { data: exceptions } = useQuery({
    queryKey: ["run-exceptions", runId],
    queryFn: () => reconciliationRunsApi.listExceptions(runId),
    enabled: tab === "exceptions",
  });

  const { data: exports } = useQuery({
    queryKey: ["run-exports", runId],
    queryFn: () => exportsApi.list(runId),
    enabled: tab === "exports",
  });

  const executeMutation = useMutation({
    mutationFn: () => reconciliationRunsApi.execute(runId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["run", runId] });
      toast.success("Reconciliation started");
    },
  });

  const exportMutation = useMutation({
    mutationFn: () => exportsApi.create(runId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["run-exports", runId] });
      toast.success("Export job started");
      setTab("exports");
    },
  });

  if (runLoading || !run) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <PageContainer>
      <Link to="/app/runs" className="inline-flex items-center gap-1 text-[12.5px] text-muted-foreground hover:text-foreground mb-3">
        <ArrowLeft className="size-3.5" /> All runs
      </Link>
      <PageHeader
        title={run.name}
        description={<span>Run ID <span className="font-mono">{run.id}</span> · Created {formatDate(run.created_at, "MMM d, yyyy")}</span>}
        actions={
          <>
            <Btn variant="secondary" onClick={() => executeMutation.mutate()} loading={executeMutation.isPending} disabled={run.status === "PROCESSING"}>
              <Play className="size-4" /> Run reconciliation
            </Btn>
            <Btn variant="secondary" onClick={() => reconciliationRunsApi.explainAll(runId).then(()=>toast.success("Batch explanation started"))}>
              <Sparkles className="size-4" /> Explain all exceptions
            </Btn>
            <Btn onClick={() => exportMutation.mutate()} loading={exportMutation.isPending}>
              <Download className="size-4" /> Export XLSX
            </Btn>
          </>
        }
      />

      <div className="mb-2"><Badge tone={statusTone(run.status)}>{run.status}</Badge></div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "summary", label: "Summary" },
          { id: "matches", label: "Matches", count: run.matched_count },
          { id: "exceptions", label: "Exceptions", count: run.exception_count },
          { id: "exports", label: "Exports" },
        ]}
      />

      <div className="mt-5">
        {tab === "summary" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <Stat label="Total source rows" value={run.total_source_rows.toLocaleString()} />
              <Stat label="Matched" value={run.matched_count.toLocaleString()} />
              <Stat label="Match rate" value={`${(run.match_rate*100).toFixed(1)}%`} />
              <Stat label="Open exceptions" value={String(run.exception_count)} />
            </div>

            {summary ? (
              <Card className="border-[#7C3AED]/20 bg-purple-50/30">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-[12px] bg-white border border-[#7C3AED]/20 grid place-items-center shrink-0">
                    <Sparkles className="size-5 text-[#7C3AED]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-[15px] font-semibold">{summary.headline}</div>
                      <Badge tone="purple">AI Summary</Badge>
                    </div>
                    <p className="text-[13.5px] text-muted-foreground mt-2 leading-relaxed">
                      {summary.summary}
                    </p>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Key Findings</div>
                        <ul className="space-y-1.5">
                          {summary.key_findings.map((f, i) => (
                            <li key={i} className="text-[12.5px] flex items-start gap-2">
                              <span className="text-[#7C3AED] mt-1">•</span> {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Recommended Actions</div>
                        <ul className="space-y-1.5">
                          {summary.recommended_actions.map((f, i) => (
                            <li key={i} className="text-[12.5px] flex items-start gap-2">
                              <span className="text-[#16A34A] mt-1">✓</span> {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ) : run.status === "COMPLETED" ? (
              <div className="py-10 text-center text-muted-foreground">AI is preparing your executive summary...</div>
            ) : null}
          </div>
        )}

        {tab === "matches" && (
          <Table>
            <thead>
              <tr>
                <Th>ID</Th><Th className="text-right">Confidence</Th>
                <Th>Strategy</Th><Th>Status</Th><Th></Th>
              </tr>
            </thead>
            <tbody>
              {(matches || []).map(m => (
                <tr key={m.id} className="hover:bg-[#FAFAFA]">
                  <Td className="font-mono text-[11px] text-muted-foreground">{m.id}</Td>
                  <Td>
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden"><div className="h-full bg-[#7C3AED]" style={{ width: `${m.confidence*100}%` }} /></div>
                      <span className="text-[12px] text-muted-foreground tabular-nums">{(m.confidence*100).toFixed(0)}%</span>
                    </div>
                  </Td>
                  <Td className="font-mono text-[11px] text-muted-foreground">{m.match_strategy}</Td>
                  <Td><Badge tone={statusTone(m.status)}>{m.status}</Badge></Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Btn size="sm" variant="ghost">Evidence</Btn>
                      <Btn size="sm" variant="secondary" onClick={() => reconciliationRunsApi.reviewMatch(runId, m.id, "APPROVED").then(()=>queryClient.invalidateQueries({queryKey: ["run-matches", runId]}))}>Approve</Btn>
                      <Btn size="sm" variant="ghost" onClick={() => reconciliationRunsApi.reviewMatch(runId, m.id, "REJECTED").then(()=>queryClient.invalidateQueries({queryKey: ["run-matches", runId]}))}>Reject</Btn>
                    </div>
                  </Td>
                </tr>
              ))}
              {(matches || []).length === 0 && <tr><Td colSpan={5} className="text-center py-10 text-muted-foreground">No matches found for this criteria.</Td></tr>}
            </tbody>
          </Table>
        )}

        {tab === "exceptions" && <ExceptionTable exceptions={exceptions || []} runId={runId} onUpdate={() => queryClient.invalidateQueries({queryKey: ["run-exceptions", runId]})} onView={(id)=>setDrawer({ kind: "exception", id })} />}

        {tab === "exports" && (
          <Table>
            <thead><tr><Th>Job ID</Th><Th>Scope</Th><Th>Status</Th><Th>Created</Th><Th></Th></tr></thead>
            <tbody>
              {(exports || []).map(j => (
                <tr key={j.id} className="hover:bg-[#FAFAFA]">
                  <Td className="font-mono text-[11px]">{j.id}</Td>
                  <Td><Badge tone="neutral">{j.scope}</Badge></Td>
                  <Td><Badge tone={statusTone(j.status)}>{j.status}</Badge></Td>
                  <Td className="text-muted-foreground text-[12px]">{formatDate(j.created_at)}</Td>
                  <Td className="text-right">
                    {j.status === "READY" ? (
                      <Btn size="sm" variant="secondary" onClick={() => window.open(exportsApi.getDownloadUrl(runId, j.id))}>
                        <Download className="size-3.5" /> Download
                      </Btn>
                    ) : (
                      <div className="text-[11px] text-muted-foreground italic">Processing...</div>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      <Drawer open={!!drawer} onClose={()=>setDrawer(null)} title={drawer?.kind === "match" ? "Match evidence" : "Exception details"}>
        <div className="p-10 text-center text-muted-foreground">Detailed record evidence view coming soon.</div>
      </Drawer>
    </PageContainer>
  );
}

function ExceptionTable({ exceptions, runId, onUpdate, onView }: { exceptions: any[]; runId: string; onUpdate: () => void; onView: (id: string) => void }) {
  return (
    <Table>
      <thead>
        <tr>
          <Th>Type</Th><Th>Severity</Th><Th className="text-right">Amount</Th>
          <Th>Status</Th><Th>AI Explanation</Th><Th></Th>
        </tr>
      </thead>
      <tbody>
        {exceptions.map(e => (
          <tr key={e.id} className="hover:bg-[#FAFAFA]">
            <Td><Badge tone="neutral">{e.exception_type}</Badge></Td>
            <Td><Badge tone={severityTone(e.severity)}>{e.severity}</Badge></Td>
            <Td className="text-right tabular-nums font-medium">₹{e.amount.toLocaleString()} <span className="text-muted-foreground text-[11px]">{e.currency}</span></Td>
            <Td><Badge tone={statusTone(e.status)}>{e.status}</Badge></Td>
            <Td className="text-muted-foreground max-w-sm">
              {e.ai_explanation ? (
                <div className="line-clamp-2 italic text-[12px]">"{e.ai_explanation.substring(0, 80)}..."</div>
              ) : (
                <div className="text-[11px] text-muted-foreground">No explanation yet</div>
              )}
            </Td>
            <Td className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Btn size="sm" variant="ghost" onClick={()=>onView(e.id)}>View</Btn>
                <Btn size="sm" variant="secondary" onClick={() => reconciliationRunsApi.explainException(runId, e.id).then(()=>onUpdate())}>
                  <Sparkles className="size-3.5" /> Explain
                </Btn>
                <Btn size="sm" onClick={() => reconciliationRunsApi.resolveException(runId, e.id, "RESOLVED").then(()=>onUpdate())}>Resolve</Btn>
              </div>
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
