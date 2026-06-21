import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, updateDoc } from "firebase/firestore";
import { UserProfile, InterviewSession, InterviewFeedback, InterviewTemplate } from "../types";
import {
  Sparkles,
  TrendingUp,
  Cpu,
  LogOut,
  Sliders,
  Settings,
  Key,
  Database,
  BarChart2,
  Calendar,
  Layers,
  ChevronRight,
  PlusSquare,
  BadgeAlert,
  User,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Award,
  RefreshCw
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

// Default pre-packaged interview templates
const DEFAULT_TEMPLATES: InterviewTemplate[] = [
  {
    id: "t1",
    role: "Frontend Engineer",
    topic: "React State & Virtual DOM",
    description: "Practice topics like reactivity, hooks lifecycle, rendering, context performance, and Web API integration.",
    icon: "JS"
  },
  {
    id: "t2",
    role: "Fullstack Developer",
    topic: "REST APIs & Middleware Security",
    description: "Answer questions about Express servers, JWT authorizations, validation strategies, and rate-limiting rules.",
    icon: "PHP"
  },
  {
    id: "t3",
    role: "Backend Engineer",
    topic: "PostgreSQL Database Joins & Indexing",
    description: "Answer deep structural concerns about database normalizations, SQL query optimizations, transactions, and scaling keys.",
    icon: "CSS"
  },
  {
    id: "t4",
    role: "Generative AI Architect",
    topic: "Gemini API Tools & Function Calling",
    description: "Verify your credentials in smart prompting, fine tuning, temperature calibration, and RAG contextual architecture.",
    icon: "AI"
  }
];

interface DashboardProps {
  user: any;
  onStartInterview: (session: InterviewSession) => void;
  onViewFeedback: (feedback: InterviewFeedback, role: string, topic: string, difficulty: string) => void;
  onShowAuth: () => void;
}

export default function Dashboard({ user, onStartInterview, onViewFeedback, onShowAuth }: DashboardProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [interviews, setInterviews] = useState<InterviewSession[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Settings edited parameters
  const [editName, setEditName] = useState("");
  const [editGeminiEmail, setEditGeminiEmail] = useState("");
  const [editGeminiApiKey, setEditGeminiApiKey] = useState("");

  // Custom Interview Creator drawer
  const [showCustomConfig, setShowCustomConfig] = useState(false);
  const [customRole, setCustomRole] = useState("Software Engineer");
  const [customTopic, setCustomTopic] = useState("System Architecture");
  const [customDifficulty, setCustomDifficulty] = useState<"Entry Level" | "Mid Level" | "Senior Level">("Mid Level");

  const [loading, setLoading] = useState(true);

  // Load profile and historical interviews from Firestore
  useEffect(() => {
    if (!user) {
      // It's a guest! Load trials from localStorage
      const saved = localStorage.getItem("prepwise_trial_sessions");
      const parsed = saved ? JSON.parse(saved) : [];
      setInterviews(parsed);
      setProfile({
        uid: "guest",
        email: "guest@example.com",
        name: "Guest Explorer",
        createdAt: new Date().toISOString()
      } as any);
      setEditName("Guest Explorer");
      setLoading(false);
      return;
    }

    // 1. Fetch User settings profile
    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as UserProfile;
          setProfile(data);
          setEditName(data.name || "");
          setEditGeminiEmail(data.geminiEmail || "");
          setEditGeminiApiKey(data.geminiApiKey || "");
        } else {
          // If no profile document exists, save basic info
          const defaultProfile: UserProfile = {
            uid: user.uid,
            email: user.email || "",
            name: user.displayName || "Candidate Pro",
            createdAt: new Date().toISOString()
          };
          setProfile(defaultProfile);
          setEditName(defaultProfile.name);
        }
      } catch (err) {
        console.error("Profile retrieval error:", err);
      }
    };

    fetchProfile();

    // 2. Query historical interviews ordered by timestamp in real-time
    const interviewsRef = collection(db, "interviews");
    const q = query(
      interviewsRef,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const parsed: InterviewSession[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        parsed.push({
          id: docSnap.id,
          ...data
        } as InterviewSession);
      });
      setInterviews(parsed);
      setLoading(false);
    }, (error) => {
      console.error("Interviews subscription failure:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Save Settings logic
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    setIsSavingSettings(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        name: editName,
        geminiEmail: editGeminiEmail,
        geminiApiKey: editGeminiApiKey
      });

      setProfile(prev => prev ? {
        ...prev,
        name: editName,
        geminiEmail: editGeminiEmail,
        geminiApiKey: editGeminiApiKey
      } : null);

      setShowSettings(false);
    } catch (err) {
      console.error("Settings update failed", err);
      alert("Failed to synchronize settings profile. Please confirm permissions.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Trigger default template interview
  const triggerTemplateInterview = (tpl: InterviewTemplate) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      // It's a guest! Load trials and check limits
      const saved = localStorage.getItem("prepwise_trial_sessions");
      const guestSessions = saved ? JSON.parse(saved) : [];
      if (guestSessions.length >= 3) {
        setIsUpgradeModalOpen(true);
        return;
      }

      const guestSession: InterviewSession = {
        id: `session-${Date.now()}`,
        userId: "guest",
        role: tpl.role,
        difficulty: "Mid Level",
        topic: tpl.topic,
        status: "ongoing",
        createdAt: new Date().toISOString()
      };

      localStorage.setItem("prepwise_trial_sessions", JSON.stringify([guestSession, ...guestSessions]));
      onStartInterview(guestSession);
      return;
    }

    const newSession: InterviewSession = {
      id: `session-${Date.now()}`,
      userId: currentUser.uid,
      role: tpl.role,
      difficulty: "Mid Level",
      topic: tpl.topic,
      status: "ongoing",
      createdAt: new Date().toISOString()
    };

    onStartInterview(newSession);
  };

  // Trigger custom interview setup
  const triggerCustomInterview = () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      // It's a guest! Load trials and check limits
      const saved = localStorage.getItem("prepwise_trial_sessions");
      const guestSessions = saved ? JSON.parse(saved) : [];
      if (guestSessions.length >= 3) {
        setIsUpgradeModalOpen(true);
        return;
      }

      const guestSession: InterviewSession = {
        id: `session-${Date.now()}`,
        userId: "guest",
        role: customRole,
        difficulty: customDifficulty,
        topic: customTopic,
        status: "ongoing",
        createdAt: new Date().toISOString()
      };

      localStorage.setItem("prepwise_trial_sessions", JSON.stringify([guestSession, ...guestSessions]));
      onStartInterview(guestSession);
      return;
    }

    const newSession: InterviewSession = {
      id: `session-${Date.now()}`,
      userId: currentUser.uid,
      role: customRole,
      difficulty: customDifficulty,
      topic: customTopic,
      status: "ongoing",
      createdAt: new Date().toISOString()
    };

    onStartInterview(newSession);
  };

  const handleSignOut = () => {
    auth.signOut();
  };

  // Performance calculations
  const totalCompleted = interviews.filter(i => i.status === "completed").length;
  const filteredCompleted = interviews.filter(i => i.status === "completed" && i.score !== undefined);
  const averageScore = filteredCompleted.length > 0
    ? Math.round(filteredCompleted.reduce((acc, curr) => acc + (curr.score || 0), 0) / filteredCompleted.length)
    : 0;

  // Chart data matching performance chronological progression
  const chartData = filteredCompleted
    .slice()
    .reverse()
    .map((item, index) => {
      return {
        name: `Interv #${index + 1}`,
        score: item.score,
        date: new Date(item.createdAt).toLocaleDateString([], { month: "short", day: "numeric" }),
        topic: item.topic
      };
    });

  return (
    <div className="bg-transparent text-neutral-200 min-h-screen">
      {/* Top dashboard connection Header */}
      <nav className="border-b border-neutral-900 bg-neutral-950/80 sticky top-0 z-30 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="h-9 w-9" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  {/* Rich orange-yellow gradient for the loop */}
                  <linearGradient id="logoGrad" x1="20%" y1="10%" x2="80%" y2="90%">
                    <stop offset="0%" stopColor="#FBBF24" />
                    <stop offset="45%" stopColor="#F97316" />
                    <stop offset="100%" stopColor="#DC2626" />
                  </linearGradient>
                  
                  {/* Rich orange-red gradient for the vertical stem */}
                  <linearGradient id="pStemGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#EA580C" />
                    <stop offset="100%" stopColor="#991B1B" />
                  </linearGradient>

                  {/* Fold shadow to create 3D depth */}
                  <linearGradient id="pFoldShadow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#000000" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                  </linearGradient>

                  <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Outer pulsing energy accent ring */}
                <circle cx="50" cy="50" r="42" stroke="url(#logoGrad)" strokeWidth="1.5" strokeDasharray="4 4" className="opacity-25 animate-[spin_60s_linear_infinite]" />

                {/* Left Vertical Stem Ribbon (layered below loop for 3D overlap) */}
                <path 
                  d="M 32,35 H 44 V 75 C 44,75 32,75 32,68 Z" 
                  fill="url(#pStemGrad)"
                  className="opacity-95"
                />

                {/* Fold shadow on top of stem */}
                <path
                  d="M 32,35 H 44 V 47 H 32 Z"
                  fill="url(#pFoldShadow)"
                  className="opacity-60"
                />

                {/* Main Curved Loop Ribbon (layered on top) */}
                <path 
                  d="M 32,24 H 56 C 68,24 76,32 76,43 C 76,54 68,62 56,62 H 32 V 51 H 55 C 60,51 64,47 64,43 C 64,39 60,35 55,35 H 32 Z" 
                  fill="url(#logoGrad)" 
                  filter="url(#logoGlow)"
                  className="opacity-95" 
                />

                {/* Subtle light reflection highlight */}
                <path 
                  d="M 34,26 H 55 C 64,26 70,31 70,41" 
                  stroke="#FFFFFF" 
                  strokeWidth="1.2" 
                  strokeLinecap="round" 
                  className="opacity-30" 
                />
              </svg>
            </div>
            <span className="font-display font-black tracking-tight text-2xl bg-gradient-to-r from-neutral-50 via-neutral-150 to-neutral-300 bg-clip-text text-transparent">PrepWise</span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4">
            {auth.currentUser ? (
              <>
                {profile && (
                  <div className="flex items-center gap-2 text-sm text-neutral-400 select-none bg-neutral-900 border border-neutral-800 rounded-full py-1.5 px-3.5 shadow-sm">
                    <User className="h-3.5 w-3.5 text-purple-400" />
                    <span className="font-medium text-neutral-300">{profile.name}</span>
                    {profile.geminiApiKey ? (
                      <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" title="Custom Key Connection Active" />
                    ) : (
                      <span className="inline-flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse" title="System Server Activated" />
                    )}
                  </div>
                )}

                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2.5 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white hover:border-neutral-700 hover:bg-neutral-800/80 transition cursor-pointer shadow-sm"
                  title="API Integration Settings"
                >
                  <Settings className="h-4.5 w-4.5" />
                </button>

                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 text-sm hover:bg-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 px-4 py-2 rounded-xl transition font-medium cursor-pointer shadow-sm"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Exit</span>
                </button>
              </>
            ) : (
              <button
                onClick={onShowAuth}
                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-sm font-semibold text-white px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-purple-600/10 hover:scale-[1.01]"
              >
                <User className="h-4 w-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Banner Card */}
        <div className="relative rounded-3xl border border-neutral-900 bg-gradient-to-r from-purple-950/20 via-indigo-950/20 to-neutral-900/40 p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between overflow-hidden gap-10 shadow-2xl">
          {/* Subtle ambient light source */}
          <div className="absolute -top-24 -left-20 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-20 w-80 h-80 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

          <div className="space-y-5 max-w-xl text-center md:text-left z-10">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold tracking-tight leading-tight text-neutral-50">
              Get Interview-Ready with AI-Powered Practice & Feedback
            </h1>
            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed font-normal">
              Practice real interview questions & get instant feedback. Connect via voice simulations and let PrepWise assess your performance in real time.
            </p>
            <div className="flex flex-wrap gap-3 pt-3 justify-center md:justify-start">
              <button
                onClick={() => setShowCustomConfig(true)}
                className="rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white hover:bg-purple-500 hover:scale-[1.01] transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-600/15"
              >
                <PlusSquare className="h-4 w-4" />
                <span>Start an Interview</span>
              </button>
              
              <button
                onClick={() => {
                  if (DEFAULT_TEMPLATES.length > 0) {
                    triggerTemplateInterview(DEFAULT_TEMPLATES[0]);
                  }
                }}
                className="rounded-xl bg-neutral-900 border border-neutral-800/85 hover:bg-neutral-800 hover:text-white hover:border-neutral-700 px-5 py-3 text-sm font-semibold text-neutral-300 transition cursor-pointer"
              >
                Try Fast Session
              </button>
            </div>
          </div>

          {/* Futuristic CSS Artwork representing laptop and coding badges */}
          <div className="relative h-60 w-full md:w-[340px] shrink-0 flex items-center justify-center select-none z-10 animate-float-laptop">
            {/* Rotating Words orbiting over the computer */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="absolute animate-orbit-tag-1 bg-purple-500/25 border border-purple-400/60 text-purple-100 font-mono text-[11px] font-extrabold px-2.5 py-1.5 rounded-md backdrop-blur-md shadow-[0_0_12px_rgba(168,85,247,0.3)] whitespace-nowrap">
                System Design 🧠
              </div>
              <div className="absolute animate-orbit-tag-2 bg-emerald-500/25 border border-emerald-400/60 text-emerald-100 font-mono text-[11px] font-extrabold px-2.5 py-1.5 rounded-md backdrop-blur-md shadow-[0_0_12px_rgba(52,211,153,0.3)] whitespace-nowrap">
                Algorithms ⚡
              </div>
              <div className="absolute animate-orbit-tag-3 bg-blue-500/25 border border-blue-400/60 text-blue-100 font-mono text-[11px] font-extrabold px-2.5 py-1.5 rounded-md backdrop-blur-md shadow-[0_0_12px_rgba(96,165,250,0.3)] whitespace-nowrap">
                React JS 🌐
              </div>
              <div className="absolute animate-orbit-tag-4 bg-amber-500/25 border border-amber-400/60 text-amber-100 font-mono text-[11px] font-extrabold px-2.5 py-1.5 rounded-md backdrop-blur-md shadow-[0_0_12px_rgba(251,191,36,0.3)] whitespace-nowrap">
                Behavioral 👥
              </div>
              <div className="absolute animate-orbit-tag-5 bg-indigo-500/25 border border-indigo-400/60 text-indigo-100 font-mono text-[11px] font-extrabold px-2.5 py-1.5 rounded-md backdrop-blur-md shadow-[0_0_12px_rgba(129,140,248,0.3)] whitespace-nowrap">
                SQL Databases 🗄️
              </div>
              <div className="absolute animate-orbit-tag-6 bg-teal-500/25 border border-teal-400/60 text-teal-100 font-mono text-[11px] font-extrabold px-2.5 py-1.5 rounded-md backdrop-blur-md shadow-[0_0_12px_rgba(45,212,191,0.3)] whitespace-nowrap">
                Mock Coding 💻
              </div>
            </div>

            {/* Glowing Laptop Stand */}
            <div className="h-32 w-52 rounded-2xl bg-neutral-900 border-2 border-neutral-800 shadow-2xl relative flex flex-col justify-between p-3 overflow-hidden z-20">
              {/* Top bezel or screen camera */}
              <div className="flex justify-center gap-1 items-center pb-1">
                <div className="h-1 w-1 bg-neutral-700 rounded-full" />
                <div className="h-1 w-1 bg-blue-500 rounded-full animate-pulse" />
              </div>

              {/* Computer Screen Display with code lines and scanline */}
              <div className="relative flex-grow rounded-lg bg-neutral-950 border border-neutral-800/80 overflow-hidden flex flex-col p-1.5 text-[8px] font-mono leading-tight text-emerald-500/80">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent animate-scanline pointer-events-none" />
                
                {/* Simulated code editor header */}
                <div className="flex items-center gap-1 border-b border-neutral-900 pb-1 mb-1 text-[7px] text-neutral-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/60" />
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
                  <span className="ml-1 text-neutral-400">interviewer.py</span>
                </div>

                <div className="space-y-0.5 tracking-wide overflow-hidden select-none">
                  <p className="text-purple-400">import <span className="text-white">genai</span></p>
                  <p className="text-blue-400">class <span className="text-yellow-400">PrepWiseMock</span>:</p>
                  <p className="text-neutral-500">  # listening for audio...</p>
                  <p className="text-neutral-400">  def <span className="text-emerald-400">evaluate_candidate</span>(user):</p>
                  <p className="text-purple-400">    return <span className="text-indigo-400">"Excellent"</span></p>
                </div>

                {/* Simulated dynamic microphone waveform in screen footer */}
                <div className="absolute bottom-1 right-2 flex items-end gap-0.5 h-3">
                  <span className="w-0.5 bg-purple-500 animate-pulse" style={{ height: '40%' }} />
                  <span className="w-0.5 bg-indigo-500 animate-pulse" style={{ height: '80%', animationDelay: '150ms' }} />
                  <span className="w-0.5 bg-emerald-500 animate-pulse" style={{ height: '50%', animationDelay: '300ms' }} />
                </div>
              </div>

              <div className="w-full h-1 bg-neutral-800 rounded-full mt-1.5" />
            </div>

            {/* Laptop Base Plate */}
            <div className="absolute bottom-12 h-2.5 w-60 bg-neutral-800 rounded-full border-t border-neutral-700 shadow-xl z-20 flex justify-center">
              {/* Keyboard groove asset */}
              <div className="w-20 h-1 bg-neutral-950 rounded-b-md" />
            </div>
            {/* Subtle glow sphere */}
            <div className="absolute bottom-9 h-1 w-32 bg-gradient-to-r from-purple-500/50 to-indigo-500/50 rounded-full blur-xs opacity-50 z-10" />
          </div>
        </div>

        {/* Real-time Performance Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Circular Score Widgets */}
          <div className="lg:col-span-4 rounded-2xl border border-neutral-900 bg-neutral-900/30 p-6 flex flex-col justify-between gap-6">
            <div>
              <h3 className="text-lg font-display font-bold text-neutral-150 flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-400" />
                <span>Performance Analytics</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-1.5 leading-normal">
                Category and cumulative scoring progress recorded over historic evaluations.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center space-y-3.5">
              <div className="relative h-32 w-32 rounded-full border-4 border-neutral-800 flex flex-col items-center justify-center font-bold text-4xl text-purple-400 bg-neutral-950 shadow-inner">
                <span className="font-display font-extrabold">{averageScore}%</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 mt-1 font-mono">Average</span>
              </div>
              <span className="text-sm text-neutral-400">Recorded across <strong className="text-purple-400">{totalCompleted}</strong> sessions</span>
            </div>

            <div className="border-t border-neutral-800/65 pt-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs sm:text-sm text-neutral-400">
                <span className="font-medium">Integrated Profile:</span>
                <span className="text-purple-400 font-mono font-bold leading-none">{profile?.geminiEmail ? "Cloud Verified" : "Server Default"}</span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm text-neutral-400">
                <span className="font-medium">Custom Key Sync:</span>
                <span className={profile?.geminiApiKey ? "text-emerald-400 font-semibold" : "text-neutral-500"}>
                  {profile?.geminiApiKey ? "CONNECTED" : "INACTIVE"}
                </span>
              </div>
            </div>
          </div>

          {/* Historical Progressive Trend Tracker */}
          <div className="lg:col-span-8 rounded-2xl border border-neutral-900 bg-neutral-900/30 p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-display font-bold text-neutral-150 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-400" />
                <span>Score Progression Tracker</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-1.5">
                Monitor your interview quality progression and observe overall study success.
              </p>
            </div>

            {/* Rendering Real-time Chart using standard Recharts */}
            <div className="h-44 w-full mt-4">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="name" stroke="#a3a3a3" fontSize={11} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="#a3a3a3" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#171717", borderColor: "#262626", borderRadius: "12px", fontSize: "12px" }}
                      itemStyle={{ color: "#c084fc" }}
                    />
                    <Area type="monotone" dataKey="score" stroke="#c084fc" fillOpacity={1} fill="url(#scoreColor)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-neutral-500 bg-neutral-950/25 rounded-xl border border-neutral-900">
                  No chronological sessions. Complete an interview to render your real-time analytics chart.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Guest Trial Session Tracker Banner */}
        {!auth.currentUser && (
          <div className="rounded-2xl border border-dashed border-purple-500/35 bg-purple-950/5 p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg shadow-purple-950/5">
            <div className="space-y-1 text-left">
              <h4 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
                <span>Guest Trial Tracker: {Math.max(0, 3 - interviews.length)} of 3 Free Interviews Left</span>
              </h4>
              <p className="text-neutral-400 text-xs leading-relaxed max-w-3xl">
                You are currently preparing as a Guest. Start a mock session to evaluate your competence. Register a free account to persist evaluations permanently, unlock progress progression charts, and enjoy unlimited AI interviews.
              </p>
            </div>
            <button
              onClick={onShowAuth}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold text-xs text-white shadow-lg shadow-purple-600/15 cursor-pointer shrink-0 transition"
            >
              Sign Up / Login to Save Progress
            </button>
          </div>
        )}

        {/* Take Interviews Card Templates */}
        <div className="space-y-5">
          <h2 className="text-2xl font-display font-extrabold tracking-tight text-neutral-100">Practice Templates</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {DEFAULT_TEMPLATES.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-neutral-900 bg-neutral-900/15 p-5 flex flex-col justify-between hover:border-purple-500/25 hover:bg-neutral-900/30 transition duration-300 group shadow-sm"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="rounded-lg bg-purple-500/10 border border-purple-500/25 px-2.5 py-1 text-xs font-semibold text-purple-400 capitalize">
                      {item.role}
                    </span>
                    <span className="text-[10px] font-bold text-neutral-600 font-mono tracking-wider">{item.icon}</span>
                  </div>
                  <div>
                    <h4 className="text-base font-display font-bold text-neutral-250 leading-snug group-hover:text-purple-400 transition duration-200">
                      {item.topic}
                    </h4>
                    <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed mt-2">{item.description}</p>
                  </div>
                </div>

                <button
                  onClick={() => triggerTemplateInterview(item)}
                  className="w-full mt-5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white px-4 py-2.5 text-sm font-semibold text-center hover:bg-purple-600 hover:border-transparent transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Start Practice</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Historical interviews list */}
        <div className="space-y-5">
          <h2 className="text-2xl font-display font-extrabold tracking-tight text-neutral-100">Your Interviews</h2>
          
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-10 text-sm text-neutral-405">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2.5 text-neutral-505" />
                <span>Loading complete transcripts...</span>
              </div>
            ) : interviews.length === 0 ? (
              <div className="rounded-2xl border border-neutral-900 bg-neutral-900/10 p-8 text-center text-sm text-neutral-400 max-w-sm mx-auto">
                No mock interviews registered yet. Compile a customized set or template from above to begin.
              </div>
            ) : (
              interviews.map((session) => (
                <div
                  key={session.id}
                  className="rounded-2xl border border-neutral-900 bg-neutral-900/15 p-5 hover:border-neutral-800 hover:bg-neutral-900/25 transition duration-300 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4.5 w-full">
                    <div className="rounded-xl bg-purple-500/10 p-3 text-purple-400 shrink-0 border border-purple-500/15">
                      <Award className="h-5.5 w-5.5" />
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 font-mono">
                        {session.difficulty} • {session.role}
                      </h4>
                      <h3 className="text-base font-display font-bold text-neutral-150">
                        Topic Focus: <span className="text-neutral-200">{session.topic}</span>
                      </h3>
                      <div className="flex flex-wrap items-center gap-2.5 text-xs text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{new Date(session.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </span>
                        <span>•</span>
                        <span>Duration: {Math.floor((session.duration || 0) / 60)}m {(session.duration || 0) % 60}s</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4.5 shrink-0 justify-end w-full sm:w-auto">
                    {session.score !== undefined && (
                      <div className="text-right">
                        <span className="rounded-xl bg-purple-500/10 border border-purple-500/25 px-3 py-1.5 text-sm font-black text-purple-400 font-mono">
                          {session.score}%
                        </span>
                      </div>
                    )}

                    {session.feedback && (
                      <button
                        onClick={() => onViewFeedback(session.feedback!, session.role, session.topic, session.difficulty)}
                        className="rounded-xl border border-neutral-800 hover:bg-purple-600 hover:border-transparent px-4 py-2 text-sm font-semibold text-neutral-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-[1.01]"
                      >
                        <span>Analyze Feedback</span>
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Custom configuration modal setup */}
      {showCustomConfig && (
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
                onClick={() => setShowCustomConfig(false)}
                className="w-1/2 rounded-lg bg-neutral-800 hover:bg-neutral-700 py-2.5 text-xs font-semibold text-neutral-300 transition cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowCustomConfig(false);
                  triggerCustomInterview();
                }}
                className="w-1/2 rounded-lg bg-purple-600 hover:bg-purple-500 py-2.5 text-xs font-semibold text-white transition cursor-pointer"
              >
                Launch Interview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trial Limit Reached Modal */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 relative overflow-hidden shadow-2xl space-y-5">
            {/* Background elements */}
            <div className="absolute top-0 right-0 h-40 w-40 bg-purple-600/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <div className="absolute bottom-0 left-0 h-40 w-40 bg-indigo-600/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

            <div className="flex flex-col items-center text-center space-y-4 pt-4">
              <div className="h-14 w-14 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center text-orange-400 shadow-inner">
                <svg className="h-10 w-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    {/* Rich orange-yellow gradient for the loop */}
                    <linearGradient id="logoGradUpgrade" x1="20%" y1="10%" x2="80%" y2="90%">
                      <stop offset="0%" stopColor="#FBBF24" />
                      <stop offset="45%" stopColor="#F97316" />
                      <stop offset="100%" stopColor="#DC2626" />
                    </linearGradient>
                    
                    {/* Rich orange-red gradient for the vertical stem */}
                    <linearGradient id="pStemGradUpgrade" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#EA580C" />
                      <stop offset="100%" stopColor="#991B1B" />
                    </linearGradient>

                    {/* Fold shadow to create 3D depth */}
                    <linearGradient id="pFoldShadowUpgrade" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#000000" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                    </linearGradient>

                    <filter id="logoGlowUpgrade" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Outer pulsing energy accent ring */}
                  <circle cx="50" cy="50" r="42" stroke="url(#logoGradUpgrade)" strokeWidth="1.5" strokeDasharray="4 4" className="opacity-25 animate-[spin_60s_linear_infinite]" />

                  {/* Left Vertical Stem Ribbon (layered below loop for 3D overlap) */}
                  <path 
                    d="M 32,35 H 44 V 75 C 44,75 32,75 32,68 Z" 
                    fill="url(#pStemGradUpgrade)"
                    className="opacity-95"
                  />

                  {/* Fold shadow on top of stem */}
                  <path
                    d="M 32,35 H 44 V 47 H 32 Z"
                    fill="url(#pFoldShadowUpgrade)"
                    className="opacity-60"
                  />

                  {/* Main Curved Loop Ribbon (layered on top) */}
                  <path 
                    d="M 32,24 H 56 C 68,24 76,32 76,43 C 76,54 68,62 56,62 H 32 V 51 H 55 C 60,51 64,47 64,43 C 64,39 60,35 55,35 H 32 Z" 
                    fill="url(#logoGradUpgrade)" 
                    filter="url(#logoGlowUpgrade)"
                    className="opacity-95" 
                  />

                  {/* Subtle light reflection highlight */}
                  <path 
                    d="M 34,26 H 55 C 64,26 70,31 70,41" 
                    stroke="#FFFFFF" 
                    strokeWidth="1.2" 
                    strokeLinecap="round" 
                    className="opacity-30" 
                  />
                </svg>
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-display font-black tracking-tight text-white">Trial Limit Reached</h3>
                <p className="text-xs font-semibold text-purple-300 tracking-wider uppercase">Unlock Premium Access</p>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed md:px-2">
                You've completed your <strong>3 free trial sessions</strong>. Create a professional account to keep practicing with artificial intelligence, save your score reports permanently, and view progress graphs.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsUpgradeModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-neutral-800 text-xs text-neutral-400 hover:text-white hover:bg-neutral-800/60 font-medium transition cursor-pointer"
              >
                Close View
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsUpgradeModalOpen(false);
                  onShowAuth();
                }}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs text-white font-semibold transition shadow-lg shadow-purple-600/10 cursor-pointer"
              >
                Sign In / Sign Up
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
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

            <form onSubmit={handleSaveSettings} className="space-y-4">
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
                  onClick={() => setShowSettings(false)}
                  className="w-1/2 rounded-lg bg-neutral-800 hover:bg-neutral-700 py-2.5 text-xs font-semibold text-neutral-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="w-1/2 rounded-lg bg-purple-600 hover:bg-purple-500 py-2.5 text-xs font-semibold text-white transition flex justify-center items-center cursor-pointer"
                >
                  {isSavingSettings ? "Saving Settings..." : "Sync Settings Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
