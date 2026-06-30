# PrepWise - Your AI Interview Practice Partner

PrepWise is a modern, responsive, and robust full-stack web application designed to help users prepare for professional technical and non-technical job interviews. Designed with developer ergonomics in mind, PrepWise provides real-time chat, immersive voice-enabled conversation simulations, automated comprehensive feedback reports, and interactive analytics to track interview progress over time.

---

## 🚀 Core Features & Capabilities

*   **🎙️ Immersive Voice Mode & Live Calls**: 
    Engage in a realistic voice call simulation. The system leverages the browser's native **Web Speech API** for high-accuracy speech-to-text voice recognition, combined with lifelike text-to-speech feedback. Real-time controls include a persistent audio output mute/unmute toggle.
*   **📊 Animated Real-Time Audio Visualizer**:
    Includes an interactive visualizer component (`AudioVisualizer`) that renders a multi-bar waveform reflecting current voice/mic states. Features color-coded fluid animations:
    *   **Purple/Indigo Gradient**: Active bot speaking states.
    *   **Emerald/Teal Gradient**: Candidate listening/recording states (scales dynamically based on real microphone volume).
    *   **Neutral Gray**: Idle/Silent states.
*   **📝 Comprehensive Performance Scorecard**:
    Every interview session generates a complete professional assessment across four core dimensions:
    *   *Technical Skill*
    *   *Communication*
    *   *Problem Solving*
    *   *Confidence*
    It provides constructive general feedback, clear suggestions for improvement, and a custom-tailored *Study Guide* with suggested resources.
*   **📂 Customizable & Pre-Defined Interview Templates**:
    Start practicing instantly with standard mock interview templates (such as *Frontend Developer*, *Backend Engineer*, *Product Manager*, *Behavioral Prep*, or *System Design*), or build and save your own custom templates dynamically.
*   **📈 Analytics Dashboard & History Tracking**:
    Monitor progress using dynamic data charts (area and bar plots powered by **Recharts**) to track score trends. View full chronological history logs of all mock interviews with their generated scorecard summaries.
*   **🔐 Seamless User Authentication**:
    Robust secure account creation and sign-in powered by **Firebase Authentication** (supporting Email/Password and Anonymous access) to synchronize records across multiple devices.
*   **💬 Interactive User Feedback & Admin Terminal**:
    *   *User Feedback*: In-app modal allows candidates to submit feedback, ratings, and feature requests.
    *   *Admin Terminal*: A real-time monitoring modal to review user feedback and manage entries (including single-click deletion) directly.

---

## 🛠️ Comprehensive Tech Stack Explanation

PrepWise is built with a highly resilient full-stack architecture designed for maximum performance, security, and stability.

### 📺 Frontend Architecture (Client-Side)
The client-side uses a Single Page Application (SPA) structure styled for responsive, desktop-first precision with mobile-first code:
1.  **React 19 & Vite 6**: High-speed, modern virtual DOM rendering, coupled with Vite's rapid compiling pipeline.
2.  **Tailwind CSS v4 (Post-CSS Native)**: Uses native `@import "tailwindcss";` styling to declare responsive layouts and highly customized UI elements.
3.  **Framer Motion (`motion/react`)**: Implements premium, high-fidelity micro-interactions, page-fade entrances, and layout transitions for modal dialogues and feedback card menus.
4.  **Recharts**: Provides responsive, elegant analytical graphics visualizing candidate score trends.
5.  **Lucide React**: Clean, lightweight, professional vector iconography.

### ⚙️ Backend Architecture (Server-Side)
To guarantee API key safety, an Express server acts as a proxy for secure transactions:
1.  **Node.js (Express.js)**: Runs as a security proxy layer for backend services, such as coordinating streaming prompts and performance analytics.
2.  **Vite Middleware Mode**: Under development (`NODE_ENV !== "production"`), mounts Vite's middleware directly within Express to facilitate real-time hot building. Under production, the server serves static compiled assets directly from the `/dist` directory.
3.  **Environment Binding**: Configured to bind on port `3000` and host `0.0.0.0` to comply with standard cloud container routing requirements (such as Google Cloud Run).

### 🤖 AI Engine
The backend intelligence is powered directly by Google's fast and cost-effective **Gemini 3.5 Flash** model:
1.  **`@google/genai` TypeScript SDK**: Integrates modern, structured, and non-deprecated methods (`ai.models.generateContent`).
2.  **Exponential Backoff Resiliency**: Features a built-in retry mechanism that catches transient `503 Service Unavailable`, `429 Rate Limit`, or high-demand network errors, retrying up to 3 times before presenting a user-friendly error state.
3.  **Prompt Engineering Guarding**: Robust regex sanitization prevents empty inputs or unauthorized formatting from causing crashes.

### 🗄️ Persistence & Client-Side Resiliency
*   **Firebase Firestore**: Handles real-time synchronization of candidate histories, templates, and feedbacks.
*   **No-Index Client Sorting**: Database query performance is optimized via client-side sorting logic, completely bypassing traditional Firestore composite index requirements (`Failed to load resource: net::ERR_BLOCKED_BY_CLIENT` or composite index errors are eliminated) to ensure a smooth out-of-the-box user experience.
*   **Offline/Local Storage Fallback**: Gracefully falls back to browser `localStorage` when credentials are not yet initialized or when the client loses internet connectivity.

---

## 📂 Project Directory Structure

```text
├── server.ts                  # Main Express Server entry & Gemini API proxy routing
├── firebase-blueprint.json    # Initial DB schema blueprints
├── firestore.rules            # Firestore security rules
├── src/
│   ├── main.tsx               # Client React mount & initial routing
│   ├── App.tsx                # Root layout container
│   ├── firebase.ts            # Client-side Firebase initializing and config safety
│   ├── types.ts               # Shared TypeScript schemas and enums
│   └── components/
│       ├── Auth.tsx           # Firebase Auth and registration modals
│       ├── Dashboard.tsx      # Landing dashboard, user statistics, dynamic graphs
│       ├── InterviewCall.tsx  # Dynamic voice/text speech mock interaction module
│       ├── AudioVisualizer.tsx# Multi-frequency dynamic waveform rendering
│       ├── FeedbackView.tsx   # Detailed scorecards, suggested study tracker & resource logs
│       ├── FeedbackModal.tsx  # User feedback and rating submittal panel
│       └── AdminFeedbackModal.tsx # Administrative workspace to monitor & manage system feedback
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
VITE_FIREBASE_MEASUREMENT_ID=""
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

---

## 💳 How to Add Payments to Your Website (Stripe Integration Guide)

To monetize PrepWise (e.g., charging users for unlimited sessions after they exhaust their 3 free trials), we recommend integrating **Stripe**—the industry-standard payment processor. Below is the step-by-step full-stack integration blueprint:

### Step 1: Install Stripe SDKs
You will need to install the server-side Stripe SDK and the client-side library.
Run these commands in your workspace:
```bash
# Install backend SDK
npm install stripe

# Install frontend libraries
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### Step 2: Configure Environment Variables
Add your Stripe keys to your `.env` file (and define them in `.env.example`).
```env
# Server-only Stripe secret key (Never expose to client!)
STRIPE_SECRET_KEY="sk_test_..."

# Public client-side Stripe publishable key (Safe for browser)
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Client redirect URLs
VITE_PAYMENT_SUCCESS_URL="http://localhost:3000?payment=success"
VITE_PAYMENT_CANCEL_URL="http://localhost:3000?payment=cancelled"
```

### Step 3: Create Backend Payment Routes (`server.ts`)
Add a secure Express router endpoint on the server to handle Stripe Checkout session creation. This keeps your secret key hidden from the browser.
```ts
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" // Or use the latest API version
});

// Endpoint to create a checkout session
app.post("/api/payment/create-checkout-session", async (req, res) => {
  try {
    const { userId, userEmail } = req.body;
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "PrepWise Pro Premium Account",
              description: "Unlock unlimited mock interviews, permanent feedback scorecards, and progress analytics.",
            },
            unit_amount: 1999, // Price in cents ($19.90)
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: userEmail,
      metadata: {
        userId: userId, // Pass Firestore userId to update subscription state later
      },
      success_url: process.env.VITE_PAYMENT_SUCCESS_URL!,
      cancel_url: process.env.VITE_PAYMENT_CANCEL_URL!,
    });

    res.json({ id: session.id, url: session.url });
  } catch (err: any) {
    console.error("Stripe Session Creation failed:", err);
    res.status(500).json({ error: err.message });
  }
});
```

### Step 4: Handle Stripe Webhooks for Instant Upgrades
Webhooks allow Stripe to notify your Express backend asynchronously when a payment succeeds. Create a webhook handler to automatically upgrade the user profile in Firestore.
```ts
// Stripe webhook endpoint (Requires raw body parser)
app.post("/api/payment/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"]!;
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;

    if (userId) {
      // Import db from your firebase configuration or admin SDK
      const { doc, updateDoc } = await import("firebase/firestore");
      // Update user subscription state to 'premium' in Firestore
      await updateDoc(doc(db, "users", userId), {
        tier: "premium",
        premiumSince: new Date().toISOString()
      });
    }
  }

  res.json({ received: true });
});
```

### Step 5: Trigger Checkout from the Frontend (`UpgradeTrialModal.tsx`)
On the frontend, when a user clicks a "Subscribe" or "Unlock Premium" button:
1. Make a POST request to `/api/payment/create-checkout-session`.
2. Redirect the user's browser to the returned Stripe Checkout page URL (`session.url`).

Once the user completes payment on Stripe, they are redirected back to your Success URL, and the Stripe Webhook updates their Firestore tier to `premium`.

---

## ⚡ Build Pipelines

*   **Linter Type-Check**: `npm run lint` — ensures type safety before checking compiled states.
*   **Production Build Command**: `npm run build` — compiles the client layout to `dist/` and runs an esbuild bundling routine over `server.ts` to output `dist/server.cjs`.
*   **Production Run Command**: `npm run start` — boots Node against `dist/server.cjs` directly, providing extreme cold-start optimization.
