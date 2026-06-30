import React, { useEffect, useState } from "react";

interface AudioVisualizerProps {
  isSpeaking: boolean;
  isListening: boolean;
  isSilent: boolean;
  userVolume?: number;
}

export default function AudioVisualizer({
  isSpeaking,
  isListening,
  isSilent,
  userVolume = 0,
}: AudioVisualizerProps) {
  const [bars, setBars] = useState<number[]>(new Array(18).fill(10));

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSpeaking || isListening) {
      interval = setInterval(() => {
        setBars(
          new Array(18).fill(0).map(() => {
            if (isSpeaking) {
              const min = 15;
              const max = 80;
              return Math.floor(Math.random() * (max - min)) + min;
            } else {
              // isListening: Scale based on actual userVolume (micLevel)
              const volume = userVolume;
              // Base height (ambient fluid movement even when silent)
              const baseMin = 6;
              const baseMax = 12;
              const base = Math.floor(Math.random() * (baseMax - baseMin)) + baseMin;
              // Scale volume component (volume goes from 0 to 100)
              const scaled = Math.min(75, Math.floor((volume / 100) * 65));
              // Combined height
              return base + scaled;
            }
          })
        );
      }, 90);
    } else {
      setBars(new Array(18).fill(8));
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSpeaking, isListening, isSilent, userVolume]);

  return (
    <div className="flex items-center justify-center gap-0.5 sm:gap-1 h-24 sm:h-32 w-full max-w-sm rounded-xl bg-neutral-900/40 border border-neutral-800/40 px-4 sm:px-6 backdrop-blur-sm">
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
            className={`w-1.5 sm:w-2.5 rounded-full transition-all duration-100 ${barColor}`}
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
