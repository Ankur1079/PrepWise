import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Correct, real Gemini model names
// Primary model + verified fallbacks only, avoiding deprecated models
export const GEMINI_MODELS = [
  "gemini-3.5-flash",              // Best quality, newest standard free model
  "gemini-2.5-flash",              // High-performance, low-latency fallback
];
