import React from "react";
import { PlusSquare } from "lucide-react";
import { InterviewTemplate } from "../../types";

interface DashboardBannerProps {
  onCustomConfig: () => void;
  onFastSession: () => void;
  defaultTemplates: InterviewTemplate[];
}

export default function DashboardBanner({
  onCustomConfig,
  onFastSession,
  defaultTemplates,
}: DashboardBannerProps) {
  return (
    <div className="relative rounded-3xl border border-neutral-900 bg-gradient-to-r from-purple-950/20 via-indigo-950/20 to-neutral-900/40 p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
      {/* Subtle ambient light source */}
      <div className="absolute -top-24 -left-20 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-20 w-80 h-80 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

      <div className="space-y-5 max-w-xl text-center md:text-left z-10">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold tracking-tight leading-tight text-neutral-50">
          Get Interview-Ready with AI-Powered Practice & Feedback
        </h1>
        <p className="text-sm sm:text-base text-neutral-400 leading-relaxed font-normal">
          Practice real interview questions & get instant feedback. Connect via voice simulations and let PrepWise assess your performance in real time.
        </p>
        <div className="flex flex-row gap-2.5 pt-3 w-full sm:w-auto justify-center md:justify-start">
          <button
            onClick={onCustomConfig}
            className="flex-1 sm:flex-initial rounded-xl bg-purple-600 px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-purple-500 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-600/20"
          >
            <PlusSquare className="h-4 w-4 shrink-0" />
            <span className="truncate">Start Interview</span>
          </button>
          
          <button
            onClick={onFastSession}
            className="flex-1 sm:flex-initial rounded-xl bg-neutral-900 border border-neutral-800/85 hover:bg-neutral-800 hover:text-white hover:border-neutral-700 px-4 sm:px-5 py-3 text-xs sm:text-sm font-semibold text-neutral-300 transition cursor-pointer shadow-sm"
          >
            Try Fast Session
          </button>
        </div>
      </div>

      {/* Futuristic CSS Artwork representing laptop and coding badges */}
      <div className="relative h-60 w-full md:w-[340px] shrink-0 flex items-center justify-center select-none z-10 animate-float-laptop scale-75 sm:scale-90 md:scale-100 transition-transform duration-500">
        {/* Rotating Words orbiting over the computer */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute animate-orbit-tag-1 bg-purple-500/25 border border-purple-400/60 text-purple-100 font-mono text-[11px] font-extrabold px-2.5 py-1.5 rounded-md backdrop-blur-sm shadow-lg">
            System Design 🧠
          </div>
          <div className="absolute animate-orbit-tag-2 bg-emerald-500/25 border border-emerald-400/60 text-emerald-100 font-mono text-[11px] font-extrabold px-2.5 py-1.5 rounded-md backdrop-blur-sm shadow-lg">
            Algorithms ⚡
          </div>
          <div className="absolute animate-orbit-tag-3 bg-blue-500/25 border border-blue-400/60 text-blue-100 font-mono text-[11px] font-extrabold px-2.5 py-1.5 rounded-md backdrop-blur-sm shadow-lg">
            React JS 🌐
          </div>
          <div className="absolute animate-orbit-tag-4 bg-amber-500/25 border border-amber-400/60 text-amber-100 font-mono text-[11px] font-extrabold px-2.5 py-1.5 rounded-md backdrop-blur-sm shadow-lg">
            Behavioral 👥
          </div>
          <div className="absolute animate-orbit-tag-5 bg-indigo-500/25 border border-indigo-400/60 text-indigo-100 font-mono text-[11px] font-extrabold px-2.5 py-1.5 rounded-md backdrop-blur-sm shadow-lg">
            SQL Databases 🗄️
          </div>
          <div className="absolute animate-orbit-tag-6 bg-teal-500/25 border border-teal-400/60 text-teal-100 font-mono text-[11px] font-extrabold px-2.5 py-1.5 rounded-md backdrop-blur-sm shadow-lg">
            Mock Coding 💻
          </div>
        </div>

        {/* Glowing Laptop Stand */}
        <div className="h-32 w-52 rounded-2xl bg-neutral-900 border-2 border-neutral-800 shadow-2xl relative flex flex-col justify-between p-3 overflow-hidden z-20">
          {/* Top bezel or screen camera */}
          <div className="flex justify-center gap-1 items-center pb-1">
            <div className="h-1 w-1 bg-neutral-700 rounded-full" />
            <div className="h-1 w-1 bg-blue-500 rounded-full animate-pulse" />
          </div>

          {/* Computer Screen Display with code lines and scanline */}
          <div className="relative flex-grow rounded-lg bg-neutral-950 border border-neutral-800/80 overflow-hidden flex flex-col p-1.5 text-[8px] font-mono leading-tight text-emerald-500/80">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent animate-scanline pointer-events-none" />
            
            {/* Simulated code editor header */}
            <div className="flex items-center gap-1 border-b border-neutral-900 pb-1 mb-1 text-[7px] text-neutral-500">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/60" />
              <span className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
              <span className="ml-1 text-neutral-400">interviewer.py</span>
            </div>

            <div className="space-y-0.5 tracking-wide overflow-hidden select-none">
              <p className="text-purple-400">import <span className="text-white">genai</span></p>
              <p className="text-blue-400">class <span className="text-yellow-400">PrepWiseMock</span>:</p>
              <p className="text-neutral-500">  # listening for audio...</p>
              <p className="text-neutral-400">  def <span className="text-emerald-400">evaluate_candidate</span>(user):</p>
              <p className="text-purple-400">    return <span className="text-indigo-400">"Excellent"</span></p>
            </div>

            {/* Simulated dynamic microphone waveform in screen footer */}
            <div className="absolute bottom-1 right-2 flex items-end gap-0.5 h-3">
              <span className="w-0.5 bg-purple-500 animate-pulse" style={{ height: '40%' }} />
              <span className="w-0.5 bg-indigo-500 animate-pulse" style={{ height: '80%', animationDelay: '150ms' }} />
              <span className="w-0.5 bg-emerald-500 animate-pulse" style={{ height: '50%', animationDelay: '300ms' }} />
            </div>
          </div>

          <div className="w-full h-1 bg-neutral-800 rounded-full mt-1.5" />
        </div>

        {/* Laptop Base Plate */}
        <div className="absolute bottom-12 h-2.5 w-60 bg-neutral-800 rounded-full border-t border-neutral-700 shadow-xl z-20 flex justify-center">
          {/* Keyboard groove asset */}
          <div className="w-20 h-1 bg-neutral-950 rounded-b-md" />
        </div>
        {/* Subtle glow sphere */}
        <div className="absolute bottom-9 h-1 w-32 bg-gradient-to-r from-purple-500/50 to-indigo-500/50 rounded-full blur-xs opacity-50 z-10" />
      </div>
    </div>
  );
}
