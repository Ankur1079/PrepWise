import React from "react";
import { RefreshCw } from "lucide-react";

interface EvaluatingStateProps {
  evalProgress: number;
  evalPhase: string;
}

export default function EvaluatingState({ evalProgress, evalPhase }: EvaluatingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-grow py-24 space-y-8">
      <div className="relative p-8 flex flex-col items-center justify-center bg-neutral-900/50 border border-neutral-800 rounded-2xl w-full max-w-lg text-center py-12 shadow-2xl">
        <RefreshCw className="h-14 w-14 text-orange-400 animate-spin mb-5" />
        <h3 className="text-2xl font-display font-extrabold text-neutral-150">Synthesizing Feedback Report</h3>
        <p className="text-sm text-orange-400 font-mono text-[11px] uppercase tracking-wider mb-2.5 animate-pulse">
          {evalProgress}% Completed
        </p>
        <p className="text-xs text-neutral-400 min-h-[36px] max-w-sm leading-relaxed italic">
          "{evalPhase}"
        </p>
        <div className="w-full bg-neutral-950 rounded-full h-2 mt-6 overflow-hidden border border-neutral-800">
          <div 
            className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 h-full transition-all duration-300 rounded-full" 
            style={{ width: `${evalProgress}%` }} 
          />
        </div>
      </div>
    </div>
  );
}
