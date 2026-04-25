import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, PageContainer, PageHeader, Btn, Badge, Table, Th, Td, statusTone } from "@/components/app/ui";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { uploadsApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/app/uploads/$fileId")({
  head: () => ({ meta: [{ title: "File preview · ReconPilot" }] }),
  component: FilePreview,
});

function FilePreview() {
  const { fileId } = Route.useParams();

  const { data: file, isLoading: fileLoading } = useQuery({
    queryKey: ["upload", fileId],
    queryFn: () => uploadsApi.get(fileId),
  });

  const { data: preview, isLoading: previewLoading } = useQuery({
    queryKey: ["upload-preview", fileId],
    queryFn: () => uploadsApi.getPreview(fileId),
  });

  if (fileLoading || !file) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin" /></div>;

  const previewRows = preview?.rows || [];
  const previewCols = preview?.column_names || [];

  return (
    <PageContainer>
      <Link to="/app/uploads" className="inline-flex items-center gap-1 text-[12.5px] text-muted-foreground hover:text-foreground mb-3">
        <ArrowLeft className="size-3.5" /> Back to uploads
      </Link>
      <PageHeader
        title={file.file_name}
        description="Inspect parsed contents before mapping columns."
        actions={
          <Link to="/app/column-mapping" search={{ fileId }}>
            <Btn><Sparkles className="size-4" /> Suggest column mapping</Btn>
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
        <Card><div className="text-[12px] text-muted-foreground">Category</div><div className="text-[14px] font-medium mt-1">{file.file_category}</div></Card>
        <Card><div className="text-[12px] text-muted-foreground">Status</div><div className="mt-1"><Badge tone={statusTone(file.status)}>{file.status}</Badge></div></Card>
        <Card><div className="text-[12px] text-muted-foreground">Rows</div><div className="text-[14px] font-medium mt-1 tabular-nums">{(file.row_count ?? 0).toLocaleString()}</div></Card>
        <Card><div className="text-[12px] text-muted-foreground">File ID</div><div className="text-[12px] font-mono mt-1 truncate">{file.id}</div></Card>
      </div>

      <div className="text-[12px] text-muted-foreground mb-2">Preview · first 5 rows</div>
      {previewLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : previewRows.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground border border-dashed rounded-[12px]">No preview data available for this file yet.</div>
      ) : (
        <Table>
          <thead>
            <tr>
              {previewCols.map(k => <Th key={k}>{k}</Th>)}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((r: any, i) => (
              <tr key={i} className="hover:bg-[#FAFAFA]">
                {previewCols.map((col, j) => (
                  <Td key={j} className="font-mono text-[11.5px] truncate max-w-[200px]">
                    {String(r[col] ?? "")}
                  </Td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </PageContainer>
  );
}
