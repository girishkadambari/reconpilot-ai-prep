import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Btn } from "@/components/app/ui";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { authApi } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ReconPilot — AI-assisted reconciliation for finance teams" },
      { name: "description", content: "ReconPilot reconciles Stripe, Razorpay, Chargebee and bank statements. AI prepares reconciliation. Your accountant approves exceptions." },
      { property: "og:title", content: "ReconPilot — AI-assisted reconciliation" },
      { property: "og:description", content: "AI prepares reconciliation. Your accountant approves exceptions." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate({ to: "/app" });
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("access_token");
      if (token) {
        login(token);
        window.history.replaceState({}, document.title, "/");
        toast.success("Successfully logged in with Google");
      }
    }
  }, [login]);

  const handleDevLogin = async () => {
    setLoading(true);
    try {
      const res = await authApi.devLogin({
        email: "alice@acme.com",
        full_name: "Alice Smith"
      });
      login(res.access_token);
      toast.success("Welcome back, Alice!");
    } catch (e: any) {
      toast.error(e.error?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/api/auth/google/login`;
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <header className="h-16 px-6 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-foreground text-white grid place-items-center text-[11px] font-semibold">RP</div>
        <span className="text-[14px] font-semibold tracking-tight">ReconPilot</span>
      </header>

      <div className="flex-1 grid place-items-center px-4">
        <div className="w-full max-w-[420px]">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full border border-border bg-white text-[11.5px] text-muted-foreground mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" /> Built for finance & accounting
            </div>
            <h1 className="text-[28px] font-semibold tracking-tight leading-tight">Welcome to ReconPilot</h1>
            <p className="text-[13.5px] text-muted-foreground mt-2 max-w-[340px] mx-auto">
              AI prepares reconciliation. Your accountant approves exceptions.
            </p>
          </div>

          <div className="bg-white border border-border rounded-[14px] p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <Btn className="w-full justify-center" size="md" onClick={handleGoogleLogin} disabled={loading}>
              <GoogleIcon /> Continue with Google
            </Btn>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Btn variant="secondary" className="w-full justify-center" onClick={handleDevLogin} loading={loading}>
              Use dev login (local only)
            </Btn>

            <p className="text-[11.5px] text-muted-foreground text-center mt-5">
              By continuing you agree to our Terms and acknowledge the Privacy Notice.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6 text-center text-[11px] text-muted-foreground">
            <div>Stripe · Razorpay</div>
            <div>Chargebee · Bank</div>
            <div>SOC-ready audit log</div>
          </div>
        </div>
      </div>

      <footer className="py-5 text-center text-[11.5px] text-muted-foreground">
        © 2025 ReconPilot · request_id surfaced on all errors for support
      </footer>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.8 6.4 29.1 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.8 6.4 29.1 4.5 24 4.5 16.4 4.5 9.8 8.7 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 43.5c5 0 9.6-1.9 13-5l-6-5.1c-2 1.4-4.5 2.2-7 2.2-5.3 0-9.7-3.5-11.3-8.4l-6.5 5C9.6 39.2 16.3 43.5 24 43.5z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.4 4.3-4.5 5.6l6 5.1c-.4.4 6.7-4.9 6.7-14.7 0-1.2-.1-2.4-.4-3.5z" />
    </svg>
  );
}
