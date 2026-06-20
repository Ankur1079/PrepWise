import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Utility to get Gemini API instance
function getAIInstance(userApiKey?: string) {
  const key = userApiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("No Gemini API key available. Please register your own Gemini API key or set GEMINI_API_KEY.");
  }
  return new GoogleGenAI({ apiKey: key });
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

    const response = await ai.models.generateContent({
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
    res.status(500).json({ error: error.message || "Interview AI server error" });
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

    const analysisPrompt = `You are a high-level technical assessor at PrepWise. Review the following mock interview transcript between the AI Interviewer and the Candidate and output an exhaustive performance review.

Interview Role: ${difficulty} ${role}
Target Topic: ${topic}

Transcript:
${historyText}

Analyze this transcript and respond with a JSON object. Ensure the format matches exactly this TypeScript interface without any extra markdown wrapper or text:
{
  "overallScore": number (integer 0 to 100),
  "technicalScore": number (integer 0 to 100),
  "communicationScore": number (integer 0 to 100),
  "problemSolvingScore": number (integer 0 to 100),
  "positives": string[] (list 3-4 specific constructive positive observations of what candidate did well),
  "improvements": string[] (list 3-4 actual improvement areas with specific guidance),
  "detailedAnalysis": string (markdown narrative discussing their technical proficiency, communications, and practical readiness),
  "suggestedResources": string[] (3 specific book/documentation/course links or topics they must study to master this topic)
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: "user", parts: [{ text: analysisPrompt }] }],
      config: {
        responseMimeType: "application/json",
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
    res.status(500).json({ error: error.message || "Failed to generate AI performance feedback" });
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
