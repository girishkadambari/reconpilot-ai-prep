import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, PageContainer, PageHeader, Btn, Badge, Th, Td, Field, Input, Select, Modal, EmptyState } from "@/components/app/ui";
import { workspacesApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/AuthContext";
import { toast } from "sonner";
import { Plus, Send, UserPlus, Users, Settings, Loader2, Pencil, Trash2, Globe, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/app/workspaces")({
  head: () => ({ meta: [{ title: "Workspaces · ReconPilot" }] }),
  component: WorkspacesPage,
});

function WorkspacesPage() {
  const { workspace: activeWorkspace, switchWorkspace } = useAuth();
  const queryClient = useQueryClient();
  
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editWorkspaceId, setEditWorkspaceId] = useState<string | null>(null);
  const [editWorkspaceName, setEditWorkspaceName] = useState("");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteWorkspace, setDeleteWorkspace] = useState<{ id: string, name: string } | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");

  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const { data: workspaces, isLoading: loadingWorkspaces } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => workspacesApi.list(),
  });

  const { data: members, isLoading: loadingMembers } = useQuery({
    queryKey: ["workspace-members", activeWorkspace?.id],
    queryFn: () => workspacesApi.listMembers(activeWorkspace!.id),
    enabled: !!activeWorkspace?.id,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => workspacesApi.create({ name }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      setCreateModalOpen(false);
      setNewWorkspaceName("");
      toast.success("Workspace created");
    },
    onError: (e: any) => toast.error(e.error?.message || "Failed to create workspace"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string, name: string }) => workspacesApi.update(data.id, { name: data.name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["auth-me"] });
      setEditModalOpen(false);
      toast.success("Workspace updated");
    },
    onError: (e: any) => toast.error(e.error?.message || "Failed to update workspace"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => workspacesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      setDeleteModalOpen(false);
      setDeleteWorkspace(null);
      setDeleteConfirmName("");
      toast.success("Workspace deleted");
    },
    onError: (e: any) => toast.error(e.error?.message || "Failed to delete workspace"),
  });

  const inviteMutation = useMutation({
    mutationFn: (data: { email: string; role: string }) => 
      workspacesApi.inviteMember(activeWorkspace!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-members", activeWorkspace?.id] });
      setInviteEmail("");
      toast.success("Invitation sent");
    },
    onError: (e: any) => toast.error(e.error?.message || "Failed to send invitation"),
  });

  const handleSwitch = async (id: string) => {
    if (activeWorkspace?.id === id) return;
    setSwitchingId(id);
    try {
      await switchWorkspace(id);
      // Force reload or invalidate queries to ensure fresh context
      await queryClient.invalidateQueries();
      toast.success("Switched workspace context");
    } catch (e: any) {
      toast.error(e.error?.message || "Failed to switch workspace");
    } finally {
      setSwitchingId(null);
    }
  };

  const openEditModal = (w: any) => {
    setEditWorkspaceId(w.id);
    setEditWorkspaceName(w.name);
    setEditModalOpen(true);
  };

  const openDeleteModal = (w: any) => {
    setDeleteWorkspace(w);
    setDeleteConfirmName("");
    setDeleteModalOpen(true);
  };

  if (loadingWorkspaces) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-40">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <div className="text-[13px] text-muted-foreground mt-3">Loading workspaces...</div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title="Workspaces" 
        description="Organize teams, billing, and reconciliation history." 
        actions={<Btn onClick={() => setCreateModalOpen(true)}><Plus className="size-4" /> Create workspace</Btn>} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {(workspaces || []).map(w => {
          const isActive = w.id === activeWorkspace?.id;
          const isSwitching = switchingId === w.id;
          const isOwner = w.role === "OWNER";

          return (
            <Card key={w.id} className={isActive ? "border-[#7C3AED]/30 bg-purple-50/10 shadow-sm" : "hover:border-border/80 transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)]"}>
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-[12px] grid place-items-center shrink-0 transition-colors ${isActive ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/20' : 'bg-secondary text-muted-foreground border border-border'}`}>
                    <Globe className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-[15px] font-semibold">{w.name}</div>
                      {isActive && <Badge tone="purple">Active</Badge>}
                    </div>
                    <div className="text-[12.5px] text-muted-foreground mt-0.5">Your role · {w.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {isOwner && (
                    <>
                      <Btn size="sm" variant="ghost" onClick={() => openEditModal(w)}>
                        <Pencil className="size-3.5" />
                      </Btn>
                      {!isActive && (
                        <Btn 
                          size="sm" 
                          variant="ghost" 
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => openDeleteModal(w)}
                        >
                          <Trash2 className="size-3.5" />
                        </Btn>
                      )}
                    </>
                  )}
                  {isActive ? (
                    <Link to="/app/settings" search={{ tab: "workspace" }}>
                      <Btn size="sm" variant="secondary" className="gap-1.5 px-3">
                        <Settings className="size-3.5" />
                        Manage
                      </Btn>
                    </Link>
                  ) : (
                    <Btn 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleSwitch(w.id)} 
                      loading={isSwitching}
                      disabled={!!switchingId}
                    >
                      Switch to
                    </Btn>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2" padding={false}>
          <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-border/50">
            <div>
              <div className="text-[14px] font-semibold flex items-center gap-2">
                <Users className="size-4 text-muted-foreground" />
                Members
              </div>
              <div className="text-[12px] text-muted-foreground">
                {loadingMembers ? "Loading..." : `${(members || []).length} people in ${activeWorkspace?.name}`}
              </div>
            </div>
          </div>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border/40 bg-secondary/20">
                <Th className="py-2.5">Name</Th>
                <Th className="py-2.5">Email</Th>
                <Th className="py-2.5">Role</Th>
                <Th className="py-2.5 text-right"></Th>
              </tr>
            </thead>
            <tbody>
              {loadingMembers ? (
                <tr>
                  <Td colSpan={4} className="py-12 text-center text-muted-foreground">
                    <Loader2 className="size-5 animate-spin mx-auto mb-2" />
                    Fetching members...
                  </Td>
                </tr>
              ) : (members || []).length === 0 ? (
                <tr>
                  <Td colSpan={4} className="py-12 text-center text-muted-foreground">
                    No members found.
                  </Td>
                </tr>
              ) : (
                members?.map(m => (
                  <tr key={m.id} className="hover:bg-[#FAFAFA] border-b border-border/40 last:border-0">
                    <Td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-secondary grid place-items-center text-[10px] font-bold text-muted-foreground uppercase shadow-sm">
                          {(m.user_name || m.user_email).split(" ").map(s => s[0]).join("").substring(0, 2)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{m.user_name || "Invited User"}</span>
                          {m.status === "INVITED" && <span className="text-[10px] text-orange-600 font-medium uppercase">Pending</span>}
                        </div>
                      </div>
                    </Td>
                    <Td className="text-muted-foreground">{m.user_email}</Td>
                    <Td><Badge tone={m.role === "OWNER" ? "purple" : "neutral"} className="font-medium">{m.role}</Badge></Td>
                    <Td className="text-right"><Btn size="sm" variant="ghost">Edit</Btn></Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>

        <Card className="h-fit sticky top-6">
          <div className="text-[14px] font-semibold flex items-center gap-2">
            <UserPlus className="size-4 text-muted-foreground" />
            Invite member
          </div>
          <div className="text-[12px] text-muted-foreground mt-0.5 mb-4">Send an invitation by email.</div>
          <form className="space-y-3" onSubmit={(e) => {
            e.preventDefault();
            if (inviteEmail) inviteMutation.mutate({ email: inviteEmail, role: inviteRole });
          }}>
            <Field label="Email">
              <Input
                placeholder="name@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </Field>
            <Field label="Role">
              <Select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                <option value="OWNER">OWNER</option>
                <option value="ADMIN">ADMIN</option>
                <option value="MEMBER">MEMBER</option>
                <option value="ACCOUNTANT">ACCOUNTANT</option>
                <option value="VIEWER">VIEWER</option>
              </Select>
            </Field>
            <Btn
              className="w-full justify-center"
              type="submit"
              loading={inviteMutation.isPending}
              disabled={!inviteEmail}
            >
              <Send className="size-3.5" />
              Send invite
            </Btn>
          </form>
        </Card>
      </div>

      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create workspace"
        footer={
          <div className="flex justify-end gap-2">
            <Btn variant="secondary" onClick={() => setCreateModalOpen(false)}>Cancel</Btn>
            <Btn
              onClick={() => createMutation.mutate(newWorkspaceName)}
              loading={createMutation.isPending}
              disabled={!newWorkspaceName}
            >
              Create workspace
            </Btn>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="Workspace name">
            <Input
              placeholder="e.g. Acme Corp Payments"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              autoFocus
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit workspace"
        footer={
          <div className="flex justify-end gap-2">
            <Btn variant="secondary" onClick={() => setEditModalOpen(false)}>Cancel</Btn>
            <Btn
              onClick={() => editWorkspaceId && updateMutation.mutate({ id: editWorkspaceId, name: editWorkspaceName })}
              loading={updateMutation.isPending}
              disabled={!editWorkspaceName}
            >
              Save changes
            </Btn>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="Workspace name">
            <Input
              placeholder="e.g. Acme Corp Payments"
              value={editWorkspaceName}
              onChange={(e) => setEditWorkspaceName(e.target.value)}
              autoFocus
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteWorkspace(null);
          setDeleteConfirmName("");
        }}
        title="Delete workspace"
        footer={
          <div className="flex justify-end gap-2">
            <Btn variant="secondary" onClick={() => setDeleteModalOpen(false)}>Cancel</Btn>
            <Btn
              variant="destructive"
              onClick={() => deleteWorkspace && deleteMutation.mutate(deleteWorkspace.id)}
              loading={deleteMutation.isPending}
              disabled={deleteConfirmName !== deleteWorkspace?.name}
            >
              Delete workspace
            </Btn>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex gap-3 text-[12.5px] text-amber-800">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            <p>This action will permanently delete <span className="font-bold underline">{deleteWorkspace?.name}</span>. All data will be archived.</p>
          </div>
          <p className="text-[13px] text-muted-foreground">
            To confirm, type <span className="font-bold text-foreground select-all">{deleteWorkspace?.name}</span> below:
          </p>
          <Input
            value={deleteConfirmName}
            onChange={(e) => setDeleteConfirmName(e.target.value)}
            placeholder="Enter workspace name"
            className="border-destructive/30 focus:ring-destructive/20 shadow-sm"
          />
        </div>
      </Modal>
    </PageContainer>
  );
}
