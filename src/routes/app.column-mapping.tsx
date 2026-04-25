import { createFileRoute } from "@tanstack/react-router";
import { Card, PageContainer, PageHeader, Btn, Badge, Table, Th, Td, Select } from "@/components/app/ui";
import { columnMapping, canonicalFields, uploads } from "@/data/mock";
import { Sparkles, Info } from "lucide-react";

export const Route = createFileRoute("/app/column-mapping")({
  head: () => ({ meta: [{ title: "Column Mapping · ReconPilot" }] }),
  component: ColumnMappingPage,
});

function ColumnMappingPage() {
  const file = uploads[0];
  return (
    <PageContainer>
      <PageHeader
        title="Column Mapping"
        description="AI suggestions speed up setup. Review mappings before normalization."
        actions={
          <>
            <Btn variant="secondary"><Sparkles className="size-4" /> Suggest with AI</Btn>
            <Btn>Confirm mapping</Btn>
          </>
        }
      />

      <Card className="mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-[oklch(0.96_0.05_295)] grid place-items-center"><Sparkles className="size-4 text-[#7C3AED]" /></div>
            <div>
              <div className="text-[14px] font-semibold">AI suggestion ready</div>
              <div className="text-[12.5px] text-muted-foreground">Mapped 8 of 8 source columns to canonical fields for <span className="font-medium text-foreground">{file.file_name}</span>.</div>
            </div>
          </div>
          <Badge tone="purple">8 fields · 92% avg confidence</Badge>
        </div>
      </Card>

      <Table>
        <thead>
          <tr>
            <Th>Source column</Th>
            <Th>Sample value</Th>
            <Th>Canonical field</Th>
            <Th>Confidence</Th>
            <Th>Mapping source</Th>
            <Th></Th>
          </tr>
        </thead>
        <tbody>
          {columnMapping.map((r) => (
            <tr key={r.source_column} className="hover:bg-[#FAFAFA]">
              <Td className="font-medium">{r.source_column}</Td>
              <Td className="font-mono text-[12px] text-muted-foreground">{r.sample_value}</Td>
              <Td>
                <Select defaultValue={r.canonical_field} className="max-w-[220px]">
                  {canonicalFields.map(f => <option key={f} value={f}>{f}</option>)}
                </Select>
              </Td>
              <Td>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-[#7C3AED]" style={{ width: `${r.confidence}%` }} />
                  </div>
                  <span className="tabular-nums text-[12px] text-muted-foreground">{r.confidence}%</span>
                </div>
              </Td>
              <Td><Badge tone={r.mapping_source === "AI" ? "purple" : "neutral"}>{r.mapping_source}</Badge></Td>
              <Td className="text-right"><Btn size="sm" variant="ghost">Override</Btn></Td>
            </tr>
          ))}
        </tbody>
      </Table>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground"><Info className="size-3.5" /> Once confirmed, normalization will produce canonical rows ready for reconciliation.</div>
        <div className="flex items-center gap-2">
          <Btn variant="secondary">Confirm mapping</Btn>
          <Btn>Normalize file</Btn>
        </div>
      </div>
    </PageContainer>
  );
}
