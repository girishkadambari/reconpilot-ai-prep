import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, PageContainer, Stat, Btn, Badge } from "@/components/app/ui";
import { CheckCircle2, Circle, ArrowRight, Upload, Columns3, RefreshCw, Download, FileCheck2, AlertCircle } from "lucide-react";
import { activity } from "@/data/mock";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Dashboard · ReconPilot" }] }),
  component: Dashboard,
});

const CHECKLIST = [
  { done: true,  label: "Upload payment reports" },
  { done: true,  label: "Upload bank statement" },
  { done: true,  label: "Upload invoice or billing exports" },
  { done: true,  label: "Map columns" },
  { done: false, label: "Normalize records" },
  { done: false, label: "Run reconciliation" },
  { done: false, label: "Export accountant report" },
];

const ACT_ICON = { upload: Upload, mapping: Columns3, run: RefreshCw, exception: AlertCircle, export: Download } as const;

function Dashboard() {
  const completed = CHECKLIST.filter((c) => c.done).length;
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
          <div className="h-full bg-[#7C3AED]" style={{ width: `${(completed/CHECKLIST.length)*100}%` }} />
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Stat label="Files uploaded" value="6" hint="2 awaiting normalize" />
        <Stat label="Reconciliation runs" value="4" hint="1 running" />
        <Stat label="Open exceptions" value="47" hint="6 critical" />
        <Stat label="Match rate" value="97.3%" hint="Last 30 days" />
        <Stat label="Amount reconciled" value="₹61.2L" hint="Across 3 runs" />
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
            <div className="text-[14px] font-semibold">Recent activity</div>
            <Badge tone="neutral">Audit</Badge>
          </div>
          <div className="px-2 pb-2">
            {activity.map((a) => {
              const Icon = ACT_ICON[a.kind];
              return (
                <div key={a.id} className="flex items-start gap-3 px-3 py-2.5 rounded-[8px] hover:bg-secondary">
                  <div className="w-7 h-7 rounded-full bg-secondary grid place-items-center mt-0.5">
                    <Icon className="size-[14px] text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12.5px] truncate">{a.text}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{a.when}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
