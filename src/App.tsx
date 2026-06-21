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
  const [showAuth, setShowAuth] = useState(false);
  
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
        setShowAuth(false);
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
    if (activeSession && activeSession.userId === "guest") {
      const saved = localStorage.getItem("prepwise_trial_sessions");
      if (saved) {
        const parsed = JSON.parse(saved);
        const filtered = parsed.filter((s: any) => s.id !== activeSession.id);
        localStorage.setItem("prepwise_trial_sessions", JSON.stringify(filtered));
      }
    }
    setActiveSession(null);
    setView("dashboard");
  };

  const handleReturnToDashboard = () => {
    setActiveFeedback(null);
    setView("dashboard");
  };

  return (
    <div className="relative z-0 min-h-screen bg-[#04040a] text-white selection:bg-purple-600/30 overflow-x-hidden">
      {/* High-Fidelity SVG Topographic Flowing Background (minds user's uploaded visual theme) */}
      <div className="fixed inset-0 -z-10 bg-[#04040a] overflow-hidden pointer-events-none select-none">
        {/* Deep, glowing atmospheric radial lights */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-purple-950/15 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-950/20 blur-[130px]" />
        
        {/* Masterful Vector Wave Lines with glowing gradients */}
        <svg className="absolute inset-0 w-full h-full opacity-35 sm:opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="purple-wave-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#6366f1" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="topographic-vortex-gradient" x1="100%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0.5" />
              <stop offset="60%" stopColor="#6366f1" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Left-side Organic Topographic Waves (28 concentric spline wave paths) */}
          <g stroke="url(#purple-wave-gradient)" strokeWidth="1.25" fill="none">
            {Array.from({ length: 28 }).map((_, i) => {
              const offset = i * 16;
              const d = `M -100 ${100 + offset * 0.45} 
                         C 200 ${120 + offset * 0.8}, 350 ${-40 + offset * 0.25}, 500 ${150 + offset * 0.55}
                         S 700 ${380 + offset * 1.1}, 850 ${420 + offset * 0.9} 
                         S 1000 ${320 + offset * 0.6}, 1100 ${450 + offset * 0.85}
                         S 1250 ${700 + offset * 1.25}, 1600 ${850 + offset * 1.3}`;
              return <path key={`left-contour-${i}`} d={d} opacity={0.35 - i * 0.01} />;
            })}
          </g>

          {/* Right-side Concentric Topographical Vortex (36 twisted nested curves) */}
          <g stroke="url(#topographic-vortex-gradient)" strokeWidth="1.4" fill="none">
            {Array.from({ length: 36 }).map((_, i) => {
              const scaleX = 180 + i * 13.5;
              const scaleY = 120 + i * 19.5;
              const rotate = 32 + i * 1.6;
              const opacity = 0.45 - i * 0.011;
              return (
                <ellipse
                  key={`topo-vortex-${i}`}
                  cx="1150"
                  cy="520"
                  rx={scaleX}
                  ry={scaleY}
                  transform={`rotate(${rotate} 1150 520)`}
                  opacity={Math.max(0.01, opacity)}
                />
              );
            })}
          </g>
        </svg>
      </div>

      {loading ? (
        <div className="flex min-h-screen flex-col items-center justify-center text-white">
          <div className="absolute top-10 flex items-center gap-3">
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="h-9 w-9" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="logoGradLoading" x1="20%" y1="10%" x2="80%" y2="90%">
                    <stop offset="0%" stopColor="#FBBF24" />
                    <stop offset="45%" stopColor="#F97316" />
                    <stop offset="100%" stopColor="#DC2626" />
                  </linearGradient>
                  
                  <linearGradient id="pStemGradLoading" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#EA580C" />
                    <stop offset="100%" stopColor="#991B1B" />
                  </linearGradient>

                  <linearGradient id="pFoldShadowLoading" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#000000" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                  </linearGradient>

                  <filter id="logoGlowLoading" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                <circle cx="50" cy="50" r="42" stroke="url(#logoGradLoading)" strokeWidth="1.5" strokeDasharray="4 4" className="opacity-25 animate-[spin_60s_linear_infinite]" />

                <path 
                  d="M 32,35 H 44 V 75 C 44,75 32,75 32,68 Z" 
                  fill="url(#pStemGradLoading)"
                  className="opacity-95"
                />

                <path
                  d="M 32,35 H 44 V 47 H 32 Z"
                  fill="url(#pFoldShadowLoading)"
                  className="opacity-60"
                />

                <path 
                  d="M 32,24 H 56 C 68,24 76,32 76,43 C 76,54 68,62 56,62 H 32 V 51 H 55 C 60,51 64,47 64,43 C 64,39 60,35 55,35 H 32 Z" 
                  fill="url(#logoGradLoading)" 
                  filter="url(#logoGlowLoading)"
                  className="opacity-95" 
                />

                <path 
                  d="M 34,26 H 55 C 64,26 70,31 70,41" 
                  stroke="#FFFFFF" 
                  strokeWidth="1.2" 
                  strokeLinecap="round" 
                  className="opacity-30" 
                />
              </svg>
            </div>
            <span className="text-xl font-display font-black tracking-tight bg-gradient-to-r from-neutral-50 via-neutral-150 to-neutral-300 bg-clip-text text-transparent">PrepWise</span>
          </div>
          <div className="flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="h-8 w-8 text-purple-400 animate-spin" />
            <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold text-center px-4">
              Synchronizing session parameters...
            </p>
          </div>
        </div>
      ) : showAuth && !user ? (
        <Auth
          onAuthSuccess={() => setShowAuth(false)}
          onCancel={() => setShowAuth(false)}
        />
      ) : (
        <>
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
              user={user}
              onStartInterview={handleStartInterview}
              onViewFeedback={handleViewHistoricalFeedback}
              onShowAuth={() => setShowAuth(true)}
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
        </>
      )}
    </div>
  );
}
