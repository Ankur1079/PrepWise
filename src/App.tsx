import React, { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { UserProfile, InterviewSession, InterviewFeedback } from "./types";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import InterviewCall from "./components/InterviewCall";
import FeedbackView from "./components/FeedbackView";
import { Sparkles, RefreshCw, BadgeAlert, ArrowUpRight } from "lucide-react";

type ViewState = "dashboard" | "call" | "feedback";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // App views state
  const [view, setView] = useState<ViewState>("dashboard");
  const [activeSession, setActiveSession] = useState<InterviewSession | null>(null);
  const [activeFeedback, setActiveFeedback] = useState<InterviewFeedback | null>(null);

  // Detail keys for active evaluation review card
  const [evaluationMeta, setEvaluationMeta] = useState<{
    role: string;
    topic: string;
    difficulty: string;
  }>({ role: "", topic: "", difficulty: "" });

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Fetch additional profile properties
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          }
        } catch (err) {
          console.error("Auth user document fetch crash:", err);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStartInterview = (session: InterviewSession) => {
    setActiveSession(session);
    setView("call");
  };

  const handleFeedbackComplete = (feedback: InterviewFeedback) => {
    if (activeSession) {
      setEvaluationMeta({
        role: activeSession.role,
        topic: activeSession.topic,
        difficulty: activeSession.difficulty
      });
    }
    setActiveFeedback(feedback);
    setActiveSession(null);
    setView("feedback");
  };

  const handleViewHistoricalFeedback = (
    feedback: InterviewFeedback,
    role: string,
    topic: string,
    difficulty: string
  ) => {
    setEvaluationMeta({ role, topic, difficulty });
    setActiveFeedback(feedback);
    setView("feedback");
  };

  const handleCancelCall = () => {
    setActiveSession(null);
    setView("dashboard");
  };

  const handleReturnToDashboard = () => {
    setActiveFeedback(null);
    setView("dashboard");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 text-white">
        <div className="absolute top-10 flex items-center gap-2">
          <div className="rounded-xl bg-purple-500/10 p-2.5 border border-purple-500/15">
            <Sparkles className="h-6 w-6 text-purple-400" />
          </div>
          <span className="text-xl font-bold tracking-tight">PrepWise</span>
        </div>
        <div className="flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="h-8 w-8 text-purple-400 animate-spin" />
          <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">
            Synchronizing session parameters...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-purple-600/30">
      {/* If iframe sandboxing is detected, show high-contrast reminder banner */}
      {window.self !== window.top && (
        <div className="bg-gradient-to-r from-purple-950 via-neutral-900 to-indigo-950 border-b border-purple-500/25 py-3 px-4 text-center flex flex-col sm:flex-row items-center justify-center gap-3 text-xs select-none">
          <div className="flex items-center gap-2 text-center">
            <BadgeAlert className="h-4 w-4 text-purple-400 animate-pulse shrink-0" />
            <span className="text-neutral-200 font-medium">
              Web Speech voice capture requires running the app in a separate browser tab.
            </span>
          </div>
          <a
            href={window.location.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-md shadow-purple-500/10 border border-purple-400/30 font-sans shrink-0 hover:scale-[1.02]"
          >
            <span>Click Here to Launch in a New Tab</span>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
          </a>
        </div>
      )}

      {view === "dashboard" && (
        <Dashboard
          onStartInterview={handleStartInterview}
          onViewFeedback={handleViewHistoricalFeedback}
        />
      )}

      {view === "call" && activeSession && (
        <InterviewCall
          session={activeSession}
          customApiKey={profile?.geminiApiKey}
          onFeedbackComplete={handleFeedbackComplete}
          onCancel={handleCancelCall}
        />
      )}

      {view === "feedback" && activeFeedback && (
        <FeedbackView
          feedback={activeFeedback}
          role={evaluationMeta.role}
          topic={evaluationMeta.topic}
          difficulty={evaluationMeta.difficulty}
          onBack={handleReturnToDashboard}
        />
      )}
    </div>
  );
}
