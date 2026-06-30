import React from "react";

interface UpgradeTrialModalProps {
  onClose: () => void;
  onShowAuth: () => void;
}

export default function UpgradeTrialModal({ onClose, onShowAuth }: UpgradeTrialModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/85 backdrop-blur-md">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 relative overflow-hidden shadow-2xl space-y-5">
        {/* Background elements */}
        <div className="absolute top-0 right-0 h-40 w-40 bg-purple-600/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-40 w-40 bg-indigo-600/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

        <div className="flex flex-col items-center text-center space-y-4 pt-4">
          <div className="h-14 w-14 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center text-orange-400 shadow-inner">
            <svg className="h-10 w-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logoGradUpgrade" x1="20%" y1="10%" x2="80%" y2="90%">
                  <stop offset="0%" stopColor="#FBBF24" />
                  <stop offset="45%" stopColor="#F97316" />
                  <stop offset="100%" stopColor="#DC2626" />
                </linearGradient>
                <linearGradient id="pStemGradUpgrade" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#EA580C" />
                  <stop offset="100%" stopColor="#991B1B" />
                </linearGradient>
                <linearGradient id="pFoldShadowUpgrade" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#000000" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                </linearGradient>
                <filter id="logoGlowUpgrade" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              <circle cx="50" cy="50" r="42" stroke="url(#logoGradUpgrade)" strokeWidth="1.5" strokeDasharray="4 4" className="opacity-25 animate-[spin_60s_linear_infinite]" />

              <path 
                d="M 32,35 H 44 V 75 C 44,75 32,75 32,68 Z" 
                fill="url(#pStemGradUpgrade)"
                className="opacity-95"
              />

              <path
                d="M 32,35 H 44 V 47 H 32 Z"
                fill="url(#pFoldShadowUpgrade)"
                className="opacity-60"
              />

              <path 
                d="M 32,24 H 56 C 68,24 76,32 76,43 C 76,54 68,62 56,62 H 32 V 51 H 55 C 60,51 64,47 64,43 C 64,39 60,35 55,35 H 32 Z" 
                fill="url(#logoGradUpgrade)" 
                filter="url(#logoGlowUpgrade)"
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
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-neutral-800 text-xs text-neutral-400 hover:text-white hover:bg-neutral-800/60 font-medium transition cursor-pointer"
          >
            Close View
          </button>
          <button
            type="button"
            onClick={onShowAuth}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs text-white font-semibold transition shadow-lg shadow-purple-600/10 cursor-pointer"
          >
            Sign In / Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}
