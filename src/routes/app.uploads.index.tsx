import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, PageContainer, PageHeader, Btn, Badge, Table, Th, Td, Modal, Field, Input, Select, statusTone, EmptyState, formatDate } from "@/components/app/ui";
import { Upload, Eye, Trash2, Search, Loader2 } from "lucide-react";
import { uploadsApi, FileCategory } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/app/uploads/")({
  head: () => ({ meta: [{ title: "Uploads · ReconPilot" }] }),
  component: UploadsPage,
});

const CATS: FileCategory[] = ["STRIPE_REPORT", "RAZORPAY_REPORT", "CHARGEBEE_INVOICE_EXPORT", "CHARGEBEE_TRANSACTION_EXPORT", "BANK_STATEMENT", "INVOICE_EXPORT"];

function UploadsPage() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCat, setUploadCat] = useState<string>("STRIPE_REPORT");

  const queryClient = useQueryClient();

  const { data: uploads, isLoading } = useQuery({
    queryKey: ["uploads", cat],
    queryFn: () => uploadsApi.list({ file_category: cat || undefined }),
  });

  const uploadMutation = useMutation({
    mutationFn: (data: { file: File; category: string }) => uploadsApi.upload(data.file, data.category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["uploads"] });
      setOpen(false);
      setUploadFile(null);
      toast.success("File uploaded successfully");
    },
    onError: (e: any) => {
      toast.error(e.error?.message || "Upload failed");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => uploadsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["uploads"] });
      toast.success("File deleted");
    },
  });

  const rows = (uploads || []).filter(u =>
    !q || u.file_name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <PageContainer>
      <PageHeader
        title="Uploads"
        description="Source files used to build reconciliation runs."
        actions={<Btn onClick={() => setOpen(true)}><Upload className="size-4" /> Upload file</Btn>}
      />

      <Card padding={false} className="mb-4">
        <div className="flex items-center gap-3 p-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search files…" className="w-full h-9 pl-9 pr-3 rounded-[10px] border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30" />
          </div>
          <Select value={cat} onChange={(e) => setCat(e.target.value)} className="max-w-[240px]">
            <option value="">All categories</option>
            {CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
          <div className="ml-auto text-[12px] text-muted-foreground">{rows.length} files</div>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-border rounded-[12px]">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <div className="text-[13px] text-muted-foreground mt-3">Fetching your files...</div>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          title={q || cat ? "No files match filters" : "No files yet"}
          description="Upload your first bank statement or gateway report to get started."
          action={!q && !cat && <Btn onClick={() => setOpen(true)}><Upload className="size-4" /> Upload file</Btn>}
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>File name</Th><Th>Category</Th><Th>Mapping</Th>
              <Th className="text-right">Rows</Th><Th>Uploaded at</Th><Th></Th>
            </tr>
          </thead>
          <tbody>
            {rows.map(u => (
              <tr key={u.id} className="hover:bg-[#FAFAFA]">
                <Td>
                  <div className="font-medium">{u.file_name}</div>
                  <div className="text-[11px] text-muted-foreground">{u.id}</div>
                </Td>
                <Td><Badge tone="neutral">{u.file_category}</Badge></Td>
                <Td><Badge tone={statusTone(u.status)}>{u.status}</Badge></Td>
                <Td className="text-right tabular-nums">{(u.row_count ?? 0).toLocaleString()}</Td>
                <Td className="text-muted-foreground">{formatDate(u.created_at)}</Td>
                <Td>
                  <div className="flex items-center justify-end gap-1">
                    <Link to="/app/uploads/$fileId" params={{ fileId: u.id }}>
                      <Btn size="sm" variant="ghost"><Eye className="size-3.5" /> Preview</Btn>
                    </Link>
                    <Btn
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => { if (confirm("Delete this upload?")) deleteMutation.mutate(u.id); }}
                    >
                      <Trash2 className="size-3.5" />
                    </Btn>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal
        open={open}
        onClose={() => !uploadMutation.isPending && setOpen(false)}
        title="Upload file"
        footer={
          <div className="flex justify-end gap-2">
            <Btn variant="secondary" onClick={() => setOpen(false)} disabled={uploadMutation.isPending}>Cancel</Btn>
            <Btn
              onClick={() => uploadFile && uploadMutation.mutate({ file: uploadFile, category: uploadCat })}
              disabled={!uploadFile || uploadMutation.isPending}
              loading={uploadMutation.isPending}
            >
              Upload
            </Btn>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="File">
            <div
              className={[
                "border border-dashed border-border rounded-[12px] p-8 text-center text-[12.5px] cursor-pointer transition-colors",
                uploadFile ? "bg-purple-50 border-[#7C3AED]/30" : "bg-[#FAFAFA] hover:bg-secondary"
              ].join(" ")}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <input
                id="file-input"
                type="file"
                className="hidden"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                accept=".csv,.xlsx"
              />
              {uploadFile ? (
                <div className="text-foreground font-medium">{uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)</div>
              ) : (
                <div className="text-muted-foreground">
                  Drop a CSV or XLSX file here, or <span className="text-foreground font-medium underline">browse</span>
                </div>
              )}
            </div>
          </Field>
          <Field label="Category">
            <Select value={uploadCat} onChange={(e) => setUploadCat(e.target.value)}>
              {CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
        </div>
      </Modal>
    </PageContainer>
  );
}
