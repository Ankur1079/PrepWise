import React, { useState } from "react";
import { Sliders } from "lucide-react";

interface CustomInterviewPlannerModalProps {
  onClose: () => void;
  onLaunch: (role: string, topic: string, difficulty: "Entry Level" | "Mid Level" | "Senior Level") => void;
}

export default function CustomInterviewPlannerModal({ onClose, onLaunch }: CustomInterviewPlannerModalProps) {
  const [customRole, setCustomRole] = useState("Software Engineer");
  const [customTopic, setCustomTopic] = useState("System Architecture");
  const [customDifficulty, setCustomDifficulty] = useState<"Entry Level" | "Mid Level" | "Senior Level">("Mid Level");

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-md">
      <div className="w-full max-w-md rounded-3xl border border-neutral-800 bg-neutral-900 p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="space-y-2">
          <h3 className="text-xl font-display font-bold text-neutral-100 flex items-center gap-2">
            <Sliders className="h-5.5 w-5.5 text-purple-400" />
            <span>Custom Interview Planner</span>
          </h3>
          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
            Coordinate custom criteria to conduct target practice interviews for specific positions.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
              Target Job Position Role
            </label>
            <input
              type="text"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950/60 py-2.5 px-3 text-xs text-neutral-200 outline-none transition focus:border-purple-500/50"
              placeholder="e.g. Senior Machine Learning Engineer"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
              Target Topic Focus
            </label>
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950/60 py-2.5 px-3 text-xs text-neutral-200 outline-none transition focus:border-purple-500/50"
              placeholder="e.g. Transformers & Vector Databases"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
              Experience Seniority Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["Entry Level", "Mid Level", "Senior Level"] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setCustomDifficulty(level)}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold hover:border-purple-500/50 transition cursor-pointer ${
                    customDifficulty === level
                      ? "bg-purple-600/15 border-purple-500/40 text-purple-400"
                      : "bg-neutral-950/50 border-neutral-800 text-neutral-500"
                  }`}
                >
                  {level.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="w-1/2 rounded-lg bg-neutral-800 hover:bg-neutral-700 py-3.5 text-xs font-semibold text-neutral-300 transition cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => onLaunch(customRole, customTopic, customDifficulty)}
            className="w-1/2 rounded-lg bg-purple-600 hover:bg-purple-500 py-3.5 text-xs font-semibold text-white transition cursor-pointer"
          >
            Launch Interview
          </button>
        </div>
      </div>
    </div>
  );
}
