import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, PageContainer, PageHeader, Btn, Badge, Table, Th, Td, Modal, Field, Input, Select, statusTone, EmptyState, formatDate } from "@/components/app/ui";
import { Plus, ChevronRight, Loader2 } from "lucide-react";
import { reconciliationRunsApi, uploadsApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  RUN_STATUS_LABELS,
  FILE_CATEGORY_LABELS,
  NORMALIZATION_STATUS_LABELS,
  formatLabel
} from "@/lib/utils/formatters";

export const Route = createFileRoute("/app/runs/")({
  head: () => ({ meta: [{ title: "Reconciliation runs · ReconPilot" }] }),
  component: RunsPage,
});

function RunsPage() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const queryClient = useQueryClient();

  const { data: runs, isLoading: runsLoading } = useQuery({
    queryKey: ["runs"],
    queryFn: () => reconciliationRunsApi.list(),
  });

  const { data: uploads } = useQuery({
    queryKey: ["uploads", "NORMALIZED"],
    queryFn: () => uploadsApi.list(), // ideally should filter by status: "NORMALIZED" if backend supported it
  });

  const normalizedFiles = (uploads || []).filter(u => u.normalization_status === "COMPLETED" || u.status === "NORMALIZED");

  const createMutation = useMutation({
    mutationFn: (data: { name: string; uploaded_file_ids: string[]; runNow?: boolean }) =>
      reconciliationRunsApi.create({ name: data.name, uploaded_file_ids: data.uploaded_file_ids }),
    onSuccess: async (newRun, variables) => {
      if (variables.runNow) {
        await reconciliationRunsApi.execute(newRun.id);
      }
      queryClient.invalidateQueries({ queryKey: ["runs"] });
      setOpen(false);
      setName("");
      setSelectedFiles([]);
      toast.success(variables.runNow ? "Run created and started" : "Run created");
    },
  });

  return (
    <PageContainer>
      <PageHeader
        title="Reconciliation runs"
        description="Pair normalized files and let the AI worker prepare matches and exceptions."
        actions={<Btn onClick={() => setOpen(true)}><Plus className="size-4" /> New reconciliation run</Btn>}
      />

      {runsLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-border rounded-[12px]">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : (runs || []).length === 0 ? (
        <EmptyState
          title="No reconciliation runs yet"
          description="Create your first run by selecting at least two normalized files."
          action={<Btn onClick={() => setOpen(true)}><Plus className="size-4" /> New run</Btn>}
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Run name</Th><Th>Status</Th><Th className="text-right">Files</Th>
              <Th className="text-right">Matched</Th><Th className="text-right">Exceptions</Th>
              <Th className="text-right">Match rate</Th><Th>Created</Th><Th></Th>
            </tr>
          </thead>
          <tbody>
            {(runs || []).map(r => (
              <tr key={r.id} className="hover:bg-[#FAFAFA]">
                <Td>
                  <div className="font-medium">{r.name}</div>
                  <div className="text-[11px] text-muted-foreground">{r.id}</div>
                </Td>
                <Td><Badge tone={statusTone(r.status)}>{formatLabel(r.status, RUN_STATUS_LABELS)}</Badge></Td>
                <Td className="text-right tabular-nums">2</Td>
                <Td className="text-right tabular-nums">{r.matched_count.toLocaleString()}</Td>
                <Td className="text-right tabular-nums text-destructive font-medium">{r.exception_count}</Td>
                <Td className="text-right tabular-nums">{r.match_rate ? (r.match_rate * 100).toFixed(1) + "%" : "—"}</Td>
                <Td className="text-muted-foreground">{formatDate(r.created_at)}</Td>
                <Td className="text-right">
                  <Link to="/app/runs/$runId" params={{ runId: r.id }}>
                    <Btn size="sm" variant="ghost">Open <ChevronRight className="size-3.5" /></Btn>
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New reconciliation run"
        footer={<div className="flex justify-end gap-2">
          <Btn variant="secondary" onClick={() => setOpen(false)} disabled={createMutation.isPending}>Cancel</Btn>
          <Btn
            onClick={() => createMutation.mutate({ name, uploaded_file_ids: selectedFiles })}
            disabled={!name || selectedFiles.length < 2 || createMutation.isPending}
            loading={createMutation.isPending}
          >
            Create
          </Btn>
          <Btn
            onClick={() => createMutation.mutate({ name, uploaded_file_ids: selectedFiles, runNow: true })}
            disabled={!name || selectedFiles.length < 2 || createMutation.isPending}
            loading={createMutation.isPending}
          >
            Create and run
          </Btn>
        </div>}>
        <div className="space-y-4">
          <Field label="Run name"><Input placeholder="e.g. April month-end close" value={name} onChange={e => setName(e.target.value)} /></Field>
          <Field label="Files to reconcile" hint="Pick at least two normalized files.">
            <div className="border border-border rounded-[12px] divide-y divide-[#F1F1F1] max-h-56 overflow-y-auto">
              {normalizedFiles.map(u => (
                <label key={u.id} className="flex items-center gap-2 px-3 py-2 hover:bg-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(u.id)}
                    onChange={e => {
                      if (e.target.checked) setSelectedFiles([...selectedFiles, u.id]);
                      else setSelectedFiles(selectedFiles.filter(id => id !== u.id));
                    }}
                  />
                  <div className="flex-1 min-w-0 text-[13px]">
                    <div className="font-medium truncate">{u.file_name}</div>
                    <div className="text-[11px] text-muted-foreground">{formatLabel(u.file_category, FILE_CATEGORY_LABELS)}</div>
                  </div>
                  <Badge tone={statusTone(u.status)}>{formatLabel(u.status, NORMALIZATION_STATUS_LABELS)}</Badge>
                </label>
              ))}
              {normalizedFiles.length === 0 && (
                <div className="p-4 text-center text-[12.5px] text-muted-foreground">No normalized files found. Confirm mappings first.</div>
              )}
            </div>
          </Field>
        </div>
      </Modal>
    </PageContainer>
  );
}
