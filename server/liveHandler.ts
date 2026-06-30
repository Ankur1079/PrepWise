import { WebSocket } from "ws";
import http from "http";
import url from "url";
import { getAIInstance } from "./gemini";

export async function handleLiveConnection(clientWs: WebSocket, request: http.IncomingMessage) {
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
}
