import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, PageContainer, PageHeader, Btn, Badge, Stat, Tabs, Table, Th, Td, Drawer, severityTone, statusTone, EmptyState } from "@/components/app/ui";
import { runs, matches, exceptions, uploads, exportJobs } from "@/data/mock";
import { Sparkles, Play, Download, ArrowLeft, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/app/runs/$runId")({
  head: () => ({ meta: [{ title: "Run detail · ReconPilot" }] }),
  component: RunDetail,
});

function RunDetail() {
  const { runId } = Route.useParams();
  const run = runs.find(r => r.id === runId) ?? runs[0];
  const [tab, setTab] = useState("summary");
  const [drawer, setDrawer] = useState<{ kind: "match" | "exception"; id: string } | null>(null);

  return (
    <PageContainer>
      <Link to="/app/runs" className="inline-flex items-center gap-1 text-[12.5px] text-muted-foreground hover:text-foreground mb-3">
        <ArrowLeft className="size-3.5" /> All runs
      </Link>
      <PageHeader
        title={run.name}
        description={<span>Run ID <span className="font-mono">{run.id}</span> · Created {new Date(run.created_at).toLocaleString()}</span> as any}
        actions={
          <>
            <Btn variant="secondary"><Play className="size-4" /> Run reconciliation</Btn>
            <Btn variant="secondary"><Sparkles className="size-4" /> Explain all exceptions</Btn>
            <Btn><Download className="size-4" /> Export XLSX</Btn>
          </>
        }
      />

      <div className="mb-2"><Badge tone={statusTone(run.status)}>{run.status}</Badge></div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "summary", label: "Summary" },
          { id: "matches", label: "Matches", count: matches.length },
          { id: "exceptions", label: "Exceptions", count: exceptions.filter(e=>e.status==="OPEN").length },
          { id: "files", label: "Files", count: 3 },
          { id: "exports", label: "Exports", count: exportJobs.length },
        ]}
      />

      <div className="mt-5">
        {tab === "summary" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Stat label="Total records" value={(run.total_records ?? 0).toLocaleString()} />
              <Stat label="Matched" value={run.matched.toLocaleString()} />
              <Stat label="Open exceptions" value={String(run.exceptions)} />
              <Stat label="Match rate" value={`${(run.match_rate*100).toFixed(1)}%`} />
              <Stat label="Matched amount" value={`₹${((run.matched_amount??0)/100000).toFixed(1)}L`} />
              <Stat label="Unmatched amount" value={`₹${((run.unmatched_amount??0)/100000).toFixed(1)}L`} />
            </div>

            <Card>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-[10px] bg-[oklch(0.96_0.05_295)] grid place-items-center"><Sparkles className="size-4 text-[#7C3AED]" /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-[14px] font-semibold">AI Executive Summary</div>
                    <Badge tone="purple">Advisory</Badge>
                  </div>
                  <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">
                    Most records reconciled successfully. Remaining exceptions are mainly refund mismatches,
                    missing bank credits, and offline payment candidates. Two duplicate Stripe charges should be
                    refunded. Consider widening the settlement window to T+5 for Razorpay to reduce delayed-settlement noise.
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-[11.5px] text-muted-foreground">
                    <AlertTriangle className="size-3.5" /> AI summary is advisory. Verify source evidence before resolving exceptions.
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {tab === "matches" && (
          <Table>
            <thead>
              <tr>
                <Th>Source</Th><Th>Target</Th><Th className="text-right">Amount</Th>
                <Th>Confidence</Th><Th>Strategy</Th><Th>Status</Th><Th></Th>
              </tr>
            </thead>
            <tbody>
              {matches.map(m => (
                <tr key={m.id} className="hover:bg-[#FAFAFA]">
                  <Td><Badge tone="neutral">{m.source_type}</Badge></Td>
                  <Td><Badge tone="neutral">{m.target_type}</Badge></Td>
                  <Td className="text-right tabular-nums font-medium">₹{m.amount.toLocaleString()}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden"><div className="h-full bg-[#7C3AED]" style={{ width: `${m.confidence}%` }} /></div>
                      <span className="text-[12px] text-muted-foreground tabular-nums">{m.confidence}%</span>
                    </div>
                  </Td>
                  <Td className="font-mono text-[12px] text-muted-foreground">{m.strategy}</Td>
                  <Td><Badge tone={statusTone(m.status)}>{m.status}</Badge></Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Btn size="sm" variant="ghost" onClick={()=>setDrawer({ kind: "match", id: m.id })}>View evidence</Btn>
                      <Btn size="sm" variant="secondary">Approve</Btn>
                      <Btn size="sm" variant="ghost">Reject</Btn>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        {tab === "exceptions" && <ExceptionTable onView={(id)=>setDrawer({ kind: "exception", id })} />}

        {tab === "files" && (
          <Table>
            <thead><tr><Th>File</Th><Th>Category</Th><Th>Status</Th><Th className="text-right">Rows</Th></tr></thead>
            <tbody>
              {uploads.slice(0, 3).map(u => (
                <tr key={u.id} className="hover:bg-[#FAFAFA]">
                  <Td className="font-medium">{u.file_name}</Td>
                  <Td><Badge tone="neutral">{u.file_category}</Badge></Td>
                  <Td><Badge tone={statusTone(u.status)}>{u.status}</Badge></Td>
                  <Td className="text-right tabular-nums">{u.rows.toLocaleString()}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        {tab === "exports" && (
          <Table>
            <thead><tr><Th>Export</Th><Th>Scope</Th><Th>Status</Th><Th>Created</Th><Th></Th></tr></thead>
            <tbody>
              {exportJobs.map(j => (
                <tr key={j.id} className="hover:bg-[#FAFAFA]">
                  <Td className="font-medium">{j.name}</Td>
                  <Td><Badge tone="neutral">{j.scope}</Badge></Td>
                  <Td><Badge tone={statusTone(j.status)}>{j.status}</Badge></Td>
                  <Td className="text-muted-foreground">{new Date(j.created_at).toLocaleString()}</Td>
                  <Td className="text-right"><Btn size="sm" variant="secondary"><Download className="size-3.5" /> Download</Btn></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      <Drawer open={!!drawer} onClose={()=>setDrawer(null)} title={drawer?.kind === "match" ? "Match evidence" : "Exception details"}>
        {drawer?.kind === "match" ? <MatchEvidence id={drawer.id} /> : drawer ? <ExceptionEvidence id={drawer.id} /> : null}
      </Drawer>
    </PageContainer>
  );
}

function ExceptionTable({ onView }: { onView: (id: string) => void }) {
  return (
    <Table>
      <thead>
        <tr>
          <Th>Type</Th><Th>Severity</Th><Th className="text-right">Amount</Th>
          <Th>Explanation</Th><Th>Suggested action</Th><Th>Status</Th><Th></Th>
        </tr>
      </thead>
      <tbody>
        {exceptions.map(e => (
          <tr key={e.id} className="hover:bg-[#FAFAFA]">
            <Td><Badge tone="neutral">{e.type}</Badge></Td>
            <Td><Badge tone={severityTone(e.severity)}>{e.severity}</Badge></Td>
            <Td className="text-right tabular-nums font-medium">₹{e.amount.toLocaleString()} <span className="text-muted-foreground text-[11px]">{e.currency}</span></Td>
            <Td className="text-muted-foreground max-w-sm"><div className="line-clamp-2">{e.explanation}</div></Td>
            <Td className="text-muted-foreground">{e.suggested_action}</Td>
            <Td><Badge tone={statusTone(e.status)}>{e.status}</Badge></Td>
            <Td className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Btn size="sm" variant="ghost" onClick={()=>onView(e.id)}>View</Btn>
                <Btn size="sm" variant="secondary"><Sparkles className="size-3.5" /> Explain</Btn>
                <Btn size="sm">Resolve</Btn>
              </div>
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

function MatchEvidence({ id }: { id: string }) {
  const m = matches.find(x => x.id === id) ?? matches[0];
  return (
    <div className="space-y-4 text-[13px]">
      <Card><div className="text-[12px] text-muted-foreground mb-1">Matching rule</div><div className="font-mono">{m.strategy}</div></Card>
      <div className="grid grid-cols-2 gap-3">
        <Card><div className="text-[12px] text-muted-foreground mb-2">Source record</div><pre className="text-[11.5px] font-mono whitespace-pre-wrap">{`type: ${m.source_type}\namount: ₹${m.amount}\ndate: 2025-04-22`}</pre></Card>
        <Card><div className="text-[12px] text-muted-foreground mb-2">Target record</div><pre className="text-[11.5px] font-mono whitespace-pre-wrap">{`type: ${m.target_type}\namount: ₹${m.amount}\ndate: 2025-04-22`}</pre></Card>
      </div>
      <Card><div className="grid grid-cols-3 gap-3 text-center">
        <div><div className="text-[11px] text-muted-foreground">Confidence</div><div className="text-[16px] font-semibold">{m.confidence}%</div></div>
        <div><div className="text-[11px] text-muted-foreground">Amount delta</div><div className="text-[16px] font-semibold">₹0</div></div>
        <div><div className="text-[11px] text-muted-foreground">Date delta</div><div className="text-[16px] font-semibold">0d</div></div>
      </div></Card>
      <textarea placeholder="Add review note…" className="w-full min-h-[80px] p-3 rounded-[10px] border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30" />
    </div>
  );
}

function ExceptionEvidence({ id }: { id: string }) {
  const e = exceptions.find(x => x.id === id) ?? exceptions[0];
  return (
    <div className="space-y-4 text-[13px]">
      <div className="flex items-center gap-2"><Badge tone={severityTone(e.severity)}>{e.severity}</Badge><Badge tone="neutral">{e.type}</Badge></div>
      <Card>
        <div className="text-[12px] text-muted-foreground mb-1">Reference</div>
        <div className="font-mono">{e.reference}</div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div><div className="text-[11px] text-muted-foreground">Amount</div><div className="font-medium">₹{e.amount.toLocaleString()} {e.currency}</div></div>
          <div><div className="text-[11px] text-muted-foreground">Status</div><div><Badge tone={statusTone(e.status)}>{e.status}</Badge></div></div>
        </div>
      </Card>
      <Card>
        <div className="flex items-center gap-2 mb-2"><Sparkles className="size-3.5 text-[#7C3AED]" /><div className="text-[13px] font-semibold">AI explanation</div><Badge tone="purple">Advisory</Badge></div>
        <p className="text-muted-foreground leading-relaxed">{e.explanation}</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div><div className="text-[11px] text-muted-foreground">Probable cause</div><div className="font-medium">Settlement timing</div></div>
          <div><div className="text-[11px] text-muted-foreground">Recommended</div><div className="font-medium">{e.suggested_action}</div></div>
        </div>
        <div className="mt-3 text-[11.5px] text-muted-foreground flex items-center gap-1.5"><AlertTriangle className="size-3.5" /> AI explanation is advisory. Verify source evidence before resolving.</div>
      </Card>
      <textarea placeholder="Resolution note…" className="w-full min-h-[80px] p-3 rounded-[10px] border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30" />
      <div className="flex items-center gap-2"><Btn>Resolve</Btn><Btn variant="secondary">Waive</Btn><Btn variant="ghost">Add note</Btn></div>
    </div>
  );
}
