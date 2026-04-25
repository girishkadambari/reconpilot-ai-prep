import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Upload, Columns3, RefreshCw, AlertTriangle,
  Download, Building2, Settings, Activity, Bell, MessageSquare, ChevronDown, Search, LogOut
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { uploadsApi } from "@/lib/api";

const NAV: { to: string; label: string; icon: any; exact?: boolean }[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/uploads", label: "Uploads", icon: Upload },
  { to: "/app/column-mapping", label: "Column Mapping", icon: Columns3 },
  { to: "/app/runs", label: "Reconciliation Runs", icon: RefreshCw },
  { to: "/app/exceptions", label: "Exceptions", icon: AlertTriangle },
  { to: "/app/exports", label: "Exports", icon: Download },
  { to: "/app/workspaces", label: "Workspaces", icon: Building2 },
  { to: "/app/settings", label: "Settings", icon: Settings },
  { to: "/app/health", label: "Service Health", icon: Activity },
];

export function Shell() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, workspace, logout } = useAuth();
  
  const { data: uploads } = useQuery({
    queryKey: ["uploads"],
    queryFn: () => uploadsApi.list(),
    enabled: !!user,
  });

  const mappingCount = (uploads || []).filter(u => u.status === 'PARSED').length;

  if (!user || !workspace) return null;

  return (
    <div className="min-h-screen flex bg-[#FAFAFA]">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-white border-r border-border flex flex-col">
        <div className="px-5 h-16 flex items-center gap-2 border-b border-border">
          <div className="w-7 h-7 rounded-lg bg-foreground text-white grid place-items-center text-[11px] font-semibold">RP</div>
          <div className="leading-tight">
            <div className="text-[14px] font-semibold tracking-tight">ReconPilot</div>
            <div className="text-[11px] text-muted-foreground">AI reconciliation</div>
          </div>
        </div>

        <button className="mx-3 mt-3 flex items-center justify-between gap-2 px-3 py-2 rounded-[10px] border border-border bg-white hover:bg-secondary text-left">
          <div className="min-w-0">
            <div className="text-[11px] text-muted-foreground">Workspace</div>
            <div className="text-[13px] font-medium truncate">{workspace.name}</div>
          </div>
          <ChevronDown className="size-4 text-muted-foreground" />
        </button>

        <nav className="px-2 py-3 flex-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] uppercase tracking-wider text-muted-foreground">Workspace</div>
          {NAV.map((item) => {
            const active = item.exact ? path === item.to : path.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={[
                  "group relative flex items-center gap-2.5 mx-1 my-0.5 px-3 py-2 rounded-[8px] text-[13px]",
                  active ? "bg-[#F5F5F5] text-foreground font-medium" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                ].join(" ")}
              >
                {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-[#7C3AED]" />}
                <Icon className={["size-[15px]", active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"].join(" ")} />
                <span className="flex-1">{item.label}</span>
                {item.label === "Column Mapping" && mappingCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] text-[10px] font-bold">
                    {mappingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <div className="rounded-[10px] border border-border p-3 bg-[#FAFAFA]">
            <div className="text-[12px] font-medium">Need a new connector?</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Vote for Cashfree, Tally and more.</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-border px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 max-w-md w-full">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                placeholder="Search runs, files, exceptions…"
                className="w-full h-9 pl-9 pr-3 rounded-[10px] bg-[#FAFAFA] border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]/40"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 rounded-[10px] border border-border text-[13px] hover:bg-secondary">
              <MessageSquare className="size-4" /> Feedback
            </button>
            <button className="relative h-9 w-9 grid place-items-center rounded-[10px] border border-border hover:bg-secondary">
              <Bell className="size-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
            </button>
            <button 
              className="h-9 w-9 grid place-items-center rounded-full bg-foreground text-white text-[12px] font-semibold hover:opacity-80 transition-opacity"
              onClick={logout}
              title="Logout"
            >
              {user.email[0].toUpperCase()}
            </button>
          </div>
        </header>

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
