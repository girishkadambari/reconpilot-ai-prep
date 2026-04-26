import { Sparkles, Info, Lightbulb, Activity, CheckCircle2, FileX, Database, Check, ArrowRight, Layers, AlertCircle, Search, Compass, ShieldCheck, Microscope } from "lucide-react";
import { Badge, Btn, statusTone, CopyButton } from "@/components/app/ui";
import { ExceptionItem } from "@/lib/api/types";
import { reconciliationRunsApi } from "@/lib/api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
    confidence: confidenceMatch ? confidenceMatch[1].trim() : null
  };
};

export function ExceptionDetails({ exception, onClose, onUpdate }: ExceptionDetailsProps) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  const aiParsed = parseAIExplanation(exception.ai_explanation || "");

  const handleExplain = async () => {
    try {
      await toast.promise(
        reconciliationRunsApi.explainException(exception.run_id, exception.id),
        {
          loading: 'AI is analyzing reconciliation patterns...',
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

  const handleResolve = async () => {
    try {
      setIsResolving(true);
      await reconciliationRunsApi.resolveException(exception.run_id, exception.id, 'RESOLVED', note || undefined);
      toast.success("Anomaly successfully resolved");
      if (onUpdate) onUpdate();
      if (onClose) onClose();
    } catch (err) {
      toast.error("Failed to resolve anomaly");
      console.error(err);
    } finally {
      setIsResolving(false);
    }
  };

  const details = (exception as any).details_json || {};
  const hasExpectedActual = details.expected_amount !== undefined && details.actual_amount !== undefined;
  const isResolved = exception.status !== 'OPEN';
  const isMissing = exception.exception_type.startsWith("MISSING_");

  const sourceRecord = details.source_record || details;
  const targetRecord = details.target_record || null;

  // Labels for the comparative sides
  const sourceLabel = exception.file_role === 'SOURCE' ? 'Primary Ledger' : 'Found Counterpart';
  const targetLabel = exception.file_role === 'SOURCE' ? 'Bank Statement' : 'Primary Source';

  return (
    <div className="flex flex-col h-full bg-[#FBFCFE]">
      {/* Structural Audit Header */}
      <header className="px-10 py-8 bg-white border-b shrink-0 z-30 flex items-start justify-between shadow-sm">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg">
                <ShieldCheck className="size-5 text-white" />
             </div>
             <div>
                <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                   Audit Intelligence Protocol v4.0
                </div>
                <h2 className="text-[28px] font-black text-slate-900 tracking-tighter leading-none">
                   {formatLabel(exception.exception_type, EXCEPTION_TYPE_LABELS)}
                </h2>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-lg border border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <Database className="size-3" /> Record: {exception.id.split('-')[0]}
             </div>
             <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 rounded-lg border border-indigo-100 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                <Layers className="size-3" /> Run ID: {exception.run_id.split('-')[0]}
             </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <Badge tone={statusTone(exception.status)} className="px-6 py-2.5 text-[14px] font-black uppercase tracking-widest bg-white shadow-xl ring-2 ring-slate-100 italic">
            {formatLabel(exception.status, EXCEPTION_STATUS_LABELS)}
          </Badge>
          <div className="flex items-center gap-2">
             <div className={`h-2 w-2 rounded-full ${isResolved ? "bg-emerald-500" : "bg-primary animate-pulse"}`} />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ledger State: {exception.status}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-12 space-y-16 pb-40">
          
          {/* Analysis Lineage (Horizontal Map) */}
          <div className="bg-white rounded-[32px] border border-slate-200 p-10 shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
                <Microscope className="size-64" />
             </div>
             
             <div className="flex items-center gap-3 mb-10">
                <div className="h-2 w-10 bg-primary rounded-full" />
                <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">Provenance Lineage & Discovery</h4>
             </div>

             <div className="grid grid-cols-5 gap-0 relative">
                <div className="absolute top-6 left-[10%] right-[10%] h-[2px] bg-slate-100 z-0" />
                
                {[
                  { title: "Ingestion", icon: Database, desc: "Source Verified", done: true },
                  { title: "Mapping", icon: Layers, desc: "Schema Aligned", done: true },
                  { title: "Matching", icon: Search, desc: details.match_strategy || (isMissing ? "Heuristic Scan" : "Pattern Found"), done: true, current: true },
                  { title: "Diagnosis", icon: Sparkles, desc: aiParsed ? "AI Interpreted" : "In Progress", done: !!aiParsed },
                  { title: "Audit Lock", icon: ShieldCheck, desc: isResolved ? "Resolved" : "Pending", done: isResolved }
                ].map((s, i) => (
                  <div key={i} className="flex flex-col items-center gap-4 relative z-10">
                     <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${s.done ? "bg-slate-900 border-slate-900 text-white shadow-xl scale-110" : "bg-white border-slate-100 text-slate-300"} ${s.current ? "ring-8 ring-slate-100" : ""}`}>
                        <s.icon className="size-5" />
                     </div>
                     <div className="text-center space-y-1">
                        <p className={`text-[11px] font-black uppercase tracking-widest ${s.done ? "text-slate-900" : "text-slate-300"}`}>{s.title}</p>
                        <p className={`text-[9px] font-bold ${s.done ? "text-slate-400" : "text-slate-200"}`}>{s.desc}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* AI Diagnosis Panel (40%) */}
            <div className="lg:col-span-12 space-y-10">
               <div className="group relative rounded-[40px] bg-gradient-to-br from-slate-900 tracking-tight via-slate-900 to-slate-800 p-12 shadow-2xl text-white overflow-hidden">
                  <div className="absolute top-0 right-0 p-16 opacity-[0.05] pointer-events-none group-hover:scale-110 transition-transform">
                     <Sparkles className="size-64" />
                  </div>
                  
                  {!aiParsed ? (
                    <div className="flex flex-col items-center text-center space-y-8 relative z-10">
                       <div className="h-24 w-24 rounded-[32px] bg-white/[0.05] border border-white/10 flex items-center justify-center shadow-2xl">
                          <Sparkles className="size-10 text-primary" />
                       </div>
                       <div className="space-y-3">
                          <h3 className="text-2xl font-black tracking-tighter">Initiate AI Diagnostic Protocol</h3>
                          <p className="text-slate-400 text-sm max-w-md leading-relaxed">
                             Instruct the FinAI agent to cross-reference this anomaly against the semantic ledger registry to expose the ultimate root cause.
                          </p>
                       </div>
                       <Btn onClick={handleExplain} className="h-14 px-12 bg-primary hover:bg-primary/90 text-white font-black text-sm rounded-2xl shadow-2xl shadow-primary/30 transition-all hover:-translate-y-1">
                          Deploy AI Agent
                       </Btn>
                    </div>
                  ) : (
                    <div className="relative z-10 space-y-10">
                        <div className="flex items-center justify-between border-b border-white/5 pb-8">
                           <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                 <Sparkles className="size-6" />
                              </div>
                              <div>
                                 <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-primary mb-1">Intelligence Output</h4>
                                 <p className="text-xl font-black text-white">System Diagnosis Report</p>
                              </div>
                           </div>
                           <div className="flex flex-col items-end gap-1">
                              <Badge className="bg-primary/20 text-primary border-primary/30 text-[11px] px-4 py-1.5 font-black uppercase tracking-widest">
                                 {aiParsed.confidence || "Ultra"} Confidence
                              </Badge>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                           <div className="space-y-6">
                              <div className="space-y-4">
                                 <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <div className="h-1 w-6 bg-slate-700" /> Executive Summary
                                 </div>
                                 <p className="text-[17px] font-bold text-slate-200 leading-relaxed tracking-tight">
                                    "{aiParsed.explanation}"
                                 </p>
                              </div>
                           </div>

                           <div className="space-y-6 bg-white/[0.03] p-8 rounded-[32px] border border-white/5 shadow-inner">
                              <div className="space-y-6">
                                 <div className="space-y-2">
                                    <h5 className="text-[10px] font-black text-primary uppercase tracking-widest">Root Cause</h5>
                                    <p className="text-[15px] font-black text-white leading-tight">{aiParsed.cause}</p>
                                 </div>
                                 <div className="h-[1px] bg-white/5" />
                                 <div className="space-y-2">
                                    <h5 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest font-mono">Recommended Fix</h5>
                                    <p className="text-[15px] font-black text-white leading-tight">{aiParsed.action}</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                    </div>
                  )}
               </div>

               {/* Comparison Math Ledger */}
               <div className="bg-white rounded-[40px] border border-slate-200 p-12 shadow-xl relative group">
                  <div className="flex items-center justify-between mb-12">
                     <div className="flex items-center gap-3">
                        <Activity className="size-5 text-slate-900" />
                        <h4 className="text-[14px] font-black text-slate-900 uppercase tracking-tighter italic">Ledger Reconciliation Differential</h4>
                     </div>
                     <Badge tone="gray" className="italic font-bold">Currency: {exception.currency || "INR"}</Badge>
                  </div>

                  <div className="flex items-center gap-4 relative">
                     <div className="flex-1 space-y-3 p-8 rounded-3xl bg-slate-50 border border-slate-100 relative group-hover:bg-white transition-colors duration-500">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sourceLabel}</div>
                        <div className="text-[44px] font-black text-slate-900 tracking-tighter leading-none">
                           {formatCurrency(details.expected_amount || exception.amount, exception.currency)}
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                           <ShieldCheck className="size-3" />
                           <span className="text-[9px] font-black uppercase tracking-widest">Integrity Locked</span>
                        </div>
                     </div>

                     <div className="flex flex-col items-center justify-center p-4">
                        <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-slate-200 font-black text-4xl border-4 border-slate-50 shadow-inner">
                           −
                        </div>
                     </div>

                     <div className={`flex-1 space-y-3 p-8 rounded-3xl border transition-all duration-500 ${isMissing ? "bg-red-50/20 border-red-100 border-dashed" : "bg-slate-50 border-slate-100 group-hover:bg-white"}`}>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{targetLabel}</div>
                        <div className={`text-[44px] font-black tracking-tighter leading-none ${isMissing ? "text-slate-200" : "text-slate-900"}`}>
                           {formatCurrency(details.actual_amount || 0, exception.currency)}
                        </div>
                        <div className="flex items-center gap-2">
                           <div className={`h-1.5 w-1.5 rounded-full ${isMissing ? "bg-red-500" : "bg-emerald-500"}`} />
                           <span className={`text-[9px] font-black uppercase tracking-widest ${isMissing ? "text-red-500" : "text-emerald-500"}`}>
                              {isMissing ? "Record Absence Detected" : "Audit Identification Strategy: " + (details.match_strategy || "Heuristic")}
                           </span>
                        </div>
                     </div>

                     <div className="translate-x-8 -translate-y-12">
                        <div className="p-8 rounded-[40px] bg-red-600 text-white shadow-2xl flex flex-col gap-1 ring-8 ring-white transform rotate-2">
                           <span className="text-[10px] font-black uppercase tracking-widest opacity-70 italic">Verified Variance</span>
                           <span className="text-4xl font-black tracking-tighter leading-none">
                              {formatCurrency(Math.abs((details.expected_amount || exception.amount) - (details.actual_amount || 0)), exception.currency)}
                           </span>
                           <div className="mt-2 h-1 w-full bg-white/20 rounded-full" />
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Evidence Comparison Ledger (100%) */}
            <div className="lg:col-span-12 space-y-8">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <Microscope className="size-5 text-slate-900" />
                     <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Granular Parameter Comparison Matrix</h4>
                  </div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Comparing {Object.keys(sourceRecord).length} Mapped Attributes</div>
               </div>

               <div className="grid grid-cols-2 divide-x divide-slate-100 bg-white border border-slate-200 rounded-[40px] overflow-hidden shadow-2xl">
                  {/* Left Column Side */}
                  <div className="flex flex-col">
                     <div className="px-8 py-5 border-b bg-slate-50 flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-900 italic">{sourceLabel}</span>
                        <div className="px-3 py-1 rounded-full bg-white border border-slate-200 text-[10px] font-black text-slate-400 uppercase">Input Registry</div>
                     </div>
                     <div className="p-0">
                        <table className="w-full text-left text-[13px]">
                           <tbody className="divide-y divide-slate-50">
                              {Object.entries(sourceRecord)
                                .filter(([k]) => k !== 'source_record' && k !== 'target_record' && k !== 'match_strategy' && !k.includes('amount'))
                                .map(([k, v], idx) => {
                                  const valStr = String(v);
                                  const isMismatch = targetRecord && targetRecord[k] !== undefined && String(targetRecord[k]) !== valStr;
                                  return (
                                    <tr key={idx} className={`group hover:bg-slate-50 transition-colors ${isMismatch ? "bg-red-50/20" : ""}`}>
                                       <td className="py-4 px-8 border-r border-slate-100 text-slate-400 uppercase text-[9px] font-black tracking-widest w-[40%] bg-white group-hover:bg-transparent">
                                          {k.replace(/_/g, ' ')}
                                       </td>
                                       <td className="py-4 px-10 font-bold tracking-tight text-slate-900 font-mono">
                                          <div className="flex items-center justify-between">
                                             <span className={`truncate max-w-[200px] ${valStr === 'null' || valStr === 'NULL' ? "text-slate-100" : ""}`}>
                                                {valStr}
                                             </span>
                                             <CopyButton text={valStr} className="opacity-0 group-hover:opacity-100 size-4 text-slate-300" />
                                          </div>
                                       </td>
                                    </tr>
                                  )
                                })
                              }
                           </tbody>
                        </table>
                     </div>
                  </div>

                  {/* Right Column Side */}
                  <div className="flex flex-col relative">
                     <div className="px-8 py-5 border-b bg-slate-50 flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-900 italic">{targetLabel}</span>
                        {!isMissing && <div className="px-3 py-1 rounded-full bg-emerald-600 text-[10px] font-black text-white uppercase shadow-lg shadow-emerald-200">Active Match</div>}
                     </div>
                     
                     {targetRecord ? (
                        <div className="p-0">
                           <table className="w-full text-left text-[13px]">
                              <tbody className="divide-y divide-slate-50">
                                 {Object.entries(targetRecord).map(([k, v], idx) => {
                                    const valStr = String(v);
                                    const isMismatch = sourceRecord[k] !== undefined && String(sourceRecord[k]) !== valStr;
                                    return (
                                       <tr key={idx} className={`group hover:bg-slate-50 transition-colors ${isMismatch ? "bg-red-50/40" : ""}`}>
                                          <td className="py-4 px-8 border-r border-slate-100 text-slate-400 uppercase text-[9px] font-black tracking-widest w-[40%] bg-white group-hover:bg-transparent">
                                             {k.replace(/_/g, ' ')}
                                          </td>
                                          <td className="py-4 px-10 font-bold tracking-tight text-slate-900 font-mono">
                                             <div className="flex items-center justify-between">
                                                <span className={`truncate max-w-[200px] uppercase ${isMismatch ? "text-red-600 font-black underline underline-offset-4 decoration-red-200" : (valStr === 'null' || valStr === 'NULL' ? "text-slate-100" : "")}`}>
                                                   {valStr}
                                                </span>
                                                <CopyButton text={valStr} className="opacity-0 group-hover:opacity-100 size-4 text-slate-300" />
                                             </div>
                                          </td>
                                       </tr>
                                    )
                                 })}
                              </tbody>
                           </table>
                        </div>
                     ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
                           <div className="h-20 w-20 rounded-[32px] bg-slate-100 border border-slate-200 flex items-center justify-center shadow-inner">
                              <FileX className="size-8 text-slate-300" />
                           </div>
                           <div className="space-y-2">
                              <p className="text-[12px] font-black text-slate-800 uppercase tracking-[0.2em] italic">Search Registry: No Hit</p>
                              <p className="text-[11px] text-slate-500 max-w-[200px] leading-relaxed mx-auto font-medium">
                                 The reconciliation engine performed inclusive heuristic scans but found no counterpart entry in the {targetLabel}.
                              </p>
                           </div>
                        </div>
                      )}
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Step Footer */}
      <footer className="px-10 py-8 bg-white border-t shrink-0 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        {isResolved ? (
          <div className="flex items-center justify-between bg-emerald-950 border border-emerald-900 rounded-[32px] px-10 py-6">
             <div className="flex items-center gap-6">
                <div className="h-14 w-14 rounded-full bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-400 rotate-12">
                   <ShieldCheck className="size-7 text-white" />
                </div>
                <div className="space-y-1">
                   <h5 className="text-[18px] font-black text-white tracking-tight italic">Audit Locked & Sequenced</h5>
                   <p className="text-[11px] text-emerald-400/80 font-black uppercase tracking-[0.15em]">Permanently cleared from the exception queue</p>
                </div>
             </div>
             <Btn variant="outline" onClick={onClose} className="h-12 px-12 bg-transparent border-emerald-800 text-white font-black uppercase text-[11px] tracking-widest hover:bg-emerald-900 transition-all active:scale-95">
                Close Record
             </Btn>
          </div>
        ) : (
          <div className="flex items-center gap-6 w-full max-w-7xl mx-auto">
            <div className="flex-1 relative group">
              <input
                type="text"
                placeholder="Declare resolution rationale for the permanent audit trail..."
                className="w-full h-16 pl-8 pr-20 text-[15px] font-black italic rounded-[24px] border-2 border-slate-100 focus:ring-4 focus:ring-slate-100 focus:border-slate-400 focus:bg-white bg-slate-50 transition-all placeholder:text-slate-300 shadow-inner"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none opacity-20 transition-all">
                <ShieldCheck className="size-5 text-slate-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol 10.1</span>
              </div>
            </div>
            <Btn
              onClick={handleResolve}
              disabled={isResolving}
              className="h-16 px-16 text-[16px] font-black tracking-tight rounded-[24px] bg-slate-900 text-white hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-4 shadow-[0_20px_40px_rgba(0,0,0,0.1)] hover:shadow-primary/20"
            >
              {isResolving ? "Processing..." : "Approve & Archive Record"}
              {!isResolving && <ArrowRight className="size-5 text-primary" />}
            </Btn>
          </div>
        )}
      </footer>
    </div>
  );
}
