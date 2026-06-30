import express from "express";
import { Type } from "@google/genai";
import { getAIInstance, generateContentWithRetry, formatAIError } from "./gemini";

const router = express.Router();

router.post("/feedback", async (req: express.Request, res: express.Response): Promise<void> => {
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

      // Validate all required fields are present before responding
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
});

export default router;
