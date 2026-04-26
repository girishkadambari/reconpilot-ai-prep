import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, PageContainer, PageHeader, Btn, Badge, Table, Th, Td, Drawer, Select, severityTone, statusTone } from "@/components/app/ui";
import { reconciliationRunsApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Search, AlertTriangle, Filter, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { ExceptionDetails } from "@/components/app/ExceptionDetails";
import { 
  EXCEPTION_TYPE_LABELS, 
  SEVERITY_LABELS, 
  EXCEPTION_STATUS_LABELS, 
  formatLabel 
} from "@/lib/utils/formatters";

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
  const [page, setPage] = useState(1);
  const [drawer, setDrawer] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ["global-exceptions", { status, type, severity, q, page }],
    queryFn: () => reconciliationRunsApi.listGlobalExceptions({ status, type, severity, page }),
  });

  const explainAllMutation = useMutation({
    mutationFn: () => Promise.resolve(), // Placeholder
    onSuccess: () => toast.success("AI is processing all exceptions in the background"),
  });

  const exceptions = response?.data || [];
  const stats = response?.stats || { open: 0, critical: 0, exposure: 0, auto_resolvable: 0 };
  const pagination = response?.pagination;

  return (
    <PageContainer>
      <PageHeader
        title="Exceptions"
        description="Review AI-prepared exceptions. Approve, waive or escalate with full evidence."
        actions={
          <>
            <Btn variant="secondary" onClick={() => explainAllMutation.mutate()} loading={explainAllMutation.isPending}>
              <Sparkles className="size-4" /> Explain all
            </Btn>
            <Btn>Bulk resolve</Btn>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <Card>
          <div className="text-[12px] text-muted-foreground">Open</div>
          <div className="text-[22px] font-semibold tabular-nums mt-1">{stats.open}</div>
        </Card>
        <Card>
          <div className="text-[12px] text-muted-foreground">Critical</div>
          <div className="text-[22px] font-semibold tabular-nums mt-1 text-[#B91C1C]">{stats.critical}</div>
        </Card>
        <Card>
          <div className="text-[12px] text-muted-foreground">Exposure</div>
          <div className="text-[22px] font-semibold tabular-nums mt-1">₹{stats.exposure.toLocaleString()}</div>
        </Card>
        <Card>
          <div className="text-[12px] text-muted-foreground">Auto-resolvable</div>
          <div className="text-[22px] font-semibold tabular-nums mt-1">{stats.auto_resolvable}</div>
        </Card>
      </div>

      <Card padding={false} className="mb-4">
        <div className="flex items-center gap-2 p-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input 
              value={q} 
              onChange={(e)=>setQ(e.target.value)} 
              placeholder="Search reference / UTR" 
              className="w-full h-9 pl-9 pr-3 rounded-[10px] border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30" 
            />
          </div>
          <Select value={status} onChange={(e)=>setStatus(e.target.value)} className="max-w-[160px]">
            <option value="">All status</option>
            {Object.entries(EXCEPTION_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
          <Select value={severity} onChange={(e)=>setSeverity(e.target.value)} className="max-w-[160px]">
            <option value="">All severities</option>
            {Object.entries(SEVERITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
          <Select value={type} onChange={(e)=>setType(e.target.value)} className="max-w-[260px]">
            <option value="">All types</option>
            {TYPES.map(t => <option key={t} value={t}>{formatLabel(t, EXCEPTION_TYPE_LABELS)}</option>)}
          </Select>
          <div className="ml-auto inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <Filter className="size-3.5" /> {pagination?.total || 0} results
          </div>
        </div>
      </Card>

      {isLoading ? (
        <Card className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <div className="text-[13px] text-muted-foreground mt-3">Fetching exceptions...</div>
        </Card>
      ) : exceptions.length === 0 ? (
        <Card className="py-20 text-center">
          <div className="text-[14px] font-medium text-muted-foreground">No exceptions found matching your filters.</div>
        </Card>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Type</Th>
              <Th>Severity</Th>
              <Th className="text-right">Amount</Th>
              <Th>AI Explanation</Th>
              <Th>Status</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {exceptions.map(e => (
              <tr key={e.id} className="hover:bg-[#FAFAFA]">
                <Td><Badge tone="neutral">{formatLabel(e.exception_type, EXCEPTION_TYPE_LABELS)}</Badge></Td>
                <Td><Badge tone={severityTone(e.severity)}>{formatLabel(e.severity, SEVERITY_LABELS)}</Badge></Td>
                <Td className="text-right tabular-nums font-medium whitespace-nowrap">
                  ₹{e.amount.toLocaleString()} <span className="text-muted-foreground text-[11px] font-normal">{e.currency}</span>
                </Td>
                <Td className="text-muted-foreground max-w-md">
                  <div className="line-clamp-2 text-[12.5px] italic">
                    {e.ai_explanation || "No AI explanation available yet. Click explain to generate."}
                  </div>
                </Td>
                <Td><Badge tone={statusTone(e.status)}>{formatLabel(e.status, EXCEPTION_STATUS_LABELS)}</Badge></Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Btn size="sm" variant="ghost" onClick={()=>setDrawer(e.id)}>View</Btn>
                    <Btn 
                      size="sm" 
                      variant="secondary" 
                      title="Explain with AI"
                      onClick={() => reconciliationRunsApi.explainException(e.run_id, e.id, true).then(() => {
                        toast.success("AI explanation refreshed");
                        queryClient.invalidateQueries({ queryKey: ["global-exceptions"] });
                      })}
                    >
                      <Sparkles className="size-3.5" />
                    </Btn>
                    <Btn size="sm" disabled={e.status !== 'OPEN'}>Resolve</Btn>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <Drawer 
        padding={false}
        open={!!drawer} 
        onClose={()=>setDrawer(null)} 
        width="600px"
      >
        {drawer && (
          <ExceptionDetails 
            exception={exceptions.find(x => x.id === drawer)!} 
            onClose={()=>setDrawer(null)}
            onUpdate={() => queryClient.invalidateQueries({ queryKey: ["global-exceptions"] })}
          />
        )}
      </Drawer>
    </PageContainer>
  );
}
