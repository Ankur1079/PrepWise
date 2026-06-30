import React from "react";
import { Sparkles } from "lucide-react";
import { auth } from "../../firebase";
import { InterviewSession } from "../../types";

interface TrialBannerProps {
  interviews: InterviewSession[];
  onShowAuth: () => void;
}

export default function TrialBanner({ interviews, onShowAuth }: TrialBannerProps) {
  if (auth.currentUser) return null;

  return (
    <div className="rounded-2xl border border-dashed border-purple-500/35 bg-purple-950/5 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-purple-500/5">
      <div className="space-y-1 text-left min-w-0 flex-1">
        <h4 className="text-xs sm:text-sm font-bold text-neutral-100 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-400 animate-pulse shrink-0" />
          <span>Guest Trial Tracker: {Math.max(0, 3 - interviews.length)} of 3 Free Interviews Left</span>
        </h4>
        <p className="text-neutral-400 text-[11px] sm:text-xs leading-relaxed max-w-3xl">
          Preparing as Guest. Start mock sessions to evaluate competence. Register a free account to persist evaluations permanently and view progress.
        </p>
      </div>
      <button
        onClick={onShowAuth}
        className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold text-[11px] sm:text-xs text-white shadow-lg shadow-purple-600/15 cursor-pointer shrink-0 transition"
      >
        Sign Up / Login
      </button>
    </div>
  );
}
