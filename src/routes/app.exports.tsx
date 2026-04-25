import { createFileRoute } from "@tanstack/react-router";
import { Card, PageContainer, PageHeader, Btn, Badge, Table, Th, Td, statusTone } from "@/components/app/ui";
import { exportJobs } from "@/data/mock";
import { Download, Plus } from "lucide-react";

export const Route = createFileRoute("/app/exports")({
  head: () => ({ meta: [{ title: "Exports · ReconPilot" }] }),
  component: ExportsPage,
});

function ExportsPage() {
  return (
    <PageContainer>
      <PageHeader title="Exports" description="Accountant-ready XLSX bundles." actions={<Btn><Plus className="size-4" /> New export</Btn>} />
      <Table>
        <thead>
          <tr><Th>Export name</Th><Th>Scope</Th><Th>Status</Th><Th>Run</Th><Th>Created</Th><Th></Th></tr>
        </thead>
        <tbody>
          {exportJobs.map(j => (
            <tr key={j.id} className="hover:bg-[#FAFAFA]">
              <Td className="font-medium">{j.name}</Td>
              <Td><Badge tone="neutral">{j.scope}</Badge></Td>
              <Td><Badge tone={statusTone(j.status)}>{j.status}</Badge></Td>
              <Td className="text-muted-foreground">{j.run}</Td>
              <Td className="text-muted-foreground">{new Date(j.created_at).toLocaleString()}</Td>
              <Td className="text-right">
                <Btn size="sm" variant="secondary" disabled={j.status !== "READY"}>
                  <Download className="size-3.5" /> Download
                </Btn>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </PageContainer>
  );
}
