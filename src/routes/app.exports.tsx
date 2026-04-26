import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, PageContainer, PageHeader, Btn, Badge, Table, Th, Td, statusTone, Modal, Field, Select } from "@/components/app/ui";
import { Download, Plus, FileText, CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";
import { exportsApi, reconciliationRunsApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/app/exports")({
  head: () => ({ meta: [{ title: "Exports · ReconPilot" }] }),
  component: ExportsPage,
});

function ExportsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState("");
  const [scope, setScope] = useState("FULL");

  const queryClient = useQueryClient();

  const { data: exportsResponse, isLoading } = useQuery({
    queryKey: ["global-exports"],
    queryFn: () => exportsApi.listGlobal(),
    refetchInterval: (query) => {
      // Poll if any job is in progress
      const jobs = (query.state.data as any)?.data || [];
      if (!Array.isArray(jobs)) return false;
      return jobs.some((j: any) => j.status === "PENDING" || j.status === "IN_PROGRESS") ? 3000 : false;
    }
  });
  const exports = (exportsResponse as any)?.data || [];

  const { data: runs } = useQuery({
    queryKey: ["runs-for-export"],
    queryFn: () => reconciliationRunsApi.list({ page: 1, page_size: 100 }),
  });

  const createExportMutation = useMutation({
    mutationFn: () => exportsApi.create(selectedRunId, scope),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["global-exports"] });
      setIsModalOpen(false);
      setSelectedRunId("");
      toast.success("Export job started");
    },
    onError: (err: any) => {
      toast.error(err.error?.message || "Failed to start export");
    }
  });

  const handleDownload = async (runId: string, jobId: string, fileName: string) => {
    try {
      toast.info("Preparing download...", { duration: 1500 });
      const blob = await exportsApi.download(runId, jobId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Download failed. Please check your connection.");
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Exports"
        description="Accountant-ready XLSX bundles generated from completed runs."
        actions={<Btn onClick={() => setIsModalOpen(true)}><Plus className="size-4" /> New export</Btn>}
      />

      <Card padding={false}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
            <p className="text-[13px] text-muted-foreground mt-4">Loading exports...</p>
          </div>
        ) : !exports || exports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
              <FileText className="size-6 text-muted-foreground" />
            </div>
            <h3 className="text-[15px] font-semibold">No exports yet</h3>
            <p className="text-[13px] text-muted-foreground max-w-[280px] mt-1">
              Generate XLSX reports for your completed reconciliation runs to see them here.
            </p>
            <Btn variant="secondary" className="mt-6" onClick={() => setIsModalOpen(true)}>
              <Plus className="size-3.5 mr-2" /> Start First Export
            </Btn>
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Export name</Th>
                <Th>Scope</Th>
                <Th>Status</Th>
                <Th className="text-right">Rows</Th>
                <Th>Created</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {exports.map((j: any) => (
                <tr key={j.id} className="hover:bg-[#FAFAFA]">
                  <Td>
                    <div className="font-medium flex items-center gap-2">
                      <FileText className="size-3.5 text-muted-foreground" />
                      {j.file_name || "Generating..."}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{j.id}</div>
                  </Td>
                  <Td>
                    <Badge tone="neutral">{j.export_scope}</Badge>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Badge tone={statusTone(j.status)}>{j.status}</Badge>
                      {j.status === "IN_PROGRESS" && <Loader2 className="size-3 animate-spin text-[#7C3AED]" />}
                    </div>
                  </Td>
                  <Td className="text-right tabular-nums">
                    <div className="text-[13px]">
                      {j.status === "COMPLETED" ? (j.matched_rows_exported + j.exception_rows_exported).toLocaleString() : "—"}
                    </div>
                  </Td>
                  <Td className="text-muted-foreground text-[12.5px]">
                    {new Date(j.created_at).toLocaleString()}
                  </Td>
                  <Td className="text-right">
                    <Btn
                      size="sm"
                      variant="secondary"
                      disabled={j.status !== "COMPLETED"}
                      onClick={() => handleDownload(j.run_id, j.id, j.file_name)}
                    >
                      <Download className="size-3.5 mr-2" /> Download
                    </Btn>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {/* New Export Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => !createExportMutation.isPending && setIsModalOpen(false)}
        title="Start New Export"
        description="Choose a completed run and the data you'd like to include in the XLSX bundle."
        footer={
          <div className="flex justify-end gap-2">
            <Btn variant="secondary" onClick={() => setIsModalOpen(false)} disabled={createExportMutation.isPending}>Cancel</Btn>
            <Btn
              loading={createExportMutation.isPending}
              disabled={!selectedRunId}
              onClick={() => createExportMutation.mutate()}
            >
              Generate Export
            </Btn>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="Reconciliation Run" description="Only completed runs can be exported.">
            <Select value={selectedRunId} onChange={(e) => setSelectedRunId(e.target.value)}>
              <option value="">Select a run...</option>
              {(runs || []).filter((r: any) => r.status === "COMPLETED").map((r: any) => (
                <option key={r.id} value={r.id}>{r.name} ({new Date(r.run_date).toLocaleDateString()})</option>
              ))}
            </Select>
          </Field>

          <Field label="Export Scope">
            <Select value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="FULL">Full Report (Matches + Exceptions)</option>
              <option value="MATCHES_ONLY">Matches Only</option>
              <option value="EXCEPTIONS_ONLY">Exceptions Only</option>
            </Select>
          </Field>

          <div className="p-4 rounded-[12px] bg-blue-50 border border-blue-100 flex gap-3 italic">
            <CheckCircle2 className="size-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-[12px] text-blue-700 leading-relaxed">
              Exports include detailed metadata, AI interpretations, and accounting-ready row summaries in XLSX format.
            </p>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
