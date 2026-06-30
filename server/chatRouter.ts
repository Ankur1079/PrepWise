import express from "express";
import { getAIInstance, generateContentWithRetry, formatAIError } from "./gemini";

const router = express.Router();

router.post("/chat", async (req: express.Request, res: express.Response): Promise<void> => {
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
});

export default router;
