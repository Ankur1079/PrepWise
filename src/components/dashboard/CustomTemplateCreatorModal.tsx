import React, { useState } from "react";
import { PlusSquare, RefreshCw } from "lucide-react";

interface CustomTemplateCreatorModalProps {
  onClose: () => void;
  onSave: (role: string, topic: string, desc: string, icon: string) => Promise<void>;
}

export default function CustomTemplateCreatorModal({ onClose, onSave }: CustomTemplateCreatorModalProps) {
  const [newTemplateRole, setNewTemplateRole] = useState("");
  const [newTemplateTopic, setNewTemplateTopic] = useState("");
  const [newTemplateDesc, setNewTemplateDesc] = useState("");
  const [newTemplateIcon, setNewTemplateIcon] = useState("Custom");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateRole.trim() || !newTemplateTopic.trim() || !newTemplateDesc.trim()) {
      alert("Please fill in all the fields.");
      return;
    }

    setIsSavingTemplate(true);
    try {
      await onSave(
        newTemplateRole.trim(),
        newTemplateTopic.trim(),
        newTemplateDesc.trim(),
        newTemplateIcon.trim() || "Custom"
      );
      onClose();
    } catch (err: any) {
      console.error("Failed to save custom template:", err);
      alert("Error saving template: " + (err.message || err));
    } finally {
      setIsSavingTemplate(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-md">
      <div className="w-full max-w-md rounded-3xl border border-neutral-800 bg-neutral-900 p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="space-y-2">
          <h3 className="text-xl font-display font-bold text-neutral-100 flex items-center gap-2">
            <PlusSquare className="h-5.5 w-5.5 text-purple-400" />
            <span>Create Custom Template</span>
          </h3>
          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
            Add a new persistent practice template to your templates collection.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
              Target Job Position / Role
            </label>
            <input
              type="text"
              required
              value={newTemplateRole}
              onChange={(e) => setNewTemplateRole(e.target.value)}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950/60 py-2.5 px-3 text-xs text-neutral-200 outline-none transition focus:border-purple-500/50"
              placeholder="e.g. React Native Developer"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
              Target Topic Focus
            </label>
            <input
              type="text"
              required
              value={newTemplateTopic}
              onChange={(e) => setNewTemplateTopic(e.target.value)}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950/60 py-2.5 px-3 text-xs text-neutral-200 outline-none transition focus:border-purple-500/50"
              placeholder="e.g. Native Bridges & Threading"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
              Template Description
            </label>
            <textarea
              required
              rows={3}
              value={newTemplateDesc}
              onChange={(e) => setNewTemplateDesc(e.target.value)}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950/60 py-2.5 px-3 text-xs text-neutral-200 outline-none transition focus:border-purple-500/50 resize-none"
              placeholder="Brief summary of what this practice session targets..."
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
              Visual Badge (Icon)
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={newTemplateIcon}
              onChange={(e) => setNewTemplateIcon(e.target.value)}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950/60 py-2.5 px-3 text-xs text-neutral-200 outline-none transition focus:border-purple-500/50"
              placeholder="e.g. REACT, JS, iOS, DB, CUSTOM"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 rounded-lg bg-neutral-800 hover:bg-neutral-700 py-3.5 text-xs font-semibold text-neutral-300 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingTemplate}
              className="w-1/2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 py-3.5 text-xs font-semibold text-white transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isSavingTemplate && <RefreshCw className="h-3 w-3 animate-spin" />}
              <span>{isSavingTemplate ? "Saving..." : "Create Template"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
