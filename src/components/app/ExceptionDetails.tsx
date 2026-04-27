import { Sparkles, Info, Lightbulb, Activity, CheckCircle2, FileX, Database, Check, ArrowRight, Layers, AlertCircle, Search, Compass, ShieldCheck, Microscope, ChevronDown, ChevronUp, History, Quote } from "lucide-react";
import { Badge, Btn, statusTone, CopyButton } from "@/components/app/ui";
import { ExceptionItem } from "@/lib/api/types";
import { reconciliationRunsApi } from "@/lib/api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  EXCEPTION_TYPE_LABELS,
  EXCEPTION_STATUS_LABELS,
  formatLabel,
  formatCurrency
} from "@/lib/utils/formatters";

interface ExceptionDetailsProps {
  exception: ExceptionItem;
  onClose?: () => void;
  onUpdate?: () => void;
}

const parseAIExplanation = (text: string) => {
  if (!text) return null;
  const confidenceMatch = text.match(/AI confidence:\s*(.+)/i);
  const actionMatch = text.match(/Recommended action:\s*(.+)/i);
  const causeMatch = text.match(/Probable cause:\s*(.+)/i);

  const explanation = text.split(/Probable cause:/i)[0].trim().replace(/^"|"$/g, '');

  return {
    explanation,
    cause: causeMatch ? causeMatch[1].trim() : null,
    action: actionMatch ? actionMatch[1].trim() : null,
    confidence: confidenceMatch ? confidenceMatch[1].trim() : "High"
  };
};

export function ExceptionDetails({ exception, onClose, onUpdate }: ExceptionDetailsProps) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [isResolving, setIsResolving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAiExpanded, setIsAiExpanded] = useState(true);
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);
  const [isTableExpanded, setIsTableExpanded] = useState(false);
  const [resolvedNote, setResolvedNote] = useState<string | null>(exception.note || null);

  const aiParsed = useMemo(() => parseAIExplanation(exception.ai_explanation || ""), [exception.ai_explanation]);

  const formatValue = (val: any) => {
    if (val === null || val === undefined || val === "") return "—";
    if (typeof val === 'boolean') return val ? "True" : "False";
    return String(val);
  };

  const handleExplain = async () => {
    try {
      setIsAnalyzing(true);
      setAiError(null);
      await reconciliationRunsApi.explainException(exception.run_id, exception.id);
      if (onUpdate) onUpdate();
      queryClient.invalidateQueries({ queryKey: ["global-exceptions"] });
      queryClient.invalidateQueries({ queryKey: ["run-exceptions", exception.run_id] });
    } catch (err) {
      console.error(err);
      setAiError("Unable to synthesize reconciliation patterns. Please ensure ledger integrity and retry.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleResolve = async () => {
    if (!note.trim()) {
      toast.error("Please provide a resolution note.");
      return;
    }
    try {
      setIsResolving(true);
      await reconciliationRunsApi.resolveException(exception.run_id, exception.id, 'RESOLVED', note || undefined);
      setResolvedNote(note);
      toast.success("Anomaly successfully resolved");
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error("Failed to resolve anomaly");
      console.error(err);
    } finally {
      setIsResolving(false);
    }
  };

  const details = (exception as any).details_json || {};
  const isResolved = exception.status !== 'OPEN';
  const isMissing = exception.exception_type.startsWith("MISSING_");

  const sourceRecord = details.source_record || details;
  const targetRecord = details.target_record || null;

  // Labels for the comparative sides
  const sourceLabel = exception.file_role === 'SOURCE' ? 'Primary Ledger' : 'Found Counterpart';
  const targetLabel = exception.file_role === 'SOURCE' ? 'Bank Statement' : 'Primary Source';

  const allKeys = useMemo(() => {
    const keys = new Set([...Object.keys(sourceRecord), ...Object.keys(targetRecord || {})]);
    return Array.from(keys).filter(k =>
      !['source_record', 'target_record', 'match_strategy', 'details_json', 'id', 'run_id'].includes(k) &&
      !k.includes('amount')
    ).sort();
  }, [sourceRecord, targetRecord]);

  const visibleKeys = allKeys;

  return (
    <div className="flex flex-col h-full bg-white font-sans selection:bg-primary/10 overflow-hidden">
      {/* HEADER SECTION */}
      <header className="px-8 py-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center shadow-sm">
            <ShieldCheck className="size-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[9px] font-bold text-violet-600 uppercase tracking-[0.2em]">Audit Intelligence Protocol v4.0</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <Badge tone={statusTone(exception.status)} className="px-2 py-0 text-[10px] font-bold uppercase tracking-wider rounded-md">
                {formatLabel(exception.status, EXCEPTION_STATUS_LABELS)}
              </Badge>
              <span className="text-[11px] text-slate-400 font-medium">Record: {exception.id.split('-')[0]}</span>
            </div>
            <h2 className="text-[22px] font-bold text-slate-900 tracking-tight leading-none">
              {formatLabel(exception.exception_type, EXCEPTION_TYPE_LABELS)}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Run ID</div>
            <div className="text-[13px] font-mono text-slate-600">{exception.run_id.split('-')[0]}</div>
          </div>
          <div className="h-8 w-px bg-slate-100 mx-2" />
          <Btn variant="ghost" onClick={onClose} className="h-10 w-10 p-0 rounded-full hover:bg-slate-50">
            <span className="text-xl">×</span>
          </Btn>
        </div>
      </header>

      {/* SUMMARY INFO ROW */}
      <div className="px-8 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-8 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 shrink-0">
          <Activity className="size-4 text-slate-400" />
          <span className="text-[12px] font-medium text-slate-500 uppercase tracking-wider">Analysis:</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-slate-900">
              {formatCurrency(details.expected_amount || exception.amount, exception.currency)}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Expected</span>
          </div>
          <ArrowRight className="size-3 text-slate-300" />
          <div className="flex items-center gap-2">
            <span className={`text-[13px] font-bold ${isMissing ? "text-slate-400 italic" : "text-slate-900"}`}>
              {isMissing ? "Missing Record" : formatCurrency(details.actual_amount || 0, exception.currency)}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Actual</span>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">
            <span className="text-[13px] font-bold text-red-600">
              {formatCurrency(Math.abs((details.expected_amount || exception.amount) - (details.actual_amount || 0)), exception.currency)}
            </span>
            <span className="text-[11px] text-red-400 font-bold uppercase tracking-tighter">Variance</span>
          </div>
        </div>

        {isResolved ? (
          <div
            className="ml-auto flex items-center gap-3 bg-emerald-50/80 px-4 py-2 rounded-xl border border-emerald-100 shadow-sm animate-in fade-in zoom-in duration-500 group relative cursor-help"
            title={resolvedNote || exception.note || "Record finalized and archived"}
          >
            <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-200 shrink-0">
              <Check className="size-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider leading-none mb-1">Resolved</span>
              <p className="text-[12px] font-medium text-emerald-600 leading-none truncate max-w-[200px]">
                {resolvedNote || exception.note || "Archived to Audit Trail"}
              </p>
            </div>
          </div>
        ) : (
          <div className="ml-auto flex items-center gap-3 bg-white p-1 rounded-xl border border-slate-200 shadow-sm min-w-[400px]">
            <Quote className="size-3.5 text-slate-300 ml-3" />
            <input
              type="text"
              placeholder="Rationale for approval..."
              className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-[13px] font-medium placeholder:text-slate-300 py-2"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Btn
              onClick={handleResolve}
              disabled={isResolving || !note.trim()}
              className="h-8 px-4 text-[11px] font-bold rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-30 mr-1"
            >
              {isResolving ? "Approving..." : "Approve"}
            </Btn>
          </div>
        )}
        <div className="flex -space-x-1 ml-2">
          {[1, 2].map(i => (
            <div key={i} className={`h-6 w-6 rounded-full border-2 border-white bg-violet-500 flex items-center justify-center text-[8px] font-bold text-white shadow-sm`}>AI</div>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="flex-1 overflow-y-auto px-8 pb-8 pt-4 bg-[#FBFCFE]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto items-start">

          {/* LEFT: COMPARISON TABLE */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <Microscope className="size-4 text-slate-900" />
                <h3 className="text-[14px] font-bold text-slate-900">Proof of Ledgers</h3>
              </div>
              <span className="text-[11px] font-medium text-slate-400 italic">Comparing {allKeys.length} attributes</span>
            </div>

            <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col transition-all duration-300 ${isTableExpanded ? "h-[800px]" : "h-[400px]"}`}>
              <div className="overflow-y-auto no-scrollbar flex-1">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 sticky top-0 z-10 backdrop-blur-sm">
                      <th className="py-3 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attribute</th>
                      <th className="py-3 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sourceLabel}</th>
                      <th className="py-3 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{targetLabel}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {visibleKeys.map((key) => {
                      const sourceVal = sourceRecord[key];
                      const targetVal = targetRecord ? targetRecord[key] : null;

                      // Normalize for comparison
                      const sFormatted = formatValue(sourceVal);
                      const tFormatted = formatValue(targetVal);
                      const isMismatch = targetRecord && sFormatted !== tFormatted;

                      return (
                        <tr key={key} className={`group hover:bg-slate-50/50 transition-colors ${isMismatch ? "bg-red-50/20" : ""}`}>
                          <td className="py-3.5 px-6">
                            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{key.replace(/_/g, ' ')}</div>
                          </td>
                          <td className="py-3.5 px-6">
                            <div className="text-[13px] font-mono text-slate-900 flex items-center justify-between group">
                              <span className="truncate max-w-[140px]">{sFormatted}</span>
                              <CopyButton text={sFormatted} className="opacity-0 group-hover:opacity-100" />
                            </div>
                          </td>
                          <td className="py-3.5 px-6">
                            {targetRecord ? (
                              <div className="text-[13px] font-mono flex items-center justify-between group">
                                <span className={`truncate max-w-[140px] ${isMismatch ? "text-red-600 font-bold underline decoration-red-200 underline-offset-4" : "text-slate-900"}`}>
                                  {tFormatted}
                                </span>
                                <CopyButton text={tFormatted} className="opacity-0 group-hover:opacity-100" />
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-300 italic font-medium">No record</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {allKeys.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-12 text-center text-slate-400 italic text-[13px]">No granular attributes available for comparison.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {allKeys.length > 8 && (
                <button
                  onClick={() => setIsTableExpanded(!isTableExpanded)}
                  className="w-full py-3 bg-slate-50 border-t border-slate-100 text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-colors flex items-center justify-center gap-2 group"
                >
                  {isTableExpanded ? (
                    <>Show Less <ChevronUp className="size-3 group-hover:-translate-y-0.5 transition-transform" /></>
                  ) : (
                    <>Show All {allKeys.length} Attributes <ChevronDown className="size-3 group-hover:translate-y-0.5 transition-transform" /></>
                  )}
                </button>
              )}
            </div>

            {/* INTEGRATED AUDIT TRAIL */}
            <div className="bg-slate-50/50 rounded-2xl border border-slate-200 overflow-hidden transition-all duration-300">
              <button
                onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
                className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-slate-100/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <History className={`size-3 ${isTimelineExpanded ? "text-violet-600" : "text-slate-400"}`} />
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Audit Lineage</h4>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1">
                    {[1, 2, 3].map(i => <div key={i} className={`h-1.5 w-1.5 rounded-full ${i <= (isResolved ? 3 : 2) ? "bg-violet-500" : "bg-slate-200"}`} />)}
                  </div>
                  {isTimelineExpanded ? <ChevronUp className="size-3 text-slate-400" /> : <ChevronDown className="size-3 text-slate-400" />}
                </div>
              </button>

              {isTimelineExpanded && (
                <div className="px-5 pb-4 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="h-px bg-slate-100 -mx-5 mb-4" />
                  <div className="flex items-center justify-between px-2">
                    {[
                      { step: "Ingestion", active: true },
                      { step: "Matching", active: true },
                      { step: "AI Diagnosis", active: !!aiParsed },
                      { step: "Final Review", active: isResolved }
                    ].map((item, idx, arr) => (
                      <div key={idx} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center">
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center border-2 transition-all ${item.active ? "bg-violet-600 border-violet-600 text-white" : "bg-white border-slate-100 text-slate-200"}`}>
                            {item.active && idx < arr.filter(x => x.active).length - 1 ? <Check className="size-3" /> : <div className="size-1 rounded-full bg-current" />}
                          </div>
                          <span className={`mt-1.5 text-[9px] font-bold uppercase tracking-tighter ${item.active ? "text-slate-900" : "text-slate-300"}`}>{item.step}</span>
                        </div>
                        {idx !== arr.length - 1 && (
                          <div className={`h-px flex-1 mx-2 mb-4 transition-colors ${item.active && arr[idx + 1].active ? "bg-violet-600" : "bg-slate-100"}`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: AI ANALYSIS & TIMELINE */}
          <div className="space-y-6">
            {/* AI ANALYZER CARD */}
            <div className={`bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group flex flex-col transition-all duration-300 ${isTableExpanded ? "h-[800px]" : "h-[400px]"}`}>
              <div className="absolute -top-12 -right-12 p-20 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                <Sparkles className="size-48" />
              </div>

              <div className="flex items-center justify-between mb-6 shrink-0 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-violet-500/20 flex items-center justify-center backdrop-blur-sm border border-violet-500/30">
                    <Sparkles className="size-5 text-violet-400" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold">AI Analyzer</h4>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{aiParsed?.confidence || "Ultra"} Confidence</span>
                    </div>
                  </div>
                </div>
                <Btn
                  variant="ghost"
                  onClick={() => setIsAiExpanded(!isAiExpanded)}
                  className="h-8 w-8 p-0 rounded-full hover:bg-white/10 text-slate-400"
                >
                  {isAiExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </Btn>
              </div>

              {isAnalyzing ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 relative z-10 px-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-violet-500/20 rounded-full blur-2xl animate-pulse" />
                    <div className="h-20 w-20 rounded-2xl bg-slate-800 border border-violet-500/30 flex items-center justify-center relative animate-bounce duration-1000">
                      <Sparkles className="size-10 text-violet-400 animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h5 className="text-[16px] font-bold text-white">Synthesizing Evidence...</h5>
                    <div className="flex flex-col items-center gap-3">
                      <p className="text-[12px] text-slate-400 max-w-[200px]">Querying semantic engine for anomaly resolution patterns.</p>
                      <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500 animate-[loading_2s_ease-in-out_infinite]" style={{ width: '40%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : aiError ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 relative z-10 px-8">
                  <div className="h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                    <AlertCircle className="size-8 text-red-400" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-[14px] font-bold text-red-100">Analysis Halted</h5>
                    <p className="text-[12px] text-slate-400 max-w-[240px] leading-relaxed">{aiError}</p>
                  </div>
                  <Btn
                    onClick={() => handleExplain()}
                    className="bg-white/10 text-white hover:bg-white/20 font-bold rounded-xl h-9 px-6 text-[11px] border border-white/10"
                  >
                    Retry Diagnostics
                  </Btn>
                </div>
              ) : !aiParsed ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 relative z-10 px-8">
                  <p className="text-[13px] text-slate-400 leading-relaxed max-w-[240px]">
                    Redeem intelligence credits to perform deep semantic analysis on this anomaly.
                  </p>
                  <Btn
                    onClick={() => handleExplain()}
                    className="bg-violet-600 text-white hover:bg-violet-500 font-bold rounded-xl h-10 px-8 active:scale-95 transition-all shadow-lg shadow-violet-500/20"
                  >
                    Deploy AI Agent
                  </Btn>
                </div>
              ) : (
                <div className={`flex-1 overflow-y-auto no-scrollbar space-y-6 relative z-10 ${isAiExpanded ? "" : "hidden"}`}>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative">
                    <Quote className="absolute top-4 right-4 size-8 text-white/5" />
                    <p className="text-[15px] font-medium leading-relaxed italic text-slate-200">
                      "{aiParsed.explanation}"
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-violet-400 uppercase tracking-widest">
                        <AlertCircle className="size-3" /> Probable Root Cause
                      </div>
                      <p className="text-[14px] font-bold text-white leading-snug">{aiParsed.cause}</p>
                    </div>
                    <div className="h-px bg-white/10" />
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                        <CheckCircle2 className="size-3" /> Recommendation
                      </div>
                      <p className="text-[14px] font-bold text-white leading-snug">{aiParsed.action}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER ACTION AREA - REMOVED AS PER USER REQUEST */}
    </div>
  );
}
