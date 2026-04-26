import { ReactNode, useState } from "react";
import { Loader2, Check, Copy } from "lucide-react";
import { format, isValid } from "date-fns";

export function PageContainer({ children }: { children: ReactNode }) {
  return <div className="px-8 py-7 max-w-[1400px] mx-auto w-full">{children}</div>;
}

export function PageHeader({
  title, description, actions,
}: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-[26px] font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-[13px] text-muted-foreground mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = "", padding = true }: { children: ReactNode; className?: string; padding?: boolean }) {
  return (
    <div className={["bg-white border border-border rounded-[12px] shadow-[0_1px_2px_rgba(15,23,42,0.04)]", padding ? "p-5" : "", className].join(" ")}>
      {children}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <div className="text-[12px] text-muted-foreground">{label}</div>
      <div className="text-[22px] font-semibold tracking-tight mt-1">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
    </Card>
  );
}

type Tone = "neutral" | "success" | "warning" | "error" | "info" | "purple";
const TONE: Record<Tone, string> = {
  neutral: "bg-secondary text-foreground border-border",
  success: "bg-[oklch(0.95_0.06_148)] text-[#15803D] border-[oklch(0.85_0.1_148)]",
  warning: "bg-[oklch(0.97_0.08_85)] text-[#B45309] border-[oklch(0.88_0.12_85)]",
  error: "bg-[oklch(0.96_0.06_25)] text-[#B91C1C] border-[oklch(0.88_0.12_25)]",
  info: "bg-[oklch(0.96_0.05_260)] text-[#1D4ED8] border-[oklch(0.88_0.08_260)]",
  purple: "bg-[oklch(0.96_0.05_295)] text-[#6D28D9] border-[oklch(0.88_0.08_295)]",
};
export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={["inline-flex items-center gap-1 px-2 h-[22px] text-[11px] font-medium rounded-full border", TONE[tone]].join(" ")}>
      {children}
    </span>
  );
}

export function Btn({
  children, variant = "primary", size = "md", className = "", loading = false, ...rest
}: {
  children: ReactNode; variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md";
  loading?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizes = size === "sm" ? "h-8 px-3 text-[12.5px]" : "h-9 px-3.5 text-[13px]";
  const variants = {
    primary: "bg-foreground text-white hover:bg-foreground/90 border border-foreground",
    secondary: "bg-white text-foreground border border-border hover:bg-secondary",
    ghost: "bg-transparent text-foreground hover:bg-secondary border border-transparent",
    destructive: "bg-destructive text-white hover:bg-destructive/90 border border-destructive",
  }[variant];
  return (
    <button
      className={["inline-flex items-center justify-center gap-1.5 rounded-[10px] font-medium transition-colors disabled:opacity-50", sizes, variants, className].join(" ")}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading && <Loader2 className="size-3.5 animate-spin" />}
      {children}
    </button>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white border border-border rounded-[12px] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">{children}</table>
      </div>
    </div>
  );
}
export function Th({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <th className={["text-left font-medium text-muted-foreground text-[11.5px] uppercase tracking-wider px-4 py-2.5 bg-[#FAFAFA] border-b border-border", className].join(" ")}>{children}</th>;
}
export function Td({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <td className={["px-4 py-3 border-b border-[#F1F1F1] align-middle", className].join(" ")}>{children}</td>;
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="text-center py-14 px-6">
      <div className="mx-auto w-10 h-10 rounded-full bg-secondary grid place-items-center text-muted-foreground mb-3">∅</div>
      <div className="text-[14px] font-medium">{title}</div>
      {description && <div className="text-[12.5px] text-muted-foreground mt-1 max-w-sm mx-auto">{description}</div>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Tabs({ tabs, value, onChange }: { tabs: { id: string; label: string; count?: number }[]; value: string; onChange: (id: string) => void }) {
  return (
    <div className="border-b border-border flex items-center gap-1">
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={["relative px-3.5 h-10 text-[13px] flex items-center gap-2", active ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"].join(" ")}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="text-[11px] px-1.5 h-4 rounded-full bg-secondary text-muted-foreground inline-flex items-center">{t.count}</span>
            )}
            {active && <span className="absolute left-2 right-2 -bottom-px h-0.5 bg-foreground rounded-full" />}
          </button>
        );
      })}
    </div>
  );
}

export function Drawer({ open, onClose, title, children, footer, padding = true, width = "480px" }: {
  open: boolean; onClose: () => void; title?: string; children: ReactNode; footer?: ReactNode; padding?: boolean; width?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full bg-white border-l border-border shadow-xl flex flex-col" style={{ maxWidth: width }}>
        {title && (
          <div className="h-14 px-5 flex items-center justify-between border-b border-border">
            <div className="text-[14px] font-semibold">{title}</div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">Close</button>
          </div>
        )}
        <div className={["flex-1 overflow-y-auto", padding ? "p-5" : ""].join(" ")}>{children}</div>
        {footer && <div className="border-t border-border p-4 bg-[#FAFAFA]">{footer}</div>}
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, description, children, footer }: {
  open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; footer?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/30 animate-in fade-in duration-200" onClick={onClose} />
      <div className="relative bg-white border border-border rounded-[14px] w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200">
        <div className="px-5 pt-5 pb-5">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[16px] font-semibold">{title}</div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">Close</button>
          </div>
          {description && <p className="text-[13px] text-muted-foreground mb-4">{description}</p>}
          <div className="mt-4">{children}</div>
        </div>
        {footer && <div className="border-t border-border p-4 bg-[#FAFAFA] rounded-b-[14px]">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({ label, hint, description, children }: { label: string; hint?: string; description?: string; children: ReactNode }) {
  return (
    <div className="block mb-4 last:mb-0">
      <div className="text-[13px] font-medium mb-1">{label}</div>
      {description && <p className="text-[11.5px] text-muted-foreground mb-2">{description}</p>}
      {children}
      {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={["w-full h-9 px-3 rounded-[10px] border border-border bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]/40", props.className].join(" ")} />;
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={["w-full h-9 px-2.5 rounded-[10px] border border-border bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]/40", props.className].join(" ")} />;
}

export function CopyButton({ text, label, className = "" }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={[
        "inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors",
        className
      ].join(" ")}
      title={label || "Copy to clipboard"}
    >
      {copied ? <Check className="size-3.5 text-green-600" /> : <Copy className="size-3.5" />}
      {label && <span className="text-[12px]">{label}</span>}
    </button>
  );
}

export function severityTone(s: string) {
  const v = String(s).toUpperCase();
  return v === "CRITICAL" || v === "HIGH" ? "error" : v === "MEDIUM" ? "warning" : "neutral";
}
export function statusTone(s: string) {
  const v = String(s).toUpperCase();
  if (["COMPLETED", "NORMALIZED", "READY", "APPROVED", "RESOLVED", "AUTO_MATCHED", "OPERATIONAL"].includes(v)) return "success";
  if (["RUNNING", "PENDING_REVIEW", "PARSING", "QUEUED", "OPEN", "PARSED", "IN_PROGRESS", "PENDING"].includes(v)) return "warning";
  if (["FAILED", "PARSE_FAILED", "REJECTED", "DEGRADED"].includes(v)) return "error";
  return "neutral";
}

export function formatDate(dateStr: string | null | undefined, fmt: string = "MMM d, h:mm a") {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (!isValid(d)) return "—";
  return format(d, fmt);
}
