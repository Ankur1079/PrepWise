import React, { useEffect, useState } from "react";

interface AudioVisualizerProps {
  isSpeaking: boolean;
  isListening: boolean;
  isSilent: boolean;
}

export default function AudioVisualizer({
  isSpeaking,
  isListening,
  isSilent,
}: AudioVisualizerProps) {
  const [bars, setBars] = useState<number[]>(new Array(18).fill(10));

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSpeaking || isListening) {
      interval = setInterval(() => {
        setBars(
          new Array(18).fill(0).map(() => {
            const min = isSpeaking ? 15 : 10;
            const max = isSpeaking ? 80 : 50;
            return Math.floor(Math.random() * (max - min)) + min;
          })
        );
      }, 90);
    } else {
      setBars(new Array(18).fill(8));
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSpeaking, isListening, isSilent]);

  return (
    <div className="flex items-center justify-center gap-1 h-32 w-full max-w-sm rounded-xl bg-neutral-900/40 border border-neutral-800/40 px-6 backdrop-blur-sm">
      {bars.map((height, idx) => {
        let barColor = "bg-purple-500/40";
        if (isSpeaking) {
          barColor = "bg-gradient-to-t from-purple-500 to-indigo-400";
        } else if (isListening) {
          barColor = "bg-gradient-to-t from-emerald-500 to-teal-400";
        } else if (isSilent) {
          barColor = "bg-neutral-700";
        }

        return (
          <div
            key={idx}
            className={`w-2.5 rounded-full transition-all duration-100 ${barColor}`}
            style={{
              height: `${Math.max(6, height)}%`,
              transform: isSilent ? "scaleY(1)" : `scaleY(${1 + (Math.sin(idx * 0.4) * 0.15)})`,
            }}
          />
        );
      })}
    </div>
  );
}
