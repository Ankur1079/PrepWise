import React from "react";
import { PlusSquare, ChevronRight, Trash2 } from "lucide-react";
import { InterviewTemplate } from "../../types";

interface PracticeTemplatesProps {
  defaultTemplates: InterviewTemplate[];
  customTemplates: InterviewTemplate[];
  onTemplateClick: (template: InterviewTemplate) => void;
  onDeleteTemplate: (templateId: string, e: React.MouseEvent) => void;
  onCreateTemplate: () => void;
}

export default function PracticeTemplates({
  defaultTemplates,
  customTemplates,
  onTemplateClick,
  onDeleteTemplate,
  onCreateTemplate,
}: PracticeTemplatesProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-2xl font-display font-extrabold tracking-tight text-neutral-100">Practice Templates</h2>
        <button
          onClick={onCreateTemplate}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold text-xs text-white shadow-lg shadow-purple-600/15 cursor-pointer flex items-center justify-center gap-2 transition"
        >
          <PlusSquare className="h-4 w-4" />
          <span>Create Custom Template</span>
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
        {[...defaultTemplates, ...customTemplates].map((item) => {
          const isCustom = !defaultTemplates.some((t) => t.id === item.id);
          return (
            <div
              key={item.id}
              className="rounded-2xl border border-neutral-900 bg-neutral-900/15 p-5 flex flex-col justify-between hover:border-purple-500/25 hover:bg-neutral-900/30 transition duration-300 group cursor-pointer"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-purple-500/10 border border-purple-500/25 px-2.5 py-1 text-xs font-semibold text-purple-400 capitalize">
                    {item.role}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-neutral-600 font-mono tracking-wider">{item.icon}</span>
                    {isCustom && (
                      <button
                        onClick={(e) => onDeleteTemplate(item.id, e)}
                        title="Delete custom template"
                        className="p-1 rounded-md text-neutral-500 hover:text-red-400 hover:bg-neutral-850 transition cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-base font-display font-bold text-neutral-250 leading-snug group-hover:text-purple-400 transition duration-200 flex flex-wrap items-center gap-1.5">
                    <span>{item.topic}</span>
                    {isCustom && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-bold border border-neutral-750 uppercase tracking-wider scale-90 inline-block">
                        Custom
                      </span>
                    )}
                  </h4>
                  <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed mt-2">{item.description}</p>
                </div>
              </div>

              <button
                onClick={() => onTemplateClick(item)}
                className="w-full mt-5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white px-4 py-3 text-sm font-semibold text-center hover:bg-purple-600 hover:border-purple-600 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Start Practice</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
