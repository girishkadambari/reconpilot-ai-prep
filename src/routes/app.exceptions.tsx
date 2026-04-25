import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, PageContainer, PageHeader, Btn, Badge, Table, Th, Td, Drawer, Select, severityTone, statusTone } from "@/components/app/ui";
import { exceptions } from "@/data/mock";
import { Sparkles, Search, AlertTriangle, Filter } from "lucide-react";

export const Route = createFileRoute("/app/exceptions")({
  head: () => ({ meta: [{ title: "Exceptions · ReconPilot" }] }),
  component: ExceptionsPage,
});

const TYPES = ["MISSING_INVOICE","MISSING_PAYMENT","MISSING_SETTLEMENT","MISSING_BANK_CREDIT","AMOUNT_MISMATCH","FEE_MISMATCH","TAX_MISMATCH","REFUND_MISMATCH","DUPLICATE_PAYMENT","DELAYED_SETTLEMENT","UNKNOWN_BANK_CREDIT","OFFLINE_PAYMENT_CANDIDATE","CHARGEBACK_OR_DISPUTE","CURRENCY_MISMATCH","NEEDS_MANUAL_REVIEW","NET_SETTLEMENT_DIFF"];

function ExceptionsPage() {
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [severity, setSeverity] = useState("");
  const [q, setQ] = useState("");
  const [drawer, setDrawer] = useState<string | null>(null);

  const rows = useMemo(() => exceptions.filter(e =>
    (!status || e.status === status) &&
    (!type || e.type === type) &&
    (!severity || e.severity === severity) &&
    (!q || (e.reference?.toLowerCase().includes(q.toLowerCase()) || e.explanation.toLowerCase().includes(q.toLowerCase())))
  ), [status, type, severity, q]);

  const open = exceptions.filter(e => e.status === "OPEN").length;
  const critical = exceptions.filter(e => e.severity === "CRITICAL").length;
  const totalAmount = exceptions.reduce((s, e) => s + e.amount, 0);

  return (
    <PageContainer>
      <PageHeader
        title="Exceptions"
        description="Review AI-prepared exceptions. Approve, waive or escalate with full evidence."
        actions={
          <>
            <Btn variant="secondary"><Sparkles className="size-4" /> Explain all</Btn>
            <Btn>Bulk resolve</Btn>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <Card><div className="text-[12px] text-muted-foreground">Open</div><div className="text-[22px] font-semibold tabular-nums mt-1">{open}</div></Card>
        <Card><div className="text-[12px] text-muted-foreground">Critical</div><div className="text-[22px] font-semibold tabular-nums mt-1 text-[#B91C1C]">{critical}</div></Card>
        <Card><div className="text-[12px] text-muted-foreground">Exposure</div><div className="text-[22px] font-semibold tabular-nums mt-1">₹{totalAmount.toLocaleString()}</div></Card>
        <Card><div className="text-[12px] text-muted-foreground">Auto-resolvable</div><div className="text-[22px] font-semibold tabular-nums mt-1">14</div></Card>
      </div>

      <Card padding={false} className="mb-4">
        <div className="flex items-center gap-2 p-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search invoice / payment / UTR" className="w-full h-9 pl-9 pr-3 rounded-[10px] border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30" />
          </div>
          <Select value={status} onChange={(e)=>setStatus(e.target.value)} className="max-w-[160px]">
            <option value="">All status</option><option>OPEN</option><option>RESOLVED</option><option>WAIVED</option>
          </Select>
          <Select value={severity} onChange={(e)=>setSeverity(e.target.value)} className="max-w-[160px]">
            <option value="">All severities</option><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option>
          </Select>
          <Select value={type} onChange={(e)=>setType(e.target.value)} className="max-w-[260px]">
            <option value="">All types</option>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </Select>
          <div className="ml-auto inline-flex items-center gap-1.5 text-[12px] text-muted-foreground"><Filter className="size-3.5" /> {rows.length} results</div>
        </div>
      </Card>

      <Table>
        <thead>
          <tr>
            <Th>Type</Th><Th>Severity</Th><Th className="text-right">Amount</Th>
            <Th>Explanation</Th><Th>Suggested action</Th><Th>Status</Th><Th></Th>
          </tr>
        </thead>
        <tbody>
          {rows.map(e => (
            <tr key={e.id} className="hover:bg-[#FAFAFA]">
              <Td><Badge tone="neutral">{e.type}</Badge></Td>
              <Td><Badge tone={severityTone(e.severity)}>{e.severity}</Badge></Td>
              <Td className="text-right tabular-nums font-medium">₹{e.amount.toLocaleString()} <span className="text-muted-foreground text-[11px]">{e.currency}</span></Td>
              <Td className="text-muted-foreground max-w-md"><div className="line-clamp-2">{e.explanation}</div></Td>
              <Td className="text-muted-foreground max-w-xs"><div className="line-clamp-2">{e.suggested_action}</div></Td>
              <Td><Badge tone={statusTone(e.status)}>{e.status}</Badge></Td>
              <Td className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Btn size="sm" variant="ghost" onClick={()=>setDrawer(e.id)}>View</Btn>
                  <Btn size="sm" variant="secondary"><Sparkles className="size-3.5" /></Btn>
                  <Btn size="sm">Resolve</Btn>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Drawer open={!!drawer} onClose={()=>setDrawer(null)} title="Exception details"
        footer={<div className="flex items-center justify-end gap-2"><Btn variant="ghost">Add note</Btn><Btn variant="secondary">Waive</Btn><Btn>Resolve</Btn></div>}>
        {drawer && <ExceptionEvidence id={drawer} />}
      </Drawer>
    </PageContainer>
  );
}

function ExceptionEvidence({ id }: { id: string }) {
  const e = exceptions.find(x => x.id === id)!;
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
        <div className="text-[12px] text-muted-foreground mb-2">Related records</div>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 rounded-[8px] bg-secondary text-[12px]"><span className="font-mono">stripe / charge / ch_3PqK…</span><span className="text-muted-foreground">₹{e.amount.toLocaleString()}</span></div>
          <div className="flex items-center justify-between p-2 rounded-[8px] bg-secondary text-[12px]"><span className="font-mono">bank / hdfc / UTR8821…</span><span className="text-muted-foreground">— missing —</span></div>
        </div>
      </Card>
      <Card>
        <div className="flex items-center gap-2 mb-2"><Sparkles className="size-3.5 text-[#7C3AED]" /><div className="font-semibold">AI explanation</div><Badge tone="purple">Advisory</Badge></div>
        <p className="text-muted-foreground leading-relaxed">{e.explanation}</p>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div><div className="text-[11px] text-muted-foreground">Probable cause</div><div className="font-medium">Settlement timing variance</div></div>
          <div><div className="text-[11px] text-muted-foreground">Confidence</div><div className="font-medium">82%</div></div>
        </div>
        <div className="mt-3 text-[11.5px] text-muted-foreground flex items-center gap-1.5"><AlertTriangle className="size-3.5" /> AI explanation is advisory. Verify source evidence before resolving.</div>
      </Card>
      <textarea placeholder="Resolution note…" className="w-full min-h-[80px] p-3 rounded-[10px] border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30" />
    </div>
  );
}
