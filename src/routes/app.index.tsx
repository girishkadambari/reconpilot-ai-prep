import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, PageContainer, Stat, Btn, Badge } from "@/components/app/ui";
import { CheckCircle2, Circle, ArrowRight, Upload, Columns3, RefreshCw, Download, FileCheck2, AlertCircle, Loader2 } from "lucide-react";
import { uploadsApi, reconciliationRunsApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Dashboard · ReconPilot" }] }),
  component: Dashboard,
});

const CHECKLIST = [
  { done: true, label: "Upload payment reports" },
  { done: true, label: "Upload bank statement" },
  { done: true, label: "Upload invoice or billing exports" },
  { done: true, label: "Map columns" },
  { done: false, label: "Normalize records" },
  { done: false, label: "Run reconciliation" },
  { done: false, label: "Export accountant report" },
];

const ACT_ICON = { upload: Upload, mapping: Columns3, run: RefreshCw, exception: AlertCircle, export: Download } as const;

function Dashboard() {
  const { data: uploads, isLoading: uploadsLoading } = useQuery({
    queryKey: ["uploads"],
    queryFn: () => uploadsApi.list(),
  });

  const { data: runs, isLoading: runsLoading } = useQuery({
    queryKey: ["runs"],
    queryFn: () => reconciliationRunsApi.list(),
  });

  const stats = {
    files: uploads?.length || 0,
    runs: runs?.length || 0,
    exceptions: (runs || []).reduce((acc, r) => acc + (r.exception_count || 0), 0),
    avgMatchRate: runs?.length ? (runs.reduce((acc, r) => acc + (r.match_rate || 0), 0) / runs.length * 100).toFixed(1) : "—"
  };

  const dynamicChecklist = [
    { done: (uploads || []).length > 0, label: "Upload payment reports" },
    { done: (uploads || []).some(u => u.status === "PARSED" || u.status === "CONFIRMED" || u.status === "NORMALIZED"), label: "Map columns" },
    { done: (uploads || []).some(u => u.status === "NORMALIZED"), label: "Normalize records" },
    { done: (runs || []).length > 0, label: "Run reconciliation" },
    { done: (runs || []).some(r => r.status === "COMPLETED"), label: "Explore findings" },
  ];

  const completed = dynamicChecklist.filter((c) => c.done).length;
  return (
    <PageContainer>
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-[12px] text-muted-foreground">Welcome back</div>
          <h1 className="text-[26px] font-semibold tracking-tight">Reconciliation Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/app/uploads"><Btn variant="secondary"><Upload className="size-4" /> Upload file</Btn></Link>
          <Link to="/app/runs"><Btn><RefreshCw className="size-4" /> Start reconciliation</Btn></Link>
        </div>
      </div>

      {/* Setup card */}
      <Card className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold">Finish setting up reconciliation</h3>
              <Badge tone="purple">{completed}/{CHECKLIST.length}</Badge>
            </div>
            <p className="text-[12.5px] text-muted-foreground mt-1">A few more steps to your first AI-prepared close.</p>
          </div>
          <Link to="/app/runs"><Btn variant="secondary" size="sm">Continue setup <ArrowRight className="size-3.5" /></Btn></Link>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
          {CHECKLIST.map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 py-1.5">
              {item.done ? <CheckCircle2 className="size-[18px] text-[#16A34A]" /> : <Circle className="size-[18px] text-muted-foreground" />}
              <span className={["text-[13px]", item.done ? "text-muted-foreground line-through" : "text-foreground"].join(" ")}>{item.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 h-1.5 rounded-full bg-secondary overflow-hidden">
          <div className="h-full bg-[#7C3AED]" style={{ width: `${(completed / CHECKLIST.length) * 100}%` }} />
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Files uploaded" value={String(stats.files)} hint={`${(uploads || []).filter(u => u.status === "PENDING_REVIEW").length} awaiting map`} />
        <Stat label="Reconciliation runs" value={String(stats.runs)} hint="Total history" />
        <Stat label="Open exceptions" value={String(stats.exceptions)} hint="Awaiting resolution" />
        <Stat label="Avg match rate" value={stats.avgMatchRate + (stats.avgMatchRate !== "—" ? "%" : "")} hint="Across all runs" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Center card */}
        <Card className="lg:col-span-2">
          <div className="flex flex-col items-start gap-4 py-6">
            <div className="w-10 h-10 rounded-[10px] bg-secondary grid place-items-center">
              <FileCheck2 className="size-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold">No reconciliation in progress</h3>
              <p className="text-[13px] text-muted-foreground mt-1 max-w-md">
                Pick the normalized files you want to reconcile and let the AI worker prepare matches and exceptions.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Link to="/app/runs"><Btn>Start reconciliation</Btn></Link>
              <Link to="/app/uploads"><Btn variant="secondary">View uploads</Btn></Link>
            </div>
          </div>
        </Card>

        {/* Activity */}
        <Card padding={false}>
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <div className="text-[14px] font-semibold">Workspace health</div>
            <Badge tone="success">Optimal</Badge>
          </div>
          <div className="px-5 pb-5 space-y-4">
            <div className="text-[13px] text-muted-foreground leading-relaxed">
              All systems are operational. AI workers are standing by for new reconciliation runs.
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-muted-foreground">API Latency</span>
                <span className="font-medium">42ms</span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-muted-foreground">AI Queue</span>
                <span className="font-medium">Idle</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
