import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, PageContainer, PageHeader, Btn, Badge, Field, Input, Select, Tabs } from "@/components/app/ui";
import { integrations, currentUser } from "@/data/mock";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Settings · ReconPilot" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [tab, setTab] = useState("profile");
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              <Field label="Full name"><Input defaultValue={currentUser.full_name} /></Field>
              <Field label="Email"><Input defaultValue={currentUser.email} /></Field>
              <Field label="Time zone"><Select defaultValue="Asia/Kolkata"><option>Asia/Kolkata</option><option>Europe/London</option><option>America/New_York</option></Select></Field>
              <Field label="Language"><Select defaultValue="English"><option>English</option><option>हिंदी</option></Select></Field>
            </div>
            <div className="mt-5 flex justify-end gap-2"><Btn variant="secondary">Cancel</Btn><Btn>Save changes</Btn></div>
          </Card>
        )}

        {tab === "workspace" && (
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              <Field label="Workspace name"><Input defaultValue="Northwind Payments" /></Field>
              <Field label="Default currency"><Select defaultValue="INR"><option>INR</option><option>USD</option><option>EUR</option></Select></Field>
              <Field label="Fiscal year start"><Select defaultValue="April"><option>January</option><option>April</option><option>July</option></Select></Field>
              <Field label="Reconciliation window (days)"><Input type="number" defaultValue={5} /></Field>
            </div>
            <div className="mt-5 flex justify-end gap-2"><Btn variant="secondary">Cancel</Btn><Btn>Save changes</Btn></div>
          </Card>
        )}

        {tab === "integrations" && (
          <>
            <p className="text-[12.5px] text-muted-foreground mb-3">For MVP, upload-based reconciliation is primary. Direct integrations are rolling out.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {integrations.map(i => (
                <Card key={i.name}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[10px] bg-secondary grid place-items-center text-[13px] font-semibold">{i.name[0]}</div>
                      <div>
                        <div className="text-[14px] font-medium">{i.name}</div>
                        <div className="text-[11.5px] text-muted-foreground">{i.note ?? "Direct integration"}</div>
                      </div>
                    </div>
                    {i.status === "available" ? <Badge tone="success">Available</Badge> : <Badge tone="neutral">Coming soon</Badge>}
                  </div>
                  <div className="mt-4">
                    {i.status === "available"
                      ? <Btn size="sm" variant="secondary" className="w-full justify-center">Connect</Btn>
                      : <Btn size="sm" variant="ghost" className="w-full justify-center" disabled>Notify me</Btn>}
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {tab === "notifications" && (
          <Card>
            <div className="space-y-3 max-w-xl">
              {["Reconciliation completed","Critical exceptions detected","Export ready","Member invited"].map(l => (
                <label key={l} className="flex items-center justify-between py-2 border-b border-[#F1F1F1] last:border-0">
                  <div className="text-[13px]">{l}</div>
                  <input type="checkbox" defaultChecked />
                </label>
              ))}
            </div>
          </Card>
        )}

        {tab === "api" && (
          <Card>
            <Field label="API base URL"><Input defaultValue="https://api.reconpilot.io" /></Field>
            <div className="mt-3"><Field label="API key"><Input defaultValue="rp_live_••••••••••••" /></Field></div>
            <div className="mt-3 text-[11.5px] text-muted-foreground">All API responses use the envelope <code className="font-mono bg-secondary px-1.5 py-0.5 rounded">{"{ data, request_id, pagination }"}</code>. Surface <code className="font-mono">request_id</code> on every error for support.</div>
            <div className="mt-5 flex justify-end gap-2"><Btn variant="secondary">Rotate key</Btn><Btn>Save</Btn></div>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
