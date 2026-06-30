import React from "react";
import { auth } from "../../firebase";
import {
  Settings,
  LogOut,
  User,
  Menu,
  X,
  MessageSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DashboardHeaderProps {
  profile: any;
  isAdmin: boolean;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  setShowSettings: (open: boolean) => void;
  setShowAdminFeedbacks: (open: boolean) => void;
  onShowAuth: () => void;
  handleSignOut: () => void;
}

export default function DashboardHeader({
  profile,
  isAdmin,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  setShowSettings,
  setShowAdminFeedbacks,
  onShowAuth,
  handleSignOut,
}: DashboardHeaderProps) {
  return (
    <nav className="border-b border-neutral-900 bg-neutral-950/80 sticky top-0 z-30 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="h-9 w-9" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logoGrad" x1="20%" y1="10%" x2="80%" y2="90%">
                  <stop offset="0%" stopColor="#FBBF24" />
                  <stop offset="45%" stopColor="#F97316" />
                  <stop offset="100%" stopColor="#DC2626" />
                </linearGradient>
                
                <linearGradient id="pStemGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#EA580C" />
                  <stop offset="100%" stopColor="#991B1B" />
                </linearGradient>

                <linearGradient id="pFoldShadow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#000000" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                </linearGradient>

                <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              <circle cx="50" cy="50" r="42" stroke="url(#logoGrad)" strokeWidth="1.5" strokeDasharray="4 4" className="opacity-25 animate-[spin_60s_linear_infinite]" />

              <path 
                d="M 32,35 H 44 V 75 C 44,75 32,75 32,68 Z" 
                fill="url(#pStemGrad)"
                className="opacity-95"
              />

              <path
                d="M 32,35 H 44 V 47 H 32 Z"
                fill="url(#pFoldShadow)"
                className="opacity-60"
              />

              <path 
                d="M 32,24 H 56 C 68,24 76,32 76,43 C 76,54 68,62 56,62 H 32 V 51 H 55 C 60,51 64,47 64,43 C 64,39 60,35 55,35 H 32 Z" 
                fill="url(#logoGrad)" 
                filter="url(#logoGlow)"
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
              className="p-2.5 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white hover:border-neutral-700 hover:bg-neutral-800/80 transition cursor-pointer shadow-sm relative"
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
              className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 text-sm hover:bg-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 px-4 py-2 rounded-xl transition cursor-pointer shadow-sm"
            >
              <LogOut className="h-4 w-4" />
              <span>Exit</span>
            </button>
          ) : (
            <button
              onClick={onShowAuth}
              className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-sm font-semibold text-white px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-purple-600/20"
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
                  className="flex items-center justify-center gap-2.5 w-full max-w-[280px] h-12 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white transition cursor-pointer shadow-sm"
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
                className="flex items-center justify-center gap-2.5 w-full max-w-[280px] h-12 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white transition cursor-pointer shadow-sm"
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
                  className="flex items-center justify-center gap-2.5 w-full max-w-[280px] h-12 bg-neutral-900 border border-neutral-800 text-sm hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-xl transition cursor-pointer shadow-sm"
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
                  className="flex items-center justify-center gap-2.5 w-full max-w-[280px] h-12 bg-purple-600 hover:bg-purple-500 text-sm font-semibold text-white px-5 rounded-xl transition-all cursor-pointer shadow-lg shadow-purple-600/20"
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
  );
}
