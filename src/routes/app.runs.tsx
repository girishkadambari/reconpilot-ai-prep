import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, PageContainer, PageHeader, Btn, Badge, Table, Th, Td, Modal, Field, Input, Select, statusTone } from "@/components/app/ui";
import { runs, uploads } from "@/data/mock";
import { Plus, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/app/runs")({
  head: () => ({ meta: [{ title: "Reconciliation runs · ReconPilot" }] }),
  component: RunsPage,
});

function RunsPage() {
  const [open, setOpen] = useState(false);
  return (
    <PageContainer>
      <PageHeader
        title="Reconciliation runs"
        description="Pair normalized files and let the AI worker prepare matches and exceptions."
        actions={<Btn onClick={()=>setOpen(true)}><Plus className="size-4" /> New reconciliation run</Btn>}
      />

      <Table>
        <thead>
          <tr>
            <Th>Run name</Th><Th>Status</Th><Th className="text-right">Files</Th>
            <Th className="text-right">Matched</Th><Th className="text-right">Exceptions</Th>
            <Th className="text-right">Match rate</Th><Th>Created</Th><Th></Th>
          </tr>
        </thead>
        <tbody>
          {runs.map(r => (
            <tr key={r.id} className="hover:bg-[#FAFAFA]">
              <Td>
                <div className="font-medium">{r.name}</div>
                <div className="text-[11px] text-muted-foreground">{r.id}</div>
              </Td>
              <Td><Badge tone={statusTone(r.status)}>{r.status}</Badge></Td>
              <Td className="text-right tabular-nums">{r.files}</Td>
              <Td className="text-right tabular-nums">{r.matched.toLocaleString()}</Td>
              <Td className="text-right tabular-nums">{r.exceptions}</Td>
              <Td className="text-right tabular-nums">{r.match_rate ? (r.match_rate*100).toFixed(1)+"%" : "—"}</Td>
              <Td className="text-muted-foreground">{new Date(r.created_at).toLocaleString()}</Td>
              <Td className="text-right">
                <Link to="/app/runs/$runId" params={{ runId: r.id }}>
                  <Btn size="sm" variant="ghost">Open <ChevronRight className="size-3.5" /></Btn>
                </Link>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal open={open} onClose={()=>setOpen(false)} title="New reconciliation run"
        footer={<div className="flex justify-end gap-2">
          <Btn variant="secondary" onClick={()=>setOpen(false)}>Cancel</Btn>
          <Btn variant="secondary" onClick={()=>setOpen(false)}>Create</Btn>
          <Btn onClick={()=>setOpen(false)}>Create and run</Btn>
        </div>}>
        <div className="space-y-4">
          <Field label="Run name"><Input placeholder="e.g. April month-end close" /></Field>
          <Field label="Files to reconcile" hint="Pick at least two normalized files.">
            <div className="border border-border rounded-[10px] divide-y divide-[#F1F1F1] max-h-56 overflow-y-auto">
              {uploads.map(u => (
                <label key={u.id} className="flex items-center gap-2 px-3 py-2 hover:bg-secondary cursor-pointer">
                  <input type="checkbox" defaultChecked={u.status==="NORMALIZED"} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate">{u.file_name}</div>
                    <div className="text-[11px] text-muted-foreground">{u.file_category}</div>
                  </div>
                  <Badge tone={statusTone(u.status)}>{u.status}</Badge>
                </label>
              ))}
            </div>
          </Field>
        </div>
      </Modal>
    </PageContainer>
  );
}
