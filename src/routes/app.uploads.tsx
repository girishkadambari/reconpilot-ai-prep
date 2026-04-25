import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, PageContainer, PageHeader, Btn, Badge, Table, Th, Td, Modal, Field, Input, Select, statusTone } from "@/components/app/ui";
import { uploads, FileCategory } from "@/data/mock";
import { Upload, Eye, Trash2, Search } from "lucide-react";

export const Route = createFileRoute("/app/uploads")({
  head: () => ({ meta: [{ title: "Uploads · ReconPilot" }] }),
  component: UploadsPage,
});

const CATS: FileCategory[] = ["STRIPE_REPORT", "RAZORPAY_REPORT", "CHARGEBEE_INVOICE_EXPORT", "CHARGEBEE_TRANSACTION_EXPORT", "BANK_STATEMENT", "INVOICE_EXPORT"];

function UploadsPage() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("");
  const rows = uploads.filter(u =>
    (!q || u.file_name.toLowerCase().includes(q.toLowerCase())) &&
    (!cat || u.file_category === cat)
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
            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search files…" className="w-full h-9 pl-9 pr-3 rounded-[10px] border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30" />
          </div>
          <Select value={cat} onChange={(e)=>setCat(e.target.value)} className="max-w-[240px]">
            <option value="">All categories</option>
            {CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
          <div className="ml-auto text-[12px] text-muted-foreground">{rows.length} files</div>
        </div>
      </Card>

      <Table>
        <thead>
          <tr>
            <Th>File name</Th><Th>Category</Th><Th>Status</Th>
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
              <Td className="text-right tabular-nums">{u.rows.toLocaleString()}</Td>
              <Td className="text-muted-foreground">{new Date(u.uploaded_at).toLocaleString()}</Td>
              <Td>
                <div className="flex items-center justify-end gap-1">
                  <Link to="/app/uploads/$fileId" params={{ fileId: u.id }}>
                    <Btn size="sm" variant="ghost"><Eye className="size-3.5" /> Preview</Btn>
                  </Link>
                  <Btn size="sm" variant="ghost"><Trash2 className="size-3.5" /></Btn>
                </div>
              </Td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><Td className="text-center text-muted-foreground py-10" >No files match your filters.</Td></tr>
          )}
        </tbody>
      </Table>

      <Modal open={open} onClose={()=>setOpen(false)} title="Upload file"
        footer={<div className="flex justify-end gap-2"><Btn variant="secondary" onClick={()=>setOpen(false)}>Cancel</Btn><Btn onClick={()=>setOpen(false)}>Upload</Btn></div>}>
        <div className="space-y-4">
          <Field label="File"><div className="border border-dashed border-border rounded-[10px] p-6 text-center text-[12.5px] text-muted-foreground bg-[#FAFAFA]">Drop a CSV or XLSX file here, or <span className="text-foreground font-medium underline">browse</span></div></Field>
          <Field label="Category">
            <Select defaultValue="STRIPE_REPORT">{CATS.map(c => <option key={c}>{c}</option>)}</Select>
          </Field>
        </div>
      </Modal>
    </PageContainer>
  );
}
