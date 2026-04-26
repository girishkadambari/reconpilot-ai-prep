import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, PageContainer, PageHeader, Btn, Badge, Field, Input, Select, Tabs, Modal } from "@/components/app/ui";
import { useAuth } from "@/components/auth/AuthContext";
import { workspacesApi } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Trash2, Save, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Settings · ReconPilot" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as string) || "profile",
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { tab: searchTab } = Route.useSearch();
  const { user, workspace: activeWorkspace } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(searchTab);

  useEffect(() => {
    setTab(searchTab);
  }, [searchTab]);

  // Workspace form state
  const [wsName, setWsName] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  useEffect(() => {
    if (activeWorkspace) {
      setWsName(activeWorkspace.name);
    }
  }, [activeWorkspace]);

  const updateMutation = useMutation({
    mutationFn: (name: string) => workspacesApi.update(activeWorkspace!.id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-me"] });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      toast.success("Workspace updated");
    },
    onError: (e: any) => toast.error(e.error?.message || "Failed to update workspace"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => workspacesApi.delete(activeWorkspace!.id),
    onSuccess: () => {
      toast.success("Workspace deleted. Redirecting...");
      window.location.href = "/app/workspaces";
    },
    onError: (e: any) => toast.error(e.error?.message || "Failed to delete workspace"),
  });

  if (!user || !activeWorkspace) return null;

  return (
    <PageContainer>
      <PageHeader title="Settings" description="Manage profile, workspace, integrations and API access." />
      <Tabs
        value={tab} onChange={setTab}
        tabs={[
          { id: "profile", label: "Profile" },
          { id: "workspace", label: "Workspace" },
          { id: "integrations", label: "Integrations" },
          { id: "notifications", label: "Notifications" },
          { id: "api", label: "API Configuration" },
        ]}
      />

      <div className="mt-5">
        {tab === "profile" && (
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
              <Field label="Full name"><Input value={user.full_name || ""} disabled /></Field>
              <Field label="Email"><Input value={user.email} disabled /></Field>
              <Field label="Time zone"><Select defaultValue="Asia/Kolkata"><option>Asia/Kolkata</option><option>Europe/London</option><option>America/New_York</option></Select></Field>
              <Field label="Language"><Select defaultValue="English"><option>English</option><option>हिंदी</option></Select></Field>
            </div>
            <div className="mt-6 pt-6 border-t border-border flex justify-end gap-2">
              <Btn variant="secondary" disabled>Cancel</Btn>
              <Btn disabled>Save changes</Btn>
            </div>
          </Card>
        )}

        {tab === "workspace" && (
          <div className="space-y-6">
            <Card>
              <div className="text-[14.5px] font-semibold mb-4">General Settings</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                <Field label="Workspace name">
                  <Input value={wsName} onChange={(e) => setWsName(e.target.value)} />
                </Field>
                <Field label="Default currency">
                  <Select defaultValue="INR">
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </Select>
                </Field>
                <Field label="Fiscal year start">
                  <Select defaultValue="April">
                    <option value="January">January</option>
                    <option value="April">April</option>
                    <option value="July">July</option>
                  </Select>
                </Field>
                <Field label="Reconciliation window (days)">
                  <Input type="number" defaultValue={5} />
                </Field>
              </div>
              <div className="mt-6 pt-6 border-t border-border flex justify-end gap-2">
                <Btn variant="secondary" onClick={() => setWsName(activeWorkspace.name)}>
                  <RotateCcw className="size-3.5" /> Reset
                </Btn>
                <Btn
                  onClick={() => updateMutation.mutate(wsName)}
                  loading={updateMutation.isPending}
                  disabled={wsName === activeWorkspace.name}
                >
                  <Save className="size-3.5" /> Save changes
                </Btn>
              </div>
            </Card>

            <Card className="border-destructive/20 bg-destructive/5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-[10px] bg-white border border-destructive/20 grid place-items-center shrink-0">
                  <AlertTriangle className="size-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <div className="text-[14.5px] font-semibold text-destructive">Danger Zone</div>
                  <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed max-w-xl">
                    Once you delete a workspace, there is no going back. Please be certain. All uploaded files,
                    reconciliation runs, and configuration will be archived.
                  </p>
                  <div className="mt-4">
                    <Btn
                      variant="destructive"
                      className="gap-2"
                      onClick={() => setShowDeleteModal(true)}
                    >
                      <Trash2 className="size-4" /> Delete this workspace
                    </Btn>
                  </div>
                </div>
              </div>
            </Card>

            <Modal
              open={showDeleteModal}
              onClose={() => {
                setShowDeleteModal(false);
                setDeleteConfirmName("");
              }}
              title="Delete workspace"
              footer={
                <div className="flex justify-end gap-2">
                  <Btn variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Btn>
                  <Btn
                    variant="destructive"
                    onClick={() => deleteMutation.mutate()}
                    loading={deleteMutation.isPending}
                    disabled={deleteConfirmName !== activeWorkspace.name}
                  >
                    I understand, delete this workspace
                  </Btn>
                </div>
              }
            >
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex gap-3 text-[12.5px] text-amber-800">
                  <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                  <p>This action will permanently disable the workspace. All data will be archived.</p>
                </div>
                <p className="text-[13px] text-muted-foreground">
                  To confirm, type <span className="font-bold text-foreground select-all">{activeWorkspace.name}</span> below:
                </p>
                <Input
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  placeholder="Enter workspace name"
                  className="border-destructive/30 focus:ring-destructive/20"
                />
              </div>
            </Modal>
          </div>
        )}

        {tab === "integrations" && (
          <>
            <p className="text-[12.5px] text-muted-foreground mb-3">Direct integrations are rolling out. Currently, we recommend upload-based reconciliation.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {["Stripe", "Razorpay", "PayPal", "Bank Statement", "FreshBooks", "Xero"].map(name => (
                <Card key={name}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[10px] bg-secondary grid place-items-center text-[13px] font-semibold">{name[0]}</div>
                      <div>
                        <div className="text-[14px] font-medium">{name}</div>
                        <div className="text-[11.5px] text-muted-foreground">Direct sync</div>
                      </div>
                    </div>
                    <Badge tone="neutral">Coming soon</Badge>
                  </div>
                  <div className="mt-4">
                    <Btn size="sm" variant="ghost" className="w-full justify-center" disabled>Notify me</Btn>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {tab === "notifications" && (
          <Card>
            <div className="space-y-1 max-w-xl">
              {["Reconciliation completed", "Critical exceptions detected", "Export ready", "Member invited"].map(l => (
                <label key={l} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0 hover:bg-secondary/20 px-2 rounded-lg transition-colors cursor-pointer">
                  <div className="text-[13.5px]">{l}</div>
                  <input type="checkbox" defaultChecked className="size-4 rounded accent-[#7C3AED]" />
                </label>
              ))}
            </div>
          </Card>
        )}

        {tab === "api" && (
          <Card>
            <div className="text-[14.5px] font-semibold mb-4">API Access</div>
            <div className="max-w-2xl space-y-4">
              <Field label="API base URL">
                <Input value={import.meta.env.VITE_API_BASE_URL || "https://api.reconpilot.io"} disabled />
              </Field>
              <Field label="API Key" hint="Use this key to authenticate your server-side requests.">
                <div className="flex gap-2">
                  <Input value="rp_live_7x9w2v8b...3m4p" type="password" disabled className="font-mono" />
                  <Btn variant="secondary">Copy</Btn>
                </div>
              </Field>
            </div>
            <div className="mt-5 p-4 rounded-[12px] bg-secondary/30 text-[12px] text-muted-foreground border border-border/50">
              <p className="font-semibold mb-1 text-foreground">Usage Note</p>
              All API responses use the envelope <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-border">{"{ data, request_id, pagination }"}</code>. Surface <code className="font-mono text-foreground">request_id</code> on every error for support.
            </div>
            <div className="mt-6 pt-6 border-t border-border flex justify-end gap-2">
              <Btn variant="secondary">Rotate key</Btn>
              <Btn disabled>Save changes</Btn>
            </div>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
