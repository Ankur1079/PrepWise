import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { X, RefreshCw, Trash2, Search, Filter, Calendar, MessageSquare, Shield, Smile, Meh, Frown, Sparkles, Check, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AdminFeedbackModalProps {
  onClose: () => void;
}

interface FeedbackItem {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  rating: "excellent" | "good" | "average" | "poor";
  improvements: string;
  difficultSteps: string;
  message?: string;
  createdAt: string;
  userAgent?: string;
}

export default function AdminFeedbackModal({ onClose }: AdminFeedbackModalProps) {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    // Realtime listener for feedbacks collection
    const feedbackRef = collection(db, "feedbacks");
    const q = query(feedbackRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: FeedbackItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push({
            id: docSnap.id,
            ...docSnap.data(),
          } as FeedbackItem);
        });
        setFeedbacks(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching feedbacks:", err);
        setError("Could not load feedback submissions. Verify Firestore configuration.");
        
        // Load offline backup from localStorage if offline or permission denied
        const saved = localStorage.getItem("prepwise_submitted_feedbacks");
        if (saved) {
          try {
            const parsed = JSON.parse(saved).map((item: any, idx: number) => ({
              id: `offline-${idx}-${item.createdAt}`,
              ...item
            }));
            setFeedbacks(parsed);
          } catch (e) {
            console.error("Local backup parse error:", e);
          }
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (id.startsWith("offline-")) {
      // Offline local deletion
      const saved = localStorage.getItem("prepwise_submitted_feedbacks");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const filtered = parsed.filter((_: any, idx: number) => `offline-${idx}-${_.createdAt}` !== id);
          localStorage.setItem("prepwise_submitted_feedbacks", JSON.stringify(filtered));
          setFeedbacks(feedbacks.filter(f => f.id !== id));
        } catch (e) {
          console.error(e);
        }
      }
      setShowConfirmDelete(null);
      return;
    }

    try {
      await deleteDoc(doc(db, "feedbacks", id));
      setShowConfirmDelete(null);
    } catch (err: any) {
      alert("Error deleting feedback: " + err.message);
    }
  };

  // Stats calculation
  const totalSubmissions = feedbacks.length;
  const ratingCounts = feedbacks.reduce(
    (acc, curr) => {
      acc[curr.rating] = (acc[curr.rating] || 0) + 1;
      return acc;
    },
    { excellent: 0, good: 0, average: 0, poor: 0 } as Record<string, number>
  );

  const satisfactionRate = totalSubmissions > 0
    ? Math.round(((ratingCounts.excellent + ratingCounts.good) / totalSubmissions) * 100)
    : 0;

  // Filtered feedbacks
  const filteredFeedbacks = feedbacks.filter((f) => {
    const matchesSearch =
      (f.userName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.userEmail || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.improvements || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.difficultSteps || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.message || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRating = ratingFilter === "all" || f.rating === ratingFilter;

    return matchesSearch && matchesRating;
  });

  const getRatingBadge = (rating: string) => {
    switch (rating) {
      case "excellent":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">😍 Excellent</span>;
      case "good":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">🙂 Good</span>;
      case "average":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">😐 Average</span>;
      case "poor":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">🙁 Poor</span>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-md select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-4xl h-[85vh] rounded-3xl border border-neutral-800 bg-neutral-900 overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-850 flex items-center justify-between bg-gradient-to-r from-neutral-950 via-neutral-900 to-purple-950/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-display font-extrabold text-neutral-100">User Feedbacks Hub</h3>
                <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-[10px] font-bold text-purple-300 border border-purple-500/30">Admin Dashboard</span>
              </div>
              <p className="text-xs text-neutral-400">Monitor overall user satisfaction and review feature requests or issues</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-2 md:grid-cols-5 border-b border-neutral-850 bg-neutral-950/45 divide-x divide-y md:divide-y-0 divide-neutral-850 shrink-0 text-center">
          <div className="p-4 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Total Feedbacks</span>
            <span className="text-2xl font-black font-mono text-white mt-1">{totalSubmissions}</span>
          </div>
          <div className="p-4 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Satisfaction Rate</span>
            <span className="text-2xl font-black font-mono text-emerald-400 mt-1">{satisfactionRate}%</span>
          </div>
          <div className="p-4 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-wider">Excellent (😍)</span>
            <span className="text-lg font-bold font-mono text-neutral-200 mt-1">{ratingCounts.excellent}</span>
          </div>
          <div className="p-4 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-purple-400/80 uppercase tracking-wider">Good/Avg (🙂/😐)</span>
            <span className="text-lg font-bold font-mono text-neutral-200 mt-1">{ratingCounts.good + ratingCounts.average}</span>
          </div>
          <div className="p-4 flex flex-col justify-center col-span-2 md:col-span-1">
            <span className="text-[10px] font-bold text-rose-400/80 uppercase tracking-wider">Issues (🙁)</span>
            <span className="text-lg font-bold font-mono text-rose-400 mt-1">{ratingCounts.poor}</span>
          </div>
        </div>

        {/* Filters and Search toolbar */}
        <div className="p-4 border-b border-neutral-850 bg-neutral-950/20 flex flex-col sm:flex-row gap-3 items-center shrink-0">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, improvements or difficult steps..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-800 bg-neutral-950 text-xs text-neutral-200 outline-none transition focus:border-purple-500/50"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto shrink-0">
            <div className="relative flex-1 sm:flex-initial">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="pl-9 pr-8 py-2.5 rounded-xl border border-neutral-800 bg-neutral-950 text-xs text-neutral-200 outline-none transition cursor-pointer appearance-none focus:border-purple-500/50 w-full"
              >
                <option value="all">All Ratings</option>
                <option value="excellent">Excellent Only</option>
                <option value="good">Good Only</option>
                <option value="average">Average Only</option>
                <option value="poor">Poor Only</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-neutral-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Scrollable Feedbacks List */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-900/60 space-y-4">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <RefreshCw className="h-8 w-8 text-purple-500 animate-spin" />
              <p className="text-xs text-neutral-400 font-mono">Retrieving client logs...</p>
            </div>
          ) : error && feedbacks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <span className="text-4xl">⚠️</span>
              <p className="text-sm font-semibold text-rose-400">{error}</p>
              <p className="text-xs text-neutral-500 max-w-sm">Permissions could be restricted. Make sure you are registered and authorized to access live user submissions.</p>
            </div>
          ) : filteredFeedbacks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 text-neutral-500">
              <MessageSquare className="h-10 w-10 mb-2.5 opacity-35" />
              <p className="text-sm font-bold">No Feedbacks Found</p>
              <p className="text-xs text-neutral-400 max-w-xs mt-1">Try resetting filters or checking your search query parameters.</p>
            </div>
          ) : (
            filteredFeedbacks.map((item) => (
              <motion.div
                key={item.id}
                layout
                className="p-5 rounded-2xl border border-neutral-850 bg-neutral-950/40 hover:border-neutral-800 hover:bg-neutral-950/70 transition duration-200 relative group"
              >
                {/* Entry Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-850/65 pb-3 mb-3.5">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-200">{item.userName || "Anonymous"}</span>
                      {item.userId === "guest" && (
                        <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-[8px] uppercase tracking-wider text-neutral-400 font-mono">Guest</span>
                      )}
                    </div>
                    <span className="text-[10px] text-purple-400/80 font-mono leading-none block">{item.userEmail}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {getRatingBadge(item.rating)}
                    <div className="flex items-center gap-1 text-[10px] text-neutral-500 font-mono">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(item.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>

                    {/* Delete feedback element */}
                    <div className="relative">
                      {showConfirmDelete === item.id ? (
                        <div className="flex items-center gap-1.5 bg-rose-500/15 border border-rose-500/20 px-2 py-1 rounded-lg absolute right-0 -top-1.5 z-10 whitespace-nowrap">
                          <span className="text-[9px] font-bold text-rose-400">Delete?</span>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-0.5 rounded hover:bg-rose-500 hover:text-white transition cursor-pointer text-[9px] px-1 font-bold bg-rose-500/25 text-rose-300"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setShowConfirmDelete(null)}
                            className="p-0.5 rounded hover:bg-neutral-800 transition cursor-pointer text-[9px] px-1 text-neutral-400"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowConfirmDelete(item.id)}
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                          title="Delete Submission"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Entry Content details */}
                <div className="space-y-3.5">
                  {/* Improvements & features */}
                  {item.improvements && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-widest text-purple-400/90">
                        <Sparkles className="h-3 w-3 text-purple-400 shrink-0" />
                        <span>Suggested Improvements</span>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed font-sans">{item.improvements}</p>
                    </div>
                  )}

                  {/* Difficult Steps */}
                  {item.difficultSteps && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-widest text-amber-400/90">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                        <span>Confusing Steps / Errors Experienced</span>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed font-sans">{item.difficultSteps}</p>
                    </div>
                  )}

                  {/* General message */}
                  {item.message && (
                    <div className="space-y-1 pt-1 border-t border-neutral-900/40">
                      <div className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-500">
                        Additional Comments
                      </div>
                      <p className="text-xs text-neutral-400 italic font-sans">"{item.message}"</p>
                    </div>
                  )}
                </div>

                {/* Browser signature details in footer */}
                {item.userAgent && (
                  <div className="mt-3 text-[8px] font-mono text-neutral-600 truncate max-w-full">
                    Client Device: {item.userAgent}
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-850 bg-neutral-950/40 flex items-center justify-between shrink-0">
          <span className="text-[10px] font-mono text-neutral-500">
            Realtime DB Connection Status: Active
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 transition cursor-pointer"
          >
            Close Dashboard
          </button>
        </div>
      </motion.div>
    </div>
  );
}
