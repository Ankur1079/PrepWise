import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODELS } from "./config";

// Utility to get Gemini API instance with validation
export function getAIInstance(userApiKey?: string) {
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
export async function generateContentWithRetry(
  ai: any,
  params: any,
  maxRetries = 5,
  initialDelay = 1500
): Promise<any> {
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
export function formatAIError(error: any): string {
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
