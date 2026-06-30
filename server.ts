import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import http from "http";
import { WebSocketServer } from "ws";
import url from "url";

// Import modular server pieces
import { PORT } from "./server/config";
import chatRouter from "./server/chatRouter";
import feedbackRouter from "./server/feedbackRouter";
import { handleLiveConnection } from "./server/liveHandler";

const app = express();
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Register modular routers
app.use("/api/interview", chatRouter);
app.use("/api/interview", feedbackRouter);

// Set up Live Gemini Multimodal WS connection events
wss.on("connection", (ws, request) => {
  handleLiveConnection(ws, request);
});

// WebSocket Protocol upgrade setup
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
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`PrepWise server running on http://localhost:${PORT}`);
  });
}

startServer();
