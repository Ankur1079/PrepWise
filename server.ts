import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Utility to get Gemini API instance with validation to prevent placeholder keys
function getAIInstance(userApiKey?: string) {
  const key = userApiKey || process.env.GEMINI_API_KEY;
  if (!key || key.trim() === "" || key === "your_actual_api_key_here") {
    throw new Error("No valid Gemini API key is configured. Please provide a real Gemini API Key beginning with 'AIzaSy' in your environment variables (GEMINI_API_KEY) or inside your registered user profile in the app.");
  }
  return new GoogleGenAI({ apiKey: key });
}

// Helper to implement automatic retries with exponential backoff for temporary overloaded/high-demand errors, and rotating model fallbacks
async function generateContentWithRetry(ai: any, params: any, maxRetries = 5, initialDelay = 1500): Promise<any> {
  const modelsToTry = [
    params.model,
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
    "gemini-2.5-flash-image"
  ].filter(Boolean);

  let modelIndex = 0;
  let attempt = 0;

  while (true) {
    const activeModel = modelsToTry[modelIndex] || params.model;
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
        errorMsg.includes("high demand") ||
        errorMsg.includes("spikes in demand") ||
        errorMsg.includes("unavailable") ||
        errorMsg.includes("overloaded") ||
        errorMsg.includes("resource_exhausted") ||
        errorMsg.includes("rate limit") ||
        error.code === 429;

      if (isRetryable && attempt <= maxRetries) {
        if (modelsToTry.length > 1) {
          modelIndex = (modelIndex + 1) % modelsToTry.length;
        }
        const delay = initialDelay * Math.pow(1.8, attempt - 1) + Math.random() * 800;
        console.warn(`Gemini API overloaded or unavailable using model '${activeModel}' on attempt ${attempt}/${maxRetries}. Retrying with model '${modelsToTry[modelIndex]}' in ${Math.round(delay)}ms... Error:`, error.message);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}

// Helper to provide friendly, user-actionable instructions on connection or authentication failures
function formatAIError(error: any): string {
  const msg = error.message || "";
  if (
    msg.includes("UNAUTHENTICATED") ||
    msg.includes("invalid authentication credentials") ||
    msg.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED") ||
    msg.includes("OAuth 2") ||
    msg.includes("API key")
  ) {
    return "Gemini API Authentication Failed. Please verify that your GEMINI_API_KEY is correctly set to a valid key (starting with 'AIzaSy') in your Render/hosting environment variables, or configured in your user profile on this app.";
  }
  if (msg.includes("high demand") || msg.includes("UNAVAILABLE") || msg.includes("503")) {
    return "The Gemini AI model is currently experiencing extremely high demand. We attempted automated retries, but we recommend waiting a brief moment and clicking the button again to retry.";
  }
  return msg || "Interview AI server error";
}

// 1. Chat endpoint for interactive interview calls
app.post("/api/interview/chat", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { messages, role, difficulty, topic, customApiKey } = req.body;

    const ai = getAIInstance(customApiKey);

    // Build immediate context instructions
    const systemPrompt = `You are PrepWise AI Interviewer, a professional, friendly, and expert technical interviewer.
You are conducting a synchronized interactive vocal/text interview for a candidates applying for:
- Role: ${role}
- Level: ${difficulty}
- Core Topic Focus: ${topic}

Rules of Interaction:
1. Act purely as the interviewer. Never speak on behalf of the user or candidate.
2. Ask ONE clear, relevant question at a time. Do not compile multiple questions into a single message.
3. Keep response brief, direct, and conversational (usually 1-3 sentences), exactly as if you are speaking on an active video/phone call.
4. Assess the candidate's last answer. If they gave an incomplete or partially incorrect response, follow up naturally before moving on.
5. Do not write markdown blocks like \`\`\` or lists unless absolutely necessary, as it is hard to voice-synthesize.
6. Begin immediately with your question. No meta-commentary.`;

    // Map messages to Gemini Content schema format
    // Gemini 2.x expects { role: 'user' | 'model', parts: [{ text: string }] }
    // We map 'user' -> 'user' and 'ai' -> 'model'
    const systemInstruction = systemPrompt;
    
    const formattedContents = messages.map((m: any) => ({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: m.text }]
    }));

    const response = await generateContentWithRetry(ai, {
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    res.status(500).json({ error: formatAIError(error) });
  }
});

// 2. Feedback generation endpoint at the end of interview
app.post("/api/interview/feedback", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { messages, role, difficulty, topic, customApiKey } = req.body;

    if (!messages || messages.length < 2) {
       res.status(400).json({ error: "Insufficient dialogue history to generate feedback." });
       return;
    }

    const ai = getAIInstance(customApiKey);

    const historyText = messages
      .map((m: any) => `${m.sender === "user" ? "Candidate" : "AI Interviewer"}: ${m.text}`)
      .join("\n\n");

    const analysisPrompt = `You are a high-level technical assessor at PrepWise. Review the following mock interview transcript between the AI Interviewer and the Candidate and output an accurate, concise performance review.

Interview Role: ${difficulty} ${role}
Target Topic: ${topic}

Transcript:
${historyText}

Analyze this transcript and respond with structured JSON. Be highly specific but concise. Avoid unnecessary fluff to produce the report incredibly quickly:
- positives: 3 specific positive points (concise)
- improvements: 3 actionable improvement areas (concise)
- detailedAnalysis: a compact 2-paragraph markdown narrative summarizing technical skill and communication readiness.
- suggestedResources: Exactly 3 high-quality study resources or topics.`;

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
              items: { type: Type.STRING }
            },
            improvements: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            detailedAnalysis: { type: Type.STRING },
            suggestedResources: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: [
            "overallScore",
            "technicalScore",
            "communicationScore",
            "problemSolvingScore",
            "positives",
            "improvements",
            "detailedAnalysis",
            "suggestedResources"
          ]
        },
        temperature: 0.2,
      }
    });

    let feedbackJsonText = response.text || "{}";
    // Sanitize any occasional markdown wrap
    feedbackJsonText = feedbackJsonText.trim();
    if (feedbackJsonText.startsWith("```json")) {
      feedbackJsonText = feedbackJsonText.substring(7);
    }
    if (feedbackJsonText.endsWith("```")) {
      feedbackJsonText = feedbackJsonText.substring(0, feedbackJsonText.length - 3);
    }
    feedbackJsonText = feedbackJsonText.trim();

    try {
      const parsedData = JSON.parse(feedbackJsonText);
      res.json(parsedData);
    } catch (parseErr) {
      console.error("JSON parsing error on Gemini output", feedbackJsonText);
      res.status(500).json({ error: "Invalid JSON evaluation format from AI assessor.", raw: feedbackJsonText });
    }
  } catch (error: any) {
    console.error("Feedback API Error:", error);
    res.status(500).json({ error: formatAIError(error) });
  }
});

// Serve static assets or mount Vite dev server
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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express custom server running on http://localhost:${PORT}`);
  });
}

startServer();
