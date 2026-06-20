import React from "react";
import { InterviewFeedback } from "../types";
import {
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  ArrowLeft,
  Award,
  TrendingUp,
  MessageSquare,
  Compass,
} from "lucide-react";

interface FeedbackViewProps {
  feedback: InterviewFeedback;
  role: string;
  topic: string;
  difficulty: string;
  onBack: () => void;
}

export default function FeedbackView({
  feedback,
  role,
  topic,
  difficulty,
  onBack,
}: FeedbackViewProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    if (score >= 55) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    return "text-red-400 border-red-500/30 bg-red-500/10";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 55) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 text-neutral-200">
      {/* Top action header */}
      <div className="flex items-center justify-between border-b border-neutral-900 pb-5">
        <div className="space-y-1.5">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition group mb-1 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-neutral-100">Full Interview Assessment</h1>
          <p className="text-sm sm:text-base text-neutral-400">
            Performance breakdown for <span className="text-purple-400 font-semibold">{difficulty} {role}</span> focusing on <span className="text-purple-400 font-semibold">{topic}</span>
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className={`flex flex-col items-center justify-center rounded-2xl border p-4 sm:p-5 text-center shadow-lg ${getScoreColor(feedback.overallScore)}`}>
            <span className="text-3xl sm:text-4xl font-black font-mono">{feedback.overallScore}</span>
            <span className="text-[10px] uppercase font-bold tracking-widest mt-1 text-neutral-400 font-mono">Overall Score</span>
          </div>
        </div>
      </div>

      {/* Grid: 3 main score vectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          {
            title: "Technical Skills",
            score: feedback.technicalScore,
            desc: "Assessment of system/API logic understand, coding facts, and theoretical depth.",
            icon: Award,
          },
          {
            title: "Vocal & Communication Clarity",
            score: feedback.communicationScore,
            desc: "Pacing, articulate structure, brevity, and focus when responding during vocal simulations.",
            icon: MessageSquare,
          },
          {
            title: "Structural Problem Solving",
            score: feedback.problemSolvingScore,
            desc: "Logical breakdown, edge casing, and efficiency metrics in solutions described.",
            icon: TrendingUp,
          },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-neutral-800/80 bg-neutral-900/50 p-6 space-y-4 shadow-sm hover:border-neutral-800 transition duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-xl bg-neutral-800 p-2.5 text-purple-400">
                    <Icon className="h-5.5 w-5.5" />
                  </div>
                  <h3 className="font-display font-bold text-neutral-150 text-base">{item.title}</h3>
                </div>
                <span className={`rounded-xl px-3 py-1 text-sm font-extrabold font-mono ${getScoreColor(item.score)}`}>
                  {item.score}/100
                </span>
              </div>
              <p className="text-sm text-neutral-400 leading-relaxed font-normal">{item.desc}</p>
              {/* Scale track indicator */}
              <div className="h-2 w-full rounded-full bg-neutral-950 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getScoreBg(item.score)}`}
                  style={{ width: `${item.score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Strengths versus Growth segments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 sm:p-7 space-y-5 shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-neutral-900 pb-3">
            <CheckCircle className="h-6 w-6 text-emerald-400 shrink-0" />
            <h2 className="text-lg font-display font-extrabold text-neutral-100">Key Strengths Demonstrated</h2>
          </div>
          <ul className="space-y-4">
            {feedback.positives.map((pos, idx) => (
              <li key={idx} className="flex gap-2.5 text-sm text-neutral-350 leading-relaxed items-start">
                <div className="h-2 w-2 rounded-full bg-emerald-400 mt-2 shrink-0 animate-pulse" />
                <span>{pos}</span>
              </li>
            ))}
            {feedback.positives.length === 0 && (
              <p className="text-xs text-neutral-500 italic">No specific strengths listed.</p>
            )}
          </ul>
        </div>

        {/* Growth points */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 sm:p-7 space-y-5 shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-neutral-900 pb-3">
            <AlertTriangle className="h-6 w-6 text-amber-400 animate-pulse shrink-0" />
            <h2 className="text-lg font-display font-extrabold text-neutral-100">Target Actionable Improvements</h2>
          </div>
          <ul className="space-y-4">
            {feedback.improvements.map((imp, idx) => (
              <li key={idx} className="flex gap-2.5 text-sm text-neutral-350 leading-relaxed items-start">
                <div className="h-2 w-2 rounded-full bg-amber-400 mt-2 shrink-0" />
                <span>{imp}</span>
              </li>
            ))}
            {feedback.improvements.length === 0 && (
              <p className="text-xs text-neutral-500 italic">No target improvements requested.</p>
            )}
          </ul>
        </div>
      </div>

      {/* Narrative report block */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 sm:p-7 space-y-5 shadow-sm leading-relaxed">
        <h2 className="text-lg font-display font-extrabold text-neutral-100 border-b border-neutral-900 pb-3 flex items-center gap-2">
          <Award className="h-6 w-6 text-purple-400 shrink-0" />
          <span>Synthesis & Analytical Verdict Assessment</span>
        </h2>
        <div className="text-sm sm:text-base text-neutral-300 space-y-4.5 whitespace-pre-line leading-relaxed">
          {feedback.detailedAnalysis}
        </div>
      </div>

      {/* Recommended study and materials */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 sm:p-7 space-y-5 shadow-sm leading-relaxed">
        <h2 className="text-lg font-display font-extrabold text-neutral-100 border-b border-neutral-900 pb-3 flex items-center gap-2">
          <Compass className="h-6 w-6 text-indigo-400 shrink-0" />
          <span>Mastery Curriculum & Practice Guidelines</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {feedback.suggestedResources.map((res, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 hover:border-purple-500/30 transition duration-300 flex gap-3.5 items-start group shadow-sm"
            >
              <Lightbulb className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest font-mono">Concept {idx + 1}</h4>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-semibold group-hover:text-white transition">
                  {res}
                </p>
              </div>
            </div>
          ))}
          {feedback.suggestedResources.length === 0 && (
            <p className="text-xs text-neutral-500 italic text-center col-span-3 py-4">No specific study materials listed.</p>
          )}
        </div>
      </div>

      {/* Bottom Button */}
      <div className="flex justify-center border-t border-neutral-900 pt-6">
        <button
          onClick={onBack}
          className="rounded-xl bg-neutral-800 border border-neutral-700 hover:border-transparent px-8 py-3 text-sm font-semibold hover:bg-neutral-700 hover:text-white transition-all cursor-pointer shadow-md hover:scale-[1.01]"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
