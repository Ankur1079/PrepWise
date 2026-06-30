import React from "react";
import { Award, Calendar, ArrowUpRight, RefreshCw } from "lucide-react";
import { InterviewSession, InterviewFeedback } from "../../types";

interface InterviewHistoryProps {
  interviews: InterviewSession[];
  loading: boolean;
  onViewFeedback: (feedback: InterviewFeedback, role: string, topic: string, difficulty: string) => void;
}

export default function InterviewHistory({
  interviews,
  loading,
  onViewFeedback,
}: InterviewHistoryProps) {
  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-display font-extrabold tracking-tight text-neutral-100">Your Interviews</h2>
      
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10 text-sm text-neutral-400">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2.5 text-neutral-500" />
            <span>Loading complete transcripts...</span>
          </div>
        ) : interviews.length === 0 ? (
          <div className="rounded-2xl border border-neutral-900 bg-neutral-900/10 p-8 text-center text-sm text-neutral-400 max-w-sm mx-auto">
            No mock interviews registered yet. Compile a customized set or template from above to begin.
          </div>
        ) : (
          interviews.map((session) => (
            <div
              key={session.id}
              className="rounded-2xl border border-neutral-900 bg-neutral-900/15 p-4 sm:p-5 hover:border-neutral-800 hover:bg-neutral-900/25 transition duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex flex-row items-start gap-3.5 w-full min-w-0">
                <div className="rounded-xl bg-purple-500/10 p-2.5 sm:p-3 text-purple-400 shrink-0 border border-purple-500/15">
                  <Award className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-purple-400 font-mono">
                    {session.difficulty} • {session.role}
                  </h4>
                  <h3 className="text-sm sm:text-base font-display font-bold text-neutral-150 truncate">
                    Topic Focus: <span className="text-neutral-200">{session.topic}</span>
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs text-neutral-500">
                    <span className="flex items-center gap-1 shrink-0">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(session.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </span>
                    <span>•</span>
                    <span className="shrink-0">Duration: {Math.floor((session.duration || 0) / 60)}m {(session.duration || 0) % 60}s</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 w-full sm:w-auto">
                {session.score !== undefined && (
                  <div className="text-right">
                    <span className="rounded-xl bg-purple-500/10 border border-purple-500/25 px-3 py-1.5 text-sm font-black text-purple-400 font-mono">
                      {session.score}%
                    </span>
                  </div>
                )}

                {session.feedback && (
                  <button
                    onClick={() => onViewFeedback(session.feedback!, session.role, session.topic, session.difficulty)}
                    className="rounded-xl border border-neutral-800 hover:bg-purple-600 hover:border-transparent px-4 py-3 text-sm font-semibold text-neutral-300 hover:text-white transition flex items-center gap-2 cursor-pointer"
                  >
                    <span>Analyze Feedback</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
