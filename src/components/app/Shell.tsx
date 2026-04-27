import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard, Upload, Columns3, RefreshCw, AlertTriangle,
  Download, Building2, Settings, Bell, MessageSquare, ChevronDown, Search, LogOut, Check, ChevronRight, User, Shield, Loader2
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { uploadsApi, workspacesApi, reconciliationRunsApi } from "@/lib/api";
import { toast } from "sonner";
import { 
  EVENT_TYPE_LABELS, 
  ENTITY_TYPE_LABELS, 
  formatLabel 
} from "@/lib/utils/formatters";

const NAV: { to: string; label: string; icon: any; exact?: boolean }[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/uploads", label: "Uploads", icon: Upload },
  { to: "/app/column-mapping", label: "Column Mapping", icon: Columns3 },
  { to: "/app/runs", label: "Reconciliation Runs", icon: RefreshCw },
  { to: "/app/exceptions", label: "Exceptions", icon: AlertTriangle },
  { to: "/app/exports", label: "Exports", icon: Download },
  { to: "/app/workspaces", label: "Workspaces", icon: Building2 },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export function Shell() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, workspace, logout, switchWorkspace } = useAuth();

  const [wsDropdownOpen, setWsDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const wsDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const { data: uploads } = useQuery({
    queryKey: ["uploads"],
    queryFn: () => uploadsApi.list(),
    enabled: !!user,
  });

  const { data: workspaces } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => workspacesApi.list(),
    enabled: !!user && wsDropdownOpen,
  });

  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ["activity", workspace?.id],
    queryFn: () => workspacesApi.listActivity(workspace!.id),
    enabled: !!user && !!workspace && notificationOpen,
  });

  const { data: globalExceptionsResponse } = useQuery({
    queryKey: ["global-exception-count"],
    queryFn: () => reconciliationRunsApi.listGlobalExceptions({ status: "OPEN" }),
    enabled: !!user,
  });

  const mappingCount = (uploads || []).filter(u => u.status === 'PARSED').length;
  const exceptionCount = globalExceptionsResponse?.stats?.open || 0;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wsDropdownRef.current && !wsDropdownRef.current.contains(event.target as Node)) {
        setWsDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSwitch = async (id: string) => {
    if (id === workspace?.id) return;
    try {
      await switchWorkspace(id);
      setWsDropdownOpen(false);
      toast.success("Switched workspace");
    } catch (e: any) {
      toast.error(e.error?.message || "Failed to switch");
    }
  };

  if (!user || !workspace) return null;

  return (
    <div className="min-h-screen flex bg-[#FAFAFA]">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-white border-r border-border flex flex-col relative">
        <div className="px-5 h-16 flex items-center gap-2 border-b border-border">
          <div className="w-7 h-7 rounded-lg bg-foreground text-white grid place-items-center text-[11px] font-semibold">SP</div>
          <div className="leading-tight">
            <div className="text-[14px] font-semibold tracking-tight">SettleProof</div>
            <div className="text-[11px] text-muted-foreground">AI reconciliation</div>
          </div>
        </div>

        <div className="relative px-3 mt-3" ref={wsDropdownRef}>
          <button
            onClick={() => setWsDropdownOpen(!wsDropdownOpen)}
            className={[
              "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-[10px] border transition-all text-left",
              wsDropdownOpen ? "border-[#7C3AED]/40 bg-white shadow-sm ring-2 ring-[#7C3AED]/5" : "border-border bg-white hover:bg-secondary"
            ].join(" ")}
          >
            <div className="min-w-0">
              <div className="text-[11px] text-muted-foreground">Workspace</div>
              <div className="text-[13px] font-medium truncate">{workspace.name}</div>
            </div>
            <ChevronDown className={["size-4 text-muted-foreground transition-transform duration-200", wsDropdownOpen ? "rotate-180" : ""].join(" ")} />
          </button>

          {wsDropdownOpen && (
            <div className="absolute left-3 right-3 top-full mt-1.5 z-50 bg-white border border-border rounded-[12px] shadow-xl py-1.5 overflow-hidden animate-in fade-in zoom-in duration-150 origin-top">
              <div className="px-3 pb-1.5 mb-1.5 border-b border-border/50">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Switch Workspace</div>
              </div>
              <div className="max-h-[240px] overflow-y-auto px-1">
                {(workspaces || [workspace]).map((w) => (
                  <button
                    key={w.id}
                    onClick={() => handleSwitch(w.id)}
                    className={[
                      "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-[13px] transition-colors text-left",
                      w.id === workspace.id ? "bg-purple-50 text-[#7C3AED]" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    ].join(" ")}
                  >
                    <div className={["w-5 h-5 rounded-md flex items-center justify-center shrink-0 border", w.id === workspace.id ? "bg-[#7C3AED] border-[#7C3AED] text-white" : "bg-secondary border-border text-muted-foreground"].join(" ")}>
                      <Building2 className="size-3" />
                    </div>
                    <span className="flex-1 truncate">{w.name}</span>
                    {w.id === workspace.id && <Check className="size-3.5" />}
                  </button>
                ))}
              </div>
              <div className="mt-1.5 pt-1.5 border-t border-border/50 px-1">
                <Link
                  to="/app/workspaces"
                  onClick={() => setWsDropdownOpen(false)}
                  className="flex items-center justify-between px-2.5 py-2 rounded-[8px] text-[12.5px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Settings className="size-3.5" />
                    Manage all
                  </span>
                  <ChevronRight className="size-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

        <nav className="px-2 py-3 flex-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Workspace</div>
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
                {item.label === "Exceptions" && exceptionCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] text-[10px] font-bold">
                    {exceptionCount}
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
        <header className="h-16 bg-white border-b border-border px-6 flex items-center justify-between sticky top-0 z-40">
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
            <button className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 rounded-[10px] border border-border text-[13px] hover:bg-secondary font-medium transition-colors">
              <MessageSquare className="size-4" /> Feedback
            </button>
            <div className="relative" ref={notificationRef}>
              <button
                className={[
                  "relative h-9 w-9 grid place-items-center rounded-[10px] border transition-colors",
                  notificationOpen ? "border-[#7C3AED]/40 bg-white shadow-sm ring-2 ring-[#7C3AED]/5" : "border-border hover:bg-secondary"
                ].join(" ")}
                onClick={() => setNotificationOpen(!notificationOpen)}
              >
                <Bell className="size-4" />
                {activity && activity.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                )}
              </button>

              {notificationOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 z-50 bg-white border border-border rounded-[14px] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                  <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
                    <div className="text-[14px] font-semibold">Activity Logs</div>
                    <Badge tone="neutral" className="text-[10px]">Recent {activity?.length || 0}</Badge>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {activityLoading ? (
                      <div className="p-8 text-center"><Loader2 className="size-5 animate-spin mx-auto text-muted-foreground" /></div>
                    ) : (activity || []).length === 0 ? (
                      <div className="p-8 text-center text-[12px] text-muted-foreground">No recent activity</div>
                    ) : (
                      <div className="divide-y divide-border/50">
                        {activity.map((ev: any) => (
                          <div key={ev.id} className="p-3.5 hover:bg-secondary/30 transition-colors">
                            <div className="flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-secondary grid place-items-center shrink-0">
                                {ev.event_type.includes('UPLOAD') ? <Upload className="size-3.5" /> :
                                  ev.event_type.includes('RUN') ? <RefreshCw className="size-3.5" /> :
                                    ev.event_type.includes('EXPORT') ? <Download className="size-3.5" /> :
                                      <Activity className="size-3.5" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-[12.5px] font-medium text-foreground leading-snug">
                                  {formatLabel(ev.event_type, EVENT_TYPE_LABELS)}
                                </div>
                                <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                                  By {ev.actor_name || 'System'} • {formatLabel(ev.entity_type, ENTITY_TYPE_LABELS)}
                                </div>
                                <div className="text-[10px] text-muted-foreground/70 mt-1 uppercase tracking-wider font-bold">
                                  {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="p-2 border-t border-border/50 bg-secondary/10">
                    <Btn variant="secondary" size="sm" className="w-full text-[11px]">View all logs</Btn>
                  </div>
                </div>
              )}
            </div>

            <div className="relative ml-1" ref={userDropdownRef}>
              <button
                className={[
                  "h-9 w-9 rounded-full bg-foreground text-white text-[12.5px] font-bold hover:opacity-90 transition-all shadow-sm ring-offset-2 ring-offset-white",
                  userDropdownOpen ? "ring-2 ring-[#7C3AED]/40" : ""
                ].join(" ")}
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              >
                {(user.full_name || user.email)[0].toUpperCase()}
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 z-50 bg-white border border-border rounded-[14px] shadow-2xl py-1.5 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                  <div className="px-4 py-3 border-b border-border/50">
                    <div className="text-[13.5px] font-semibold text-foreground truncate">{user.full_name || "Account"}</div>
                    <div className="text-[11.5px] text-muted-foreground truncate">{user.email}</div>
                    <div className="mt-2 text-[10px] font-bold text-[#7C3AED] uppercase tracking-widest bg-purple-50 inline-block px-1.5 py-0.5 rounded">
                      {workspace.role}
                    </div>
                  </div>

                  <div className="px-1.5 py-1">
                    <Link
                      to="/app/settings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-[13px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                      <User className="size-4" />
                      View Profile
                    </Link>
                    <Link
                      to="/app/settings"
                      search={{ tab: 'workspace' }}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-[13px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                      <Building2 className="size-4" />
                      Workspace Settings
                    </Link>
                    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-[13px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-not-allowed opacity-50">
                      <Shield className="size-4" />
                      Security
                    </div>
                  </div>

                  <div className="px-1.5 pt-1 border-t border-border/50">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-[13px] text-destructive hover:bg-destructive/5 transition-colors text-left"
                    >
                      <LogOut className="size-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
