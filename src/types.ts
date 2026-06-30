export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  geminiEmail?: string;
  geminiApiKey?: string;
  createdAt: string;
}

export interface InterviewFeedback {
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  positives: string[];
  improvements: string[];
  detailedAnalysis: string;
  suggestedResources: string[];
}

export type InterviewStatus = "ongoing" | "completed";

export interface InterviewSession {
  id: string;
  userId: string;
  role: string;
  difficulty: "Entry Level" | "Mid Level" | "Senior Level";
  topic: string;
  status: InterviewStatus;
  score?: number;
  feedback?: InterviewFeedback;
  createdAt: string;
  duration?: number; // in seconds
}

export interface InterviewMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  createdAt: string;
}

export interface InterviewTemplate {
  id: string;
  role: string;
  topic: string;
  description: string;
  icon: string;
  createdAt?: string;
}
