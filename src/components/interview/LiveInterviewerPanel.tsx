import React from "react";
import { Mic, MicOff, ArrowRight, Cpu } from "lucide-react";
import AudioVisualizer from "../AudioVisualizer";

interface LiveInterviewerPanelProps {
  isAiSpeaking: boolean;
  isListening: boolean;
  micLevel: number;
  isAutoSending: boolean;
  handsFree: boolean;
  setHandsFree: (val: boolean) => void;
  micActive: boolean;
  micError: string | null;
  fallbackCountdown: number | null;
  setFallbackCountdown: (val: number | null) => void;
  mode: "live" | "standard";
  setMode: (val: "live" | "standard") => void;
  toggleMic: () => Promise<void> | void;
  finishInterview: () => Promise<void> | void;
  onClearAutoSubmit: () => void;
}

export default function LiveInterviewerPanel({
  isAiSpeaking,
  isListening,
  micLevel,
  isAutoSending,
  handsFree,
  setHandsFree,
  micActive,
  micError,
  fallbackCountdown,
  setFallbackCountdown,
  mode,
  setMode,
  toggleMic,
  finishInterview,
  onClearAutoSubmit,
}: LiveInterviewerPanelProps) {
  return (
    <div className="lg:col-span-5 flex flex-col justify-between items-center bg-neutral-900/40 rounded-2xl border border-neutral-800/80 p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="text-center space-y-1">
        <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-3.5 py-1 text-xs font-semibold text-purple-400 font-mono">
          Live AI Assistant
        </span>
        <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1.5 font-bold">PrepWise Voice-Ready Agent</p>
      </div>

      {/* Simulated Animated Portal */}
      <div className="relative flex items-center justify-center h-32 w-32 sm:h-44 sm:w-44">
        <div
          className={`absolute inset-0 rounded-full border border-purple-500/10 scale-[1.3] transition-transform duration-500 ${
            isAiSpeaking ? "animate-ping opacity-60" : ""
          }`}
        />
        <div
          className={`absolute inset-0 rounded-full border border-teal-500/10 scale-[1.1] transition-transform duration-500 ${
            isListening ? "animate-pulse" : ""
          }`}
        />

        <div className="relative h-20 w-20 sm:h-28 sm:w-28 rounded-full bg-neutral-950 border-2 border-neutral-800 flex items-center justify-center shadow-xl overflow-hidden">
          <Cpu className={`h-8 w-8 sm:h-12 sm:w-12 text-purple-400 ${isAiSpeaking ? "scale-110 rotate-12 transition-transform" : ""}`} />
        </div>
      </div>

      {/* Audio frequency wave simulation */}
      <AudioVisualizer isSpeaking={isAiSpeaking} isListening={isListening} isSilent={!isAiSpeaking && !isListening} userVolume={micLevel} />

      <div className="w-full text-center space-y-2.5">
        <p className="text-sm font-semibold text-neutral-200">
          {isAiSpeaking
            ? "AI Interviewer is speaking..."
            : isAutoSending
            ? "Silence detected! Sending reply..."
            : isListening
            ? "Listening to Candidate's response..."
            : "Microphone Silent. Tap button below to speak."}
        </p>
        {isListening && handsFree && (
          <span className="inline-flex items-center gap-1.5 text-xs text-green-400 bg-green-950/20 border border-green-500/20 px-3 py-1 rounded-full animate-pulse mx-auto font-mono">
            ● Hands-free Mode Active (AI responds on pause)
          </span>
        )}
        {micError && (
          <div className="flex flex-col gap-2.5 max-w-xs mx-auto text-left">
            <p className="text-xs text-red-400 bg-red-950/30 border border-red-500/20 rounded-xl px-3 py-2.5 leading-relaxed select-text">
              {micError}
            </p>
            
            {fallbackCountdown !== null && (
              <div className="bg-amber-950/40 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-350 flex flex-col gap-2">
                <span className="font-semibold flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  Auto-switching to Standard mode in {fallbackCountdown}s...
                </span>
                <button
                  onClick={() => setFallbackCountdown(null)}
                  className="text-left text-[10px] text-amber-400 hover:text-amber-300 hover:underline cursor-pointer select-none font-medium outline-none"
                >
                  [Cancel and stay on this error screen]
                </button>
              </div>
            )}
            
            {mode === "live" && (
              <button
                onClick={() => {
                  setMode("standard");
                  setFallbackCountdown(null);
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 active:bg-amber-700 rounded-xl transition-all shadow-md cursor-pointer text-center"
              >
                💡 Switch to Standard (STT) Fallback Mode
              </button>
            )}

            <a
              href={window.location.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-neutral-300 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-900 rounded-xl transition-all shadow-md cursor-pointer text-center"
            >
              ⚡ Open in New Tab (Bypasses Frame Limits) ↗
            </a>
          </div>
        )}
        {!(window as any).SpeechRecognition && !(window as any).webkitSpeechRecognition && (
          <p className="text-xs text-yellow-550 leading-relaxed max-w-xs mx-auto">
            Vocal capture is optimized in Chrome/Edge. In other browsers, type your replies on the right.
          </p>
        )}
      </div>

      {/* Hands-Free Auto-Send Toggle */}
      {micActive && (
        <label className="flex items-center gap-3 text-sm font-medium text-neutral-400 select-none cursor-pointer bg-neutral-950/40 px-4 py-2.5 rounded-xl border border-neutral-800/80 hover:border-purple-500/30 transition shadow-inner">
          <input
            type="checkbox"
            checked={handsFree}
            onChange={(e) => {
              setHandsFree(e.target.checked);
              if (!e.target.checked) {
                onClearAutoSubmit();
              }
            }}
            className="rounded border-neutral-700 bg-neutral-900 text-purple-600 focus:ring-purple-500/30 h-4 w-4 cursor-pointer"
          />
          <span className="flex flex-col text-left">
            <span className="text-neutral-200">Hands-Free Conversation</span>
            <span className="text-xs text-neutral-500 font-normal">Auto-send reply on pause</span>
          </span>
        </label>
      )}

      {/* Bottom Vocal Sync Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full justify-center">
        <button
          onClick={toggleMic}
          className={`flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border text-sm font-semibold hover:scale-[1.01] transition-all cursor-pointer shadow-sm w-full sm:w-auto ${
            micActive
              ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/30"
              : "bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700"
          }`}
        >
          {micActive ? <Mic className="h-4.5 w-4.5 animate-bounce" /> : <MicOff className="h-4.5 w-4.5" />}
          <span>{micActive ? "Microphone ON" : "Turn Voice ON"}</span>
        </button>

        <button
          onClick={finishInterview}
          className="bg-purple-600 hover:bg-purple-500 text-white border border-transparent hover:scale-[1.01] transition-all px-5 py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-purple-600/15 w-full sm:w-auto"
        >
          <span>End Call & Evaluate</span>
          <ArrowRight className="h-4.5 w-4.5" />
        </button>
      </div>
    </div>
  );
}
