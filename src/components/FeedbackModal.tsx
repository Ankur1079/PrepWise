import React, { useState } from "react";
import { User } from "firebase/auth";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { X, Send, Heart, RefreshCw, MessageSquarePlus, Smile, Meh, Frown, Sparkles, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile } from "../types";

interface FeedbackModalProps {
  onClose: () => void;
  user: User | null;
  profile: UserProfile | null;
}

type RatingType = "excellent" | "good" | "average" | "poor";

export default function FeedbackModal({ onClose, user, profile }: FeedbackModalProps) {
  const [rating, setRating] = useState<RatingType | null>(null);
  const [improvements, setImprovements] = useState("");
  const [difficultSteps, setDifficultSteps] = useState("");
  const [message, setMessage] = useState("");
  const [guestName, setGuestName] = useState(profile?.name || "");
  const [guestEmail, setGuestEmail] = useState(profile?.email || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      alert("Please select your overall experience rating!");
      return;
    }

    setIsSubmitting(true);
    const feedbackData = {
      userId: user?.uid || "guest",
      userEmail: user?.email || guestEmail.trim() || "anonymous@prepwise.app",
      userName: user?.displayName || guestName.trim() || "Anonymous Guest",
      rating,
      improvements: improvements.trim(),
      difficultSteps: difficultSteps.trim(),
      message: message.trim(),
      createdAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    try {
      // Save to Firebase Firestore
      await addDoc(collection(db, "feedbacks"), feedbackData);

      // Save a local copy in localStorage for persistence backup
      const saved = localStorage.getItem("prepwise_submitted_feedbacks");
      const parsed = saved ? JSON.parse(saved) : [];
      localStorage.setItem(
        "prepwise_submitted_feedbacks",
        JSON.stringify([feedbackData, ...parsed])
      );

      setIsSuccess(true);
    } catch (error: any) {
      console.error("Error saving feedback to Firestore:", error);
      // Fallback: save to localStorage if Firestore failed or offline
      const saved = localStorage.getItem("prepwise_submitted_feedbacks");
      const parsed = saved ? JSON.parse(saved) : [];
      localStorage.setItem(
        "prepwise_submitted_feedbacks",
        JSON.stringify([feedbackData, ...parsed])
      );
      // Even with fallback, show success to user
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratings: { type: RatingType; label: string; emoji: string; color: string; hoverBg: string }[] = [
    { type: "excellent", label: "Excellent", emoji: "😍", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5", hoverBg: "hover:bg-emerald-500/10 hover:border-emerald-500/40" },
    { type: "good", label: "Good", emoji: "🙂", color: "text-purple-400 border-purple-500/20 bg-purple-500/5", hoverBg: "hover:bg-purple-500/10 hover:border-purple-500/40" },
    { type: "average", label: "Average", emoji: "😐", color: "text-amber-400 border-amber-500/20 bg-amber-500/5", hoverBg: "hover:bg-amber-500/10 hover:border-amber-500/40" },
    { type: "poor", label: "Poor", emoji: "🙁", color: "text-rose-400 border-rose-500/20 bg-rose-500/5", hoverBg: "hover:bg-rose-500/10 hover:border-rose-500/40" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="w-full max-w-lg rounded-3xl border border-neutral-800 bg-neutral-900 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-850 flex items-center justify-between bg-gradient-to-r from-neutral-900 via-neutral-900 to-purple-950/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <MessageSquarePlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-neutral-100">Share Your Experience</h3>
              <p className="text-xs text-neutral-400">Help us make PrepWise the ultimate tool for everyone!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 select-none">
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* 1. Rating Choice */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    How was your overall experience? <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {ratings.map((r) => {
                      const isSelected = rating === r.type;
                      return (
                        <button
                          key={r.type}
                          type="button"
                          onClick={() => setRating(r.type)}
                          className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? `${r.color} ring-1 ring-purple-500/40 border-purple-500`
                              : `border-neutral-800 bg-neutral-950/40 text-neutral-400 ${r.hoverBg}`
                          }`}
                        >
                          <span className="text-2xl">{r.emoji}</span>
                          <span className="text-[10px] font-semibold font-sans capitalize">{r.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Optional Guest Name/Email details if not authenticated with real account */}
                {(!user || user.uid === "guest") && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-neutral-950/20 p-3.5 rounded-2xl border border-neutral-850">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                        Your Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Anonymous Explorer"
                        className="w-full rounded-xl border border-neutral-800 bg-neutral-950/60 py-2 px-3 text-xs text-neutral-200 outline-none transition focus:border-purple-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                        Your Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full rounded-xl border border-neutral-800 bg-neutral-950/60 py-2 px-3 text-xs text-neutral-200 outline-none transition focus:border-purple-500/50"
                      />
                    </div>
                  </div>
                )}

                {/* 2. Improvements */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-purple-400" />
                    <span>What improvements or features would you like to see?</span>
                  </label>
                  <textarea
                    rows={2}
                    value={improvements}
                    onChange={(e) => setImprovements(e.target.value)}
                    required
                    placeholder="e.g. Add technical mock templates for databases, better resume scanning, or longer timers..."
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950/60 py-2.5 px-3 text-xs text-neutral-200 outline-none transition focus:border-purple-500/50 resize-none font-sans"
                  />
                </div>

                {/* 3. Difficult Steps / Confusion / Errors */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                    <HelpCircle className="h-3 w-3 text-amber-400" />
                    <span>Which step is confusing, difficult to understand, or getting errors?</span>
                  </label>
                  <textarea
                    rows={2}
                    value={difficultSteps}
                    onChange={(e) => setDifficultSteps(e.target.value)}
                    required
                    placeholder="e.g. Enabling microphone, starting the voice session, understanding real-time Live vs standard mode..."
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950/60 py-2.5 px-3 text-xs text-neutral-200 outline-none transition focus:border-purple-500/50 resize-none font-sans"
                  />
                </div>

                {/* 4. Message */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Additional Message / Comments (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us anything else about your experience..."
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950/60 py-2.5 px-3 text-xs text-neutral-200 outline-none transition focus:border-purple-500/50 resize-none font-sans"
                  />
                </div>

                {/* Submit buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-1/3 rounded-xl bg-neutral-800 hover:bg-neutral-700 py-3.5 text-xs font-semibold text-neutral-300 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !rating}
                    className="w-2/3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 py-3.5 text-xs font-semibold text-white transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/15"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    <span>{isSubmitting ? "Sending Feedback..." : "Submit Feedback"}</span>
                  </button>
                </div>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 text-center space-y-5"
              >
                <div className="mx-auto w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center text-3xl animate-bounce">
                  💖
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-display font-extrabold text-neutral-100">Thank you so much!</h4>
                  <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-sm mx-auto">
                    Your feedback is highly valuable and has been successfully saved. It helps us build better experiences and fix confusing steps!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 font-semibold text-xs text-neutral-200 transition cursor-pointer"
                >
                  Close Window
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
