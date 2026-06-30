import React, { useState, useEffect } from "react";
import { Database } from "lucide-react";
import { UserProfile } from "../../types";

interface ApiSettingsModalProps {
  profile: UserProfile | null;
  onClose: () => void;
  onSave: (name: string, geminiEmail: string, geminiApiKey: string) => Promise<void>;
}

export default function ApiSettingsModal({ profile, onClose, onSave }: ApiSettingsModalProps) {
  const [editName, setEditName] = useState("");
  const [editGeminiEmail, setEditGeminiEmail] = useState("");
  const [editGeminiApiKey, setEditGeminiApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setEditName(profile.name || "");
      setEditGeminiEmail(profile.geminiEmail || "");
      setEditGeminiApiKey(profile.geminiApiKey || "");
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(editName, editGeminiEmail, editGeminiApiKey);
      onClose();
    } catch (err) {
      console.error("Settings save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-md">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 space-y-5">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
            <Database className="h-5 w-5 text-purple-400" />
            <span>API Settings Integration</span>
          </h3>
          <p className="text-xs text-neutral-400 leading-normal">
            Support your credentials to integrate registered Gemini emails for direct seamless server pipelines and metrics analytics.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
              Candidate Display Name
            </label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950/60 py-2.5 px-3 text-xs text-neutral-200 outline-none transition focus:border-purple-500/50"
              placeholder="Your Name"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
              Registered Gemini Email Address
            </label>
            <input
              type="email"
              value={editGeminiEmail}
              onChange={(e) => setEditGeminiEmail(e.target.value)}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950/60 py-2.5 px-3 text-xs text-neutral-200 outline-none transition focus:border-purple-500/50"
              placeholder="your.email@google-registered.com"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1 flex justify-between items-center">
              <span>Personal Gemini API Secret Key</span>
              <span className="text-[9px] uppercase text-emerald-400 font-bold bg-emerald-500/5 px-1.5 rounded-sm">Secure client-side</span>
            </label>
            <input
              type="password"
              value={editGeminiApiKey}
              onChange={(e) => setEditGeminiApiKey(e.target.value)}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950/60 py-2.5 px-3 text-xs font-mono text-neutral-300 outline-none transition focus:border-purple-500/50"
              placeholder="AIzaSy... (usually 39 symbols)"
            />
            <p className="text-[10px] text-neutral-500 mt-1.5 leading-snug">
              If left blank, queries fall back securely to the primary developer system key default.
            </p>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 rounded-lg bg-neutral-800 hover:bg-neutral-700 py-2.5 text-xs font-semibold text-neutral-300 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="w-1/2 rounded-lg bg-purple-600 hover:bg-purple-500 py-2.5 text-xs font-semibold text-white transition flex justify-center items-center cursor-pointer"
            >
              {isSaving ? "Saving Settings..." : "Sync Settings Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
