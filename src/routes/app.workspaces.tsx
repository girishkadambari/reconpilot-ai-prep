import { createFileRoute } from "@tanstack/react-router";
import { Card, PageContainer, PageHeader, Btn, Badge, Table, Th, Td, Field, Input, Select } from "@/components/app/ui";
import { workspaces, members } from "@/data/mock";

export const Route = createFileRoute("/app/workspaces")({
  head: () => ({ meta: [{ title: "Workspaces · ReconPilot" }] }),
  component: WorkspacesPage,
});

function WorkspacesPage() {
  return (
    <PageContainer>
      <PageHeader title="Workspaces" description="Organize teams, billing, and reconciliation history." actions={<Btn>Create workspace</Btn>} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {workspaces.map(w => (
          <Card key={w.id}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-[15px] font-semibold">{w.name}</div>
                  {w.active && <Badge tone="purple">Active</Badge>}
                </div>
                <div className="text-[12.5px] text-muted-foreground mt-0.5">Your role · {w.role}</div>
              </div>
              <Btn size="sm" variant="secondary">{w.active ? "Manage" : "Switch to"}</Btn>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2" padding={false}>
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <div>
              <div className="text-[14px] font-semibold">Members</div>
              <div className="text-[12px] text-muted-foreground">{members.length} people in Northwind Payments</div>
            </div>
          </div>
          <table className="w-full text-[13px]">
            <thead><tr><Th>Name</Th><Th>Email</Th><Th>Role</Th><Th></Th></tr></thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id} className="hover:bg-[#FAFAFA]">
                  <Td className="font-medium flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-secondary grid place-items-center text-[11px] font-semibold">{m.name.split(" ").map(s=>s[0]).join("")}</div>
                    {m.name}
                  </Td>
                  <Td className="text-muted-foreground">{m.email}</Td>
                  <Td><Badge tone={m.role === "OWNER" ? "purple" : "neutral"}>{m.role}</Badge></Td>
                  <Td className="text-right"><Btn size="sm" variant="ghost">Edit</Btn></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <div className="text-[14px] font-semibold">Invite member</div>
          <div className="text-[12px] text-muted-foreground mt-0.5 mb-4">Send an invitation by email.</div>
          <div className="space-y-3">
            <Field label="Email"><Input placeholder="name@company.com" /></Field>
            <Field label="Role">
              <Select defaultValue="MEMBER">
                <option>OWNER</option><option>ADMIN</option><option>MEMBER</option><option>ACCOUNTANT</option><option>VIEWER</option>
              </Select>
            </Field>
            <Btn className="w-full justify-center">Send invite</Btn>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
