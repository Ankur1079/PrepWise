import React from "react";
import { User, Cpu, Send } from "lucide-react";
import { InterviewMessage } from "../../types";

interface TranscriptPanelProps {
  messages: InterviewMessage[];
  inputText: string;
  setInputText: (val: string) => void;
  sendMessage: (e?: React.FormEvent, overrideText?: string) => Promise<void> | void;
  status: string;
  transcriptEndRef: React.RefObject<HTMLDivElement | null>;
}

export default function TranscriptPanel({
  messages,
  inputText,
  setInputText,
  sendMessage,
  status,
  transcriptEndRef,
}: TranscriptPanelProps) {
  return (
    <div className="lg:col-span-7 flex flex-col justify-between bg-neutral-900/40 rounded-2xl border border-neutral-800/80 p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-hidden h-[380px] sm:h-[450px] lg:h-auto shadow-inner">
      {/* Scrollable feed entries */}
      <div className="flex-grow overflow-y-auto space-y-4 px-1 pr-2 max-h-[250px] sm:max-h-[340px] lg:max-h-[440px]">
        {messages.map((m, idx) => {
          const isUser = m.sender === "user";
          return (
            <div
              key={m.id || idx}
              className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              <div className={`rounded-full p-2 shrink-0 shadow-sm ${isUser ? "bg-purple-600/10 border border-purple-500/20 text-purple-400" : "bg-neutral-800 text-neutral-300"}`}>
                {isUser ? <User className="h-4 w-4" /> : <Cpu className="h-4 w-4" />}
              </div>
              <div className="space-y-1.5 max-w-[80%]">
                <div className={`rounded-2xl px-4 py-3 text-sm font-normal leading-relaxed shadow-sm ${
                  isUser
                     ? "bg-purple-600/95 text-white rounded-tr-none"
                     : "bg-neutral-800/90 text-neutral-200 rounded-tl-none border border-neutral-700/40"
                }`}>
                  {m.text}
                </div>
                <p className={`text-[10px] text-neutral-550 font-mono ${isUser ? "text-right" : "text-left"}`}>
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={transcriptEndRef} />
      </div>

      {/* Message composer input section */}
      <form onSubmit={sendMessage} className="flex gap-2 items-center pt-3 border-t border-neutral-800/60">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your reply here..."
          className="flex-grow rounded-xl border border-neutral-800 bg-neutral-950/60 py-3 px-4 text-sm text-neutral-200 outline-none transition placeholder:text-neutral-600 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="rounded-xl bg-purple-600 p-3 text-white hover:bg-purple-500 transition hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 disabled:pointer-events-none cursor-pointer shadow-md shadow-purple-600/15"
        >
          <Send className="h-4.5 w-4.5" />
        </button>
      </form>
    </div>
  );
}
