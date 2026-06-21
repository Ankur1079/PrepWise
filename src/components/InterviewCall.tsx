import React, { useState, useEffect, useRef } from "react";
import { InterviewSession, InterviewMessage, InterviewFeedback } from "../types";
import { db } from "../firebase";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import AudioVisualizer from "./AudioVisualizer";
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  PhoneOff,
  User,
  Cpu,
  RefreshCw,
  Clock,
  ArrowRight,
} from "lucide-react";

interface InterviewCallProps {
  session: InterviewSession;
  customApiKey?: string;
  onFeedbackComplete: (feedback: InterviewFeedback) => void;
  onCancel: () => void;
}

export default function InterviewCall({
  session,
  customApiKey,
  onFeedbackComplete,
  onCancel,
}: InterviewCallProps) {
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [status, setStatus] = useState<"connecting" | "active" | "evaluating">("connecting");
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [micActive, setMicActive] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [handsFree, setHandsFree] = useState(true);
  const [isAutoSending, setIsAutoSending] = useState(false);
  
  // Timer states
  const [seconds, setSeconds] = useState(0);

  // Smooth evaluation progress indicators
  const [evalProgress, setEvalProgress] = useState(0);
  const [evalPhase, setEvalPhase] = useState("Initializing feedback compiler...");

  useEffect(() => {
    if (status !== "evaluating") {
      setEvalProgress(0);
      setEvalPhase("Initializing feedback compiler...");
      return;
    }

    const progressPhases = [
      { text: "Ingesting transcript & loading dialogue context...", maxProgress: 20 },
      { text: "Analyzing technical accuracy and correctness...", maxProgress: 45 },
      { text: "Evaluating communication clarity & tone...", maxProgress: 70 },
      { text: "Synthesizing positives, areas of improvement & study guides...", maxProgress: 90 },
      { text: "Preparing final evaluation report card...", maxProgress: 96 }
    ];

    const interval = setInterval(() => {
      setEvalProgress((prev) => {
        const nextProgress = prev + Math.floor(Math.random() * 3) + 1;
        
        let selectedPhase = progressPhases[progressPhases.length - 1].text;
        for (const phase of progressPhases) {
          if (nextProgress <= phase.maxProgress) {
            selectedPhase = phase.text;
            break;
          }
        }
        setEvalPhase(selectedPhase);

        if (nextProgress >= 96) {
          return 96;
        }
        return nextProgress;
      });
    }, 220);

    return () => clearInterval(interval);
  }, [status]);

  // Refs for auto-scroll andSpeech recognition
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const textBeforeMicRef = useRef<string>("");
  const latestInputTextRef = useRef("");
  const autoSubmitTimeoutRef = useRef<any>(null);

  useEffect(() => {
    latestInputTextRef.current = inputText;
  }, [inputText]);

  useEffect(() => {
    return () => {
      if (autoSubmitTimeoutRef.current) {
        clearTimeout(autoSubmitTimeoutRef.current);
      }
    };
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onresult = (event: any) => {
        let sessionTranscript = "";
        let hasFinal = false;
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            sessionTranscript += event.results[i][0].transcript + " ";
            hasFinal = true;
          }
        }
        
        sessionTranscript = sessionTranscript.trim();
        if (sessionTranscript) {
          const prefix = textBeforeMicRef.current.trim();
          const fullText = prefix ? `${prefix} ${sessionTranscript}` : sessionTranscript;
          setInputText(fullText);

          // Clear any active submission timer when new speech comes in
          if (autoSubmitTimeoutRef.current) {
            clearTimeout(autoSubmitTimeoutRef.current);
          }

          if (handsFree && hasFinal) {
            setIsAutoSending(true);
            autoSubmitTimeoutRef.current = setTimeout(() => {
              setIsAutoSending(false);
              const text = latestInputTextRef.current.trim();
              if (text) {
                sendMessage(undefined, text);
              }
            }, 1800); // 1.8 seconds of silence detected after final speech segment
          }
        }
      };

      rec.onerror = (err: any) => {
        console.error("Speech Recognition Error:", err);
        // Avoid disabling micActive on non-fatal status events
        if (err.error === "aborted" || err.error === "no-speech") {
          return;
        }
        
        setMicActive(false);
        setIsListening(false);
        
        let message = "Vocal capture error.";
        if (err.error === "not-allowed") {
          message = "Microphone permission is blocked. Click the lock/mic icon in your address bar to allow mic access, or try opening the app in a new tab.";
        } else if (err.error === "service-not-allowed") {
          message = "Speech Recognition is restricted. Opening the app in a new tab using the icon at the top right usually solves this.";
        } else if (err.error === "network") {
          message = "Chrome prohibits Speech Recognition servers within iframe previews (throws a 'network' error). Opening the app in a new tab completely resolves this!";
        } else {
          message = `Voice capture ended: ${err.error || "unknown"}`;
        }
        setMicError(message);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  // Timer counter effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === "active") {
      timer = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [status]);

  // Initial trigger greeting
  useEffect(() => {
    const greetingText = `Hello! Welcome to your mock interview for the ${session.difficulty} ${session.role} position, specializing in ${session.topic}. I'm PrepWise AI, and I will be your assessor today. Are you ready to begin?`;
    
    // Set immediate status to active with initial greeting message
    setTimeout(() => {
      setStatus("active");
      const greetingMsg: InterviewMessage = {
        id: "greet-1",
        sender: "ai",
        text: greetingText,
        createdAt: new Date().toISOString(),
      };
      setMessages([greetingMsg]);
      speakUtterance(greetingText);
    }, 1200);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [session]);

  // Scroll to bottom when transcripts grow
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle Speech synthesis vocalization
  const speakUtterance = (text: string) => {
    if (!speechEnabled) return;
    window.speechSynthesis.cancel(); // clear previous speech queue
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Choose professional MALE voice
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = voices.find((v) => {
      const nameLower = v.name.toLowerCase();
      const langLower = v.lang.toLowerCase();
      return (
        langLower.startsWith("en") &&
        (nameLower.includes("male") ||
         nameLower.includes("david") ||
         nameLower.includes("george") ||
         nameLower.includes("mark") ||
         nameLower.includes("daniel") ||
         nameLower.includes("oliver") ||
         nameLower.includes("malk") ||
         nameLower.includes("en-us-x-sfg") ||
         nameLower.includes("premium-male"))
      );
    });

    // Fallback to high-quality English voice if no male voice is found
    if (!selectedVoice) {
      selectedVoice = voices.find(
        (v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural"))
      );
    }
    // Final fallback
    if (!selectedVoice) {
      selectedVoice = voices.find((v) => v.lang.startsWith("en"));
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.onstart = () => {
      setIsAiSpeaking(true);
      setIsListening(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
    utterance.onend = () => {
      setIsAiSpeaking(false);
      // Auto-listen if microphone trigger configured
      if (micActive && recognitionRef.current) {
        try {
          textBeforeMicRef.current = inputText;
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          console.error("Failed to resume speech", e);
        }
      }
    };
    utterance.onerror = () => {
      setIsAiSpeaking(false);
    };
    window.speechSynthesis.speak(utterance);
  };

  // Toggle vocal microphone capture
  const toggleMic = async () => {
    setMicError(null);
    if (!recognitionRef.current) {
      alert("Speech recognition is not fully supported in this browser. Please type your responses.");
      return;
    }

    if (micActive) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setMicActive(false);
      setIsListening(false);
    } else {
      try {
        // Request microphone permission explicitly first, to make sure it is granted
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          await navigator.mediaDevices.getUserMedia({ audio: true }).catch((err) => {
            throw new Error("Microphone permission denied. Click the mic/lock icon in your browser address bar to allow access.");
          });
        }
        
        setMicActive(true);
        textBeforeMicRef.current = inputText;
        
        try {
          recognitionRef.current.start();
        } catch (_) {}
        
        setIsListening(true);
      } catch (err: any) {
        console.error("Failed to start speech capture", err);
        setMicError(err.message || "Failed to start voice recognition. Please ensure microphone permissions are granted and try opening in a new tab.");
        setMicActive(false);
        setIsListening(false);
      }
    }
  };

  // Post conversational inputs to internal Gemini Gateway
  const sendMessage = async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    
    // Reset any active auto-submission timers
    if (autoSubmitTimeoutRef.current) {
      clearTimeout(autoSubmitTimeoutRef.current);
      autoSubmitTimeoutRef.current = null;
    }
    setIsAutoSending(false);

    const messageText = (overrideText !== undefined ? overrideText : inputText).trim();
    if (!messageText || status !== "active") return;

    window.speechSynthesis.cancel(); // Stop playing anything AI was saying
    
    const userMsg: InterviewMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: messageText,
      createdAt: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText("");
    latestInputTextRef.current = "";
    setIsListening(false);
    setIsAiSpeaking(false);
    textBeforeMicRef.current = "";
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }

    try {
      // Temporary AI generating bubble
      setIsAiSpeaking(true);

      const res = await fetch("/api/interview/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          role: session.role,
          difficulty: session.difficulty,
          topic: session.topic,
          customApiKey: customApiKey,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed stream response");
      }

      const data = await res.json();
      
      const aiResponseMsg: InterviewMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "ai",
        text: data.text,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiResponseMsg]);
      speakUtterance(data.text);
    } catch (err: any) {
      console.error(err);
      const errorMsg: InterviewMessage = {
        id: `msg-err-${Date.now()}`,
        sender: "ai",
        text: `I encountered an unexpected network error: "${err.message}". Let's continue. Can you retry or elaborate?`,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAiSpeaking(false);
    }
  };

  // Convert timer seconds to friendly display minutes
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Complete and POST evaluation request
  const finishInterview = async () => {
    if (messages.length < 2) {
      alert("Please exchange at least a couple of messages before completing the interview.");
      return;
    }

    setStatus("evaluating");
    window.speechSynthesis.cancel();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }

    try {
      const res = await fetch("/api/interview/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages,
          role: session.role,
          difficulty: session.difficulty,
          topic: session.topic,
          customApiKey: customApiKey,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Analysis response failure");
      }

      const feedbackData: InterviewFeedback = await res.json();

      // Complete progress animation beautifully
      setEvalProgress(100);
      setEvalPhase("Evaluation report completed successfully! Loading dashboard...");
      await new Promise(resolve => setTimeout(resolve, 600));

      if (session.userId === "guest") {
        // Save to localStorage
        const saved = localStorage.getItem("prepwise_trial_sessions");
        const guestSessions = saved ? JSON.parse(saved) : [];
        const updatedSessions = guestSessions.map((s: any) => {
          if (s.id === session.id) {
            return {
              ...s,
              status: "completed",
              score: feedbackData.overallScore,
              feedback: feedbackData,
              createdAt: new Date().toISOString(),
              duration: seconds
            };
          }
          return s;
        });
        localStorage.setItem("prepwise_trial_sessions", JSON.stringify(updatedSessions));
        onFeedbackComplete(feedbackData);
      } else {
        // Store in firestore permanently
        const interviewDocRef = await addDoc(collection(db, "interviews"), {
          userId: session.userId,
          role: session.role,
          difficulty: session.difficulty,
          topic: session.topic,
          status: "completed",
          score: feedbackData.overallScore,
          feedback: feedbackData,
          createdAt: new Date().toISOString(),
          duration: seconds,
        });

        // Call feedback complete handler
        onFeedbackComplete(feedbackData);
      }
    } catch (err: any) {
      console.error("Evaluation crash:", err);
      alert(`Feedback processing error: ${err.message}. Please retry.`);
      setStatus("active");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-neutral-200 min-h-[85vh] flex flex-col justify-between">
      {/* Top dashboard connection strip */}
      <div className="flex items-center justify-between border-b border-neutral-900 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="h-3 w-3 rounded-full bg-emerald-500 animate-ping absolute inset-0" />
            <div className="h-3 w-3 rounded-full bg-emerald-500" />
          </div>
          <div>
            <h2 className="text-base font-display font-bold tracking-tight text-neutral-100 flex items-center gap-2">
              <span>Mock Practice: {session.role} ({session.difficulty})</span>
            </h2>
            <span className="text-xs text-neutral-400 capitalize">Focus Area: {session.topic}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 rounded-xl bg-neutral-900 border border-neutral-800 px-3.5 py-2 font-mono text-neutral-300">
            <Clock className="h-4 w-4 text-purple-400" />
            <span>{formatTime(seconds)}</span>
          </div>

          <button
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className={`p-2.5 rounded-xl border transition cursor-pointer ${
              speechEnabled
                ? "bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
                : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-400"
            }`}
            title={speechEnabled ? "Mute Bot Voice Output" : "Enable Bot Voice Output"}
          >
            {speechEnabled ? <Volume2 className="h-4.5 w-4.5" /> : <VolumeX className="h-4.5 w-4.5" />}
          </button>

          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 px-3.5 py-2 rounded-xl text-red-400 transition cursor-pointer"
          >
            <PhoneOff className="h-4 w-4" />
            <span className="hidden sm:inline font-semibold">Exit</span>
          </button>
        </div>
      </div>

      {status === "connecting" && (
        <div className="flex flex-col items-center justify-center flex-grow py-24 space-y-5">
          <div className="relative flex items-center justify-center">
            <div className="absolute h-20 w-20 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
            <div className="h-12 w-12 rounded-full bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-600/20">
              <Cpu className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-display font-bold text-neutral-100">Connecting Secure Channels...</h3>
            <p className="text-sm text-neutral-400 max-w-sm leading-relaxed">
              PrepWise AI model evaluator is compiling target parameters for {session.topic}. Please stay online.
            </p>
          </div>
        </div>
      )}

      {status === "evaluating" && (
        <div className="flex flex-col items-center justify-center flex-grow py-24 space-y-8">
          <div className="relative p-8 flex flex-col items-center justify-center bg-neutral-900/50 border border-neutral-800 rounded-2xl w-full max-w-lg text-center py-12 shadow-2xl">
            <RefreshCw className="h-14 w-14 text-orange-400 animate-spin mb-5" />
            <h3 className="text-2xl font-display font-extrabold text-neutral-150">Synthesizing Feedback Report</h3>
            <p className="text-sm text-orange-400 font-mono text-[11px] uppercase tracking-wider mb-2.5 animate-pulse">
              {evalProgress}% Completed
            </p>
            <p className="text-xs text-neutral-400 min-h-[36px] max-w-sm leading-relaxed italic">
              "{evalPhase}"
            </p>
            <div className="w-full bg-neutral-950 rounded-full h-2 mt-6 overflow-hidden border border-neutral-800">
              <div 
                className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 h-full transition-all duration-300 rounded-full" 
                style={{ width: `${evalProgress}%` }} 
              />
            </div>
          </div>
        </div>
      )}

      {status === "active" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow py-6 overflow-hidden items-stretch">
          {/* Visual Call Center panel: column 1 */}
          <div className="lg:col-span-5 flex flex-col justify-between items-center bg-neutral-900/40 rounded-2xl border border-neutral-800/80 p-6 space-y-6">
            <div className="text-center space-y-1">
              <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-3.5 py-1 text-xs font-semibold text-purple-400 font-mono">
                Live AI Assistant
              </span>
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1.5 font-bold">PrepWise Voice-Ready Agent</p>
            </div>

            {/* Simulated Animated Portal */}
            <div className="relative flex items-center justify-center h-44 w-44">
              <div
                className={`absolute inset-0 rounded-full border border-purple-500/10 scale-[1.3] transition-transform duration-500 ${
                  isAiSpeaking ? "animate-ping opacity-60" : ""
                }`}
              />
              <div
                className={`absolute inset-0 rounded-full border border-teal-500/10 scale-[1.1] transition-transform duration-500 ${
                  isListening ? "animate-pulse" : ""
                }`}
              />

              <div className="relative h-28 w-28 rounded-full bg-neutral-950 border-2 border-neutral-800 flex items-center justify-center shadow-xl overflow-hidden">
                <Cpu className={`h-12 w-12 text-purple-400 ${isAiSpeaking ? "scale-110 rotate-12 transition-transform" : ""}`} />
              </div>
            </div>

            {/* Audio frequency wave simulation */}
            <AudioVisualizer isSpeaking={isAiSpeaking} isListening={isListening} isSilent={!isAiSpeaking && !isListening} />

            <div className="w-full text-center space-y-2.5">
              <p className="text-sm font-semibold text-neutral-200">
                {isAiSpeaking
                  ? "AI Interviewer is speaking..."
                  : isAutoSending
                  ? "Silence detected! Sending reply..."
                  : isListening
                  ? "Listening to Candidate's response..."
                  : "Microphone Silent. Tap button below to speak."}
              </p>
              {isListening && handsFree && (
                <span className="inline-flex items-center gap-1.5 text-xs text-green-400 bg-green-950/20 border border-green-500/20 px-3 py-1 rounded-full animate-pulse mx-auto font-mono">
                  ● Hands-free Mode Active (AI responds on pause)
                </span>
              )}
              {micError && (
                <div className="flex flex-col gap-2.5 max-w-xs mx-auto text-left">
                  <p className="text-xs text-red-400 bg-red-950/30 border border-red-500/20 rounded-xl px-3 py-2.5 leading-relaxed select-text">
                    {micError}
                  </p>
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 active:bg-purple-700 rounded-xl transition-all shadow-md cursor-pointer text-center"
                  >
                    ⚡ Click to Launch in standard tab (Fixes Error!) ↗
                  </a>
                </div>
              )}
              {!(window as any).SpeechRecognition && !(window as any).webkitSpeechRecognition && (
                <p className="text-xs text-yellow-550 leading-relaxed max-w-xs mx-auto">
                  Vocal capture is optimized in Chrome/Edge. In other browsers, type your replies on the right.
                </p>
              )}
            </div>

            {/* Hands-Free Auto-Send Toggle */}
            {micActive && (
              <label className="flex items-center gap-3 text-sm font-medium text-neutral-400 select-none cursor-pointer bg-neutral-950/40 px-4 py-2.5 rounded-xl border border-neutral-800/80 hover:border-purple-500/30 transition shadow-inner">
                <input
                  type="checkbox"
                  checked={handsFree}
                  onChange={(e) => {
                    setHandsFree(e.target.checked);
                    if (!e.target.checked && autoSubmitTimeoutRef.current) {
                      clearTimeout(autoSubmitTimeoutRef.current);
                      autoSubmitTimeoutRef.current = null;
                    }
                    setIsAutoSending(false);
                  }}
                  className="rounded border-neutral-700 bg-neutral-900 text-purple-600 focus:ring-purple-500/30 h-4 w-4 cursor-pointer"
                />
                <span className="flex flex-col text-left">
                  <span className="text-neutral-200">Hands-Free Conversation</span>
                  <span className="text-xs text-neutral-500 font-normal">Auto-send reply on pause</span>
                </span>
              </label>
            )}

            {/* Bottom Vocal Sync Actions */}
            <div className="flex items-center gap-3 w-full justify-center">
              <button
                onClick={toggleMic}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl border text-sm font-semibold hover:scale-[1.01] transition-all cursor-pointer shadow-sm ${
                  micActive
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/30"
                    : "bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700"
                }`}
              >
                {micActive ? <Mic className="h-4.5 w-4.5 animate-bounce" /> : <MicOff className="h-4.5 w-4.5" />}
                <span>{micActive ? "Microphone ON" : "Turn Voice ON"}</span>
              </button>

              <button
                onClick={finishInterview}
                disabled={messages.length < 2}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white border border-transparent hover:scale-[1.01] transition-all px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-md shadow-purple-600/15"
              >
                <span>End Call & Evaluate</span>
                <ArrowRight className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Transcript logs & keyboard panel: column 2 */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-neutral-900/40 rounded-2xl border border-neutral-800/80 p-6 space-y-5 overflow-hidden h-[500px] lg:h-auto shadow-inner">
            {/* Scrollable feed entries */}
            <div className="flex-grow overflow-y-auto space-y-4 px-1 pr-2 max-h-[360px] lg:max-h-[440px]">
              {messages.map((m, idx) => {
                const isUser = m.sender === "user";
                return (
                  <div
                    key={m.id || idx}
                    className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div className={`rounded-full p-2 shrink-0 shadow-sm ${isUser ? "bg-purple-600/10 border border-purple-500/20 text-purple-400" : "bg-neutral-800 text-neutral-300"}`}>
                      {isUser ? <User className="h-4 w-4" /> : <Cpu className="h-4 w-4" />}
                    </div>
                    <div className="space-y-1.5 max-w-[80%]">
                      <div className={`rounded-2xl px-4 py-3 text-sm font-normal leading-relaxed shadow-sm ${
                        isUser
                           ? "bg-purple-600/95 text-white rounded-tr-none"
                           : "bg-neutral-800/90 text-neutral-200 rounded-tl-none border border-neutral-700/40"
                      }`}>
                        {m.text}
                      </div>
                      <p className={`text-[10px] text-neutral-550 font-mono ${isUser ? "text-right" : "text-left"}`}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={transcriptEndRef} />
            </div>

            {/* Message composer input section */}
            <form onSubmit={sendMessage} className="flex gap-2 items-center pt-3 border-t border-neutral-800/60">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your reply here..."
                className="flex-grow rounded-xl border border-neutral-800 bg-neutral-950/60 py-3 px-4 text-sm text-neutral-200 outline-none transition placeholder:text-neutral-600 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="rounded-xl bg-purple-600 p-3 text-white hover:bg-purple-500 transition hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 disabled:pointer-events-none cursor-pointer shadow-md shadow-purple-600/15"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
