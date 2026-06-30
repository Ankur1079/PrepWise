import React from "react";
import { Cpu } from "lucide-react";

interface ConnectingStateProps {
  topic: string;
}

export default function ConnectingState({ topic }: ConnectingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-grow py-24 space-y-5">
      <div className="relative flex items-center justify-center">
        <div className="absolute h-20 w-20 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        <div className="h-12 w-12 rounded-full bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-600/20">
          <Cpu className="h-6 w-6 text-white" />
        </div>
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-display font-bold text-neutral-100">Connecting Secure Channels...</h3>
        <p className="text-sm text-neutral-400 max-w-sm leading-relaxed">
          PrepWise AI model evaluator is compiling target parameters for {topic}. Please stay online.
        </p>
      </div>
    </div>
  );
}
