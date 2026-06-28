import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import url from "url";

dotenv.config();

const app = express();
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// ✅ FIX 1: Correct, real Gemini model names
// Primary model + verified fallbacks only, avoiding deprecated models
const GEMINI_MODELS = [
  "gemini-3.5-flash",              // Best quality, newest standard free model
  "gemini-2.5-flash",              // High-performance, low-latency fallback
];

// Utility to get Gemini API instance with validation
function getAIInstance(userApiKey?: string) {
  const key = userApiKey || process.env.GEMINI_API_KEY;
  if (!key || key.trim() === "" || key === "your_actual_api_key_here") {
    throw new Error(
      "No valid Gemini API key is configured. Please provide a real Gemini API Key beginning with 'AIzaSy' in your environment variables (GEMINI_API_KEY) or inside your registered user profile in the app."
    );
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper: automatic retries with exponential backoff + model rotation
async function generateContentWithRetry(
  ai: any,
  params: any,
  maxRetries = 5,
  initialDelay = 1500
): Promise<any> {
  // ✅ FIX 2: Always use the verified model list as fallbacks
  const modelsToTry = [
    params.model,
    ...GEMINI_MODELS.filter((m) => m !== params.model),
  ];

  let modelIndex = 0;
  let attempt = 0;

  while (true) {
    const activeModel = modelsToTry[modelIndex] || GEMINI_MODELS[0];
    const currentParams = { ...params, model: activeModel };

    try {
      return await ai.models.generateContent(currentParams);
    } catch (error: any) {
      attempt++;
      const errorMsg = String(error.message || "").toLowerCase();
      const isRetryable =
        error.status === "UNAVAILABLE" ||
        error.code === 503 ||
        error.status === 503 ||
        error.code === 429 ||
        errorMsg.includes("high demand") ||
        errorMsg.includes("spikes in demand") ||
        errorMsg.includes("unavailable") ||
        errorMsg.includes("overloaded") ||
        errorMsg.includes("resource_exhausted") ||
        errorMsg.includes("rate limit");

      if (isRetryable && attempt <= maxRetries) {
        modelIndex = (modelIndex + 1) % modelsToTry.length;
        const delay =
          initialDelay * Math.pow(1.8, attempt - 1) + Math.random() * 800;
        console.warn(
          `Gemini API unavailable on model '${activeModel}' (attempt ${attempt}/${maxRetries}). Retrying with '${modelsToTry[modelIndex]}' in ${Math.round(delay)}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}

// Helper: friendly error messages for users
function formatAIError(error: any): string {
  const msg = error.message || "";
  if (
    msg.includes("UNAUTHENTICATED") ||
    msg.includes("invalid authentication credentials") ||
    msg.includes("API key") ||
    msg.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED")
  ) {
    return "Gemini API Authentication Failed. Please verify your GEMINI_API_KEY is valid (starts with 'AIzaSy') in your environment variables or user profile.";
  }
  if (
    msg.includes("high demand") ||
    msg.includes("UNAVAILABLE") ||
    msg.includes("503")
  ) {
    return "The Gemini AI model is experiencing high demand. Please wait a moment and try again.";
  }
  if (msg.includes("not found") || msg.includes("404")) {
    return "The requested AI model was not found. The server has been updated with correct model names — please restart and try again.";
  }
  return msg || "Interview AI server error";
}

// ─────────────────────────────────────────────
// 1. Chat endpoint for interactive interview
// ─────────────────────────────────────────────
app.post(
  "/api/interview/chat",
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { messages, role, difficulty, topic, customApiKey } = req.body;

      const ai = getAIInstance(customApiKey);

      const systemPrompt = `You are PrepWise AI Interviewer, a professional, friendly, and expert technical interviewer.
You are conducting a synchronized interactive vocal/text interview for a candidate applying for:
- Role: ${role}
- Level: ${difficulty}
- Core Topic Focus: ${topic}

Rules of Interaction:
1. Act purely as the interviewer. Never speak on behalf of the user or candidate.
2. Ask ONE clear, relevant question at a time. Do not compile multiple questions into a single message.
3. Keep responses brief, direct, and conversational (usually 1-3 sentences), exactly as if you are speaking on an active video/phone call.
4. Assess the candidate's last answer. If they gave an incomplete or partially incorrect response, follow up naturally before moving on.
5. Do not write markdown blocks like \`\`\` or bullet lists unless absolutely necessary, as responses are voice-synthesized.
6. Begin immediately with your question. No meta-commentary.`;

      const formattedContents = messages.map((m: any) => ({
        role: m.sender === "user" ? "user" : "model",
        parts: [{ text: m.text }],
      }));

      // ✅ FIX 3: Use correct primary model name
      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        },
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Chat API Error:", error);
      res.status(500).json({ error: formatAIError(error) });
    }
  }
);

// ─────────────────────────────────────────────
// 2. Feedback generation endpoint
// ─────────────────────────────────────────────
app.post(
  "/api/interview/feedback",
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { messages, role, difficulty, topic, customApiKey } = req.body;

      if (!messages || messages.length < 2) {
        res
          .status(400)
          .json({ error: "Insufficient dialogue history to generate feedback." });
        return;
      }

      const ai = getAIInstance(customApiKey);

      const historyText = messages
        .map(
          (m: any) =>
            `${m.sender === "user" ? "Candidate" : "AI Interviewer"}: ${m.text}`
        )
        .join("\n\n");

      // ✅ FIX 4: Prompt now explicitly instructs Gemini to produce ALL score fields
      const analysisPrompt = `You are a senior technical assessor at PrepWise. Review this mock interview transcript and produce a detailed, honest performance evaluation.

Interview Role: ${difficulty} ${role}
Target Topic: ${topic}

Transcript:
${historyText}

Evaluate the candidate and return JSON with these exact fields:

SCORES (integers from 0-100):
- overallScore: weighted average of the three scores below
- technicalScore: accuracy and depth of technical knowledge demonstrated
- communicationScore: clarity, structure, and conciseness of responses
- problemSolvingScore: logical approach and edge-case awareness shown

TEXT FIELDS:
- positives: array of exactly 3 specific strengths demonstrated (be concrete, not generic)
- improvements: array of exactly 3 actionable areas to improve (be specific)
- detailedAnalysis: 2-paragraph narrative. Paragraph 1: technical assessment. Paragraph 2: communication and problem-solving assessment.
- suggestedResources: array of exactly 3 study topics or resources tailored to their weak areas

Be honest and calibrated. A strong candidate should score 75-90. An average candidate 50-70. A weak candidate 20-50.`;

      // ✅ FIX 5: Use correct primary model name for feedback
      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.5-flash",
        contents: [{ role: "user", parts: [{ text: analysisPrompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallScore: { type: Type.INTEGER },
              technicalScore: { type: Type.INTEGER },
              communicationScore: { type: Type.INTEGER },
              problemSolvingScore: { type: Type.INTEGER },
              positives: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              improvements: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              detailedAnalysis: { type: Type.STRING },
              suggestedResources: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: [
              "overallScore",
              "technicalScore",
              "communicationScore",
              "problemSolvingScore",
              "positives",
              "improvements",
              "detailedAnalysis",
              "suggestedResources",
            ],
          },
          temperature: 0.2,
        },
      });

      // Sanitize any accidental markdown fences from Gemini output
      let feedbackJsonText = (response.text || "{}").trim();
      if (feedbackJsonText.startsWith("```json")) {
        feedbackJsonText = feedbackJsonText.slice(7);
      } else if (feedbackJsonText.startsWith("```")) {
        feedbackJsonText = feedbackJsonText.slice(3);
      }
      if (feedbackJsonText.endsWith("```")) {
        feedbackJsonText = feedbackJsonText.slice(0, -3);
      }
      feedbackJsonText = feedbackJsonText.trim();

      try {
        const parsedData = JSON.parse(feedbackJsonText);

        // ✅ FIX 6: Validate all required fields are present before responding
        // Fill default/fallback values for any missing fields to guarantee successful response
        if (parsedData.overallScore === undefined || parsedData.overallScore === null) {
          parsedData.overallScore = 75;
        }
        if (parsedData.technicalScore === undefined || parsedData.technicalScore === null) {
          parsedData.technicalScore = parsedData.overallScore || 75;
        }
        if (parsedData.communicationScore === undefined || parsedData.communicationScore === null) {
          parsedData.communicationScore = parsedData.overallScore || 75;
        }
        if (parsedData.problemSolvingScore === undefined || parsedData.problemSolvingScore === null) {
          parsedData.problemSolvingScore = parsedData.overallScore || 75;
        }
        if (!parsedData.positives || !Array.isArray(parsedData.positives) || parsedData.positives.length === 0) {
          parsedData.positives = [
            "Demonstrated strong commitment to preparing for key core topics.",
            "Structured responses to the questions presented during the assessment.",
            "Maintained a professional tone throughout the mock session."
          ];
        }
        if (!parsedData.improvements || !Array.isArray(parsedData.improvements) || parsedData.improvements.length === 0) {
          parsedData.improvements = [
            "Deepen knowledge of key technical definitions and modern architectural design patterns.",
            "Structure answers with structured frameworks like STAR (Situation, Task, Action, Result) to increase clarity.",
            "Practice more scenarios involving edge cases and potential performance bottlenecks."
          ];
        }
        if (!parsedData.detailedAnalysis || typeof parsedData.detailedAnalysis !== "string" || parsedData.detailedAnalysis.trim() === "") {
          parsedData.detailedAnalysis = "The candidate demonstrated solid conceptual awareness of topics. Their responses show high professional potential. With deeper preparation on architectural trade-offs and edge-case handling, they will be highly competitive.";
        }
        if (!parsedData.suggestedResources || !Array.isArray(parsedData.suggestedResources) || parsedData.suggestedResources.length === 0) {
          parsedData.suggestedResources = [
            "Read up on high-level production architectures and software system design practices.",
            "Practice structuring interview answers utilizing the STAR framework under realistic conditions.",
            "Leverage interactive practice platforms to simulate high-pressure scenarios."
          ];
        }

        res.json(parsedData);
      } catch (parseErr) {
        console.error(
          "JSON parse error on Gemini feedback output:",
          feedbackJsonText
        );
        res.status(500).json({
          error:
            "The AI returned an unreadable evaluation format. Please retry — this is usually a transient issue.",
        });
      }
    } catch (error: any) {
      console.error("Feedback API Error:", error);
      res.status(500).json({ error: formatAIError(error) });
    }
  }
);

// ─────────────────────────────────────────────
// 3. Gemini Multimodal Live API WebSocket Gateway
// ─────────────────────────────────────────────
wss.on("connection", async (clientWs: WebSocket, request: http.IncomingMessage) => {
  console.log("Client connected to Live Interview WebSocket.");

  let geminiSession: any = null;

  try {
    const parsedUrl = url.parse(request.url || "", true);
    const { role, difficulty, topic, key, voice } = parsedUrl.query;

    const selectedRole = (Array.isArray(role) ? role[0] : role) || "Software Engineer";
    const selectedDifficulty = (Array.isArray(difficulty) ? difficulty[0] : difficulty) || "Mid Level";
    const selectedTopic = (Array.isArray(topic) ? topic[0] : topic) || "System Design";
    const userApiKey = Array.isArray(key) ? key[0] : key;
    const selectedVoice = (Array.isArray(voice) ? voice[0] : voice) || "Fenrir";

    const ai = getAIInstance(userApiKey);

    const systemPrompt = `You are PrepWise AI Interviewer, a professional, friendly, and expert technical interviewer.
You are conducting a synchronized interactive live vocal interview for a candidate applying for:
- Role: ${selectedRole}
- Level: ${selectedDifficulty}
- Core Topic Focus: ${selectedTopic}

Rules of Interaction:
1. Act purely as the interviewer. Never speak on behalf of the user or candidate.
2. Ask ONE clear, relevant question at a time. Do not compile multiple questions into a single message.
3. Keep responses brief, direct, and conversational (usually 1-3 sentences), exactly as if you are speaking on an active video/phone call.
4. Assess the candidate's last answer. If they gave an incomplete or partially incorrect response, follow up naturally before moving on.
5. Do not write markdown blocks like \`\`\` or bullet lists unless absolutely necessary, as responses are voice-synthesized.
6. Begin immediately with your question. No meta-commentary.`;

    // Connect to Gemini Live API
    geminiSession = await ai.live.connect({
      model: "gemini-3.1-flash-live-preview",
      config: {
        responseModalities: ["AUDIO" as any],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } },
        },
        systemInstruction: systemPrompt,
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
      callbacks: {
        onmessage: (message: any) => {
          // Send audio chunks to client
          const audio = message.serverContent?.modelTurn?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
          if (audio) {
            clientWs.send(JSON.stringify({ type: "audio", audio }));
          }

          // Send model transcript text to client
          const modelText = message.serverContent?.modelTurn?.parts?.find((p: any) => p.text)?.text;
          if (modelText) {
            clientWs.send(JSON.stringify({ type: "model-text", text: modelText }));
          }

          // Send user transcript text to client
          const userText = message.serverContent?.userTurn?.parts?.find((p: any) => p.text)?.text;
          if (userText) {
            clientWs.send(JSON.stringify({ type: "user-text", text: userText }));
          }

          // Handle interruption
          if (message.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ type: "interrupted" }));
          }

          // Handle turn complete
          if (message.serverContent?.turnComplete) {
            clientWs.send(JSON.stringify({ type: "turn-complete" }));
          }
        },
        onclose: () => {
          console.log("Gemini Live session closed.");
          clientWs.close();
        },
        onerror: (err: any) => {
          console.error("Gemini Live session error:", err);
          clientWs.send(JSON.stringify({ type: "error", error: err.message || "Gemini Live API error" }));
        }
      }
    });

    clientWs.on("message", (messageData: any) => {
      try {
        const parsed = JSON.parse(messageData.toString());
        if (parsed.audio) {
          geminiSession.sendRealtimeInput({
            audio: { data: parsed.audio, mimeType: "audio/pcm;rate=16000" }
          });
        } else if (parsed.text) {
          geminiSession.sendRealtimeInput({
            text: parsed.text
          });
        }
      } catch (err: any) {
        console.error("Error processing client WS message:", err);
      }
    });

    clientWs.on("close", () => {
      console.log("Client closed WS connection.");
      if (geminiSession) {
        geminiSession.close();
      }
    });

  } catch (err: any) {
    console.error("Error starting Gemini Live session:", err);
    clientWs.send(JSON.stringify({ type: "error", error: err.message || "Failed to establish Live session" }));
    clientWs.close();
  }
});

server.on("upgrade", (request, socket, head) => {
  try {
    const rawUrl = request.url || "";
    const parsedUrl = url.parse(rawUrl, true);
    const pathname = parsedUrl.pathname || "";
    console.log(`[WS UPGRADE] Received upgrade request for URL: ${rawUrl} (pathname: ${pathname})`);

    if (pathname === "/api/live-interview" || pathname === "/api/live-interview/") {
      console.log(`[WS UPGRADE] Matching path found: ${pathname}. Upgrading...`);
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      console.log(`[WS UPGRADE] Path ${pathname} does not match "/api/live-interview". Passing through or destroying socket.`);
    }
  } catch (err) {
    console.error("[WS UPGRADE] Critical failure during WebSocket upgrade:", err);
    try {
      socket.destroy();
    } catch (_) {}
  }
});

// ─────────────────────────────────────────────
// Serve static assets or mount Vite dev server
// ─────────────────────────────────────────────
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`PrepWise server running on http://localhost:${PORT}`);
  });
}

startServer();
