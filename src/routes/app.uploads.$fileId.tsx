import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, PageContainer, PageHeader, Btn, Badge, Table, Th, Td, statusTone } from "@/components/app/ui";
import { uploads, filePreviewRows } from "@/data/mock";
import { ArrowLeft, Sparkles } from "lucide-react";

export const Route = createFileRoute("/app/uploads/$fileId")({
  head: () => ({ meta: [{ title: "File preview · ReconPilot" }] }),
  component: FilePreview,
});

function FilePreview() {
  const { fileId } = Route.useParams();
  const file = uploads.find(u => u.id === fileId) ?? uploads[0];

  return (
    <PageContainer>
      <Link to="/app/uploads" className="inline-flex items-center gap-1 text-[12.5px] text-muted-foreground hover:text-foreground mb-3">
        <ArrowLeft className="size-3.5" /> Back to uploads
      </Link>
      <PageHeader
        title={file.file_name}
        description="Inspect parsed contents before mapping columns."
        actions={
          <Link to="/app/column-mapping"><Btn><Sparkles className="size-4" /> Suggest column mapping</Btn></Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
        <Card><div className="text-[12px] text-muted-foreground">Category</div><div className="text-[14px] font-medium mt-1">{file.file_category}</div></Card>
        <Card><div className="text-[12px] text-muted-foreground">Status</div><div className="mt-1"><Badge tone={statusTone(file.status)}>{file.status}</Badge></div></Card>
        <Card><div className="text-[12px] text-muted-foreground">Rows</div><div className="text-[14px] font-medium mt-1 tabular-nums">{file.rows.toLocaleString()}</div></Card>
        <Card><div className="text-[12px] text-muted-foreground">File ID</div><div className="text-[12px] font-mono mt-1 truncate">{file.id}</div></Card>
      </div>

      <div className="text-[12px] text-muted-foreground mb-2">Preview · first 5 rows</div>
      <Table>
        <thead>
          <tr>
            {Object.keys(filePreviewRows[0]).map(k => <Th key={k}>{k}</Th>)}
          </tr>
        </thead>
        <tbody>
          {filePreviewRows.map((r, i) => (
            <tr key={i} className="hover:bg-[#FAFAFA]">
              {Object.values(r).map((v, j) => <Td key={j} className="font-mono text-[12px]">{String(v)}</Td>)}
            </tr>
          ))}
        </tbody>
      </Table>
    </PageContainer>
  );
}
