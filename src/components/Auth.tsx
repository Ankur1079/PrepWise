import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { z } from "zod";
import { Shield, Sparkles, User, Key, Mail, Lock, LogIn, ArrowRight } from "lucide-react";

import { UserProfile } from "../types";

// Register schema with Zod
const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  geminiEmail: z.string().email("Invalid email format").optional().or(z.literal("")),
  geminiApiKey: z
    .string()
    .regex(/^AIzaSy[A-Za-z0-9_-]{33}$/, "Invalid Gemini API Key format (usually starts with AIzaSy and is 39 chars)")
    .optional()
    .or(z.literal("")),
});

// Login schema with Zod
const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

interface AuthProps {
  onAuthSuccess: (profile?: UserProfile) => void;
  onCancel?: () => void;
}

export default function Auth({ onAuthSuccess, onCancel }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [geminiEmail, setGeminiEmail] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          setIsLoading(true);
          const userDocRef = doc(db, "users", result.user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          let profileData: UserProfile;
          if (!userDocSnap.exists()) {
            profileData = {
              uid: result.user.uid,
              name: result.user.displayName || "Candidate Pro",
              email: result.user.email || "",
              geminiEmail: result.user.email || "",
              geminiApiKey: "",
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, profileData);
          } else {
            profileData = userDocSnap.data() as UserProfile;
          }
          onAuthSuccess(profileData);
        }
      } catch (err: any) {
        console.error("Redirect Auth Error:", err);
        setServerError(err.message || "Failed to process Google Redirect Login.");
      } finally {
        setIsLoading(false);
      }
    };
    checkRedirect();
  }, [onAuthSuccess]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError("");
    setIsLoading(true);

    try {
      let finalProfile: UserProfile | undefined;
      
      if (isSignUp) {
        // Validate with Zod
        const valData = signUpSchema.parse({
          name,
          email,
          password,
          geminiEmail,
          geminiApiKey,
        });

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          valData.email,
          valData.password
        );

        finalProfile = {
          uid: userCredential.user.uid,
          name: valData.name,
          email: valData.email,
          geminiEmail: valData.geminiEmail || "",
          geminiApiKey: valData.geminiApiKey || "",
          createdAt: new Date().toISOString(),
        };

        // Store user profile details in Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), finalProfile);
      } else {
        // Validate Login with Zod
        const valData = signInSchema.parse({ email, password });
        const userCredential = await signInWithEmailAndPassword(auth, valData.email, valData.password);
        
        // Load the document instantly and pass to App state to prevent any screen flash or missing config lag
        const userDocSnap = await getDoc(doc(db, "users", userCredential.user.uid));
        if (userDocSnap.exists()) {
          finalProfile = userDocSnap.data() as UserProfile;
        }
      }

      onAuthSuccess(finalProfile);
    } catch (err: any) {
      console.error(err);
      if (err instanceof z.ZodError) {
        const fieldErrors: { [key: string]: string } = {};
        err.issues.forEach((issues) => {
          if (issues.path[0]) {
            fieldErrors[issues.path[0] as string] = issues.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        // Firebase or network errors
        if (err.code === "auth/email-already-in-use") {
          setServerError("This email address is already registered.");
        } else if (err.code === "auth/invalid-credential") {
          setServerError("Invalid verification credentials. Check email or password.");
        } else if (err.code === "auth/weak-password") {
          setServerError("Password is too weak.");
        } else {
          setServerError(err.message || "An authentication error occurred.");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrors({});
    setServerError("");
    setIsLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      // Google Auth provider credentials
      const result = await signInWithPopup(auth, provider);
      
      const userDocRef = doc(db, "users", result.user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      let profileData: UserProfile;
      if (!userDocSnap.exists()) {
        profileData = {
          uid: result.user.uid,
          name: result.user.displayName || "Candidate Pro",
          email: result.user.email || "",
          geminiEmail: result.user.email || "",
          geminiApiKey: "",
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, profileData);
      } else {
        profileData = userDocSnap.data() as UserProfile;
      }
      
      onAuthSuccess(profileData);
    } catch (err: any) {
      console.error("Google Auth error:", err);
      if (err.code === "auth/popup-blocked" || err.message?.includes("popup-blocked") || err.message?.includes("popup")) {
        setServerError("Pop-up blocked in sandbox. Redirecting to Google login...");
        try {
          const provider = new GoogleAuthProvider();
          await signInWithRedirect(auth, provider);
          return; // Let the redirect load over the page
        } catch (redirectErr: any) {
          console.error("Redirect error:", redirectErr);
          setServerError("Failed to redirect. Try opening the application in a new tab using the icon at the top right.");
        }
      } else {
        setServerError(err.message || "Failed to authenticate with Google.");
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent px-4 py-12 text-white">
      <div className="absolute top-10 flex items-center gap-3">
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="h-10 w-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              {/* Rich orange-yellow gradient for the loop */}
              <linearGradient id="logoGradAuth" x1="20%" y1="10%" x2="80%" y2="90%">
                <stop offset="0%" stopColor="#FBBF24" />
                <stop offset="45%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#DC2626" />
              </linearGradient>
              
              {/* Rich orange-red gradient for the vertical stem */}
              <linearGradient id="pStemGradAuth" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#EA580C" />
                <stop offset="100%" stopColor="#991B1B" />
              </linearGradient>

              {/* Fold shadow to create 3D depth */}
              <linearGradient id="pFoldShadowAuth" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#000000" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </linearGradient>

              <filter id="logoGlowAuth" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Outer pulsing energy accent ring */}
            <circle cx="50" cy="50" r="42" stroke="url(#logoGradAuth)" strokeWidth="1.5" strokeDasharray="4 4" className="opacity-25 animate-[spin_60s_linear_infinite]" />

            {/* Left Vertical Stem Ribbon (layered below loop for 3D overlap) */}
            <path 
              d="M 32,35 H 44 V 75 C 44,75 32,75 32,68 Z" 
              fill="url(#pStemGradAuth)"
              className="opacity-95"
            />

            {/* Fold shadow on top of stem */}
            <path
              d="M 32,35 H 44 V 47 H 32 Z"
              fill="url(#pFoldShadowAuth)"
              className="opacity-60"
            />

            {/* Main Curved Loop Ribbon (layered on top) */}
            <path 
              d="M 32,24 H 56 C 68,24 76,32 76,43 C 76,54 68,62 56,62 H 32 V 51 H 55 C 60,51 64,47 64,43 C 64,39 60,35 55,35 H 32 Z" 
              fill="url(#logoGradAuth)" 
              filter="url(#logoGlowAuth)"
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
        <span className="text-2xl font-display font-black tracking-tight bg-gradient-to-r from-neutral-50 via-neutral-150 to-neutral-300 bg-clip-text text-transparent">PrepWise</span>
      </div>

      <div className="w-full max-w-md space-y-6 sm:space-y-8 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight">
            {isSignUp ? "Create an account" : "Welcome Back"}
          </h2>
          <p className="mt-2 text-sm text-neutral-400">
            {isSignUp
              ? "Join PrepWise to master your interview performance"
              : "Sign in to access your interview practice simulator"}
          </p>
        </div>

        {serverError && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400 text-center">
            {serverError}
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleAuth}>
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950/50 py-2.5 pl-10 pr-4 text-sm text-neutral-200 outline-none transition placeholder:text-neutral-600 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30"
                  placeholder="e.g. John Doe"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-xs text-red-400">{errors.name}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950/50 py-2.5 pl-10 pr-4 text-sm text-neutral-200 outline-none transition placeholder:text-neutral-600 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30"
                placeholder="you@example.com"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-400">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950/50 py-2.5 pl-10 pr-4 text-sm text-neutral-200 outline-none transition placeholder:text-neutral-600 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30"
                placeholder="••••••••"
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-400">{errors.password}</p>
            )}
          </div>

          {isSignUp && (
            <div className="border-t border-neutral-800 pt-4 mt-6 space-y-4">
              <div className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-purple-400" />
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                  Gemini API Custom Sync (Optional)
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5 flex items-center gap-1">
                  <span>Registered Gemini Email</span>
                  <span className="text-[10px] lowercase text-neutral-500 font-normal">
                    (for seamless cloud logs)
                  </span>
                </label>
                <input
                  type="email"
                  value={geminiEmail}
                  onChange={(e) => setGeminiEmail(e.target.value)}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950/50 py-2.5 px-3 text-sm text-neutral-200 outline-none transition placeholder:text-neutral-700 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30"
                  placeholder="gemini-dev@yourcompany.com"
                />
                {errors.geminiEmail && (
                  <p className="mt-1 text-xs text-red-500">{errors.geminiEmail}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5 flex items-center justify-between">
                  <span>Personal Gemini API Key</span>
                  <span className="text-[10px] text-yellow-500 font-normal">
                    Secure Client-Side
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                    <Key className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950/50 py-2.5 pl-10 pr-4 text-sm font-mono text-neutral-200 outline-none transition placeholder:text-neutral-700 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30"
                    placeholder="AIzaSy..."
                  />
                </div>
                {errors.geminiApiKey && (
                  <p className="mt-1 text-xs text-red-400">{errors.geminiApiKey}</p>
                )}
                <p className="mt-1 text-[11px] text-neutral-500 leading-normal">
                  If provided, this key is saved in secure cloud storage under lock, or fallback to server credentials.
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 flex items-center justify-center gap-2 rounded-lg bg-purple-600 py-3 text-sm font-semibold text-white hover:bg-purple-500 hover:scale-[1.01] transition disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {isLoading ? (
              <span className="border-2 border-white/30 border-t-white h-4 w-4 rounded-full animate-spin"></span>
            ) : (
              <>
                <span>{isSignUp ? "Sign Up" : "Sign In"}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-neutral-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-neutral-900 px-3 text-neutral-500 font-bold tracking-wider">Or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 rounded-lg border border-neutral-800 bg-neutral-950/40 py-3 text-sm font-semibold text-neutral-300 hover:bg-neutral-950 hover:text-white hover:border-purple-500/30 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fillRule="evenodd"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.11-.3-.21-.63-.21-.63z"
              fillRule="evenodd"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 6.09l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fillRule="evenodd"
            />
          </svg>
          <span>Google Account Login</span>
        </button>

        <div className="text-center pt-2 flex flex-col gap-2">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrors({});
              setServerError("");
            }}
            className="text-xs text-neutral-400 hover:text-white underline transition cursor-pointer"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account yet? Create one"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-neutral-500 hover:text-neutral-300 font-medium transition cursor-pointer mt-1"
            >
              Continue as Guest
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
