import { Sparkles, Info, AlertTriangle, X } from "lucide-react";
import { Card, Badge, Btn, severityTone, statusTone, CopyButton } from "./ui";
import { ExceptionItem } from "@/lib/api/types";
import { reconciliationRunsApi } from "@/lib/api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { 
  EXCEPTION_TYPE_LABELS, 
  EXCEPTION_STATUS_LABELS,
  formatLabel 
} from "@/lib/utils/formatters";

interface ExceptionDetailsProps {
  exception: ExceptionItem;
  onClose?: () => void;
  onUpdate?: () => void;
}

export function ExceptionDetails({ exception, onClose, onUpdate }: ExceptionDetailsProps) {
  const queryClient = useQueryClient();

  const handleExplain = async () => {
    try {
      await toast.promise(
        reconciliationRunsApi.explainException(exception.run_id, exception.id),
        {
          loading: 'AI is analyzing record patterns...',
          success: 'Analysis complete',
          error: 'Analysis failed'
        }
      );
      if (onUpdate) onUpdate();
      queryClient.invalidateQueries({ queryKey: ["global-exceptions"] });
      queryClient.invalidateQueries({ queryKey: ["run-exceptions", exception.run_id] });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <h2 className="text-[16px] font-semibold">Exception details</h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <span className="text-[13px] font-medium mr-2">Close</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Exception Type Card */}
        <div className="p-5 rounded-[12px] bg-red-50/30 border border-red-100/50">
          <div className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1.5">EXCEPTION TYPE</div>
          <div className="text-[16px] font-bold text-[#1A1A1A]">{formatLabel(exception.exception_type, EXCEPTION_TYPE_LABELS)}</div>
        </div>

        {/* AI Interpretation Card */}
        <div className="p-6 rounded-[12px] bg-[#F5F3FF] border border-[#DDD6FE]/50 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-[#7C3AED]" />
              <div className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-widest">AI INTERPRETATION</div>
            </div>
            {exception.ai_explanation && <CopyButton text={exception.ai_explanation} label="Copy info" />}
          </div>
          
          {exception.ai_explanation ? (
            <>
              <p className="text-[13.5px] leading-relaxed text-[#4B5563] italic whitespace-pre-wrap">
                "{exception.ai_explanation}"
              </p>
              <div className="mt-5 p-3 rounded-lg bg-white/60 border border-[#DDD6FE]/30 flex gap-3">
                <Info className="size-4 text-[#7C3AED] shrink-0 mt-0.5" />
                <p className="text-[11.5px] text-muted-foreground leading-relaxed">
                  AI insights are trained on historical reconciliation patterns. Always verify against primary evidence.
                </p>
              </div>
            </>
          ) : (
            <div className="py-4 text-center">
              <p className="text-[13px] text-muted-foreground mb-4">No AI interpretation available for this exception yet.</p>
              <Btn variant="secondary" onClick={handleExplain} size="sm" className="h-8">
                <Sparkles className="size-3.5 mr-2" />
                Generate Insight
              </Btn>
            </div>
          )}
        </div>

        {/* Record Details Section */}
        <div className="space-y-3">
           <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1">RECORD DETAILS</div>
           <div className="rounded-[12px] border border-border overflow-hidden">
              <table className="w-full text-[12.5px] font-mono">
                <tbody>
                  {(exception as any).details_json && Object.entries((exception as any).details_json || {}).map(([key, value], i) => (
                    <tr key={key} className={i % 2 === 0 ? "bg-white" : "bg-secondary/10"}>
                      <td className="px-4 py-2.5 text-muted-foreground w-1/3 border-r border-border/50">{key}</td>
                      <td className="px-4 py-2.5 text-foreground break-all">
                        <div className="flex items-center justify-between gap-4">
                          <span>{String(value)}</span>
                          <CopyButton text={String(value)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {/* Fallback if no details_json */}
                  {!((exception as any).details_json) && (
                    <>
                      <tr>
                        <td className="px-4 py-2.5 text-muted-foreground w-1/3 border-r">id</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-mono">{exception.id}</span>
                            <CopyButton text={exception.id} />
                          </div>
                        </td>
                      </tr>
                      <tr className="bg-secondary/10">
                        <td className="px-4 py-2.5 text-muted-foreground w-1/3 border-r">run_id</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-mono">{exception.run_id}</span>
                            <CopyButton text={exception.run_id} />
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 text-muted-foreground w-1/3 border-r">status</td>
                        <td className="px-4 py-2.5">
                          <Badge tone={statusTone(exception.status)}>{formatLabel(exception.status, EXCEPTION_STATUS_LABELS)}</Badge>
                        </td>
                      </tr>
                      <tr className="bg-secondary/10">
                        <td className="px-4 py-2.5 text-muted-foreground w-1/3 border-r">amount</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-sans">₹{exception.amount.toLocaleString()} {exception.currency}</span>
                            <CopyButton text={String(exception.amount)} />
                          </div>
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
           </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t bg-secondary/5 flex items-center justify-end gap-2">
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="secondary">Add note</Btn>
        <Btn disabled={exception.status !== 'OPEN'} className="px-6">Resolve</Btn>
      </div>
    </div>
  );
}
