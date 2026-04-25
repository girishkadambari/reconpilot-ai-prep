import { createFileRoute } from "@tanstack/react-router";
import { Card, PageContainer, PageHeader, Btn, Badge, statusTone } from "@/components/app/ui";
import { serviceHealth } from "@/data/mock";
import { CheckCircle2, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/app/health")({
  head: () => ({ meta: [{ title: "Service health · ReconPilot" }] }),
  component: HealthPage,
});

function HealthPage() {
  const allOk = serviceHealth.every(s => s.status === "operational");
  return (
    <PageContainer>
      <PageHeader title="Service health"
        description="Live status of ReconPilot dependencies via /health and /ready."
        actions={<Btn variant="secondary">Re-check</Btn>}
      />

      <Card className="mb-5">
        <div className="flex items-center gap-3">
          {allOk
            ? <div className="w-10 h-10 rounded-full grid place-items-center bg-[oklch(0.95_0.06_148)] text-[#15803D]"><CheckCircle2 className="size-5" /></div>
            : <div className="w-10 h-10 rounded-full grid place-items-center bg-[oklch(0.97_0.08_85)] text-[#B45309]"><AlertTriangle className="size-5" /></div>
          }
          <div>
            <div className="text-[15px] font-semibold">{allOk ? "All systems operational" : "Partial degradation"}</div>
            <div className="text-[12.5px] text-muted-foreground">Last checked just now · request_id req_7bk2x</div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {serviceHealth.map(s => (
          <Card key={s.name}>
            <div className="flex items-center justify-between">
              <div className="text-[14px] font-medium">{s.name}</div>
              <Badge tone={statusTone(s.status)}>{s.status === "operational" ? "Operational" : "Degraded"}</Badge>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className={["h-full", s.status === "operational" ? "bg-[#16A34A]" : "bg-[#F59E0B]"].join(" ")} style={{ width: s.status === "operational" ? "100%" : "62%" }} />
            </div>
            <div className="mt-2 text-[11.5px] text-muted-foreground">99.9% uptime · 30 day window</div>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
