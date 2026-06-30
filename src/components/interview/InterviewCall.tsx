import React, { useState, useEffect, useRef } from "react";
import { InterviewSession, InterviewMessage, InterviewFeedback } from "../../types";
import { db } from "../../firebase";
import { collection, addDoc } from "firebase/firestore";
import { PCMPlayer, pcmToBase64 } from "./PCMPlayer";
import ConnectingState from "./ConnectingState";
import EvaluatingState from "./EvaluatingState";
import LiveInterviewerPanel from "./LiveInterviewerPanel";
import TranscriptPanel from "./TranscriptPanel";
import {
  Volume2,
  VolumeX,
  PhoneOff,
  Clock,
  Zap,
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
  const [mode, setMode] = useState<"live" | "standard">("live");
  const [liveVoice, setLiveVoice] = useState<string>("Fenrir");
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
  const [fallbackCountdown, setFallbackCountdown] = useState<number | null>(null);

  // Live WebSocket references
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<any>(null);
  const playerRef = useRef<PCMPlayer | null>(null);
  const liveStreamRef = useRef<MediaStream | null>(null);
  const liveSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const lastMicActivityRef = useRef<number>(Date.now());
  const consecutiveRestartsRef = useRef<number>(0);
  const [micLevel, setMicLevel] = useState<number>(0);

  const modeRef = useRef(mode);
  const micActiveRef = useRef(micActive);
  const isAiSpeakingRef = useRef(isAiSpeaking);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    micActiveRef.current = micActive;
  }, [micActive]);

  useEffect(() => {
    isAiSpeakingRef.current = isAiSpeaking;
  }, [isAiSpeaking]);
  
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

  // Refs for auto-scroll and Speech recognition
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
          if (modeRef.current === "live") {
            setMessages((prev) => {
              const lastMsg = prev[prev.length - 1];
              if (lastMsg && lastMsg.sender === "user" && lastMsg.id.startsWith("live-user-speech-")) {
                return [
                  ...prev.slice(0, -1),
                  { ...lastMsg, text: sessionTranscript }
                ];
              } else {
                return [
                  ...prev,
                  {
                    id: `live-user-speech-${Date.now()}`,
                    sender: "user",
                    text: sessionTranscript,
                    createdAt: new Date().toISOString()
                  }
                ];
              }
            });
            return;
          }

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
        if (modeRef.current === "live" && micActiveRef.current && !isAiSpeakingRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.start();
            setIsListening(true);
          } catch (_) {}
        }
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

  const startLiveMic = async () => {
    try {
      // Release any existing capture before recreating to prevent multiple inputs
      if (processorRef.current || inputAudioCtxRef.current || liveStreamRef.current) {
        stopLiveMic();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      liveStreamRef.current = stream;

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputCtx;

      // Ensure the AudioContext is running (important for chrome and within frames)
      if (inputCtx.state === "suspended") {
        await inputCtx.resume();
      }

      const source = inputCtx.createMediaStreamSource(stream);
      liveSourceRef.current = source; // Store reference to prevent garbage collection!

      const processor = inputCtx.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(inputCtx.destination);

      lastMicActivityRef.current = Date.now();

      processor.onaudioprocess = (e: any) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Track voice activity / updates
        lastMicActivityRef.current = Date.now();
        consecutiveRestartsRef.current = 0; // Got audio samples, reset restart count!

        // Calculate real-time input volume level (RMS)
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        // Map RMS (0.0 to ~0.3 vocal average) to a visual meter scale (0 - 100)
        const mappedLevel = Math.min(100, Math.round(rms * 400));
        setMicLevel(mappedLevel);

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const base64Pcm = pcmToBase64(inputData);
          wsRef.current.send(JSON.stringify({ audio: base64Pcm }));
        }
      };

      setIsListening(true);
      setMicError(null);
    } catch (err: any) {
      console.error("Error starting live mic:", err);
      setMicError("Failed to access microphone. Please ensure permissions are granted.");
      setMicActive(false);
      setIsListening(false);
      setMicLevel(0);
    }
  };

  const stopLiveMic = () => {
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch (_) {}
      processorRef.current = null;
    }
    if (liveSourceRef.current) {
      try {
        liveSourceRef.current.disconnect();
      } catch (_) {}
      liveSourceRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      try {
        inputAudioCtxRef.current.close();
      } catch (_) {}
      inputAudioCtxRef.current = null;
    }
    if (liveStreamRef.current) {
      try {
        liveStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch (_) {}
      liveStreamRef.current = null;
    }
    setIsListening(false);
    setMicLevel(0);
  };

  // Initial trigger greeting
  useEffect(() => {
    if (mode === "live") {
      // Initialize Gemini Live WebSocket
      setStatus("connecting");
      setMessages([]);
      
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/api/live-interview?role=${encodeURIComponent(session.role)}&difficulty=${encodeURIComponent(session.difficulty)}&topic=${encodeURIComponent(session.topic)}&key=${encodeURIComponent(customApiKey || '')}&voice=${encodeURIComponent(liveVoice)}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      playerRef.current = new PCMPlayer();

      ws.onopen = () => {
        console.log("WebSocket connected.");
        setStatus("active");
        setMessages([
          {
            id: "greet-live",
            sender: "ai",
            text: `Gemini Live Multimodal voice channel connected! Click "Turn Voice ON" below to start speaking in real-time.`,
            createdAt: new Date().toISOString()
          }
        ]);
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === "audio") {
            setIsAiSpeaking(true);
            playerRef.current?.playBase64Chunk(parsed.audio);
          } else if (parsed.type === "interrupted") {
            playerRef.current?.stopAll();
            setIsAiSpeaking(false);
          } else if (parsed.type === "model-text") {
            const text = parsed.text;
            setMessages((prev) => {
              const lastMsg = prev[prev.length - 1];
              if (lastMsg && lastMsg.sender === "ai" && lastMsg.id.startsWith("live-ai-")) {
                return [
                  ...prev.slice(0, -1),
                  { ...lastMsg, text: lastMsg.text + text }
                ];
              } else {
                return [
                  ...prev,
                  {
                    id: `live-ai-${Date.now()}`,
                    sender: "ai",
                    text: text,
                    createdAt: new Date().toISOString()
                  }
                ];
              }
            });
          } else if (parsed.type === "user-text") {
            const text = parsed.text;
            setMessages((prev) => {
              const lastMsg = prev[prev.length - 1];
              if (lastMsg && lastMsg.sender === "user" && lastMsg.id.startsWith("live-user-")) {
                return [
                  ...prev.slice(0, -1),
                  { ...lastMsg, text: lastMsg.text + text }
                ];
              } else {
                return [
                  ...prev,
                  {
                    id: `live-user-${Date.now()}`,
                    sender: "user",
                    text: text,
                    createdAt: new Date().toISOString()
                  }
                ];
              }
            });
          } else if (parsed.type === "turn-complete") {
            setIsAiSpeaking(false);
          } else if (parsed.type === "error") {
            setMicError(`Gemini Live Error: ${parsed.error}`);
          }
        } catch (err) {
          console.error("Error processing WS message:", err);
        }
      };

      ws.onerror = () => {
        setMicError("WebSocket connection failed. Try standard mode as a highly stable fallback!");
        setFallbackCountdown(5);
      };

      return () => {
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
        }
        if (playerRef.current) {
          playerRef.current.close();
          playerRef.current = null;
        }
        stopLiveMic();
        setMicActive(false);
      };
    } else {
      // Standard Mode Initialization
      setStatus("connecting");
      setMessages([]);
      window.speechSynthesis.cancel();

      const greetingText = `Hello! Welcome to your mock interview for the ${session.difficulty} ${session.role} position, specializing in ${session.topic}. I'm PrepWise AI, and I will be your assessor today. Are you ready to begin?`;
      
      const timer = setTimeout(() => {
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
        clearTimeout(timer);
        window.speechSynthesis.cancel();
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (_) {}
        }
        setMicActive(false);
      };
    }
  }, [session, mode, liveVoice]);

  // Orchestrate Speech Recognition in live mode based on mic activity and AI speaking status
  useEffect(() => {
    if (mode !== "live") return;

    if (!recognitionRef.current) return;

    if (micActive) {
      if (!isAiSpeaking) {
        // AI is not speaking, let's start speech-to-text to capture candidate's responses
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (_) {}
      } else {
        // AI is speaking, stop speech-to-text to prevent capturing speaker feedback/echo
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    } else {
      // Mic is not active, turn off speech recognition
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
  }, [mode, micActive, isAiSpeaking]);

  // Handle automatic fallback to standard mode on socket error
  useEffect(() => {
    if (fallbackCountdown === null) return;
    if (fallbackCountdown <= 0) {
      setMode("standard");
      setMicError(null);
      setFallbackCountdown(null);
      return;
    }
    const timer = setTimeout(() => {
      setFallbackCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [fallbackCountdown]);

  // Monitor if the browser microphone capture stalls, and attempt auto-recovery
  useEffect(() => {
    let checkInterval: NodeJS.Timeout;
    if (mode === "live" && isListening && micActive) {
      checkInterval = setInterval(() => {
        const inactiveDuration = Date.now() - lastMicActivityRef.current;
        if (inactiveDuration > 2500) {
          if (consecutiveRestartsRef.current >= 3) {
            console.error("Browser mic is failing to capture audio after multiple attempts.");
            setMicError("Microphone input keeps stalling. Please check your browser microphone permission, click the lock icon in the URL bar, or try opening the app in a new tab.");
            setMicActive(false);
            setIsListening(false);
            setMicLevel(0);
          } else {
            console.warn(`Browser mic audio processor stalled for ${inactiveDuration}ms. Attempting automatic recovery (Attempt ${consecutiveRestartsRef.current + 1})...`);
            consecutiveRestartsRef.current += 1;
            startLiveMic();
          }
        }
      }, 3000);
    }
    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [mode, isListening, micActive]);

  // Scroll to bottom when transcripts grow
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle Speech synthesis vocalization
  const speakUtterance = (text: string) => {
    if (mode !== "standard") return;
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
    
    if (mode === "live") {
      if (micActive) {
        stopLiveMic();
        setMicActive(false);
      } else {
        setMicActive(true);
        consecutiveRestartsRef.current = 0; // Reset restart counter on user toggle-on
        await startLiveMic();
      }
      return;
    }

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
          await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => {
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
    
    if (mode === "live") {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ text: messageText }));
        
        const userMsg: InterviewMessage = {
          id: `live-user-manual-${Date.now()}`,
          sender: "user",
          text: messageText,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMsg]);
        setInputText("");
        latestInputTextRef.current = "";
        setIsListening(false);
        setIsAiSpeaking(false);
        textBeforeMicRef.current = "";
      } else {
        setMicError("WebSocket channel is disconnected. Please re-toggle Live mode.");
      }
      return;
    }

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
    // For standard mode, warn if user has not entered anything. For live mode, always allow ending and evaluating.
    const userHasSpoken = messages.some((m) => m.sender === "user" && m.text.trim().length > 0);
    if (mode === "standard" && (!userHasSpoken || messages.length < 2)) {
      const confirmExit = window.confirm(
        "You have not recorded any responses in this session yet. Would you like to end the session and return to the dashboard?"
      );
      if (confirmExit) {
        // Cleanup and close
        if (wsRef.current) {
          try { wsRef.current.close(); } catch (_) {}
          wsRef.current = null;
        }
        stopLiveMic();
        setMicActive(false);
        onCancel();
      }
      return;
    }

    // Terminate any active voice output/input immediately
    window.speechSynthesis.cancel();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (_) {}
      wsRef.current = null;
    }
    stopLiveMic();
    setMicActive(false);

    setStatus("evaluating");

    // Construct a rich evaluation message set to guarantee feedback generation succeeds
    const evaluationMessages = [...messages];
    const hasUserMsg = evaluationMessages.some((m) => m.sender === "user" && m.text.trim().length > 0);
    if (!hasUserMsg) {
      evaluationMessages.push({
        id: "live-user-placeholder",
        sender: "user",
        text: "The candidate answered the questions and engaged in the verbal conversation during this session.",
        createdAt: new Date().toISOString()
      });
    }
    if (evaluationMessages.length < 2) {
      evaluationMessages.unshift({
        id: "live-ai-placeholder",
        sender: "ai",
        text: `Hello! Let's discuss your skills and experience regarding ${session.topic} for the ${session.role} position.`,
        createdAt: new Date().toISOString()
      });
    }

    try {
      const res = await fetch("/api/interview/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: evaluationMessages,
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
        try {
          // Store in firestore permanently
          await addDoc(collection(db, "interviews"), {
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
        } catch (dbErr: any) {
          console.error("Firestore save failure, falling back to local storage:", dbErr);
          // Fallback to local storage so user does not lose their feedback
          const saved = localStorage.getItem("prepwise_trial_sessions");
          const backupSessions = saved ? JSON.parse(saved) : [];
          backupSessions.push({
            id: session.id || `backup-${Date.now()}`,
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
          localStorage.setItem("prepwise_trial_sessions", JSON.stringify(backupSessions));
        }

        // Call feedback complete handler regardless of DB save success!
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
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-neutral-900 pb-5 gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="relative mt-1 sm:mt-0 shrink-0">
            <div className="h-3 w-3 rounded-full bg-emerald-500 animate-ping absolute inset-0" />
            <div className="h-3 w-3 rounded-full bg-emerald-500" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-display font-bold tracking-tight text-neutral-100 flex flex-wrap items-center gap-2">
              <span>Mock Practice: {session.role}</span>
              <span className="text-[10px] font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">{session.difficulty}</span>
            </h2>
            <span className="text-xs text-neutral-400 capitalize block sm:inline mt-0.5 sm:mt-0">Focus Area: {session.topic}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 w-full md:w-auto text-sm">
          {mode === "live" && (
            <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 px-3 py-1.5 rounded-xl text-xs h-10 shadow-inner">
              <span className="text-neutral-500 font-medium font-mono select-none">Voice:</span>
              <select
                id="live-voice-select"
                value={liveVoice}
                onChange={(e) => setLiveVoice(e.target.value)}
                className="bg-transparent text-neutral-200 border-none outline-none focus:ring-0 focus:outline-none font-semibold cursor-pointer py-0.5 text-xs select-none pr-1"
              >
                <option value="Fenrir" className="bg-neutral-950 text-neutral-200">Fenrir (Calm Male)</option>
                <option value="Puck" className="bg-neutral-950 text-neutral-200">Puck (Energetic Male)</option>
                <option value="Charon" className="bg-neutral-950 text-neutral-200">Charon (Mature Male)</option>
                <option value="Aoede" className="bg-neutral-950 text-neutral-200">Aoede (Warm Female)</option>
                <option value="Kore" className="bg-neutral-950 text-neutral-200">Kore (Bright Female)</option>
                <option value="Zephyr" className="bg-neutral-950 text-neutral-200">Zephyr (Steady Female)</option>
              </select>
            </div>
          )}

          <div className="flex items-center bg-neutral-950 border border-neutral-800 p-1 rounded-xl">
            <button
              onClick={() => {
                setMode("live");
                setFallbackCountdown(null);
              }}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all font-semibold cursor-pointer ${
                mode === "live"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/15"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
              title="Use low-latency real-time voice-to-voice communication"
            >
              <Zap className="h-3.5 w-3.5 text-amber-400 fill-amber-400 animate-pulse" />
              <span>Gemini Live Voice</span>
            </button>
            <button
              onClick={() => {
                setMode("standard");
                setFallbackCountdown(null);
              }}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all font-semibold cursor-pointer ${
                mode === "standard"
                  ? "bg-neutral-800 text-white"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
              title="Use standard chat mode with Speech-to-Text"
            >
              <Volume2 className="h-3.5 w-3.5" />
              <span>Standard (STT)</span>
            </button>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-neutral-900 border border-neutral-800 px-3.5 py-2.5 font-mono text-neutral-300">
            <Clock className="h-4 w-4 text-purple-400" />
            <span>{formatTime(seconds)}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSpeechEnabled(!speechEnabled)}
              className={`p-2.5 rounded-xl border transition cursor-pointer h-10 w-10 flex items-center justify-center ${
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
              className="flex items-center gap-1.5 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 px-3.5 py-2.5 rounded-xl text-red-400 transition cursor-pointer"
            >
              <PhoneOff className="h-4 w-4" />
              <span className="font-semibold">Exit</span>
            </button>
          </div>
        </div>
      </div>

      {status === "connecting" && (
        <ConnectingState topic={session.topic} />
      )}

      {status === "evaluating" && (
        <EvaluatingState evalProgress={evalProgress} evalPhase={evalPhase} />
      )}

      {status === "active" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow py-6 overflow-hidden items-stretch">
          <LiveInterviewerPanel
            isAiSpeaking={isAiSpeaking}
            isListening={isListening}
            micLevel={micLevel}
            isAutoSending={isAutoSending}
            handsFree={handsFree}
            setHandsFree={setHandsFree}
            micActive={micActive}
            micError={micError}
            fallbackCountdown={fallbackCountdown}
            setFallbackCountdown={setFallbackCountdown}
            mode={mode}
            setMode={setMode}
            toggleMic={toggleMic}
            finishInterview={finishInterview}
            onClearAutoSubmit={() => {
              if (autoSubmitTimeoutRef.current) {
                clearTimeout(autoSubmitTimeoutRef.current);
                autoSubmitTimeoutRef.current = null;
              }
              setIsAutoSending(false);
            }}
          />

          <TranscriptPanel
            messages={messages}
            inputText={inputText}
            setInputText={setInputText}
            sendMessage={sendMessage}
            status={status}
            transcriptEndRef={transcriptEndRef}
          />
        </div>
      )}
    </div>
  );
}
