# PrepWise - Your AI Interview Practice Partner

PrepWise is a modern, responsive, and robust full-stack web application designed to help users prepare for professional technical and non-technical job interviews. Designed with developer ergonomics in mind, PrepWise provides real-time chat, voice-enabled conversation simulations, automated comprehensive feedback reports, and interactive analytics to track interview progress over time.

---

## 🚀 Key Features

*   **Real-time Live Calls / Interactive Dynamic Chat**: Speak or type answers to realistic, AI-driven behavioral and technical questions in real-time.
*   **Web Speech Recognition & Synthesis**: Immersive mock experience utilizing the Web Speech API for real-time speech-to-text input, combined with automated, lifelike text-to-speech feedback (with a visual toggle to mute/unmute bot audio outputs). *Note: Web Speech voice capture requires running the app in a dedicated tab/browser window due to browser sandbox restrictions in iframe previews.*
*   **Automated Professional Analysis**: Custom evaluation reports detailing candidate performance across key parameters, constructive feedback, suggestions for development, and curated study tracks.
*   **User Dashboard & History Tracks**: Persistent tracking of simulated sessions, visual performance trends utilizing clean dynamic charting, and individual authentication.
*   **Dual-Option API Integrations**: Powered by standard enterprise-backed backend endpoints or optional user-configured personal Gemini keys for flexible customization.

---

## 🛠️ Comprehensive Tech Stack Explanation

PrepWise is architected with a full-stack structure for secure API proxying and cloud-ready resilience. Here is the layout of the technologies used and their design motivation:

### 📺 Frontend Architecture (Client-Side)

The client is designed as a single-page app (SPA) serving lightning-fast interactive views with rigorous UI polish.

1.  **React 19 & Vite 6**: Built on top of React's newest architecture for optimized rendering, combined with Vite’s extremely fast hot-module builds and compiling pipeline.
2.  **Tailwind CSS v4 (Post-CSS Native)**: Uses Tailwind CSS v4 to style components with clean utility classes, consistent spacing rhythms, and responsive layouts (`sm:`, `md:`, `lg:`).
3.  **Framer Motion (`motion/react`)**: Smooth, micro-interactive transitions, page-fade entrances, and visual card/element movements for feedback containers and modal dialogues.
4.  **Recharts**: Modern responsive analytical data charts (area and bar plots) used on the candidate performance metric screens to visualize score fluctuations over time.
5.  **Lucide React**: Clean, lightweight, professional vector UI icons.

### ⚙️ Backend Architecture (Server-Side)

To guarantee that critical API keys and developer configurations are kept absolutely private from standard client-side inspect tools, we use an Express.js backend as a security proxy layer.

1.  **Node.js (Express.js)**: A lightweight, highly scalable routing framework handling core endpoints like chat streaming proxies, performance grading engines, and health checks.
2.  **Dynamic Binding**: Designed to respect live container requirements (such as Google Cloud Run, Render, or Railway) by dynamically binding the process listener using:
    ```javascript
    const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    ```
3.  **Vite Middleware Direct Mode**: In development mode (`NODE_ENV !== "production"`), the server spins up a custom Vite development server on demand, integrating internal assets and avoiding WebSocket delays. In production, it falls back seamlessly to serving static compiled resources inside the `/dist` directory.

### 🤖 AI Engine

The intelligence layer is driven directly by Google’s fast and cost-effective **Gemini 3.5 Flash** model.

1.  **`@google/genai` TypeScript SDK**: Structured, modern AI API client using standard non-deprecated method architectures (`ai.models.generateContent`).
2.  **Exponential Backoff Resiliency**: The system automatically captures transient `503 Service Unavailable`, `429 Rate Limit`, or high-demand spike errors and gracefully retries up to 3 times before displaying a beautiful, readable suggestion to the user:
    ```typescript
    // Adaptive Retry Mechanism
    const delay = initialDelay * Math.pow(2, attempt - 1) + Math.random() * 500;
    ```
3.  **Authentication Guarding**: Immediate regex validation on user-defined key entries preventing empty or invalid credential crashes, and outputting actionable messages for authentication failures.

### 🗄️ Persistence & Authentication

*   **Firebase Core**: Integrates Firebase Auth and Firestore Database to synchronize candidate accounts and protect history tracks. To keep third-party variables from crashing the server, the app is engineered with client-side environment fail-safes using a fallback initialization layout (`(import.meta as any).env`) which guarantees compiling stability when environment records are partially pending.

---

## 📂 Project Directory Structure

```text
├── server.ts                  # Main Express Server entry & Gemini API proxy routing
├── src/
│   ├── main.tsx               # Client React mount & initial routing
│   ├── App.tsx                # Root layout container
│   ├── firebase.ts            # Client-side Firebase initializing and config safety
│   ├── types.ts               # Shared TypeScript schemas and enums
│   └── components/
│       ├── Auth.tsx           # Firebase Auth and registration modals
│       ├── Dashboard.tsx      # Landing dashboard, user statistics, dynamic graphs
│       ├── InterviewCall.tsx  # Dynamic voice/text speech mock interaction module
│       └── ...
├── package.json               # Native NPM package script workflows and dependencies
├── vite.config.ts             # Tailwind CSS build pipelines + Vite specifications
└── tsconfig.json              # Structured production compile typings
```

---

## 🚀 Setting Up Locally

Follow these steps to spin up the application on your local machine:

### 1. Prerequisite Checklist
*   Make sure you have [Node.js](https://nodejs.org/) installed (v18 or higher recommended).
*   Create a Gemini API Key in the [Google AI Studio Console](https://aistudio.google.com/).

### 2. Configuration (`.env`)
Create a `.env` file in the root folder (modeled after `.env.example`):
```env
# Server Secret Keep (Never exposed to client side browsers)
GEMINI_API_KEY="AIzaSy..." # Your real Gemini API Key beginning with AIzaSy

# Optional Client Environment Keys for Firebase Sync
VITE_FIREBASE_API_KEY=""
VITE_FIREBASE_PROJECT_ID=""
VITE_FIREBASE_APP_ID=""
VITE_FIREBASE_AUTH_DOMAIN=""
```

### 3. Installation & Booting

1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Run in development mode**:
    ```bash
    npm run dev
    ```
    This launches the backend custom server on `http://localhost:3000` with hot-rebuilding enabled.

3.  **Open in your browser**:
    Navigate to `http://localhost:3000`.

---

## ☁️ How to Deploy on Your Website

You can host PrepWise easily on modern cloud hosting services.

### Option A: Serverless Hosting using Docker (Recommended)
This is the most reliable method for full-stack apps. Google Cloud Run, Render, or Railway can read the Docker configurations.

#### 1. Define the `Dockerfile` at the root:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["npm", "start"]
```

#### 2. Configure Hosting Environment Variables
Inside your hosting panel (e.g., Render, Railway, or Google Cloud Console):
*   Add `GEMINI_API_KEY`: set your real Google AI Studio key.
*   Add `NODE_ENV`: `production`.
*   Ensure HTTP traffic is routed to Port `3000`.

---

### Option B: Traditional PAAS Deployment (e.g., Render Web Services)

If deploying to Render (or similar PaaS providers directly from GitHub/Zip):
1.  **Create a New Web Service** linked to your repository.
2.  Set the following settings:
    *   **Build Command**: `npm run build`
        *(This builds static client files to `dist/index.html` and bundles the Express server to `dist/server.cjs` via esbuild.)*
    *   **Start Command**: `npm run start`
        *(Runs node on the compiled CommonJS server bundle).*
3.  Add your **Environment Variables** (exactly matching step 2 above).

---

### Option C: Standalone Client Hosting (e.g., Vercel / Netlify)
If you *only* want to run client-side code on Netlify or Vercel, note that the static client calls Express backend endpoints `/api/interview/chat` and `/api/interview/feedback`.
*   For a client-only hosting model, you can host the static pages on Netlify/Vercel (using the static files output in `/dist` after running `npm run build`), but you **must** build a separate backend server (Option A or B) to coordinate the backend APIs and set the endpoint redirects accordingly.

---

## ⚡ Build Pipelines

*   **Linter Type-Check**: `npm run lint` — ensures type safety before checking compiled states.
*   **Production Build Command**: `npm run build` — compiles the client layout to `dist/` and runs an esbuild bundling routine over `server.ts` to output `dist/server.cjs`.
*   **Production Run Command**: `npm run start` — boots Node against `dist/server.cjs` directly, providing extreme cold-start optimization.
