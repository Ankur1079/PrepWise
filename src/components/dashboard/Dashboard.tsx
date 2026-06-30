import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase";
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { UserProfile, InterviewSession, InterviewFeedback, InterviewTemplate } from "../../types";
import AdminFeedbackModal from "../AdminFeedbackModal";
import CustomInterviewPlannerModal from "./CustomInterviewPlannerModal";
import CustomTemplateCreatorModal from "./CustomTemplateCreatorModal";
import UpgradeTrialModal from "./UpgradeTrialModal";
import ApiSettingsModal from "./ApiSettingsModal";
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
  RefreshCw,
  Menu,
  X,
  Trash2,
  MessageSquare
} from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { motion, AnimatePresence } from "motion/react";

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
  profile: UserProfile | null;
  onProfileUpdate: (profile: UserProfile) => void;
  onStartInterview: (session: InterviewSession) => void;
  onViewFeedback: (feedback: InterviewFeedback, role: string, topic: string, difficulty: string) => void;
  onShowAuth: () => void;
}

export default function Dashboard({ user, profile, onProfileUpdate, onStartInterview, onViewFeedback, onShowAuth }: DashboardProps) {
  const [interviews, setInterviews] = useState<InterviewSession[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showAdminFeedbacks, setShowAdminFeedbacks] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = user && user.email === "ankuryadav1079@gmail.com";
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);

  // Custom Interview Creator drawer
  const [showCustomConfig, setShowCustomConfig] = useState(false);

  const [loading, setLoading] = useState(true);

  // Custom practice templates
  const [customTemplates, setCustomTemplates] = useState<InterviewTemplate[]>([]);
  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);

  // Load profile and historical interviews from Firestore
  useEffect(() => {
    if (!user) {
      // It's a guest! Load trials from localStorage
      const saved = localStorage.getItem("prepwise_trial_sessions");
      const parsed = saved ? JSON.parse(saved) : [];
      setInterviews(parsed);
      setLoading(false);
      return;
    }

    // Query historical interviews for the user and sort client-side in real-time
    const interviewsRef = collection(db, "interviews");
    const q = query(
      interviewsRef,
      where("userId", "==", user.uid)
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
      
      // Sort client-side by createdAt descending
      parsed.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      setInterviews(parsed);
      setLoading(false);
    }, (error) => {
      console.error("Interviews subscription failure:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Load custom templates
  useEffect(() => {
    if (!user) {
      const saved = localStorage.getItem("prepwise_custom_templates");
      const parsed = saved ? JSON.parse(saved) : [];
      setCustomTemplates(parsed);
      return;
    }

    const templatesRef = collection(db, "custom_templates");
    const q = query(
      templatesRef,
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const parsed: InterviewTemplate[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        parsed.push({
          id: docSnap.id,
          role: data.role || "",
          topic: data.topic || "",
          description: data.description || "",
          icon: data.icon || "Custom",
          createdAt: data.createdAt || ""
        } as InterviewTemplate);
      });

      // Sort client-side by createdAt descending
      parsed.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      setCustomTemplates(parsed);
    }, (error) => {
      console.error("Custom templates subscription failure:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreateTemplate = async (role: string, topic: string, desc: string, icon: string) => {
    const templateData = {
      role: role,
      topic: topic,
      description: desc,
      icon: icon || "Custom",
      createdAt: new Date().toISOString()
    };

    try {
      if (!user) {
        const saved = localStorage.getItem("prepwise_custom_templates");
        const parsed = saved ? JSON.parse(saved) : [];
        const newLocalTpl: InterviewTemplate = {
          id: `local-tpl-${Date.now()}`,
          ...templateData
        };
        const updated = [newLocalTpl, ...parsed];
        localStorage.setItem("prepwise_custom_templates", JSON.stringify(updated));
        setCustomTemplates(updated);
      } else {
        const { addDoc, collection } = await import("firebase/firestore");
        await addDoc(collection(db, "custom_templates"), {
          userId: user.uid,
          ...templateData
        });
      }
    } catch (err: any) {
      console.error("Failed to save custom template:", err);
      alert("Error saving template: " + (err.message || err));
      throw err;
    }
  };

  const handleDeleteTemplate = async (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmDelete = window.confirm("Are you sure you want to delete this custom template?");
    if (!confirmDelete) return;

    try {
      if (!user) {
        const saved = localStorage.getItem("prepwise_custom_templates");
        const parsed = saved ? JSON.parse(saved) : [];
        const filtered = parsed.filter((t: any) => t.id !== templateId);
        localStorage.setItem("prepwise_custom_templates", JSON.stringify(filtered));
        setCustomTemplates(filtered);
      } else {
        const { doc, deleteDoc } = await import("firebase/firestore");
        await deleteDoc(doc(db, "custom_templates", templateId));
      }
    } catch (err: any) {
      console.error("Failed to delete custom template:", err);
      alert("Error deleting template: " + (err.message || err));
    }
  };

  // Save Settings logic with instantaneous Optimistic UI updates
  const handleSaveSettings = async (name: string, geminiEmail: string, geminiApiKey: string) => {
    try {
      // Create the updated profile object locally
      const updatedProfile: UserProfile = {
        ...(profile || { uid: "guest", email: "guest@example.com", name: "Guest Explorer", createdAt: new Date().toISOString() }),
        name: name,
        geminiEmail: geminiEmail,
        geminiApiKey: geminiApiKey
      };

      if (!user) {
        localStorage.setItem("prepwise_guest_name", name);
        localStorage.setItem("prepwise_guest_email", geminiEmail);
        localStorage.setItem("prepwise_guest_api_key", geminiApiKey);
      } else {
        await setDoc(doc(db, "users", user.uid), {
          name: name,
          geminiEmail: geminiEmail,
          geminiApiKey: geminiApiKey
        }, { merge: true });
      }

      // Update UI state in App and close form
      onProfileUpdate(updatedProfile);
      
      // Trigger gorgeous confirmation toast feedback immediately
      setSettingsSavedToast(true);
      setTimeout(() => {
        setSettingsSavedToast(false);
      }, 3000);
    } catch (err: any) {
      console.error("Settings sync failed:", err);
      alert("Failed to update settings profile: " + (err.message || err));
      throw err;
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
  const triggerCustomInterview = (role: string, topic: string, difficulty: "Entry Level" | "Mid Level" | "Senior Level") => {
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
        role: role,
        difficulty: difficulty,
        topic: topic,
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
      role: role,
      difficulty: difficulty,
      topic: topic,
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
      const overall = item.score || item.feedback?.overallScore || 0;
      return {
        name: `Interv #${index + 1}`,
        overallScore: overall,
        technicalScore: item.feedback?.technicalScore || overall,
        communicationScore: item.feedback?.communicationScore || overall,
        problemSolvingScore: item.feedback?.problemSolvingScore || overall,
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

          <div className="hidden md:flex items-center gap-2.5 sm:gap-4">
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

            {isAdmin && (
              <button
                onClick={() => setShowAdminFeedbacks(true)}
                className="p-2.5 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white hover:border-neutral-700 hover:bg-neutral-800/80 transition cursor-pointer shadow-sm relative group"
                title="View User Feedbacks Hub"
                id="admin-feedbacks-btn"
              >
                <MessageSquare className="h-4.5 w-4.5" />
                <span className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
              </button>
            )}

            <button
              onClick={() => setShowSettings(true)}
              className="p-2.5 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white hover:border-neutral-700 hover:bg-neutral-800/80 transition cursor-pointer shadow-sm"
              title="API Integration Settings"
            >
              <Settings className="h-4.5 w-4.5" />
            </button>

            {auth.currentUser ? (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 text-sm hover:bg-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 px-4 py-2 rounded-xl transition font-medium cursor-pointer shadow-sm"
              >
                <LogOut className="h-4 w-4" />
                <span>Exit</span>
              </button>
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

          {/* Mobile hamburger menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white transition cursor-pointer shadow-sm"
              aria-expanded={isMobileMenuOpen}
              id="mobile-menu-toggle-btn"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-neutral-900 bg-neutral-950/95 backdrop-blur-md overflow-hidden"
              id="mobile-navigation-dropdown"
            >
              <div className="px-4 py-6 flex flex-col items-center gap-5">
                {profile && (
                  <div className="flex items-center justify-center gap-2 text-sm text-neutral-400 select-none bg-neutral-900 border border-neutral-800 rounded-full py-2.5 px-5 shadow-sm w-full max-w-[280px]">
                    <User className="h-4 w-4 text-purple-400" />
                    <span className="font-semibold text-neutral-300">{profile.name}</span>
                    {profile.geminiApiKey ? (
                      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" title="Custom Key Connection Active" />
                    ) : (
                      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-indigo-400 animate-pulse" title="System Server Activated" />
                    )}
                  </div>
                )}

                {isAdmin && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setShowAdminFeedbacks(true);
                    }}
                    className="flex items-center justify-center gap-2.5 w-full max-w-[280px] h-12 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white transition cursor-pointer shadow-sm text-sm font-semibold"
                    id="mobile-admin-feedbacks-btn"
                  >
                    <MessageSquare className="h-4.5 w-4.5 text-purple-400" />
                    <span>Feedbacks Hub</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setShowSettings(true);
                  }}
                  className="flex items-center justify-center gap-2.5 w-full max-w-[280px] h-12 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white transition cursor-pointer shadow-sm text-sm font-semibold"
                  id="mobile-settings-btn"
                >
                  <Settings className="h-4.5 w-4.5" />
                  <span>API Settings</span>
                </button>

                {auth.currentUser ? (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="flex items-center justify-center gap-2.5 w-full max-w-[280px] h-12 bg-neutral-900 border border-neutral-800 text-sm hover:bg-neutral-800 text-neutral-300 hover:text-white px-4 rounded-xl transition font-medium cursor-pointer shadow-sm"
                    id="mobile-logout-btn"
                  >
                    <LogOut className="h-4.5 w-4.5 text-neutral-400" />
                    <span>Exit</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onShowAuth();
                    }}
                    className="flex items-center justify-center gap-2.5 w-full max-w-[280px] h-12 bg-purple-600 hover:bg-purple-500 text-sm font-semibold text-white px-5 rounded-xl transition-all cursor-pointer shadow-lg shadow-purple-600/10"
                    id="mobile-signin-btn"
                  >
                    <User className="h-4.5 w-4.5" />
                    <span>Sign In</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
            <div className="flex flex-row gap-2.5 pt-3 w-full sm:w-auto justify-center md:justify-start">
              <button
                onClick={() => setShowCustomConfig(true)}
                className="flex-1 sm:flex-initial rounded-xl bg-purple-600 px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-purple-500 hover:scale-[1.01] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/15"
              >
                <PlusSquare className="h-4 w-4 shrink-0" />
                <span className="truncate">Start Interview</span>
              </button>
              
              <button
                onClick={() => {
                  if (DEFAULT_TEMPLATES.length > 0) {
                    triggerTemplateInterview(DEFAULT_TEMPLATES[0]);
                  }
                }}
                className="flex-1 sm:flex-initial rounded-xl bg-neutral-900 border border-neutral-800/85 hover:bg-neutral-800 hover:text-white hover:border-neutral-700 px-4 sm:px-5 py-3 text-xs sm:text-sm font-semibold text-neutral-300 transition cursor-pointer text-center truncate"
              >
                Try Fast Session
              </button>
            </div>
          </div>

          {/* Futuristic CSS Artwork representing laptop and coding badges */}
          <div className="relative h-60 w-full md:w-[340px] shrink-0 flex items-center justify-center select-none z-10 animate-float-laptop scale-75 sm:scale-90 md:scale-100 transition-transform duration-300">
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

            <div className="flex flex-row items-center justify-center gap-4.5 sm:gap-6 w-full">
              <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 rounded-full border-4 border-neutral-800 flex flex-col items-center justify-center font-bold text-2xl sm:text-3xl text-purple-400 bg-neutral-950 shadow-inner select-none">
                <span className="font-display font-extrabold">{averageScore}%</span>
                <span className="text-[8px] sm:text-[9px] uppercase font-bold tracking-wider text-neutral-500 mt-0.5 sm:mt-1 font-mono">Average</span>
              </div>
              <div className="space-y-1 min-w-0">
                <p className="text-xs sm:text-sm text-neutral-400 font-medium">Overall Performance</p>
                <p className="text-sm sm:text-base text-neutral-200 font-semibold leading-tight">
                  Recorded across <strong className="text-purple-400 font-mono font-bold">{totalCompleted}</strong> sessions
                </p>
              </div>
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
          <div className="lg:col-span-8 rounded-2xl border border-neutral-900 bg-neutral-900/30 p-6 flex flex-col justify-between min-w-0">
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
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#737373" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      dy={8}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      stroke="#737373" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      dx={-5}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-neutral-950/95 border border-neutral-800 rounded-xl p-3 shadow-xl backdrop-blur-md max-w-xs space-y-2 z-50">
                              <div>
                                <p className="text-xs font-bold text-neutral-200">{data.topic}</p>
                                <p className="text-[10px] text-neutral-500 font-mono font-semibold">{data.date}</p>
                              </div>
                              <div className="border-t border-neutral-900 pt-2 space-y-1">
                                <div className="flex items-center justify-between gap-4 text-xs">
                                  <span className="flex items-center gap-1.5 text-neutral-400 font-medium">
                                    <span className="h-2 w-2 rounded-full bg-purple-500" />
                                    Overall Score:
                                  </span>
                                  <span className="font-bold text-purple-400 font-mono">{data.overallScore}%</span>
                                </div>
                                <div className="flex items-center justify-between gap-4 text-xs">
                                  <span className="flex items-center gap-1.5 text-neutral-400">
                                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                                    Technical:
                                  </span>
                                  <span className="font-semibold text-blue-400 font-mono">{data.technicalScore}%</span>
                                </div>
                                <div className="flex items-center justify-between gap-4 text-xs">
                                  <span className="flex items-center gap-1.5 text-neutral-400">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                    Communication:
                                  </span>
                                  <span className="font-semibold text-emerald-400 font-mono">{data.communicationScore}%</span>
                                </div>
                                <div className="flex items-center justify-between gap-4 text-xs">
                                  <span className="flex items-center gap-1.5 text-neutral-400">
                                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                                    Problem Solving:
                                  </span>
                                  <span className="font-semibold text-amber-400 font-mono">{data.problemSolvingScore}%</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={30} 
                      iconType="circle"
                      iconSize={6}
                      wrapperStyle={{ fontSize: '10px', color: '#a3a3a3' }}
                    />
                    <Line 
                      name="Overall Score"
                      type="monotone" 
                      dataKey="overallScore" 
                      stroke="#c084fc" 
                      strokeWidth={3} 
                      activeDot={{ r: 6, stroke: '#171717', strokeWidth: 2 }}
                      dot={{ r: 4, stroke: '#c084fc', strokeWidth: 1, fill: '#171717' }}
                    />
                    <Line 
                      name="Technical"
                      type="monotone" 
                      dataKey="technicalScore" 
                      stroke="#3b82f6" 
                      strokeWidth={1.5} 
                      strokeDasharray="3 3"
                      dot={false}
                      opacity={0.5}
                    />
                    <Line 
                      name="Communication"
                      type="monotone" 
                      dataKey="communicationScore" 
                      stroke="#10b981" 
                      strokeWidth={1.5} 
                      strokeDasharray="3 3"
                      dot={false}
                      opacity={0.5}
                    />
                    <Line 
                      name="Problem Solving"
                      type="monotone" 
                      dataKey="problemSolvingScore" 
                      stroke="#f59e0b" 
                      strokeWidth={1.5} 
                      strokeDasharray="3 3"
                      dot={false}
                      opacity={0.5}
                    />
                  </LineChart>
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
          <div className="rounded-2xl border border-dashed border-purple-500/35 bg-purple-950/5 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-purple-950/5">
            <div className="space-y-1 text-left min-w-0 flex-1">
              <h4 className="text-xs sm:text-sm font-bold text-neutral-100 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-400 animate-pulse shrink-0" />
                <span>Guest Trial Tracker: {Math.max(0, 3 - interviews.length)} of 3 Free Interviews Left</span>
              </h4>
              <p className="text-neutral-400 text-[11px] sm:text-xs leading-relaxed max-w-3xl">
                Preparing as Guest. Start mock sessions to evaluate competence. Register a free account to persist evaluations permanently and view progress.
              </p>
            </div>
            <button
              onClick={onShowAuth}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold text-[11px] sm:text-xs text-white shadow-lg shadow-purple-600/15 cursor-pointer shrink-0 transition w-full sm:w-auto text-center"
            >
              Sign Up / Login
            </button>
          </div>
        )}

        {/* Take Interviews Card Templates */}
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-2xl font-display font-extrabold tracking-tight text-neutral-100">Practice Templates</h2>
            <button
              onClick={() => setShowAddTemplateModal(true)}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold text-xs text-white shadow-lg shadow-purple-600/15 cursor-pointer flex items-center justify-center gap-1.5 transition hover:scale-[1.01] w-full sm:w-auto"
            >
              <PlusSquare className="h-4 w-4" />
              <span>Create Custom Template</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
            {[...DEFAULT_TEMPLATES, ...customTemplates].map((item) => {
              const isCustom = !DEFAULT_TEMPLATES.some((t) => t.id === item.id);
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-neutral-900 bg-neutral-900/15 p-5 flex flex-col justify-between hover:border-purple-500/25 hover:bg-neutral-900/30 transition duration-300 group shadow-sm h-full relative"
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
                            onClick={(e) => handleDeleteTemplate(item.id, e)}
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
                    onClick={() => triggerTemplateInterview(item)}
                    className="w-full mt-5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white px-4 py-3 text-sm font-semibold text-center hover:bg-purple-600 hover:border-transparent transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Start Practice</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
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
                  className="rounded-2xl border border-neutral-900 bg-neutral-900/15 p-4 sm:p-5 hover:border-neutral-800 hover:bg-neutral-900/25 transition duration-300 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-5 shadow-sm"
                >
                  <div className="flex flex-row items-start gap-3.5 w-full min-w-0">
                    <div className="rounded-xl bg-purple-500/10 p-2.5 sm:p-3 text-purple-400 shrink-0 border border-purple-500/15">
                      <Award className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-purple-400 font-mono">
                        {session.difficulty} • {session.role}
                      </h4>
                      <h3 className="text-sm sm:text-base font-display font-bold text-neutral-150 truncate">
                        Topic Focus: <span className="text-neutral-200">{session.topic}</span>
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs text-neutral-500">
                        <span className="flex items-center gap-1 shrink-0">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{new Date(session.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </span>
                        <span>•</span>
                        <span className="shrink-0">Duration: {Math.floor((session.duration || 0) / 60)}m {(session.duration || 0) % 60}s</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
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
                        className="rounded-xl border border-neutral-800 hover:bg-purple-600 hover:border-transparent px-4 py-3 text-sm font-semibold text-neutral-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-[1.01]"
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
        <CustomInterviewPlannerModal
          onClose={() => setShowCustomConfig(false)}
          onLaunch={(role, topic, difficulty) => {
            setShowCustomConfig(false);
            triggerCustomInterview(role, topic, difficulty);
          }}
        />
      )}

      {/* Create Custom Template Modal */}
      {showAddTemplateModal && (
        <CustomTemplateCreatorModal
          onClose={() => setShowAddTemplateModal(false)}
          onSave={async (role, topic, desc, icon) => {
            await handleCreateTemplate(role, topic, desc, icon);
            setShowAddTemplateModal(false);
          }}
        />
      )}

      {/* Trial Limit Reached Modal */}
      {isUpgradeModalOpen && (
        <UpgradeTrialModal
          onClose={() => setIsUpgradeModalOpen(false)}
          onShowAuth={onShowAuth}
        />
      )}

      {/* Advanced Settings Modal */}
      {showSettings && (
        <ApiSettingsModal
          profile={profile}
          onClose={() => setShowSettings(false)}
          onSave={async (name, geminiEmail, geminiApiKey) => {
            await handleSaveSettings(name, geminiEmail, geminiApiKey);
            setShowSettings(false);
          }}
        />
      )}

      {/* Instant Notification Toast */}
      {settingsSavedToast && (
        <div className="fixed bottom-6 right-6 flex items-center gap-3 bg-neutral-900/95 border border-emerald-500/30 text-white rounded-xl py-3 px-4 shadow-xl z-50 animate-bounce backdrop-blur">
          <div className="h-8 w-8 bg-emerald-500/10 text-emerald-400 rounded-lg flex items-center justify-center shrink-0">
            <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-neutral-150">Settings Profile Synced</p>
            <p className="text-[10px] text-neutral-400 leading-none mt-1">Key parameters integrated securely!</p>
          </div>
        </div>
      )}

      {/* Admin User Feedbacks Viewer */}
      <AnimatePresence>
        {showAdminFeedbacks && isAdmin && (
          <AdminFeedbackModal onClose={() => setShowAdminFeedbacks(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
