import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";

// Safely load firebase config JSON using import.meta.glob to prevent build errors when the file is gitignored & missing on GitHub/production
const configFiles = (import.meta as any).glob("../firebase-applet-config.json", { eager: true });
const configFileKeys = Object.keys(configFiles);
const firebaseConfigJson: any = configFileKeys.length > 0
  ? (configFiles[configFileKeys[0]] as any).default || configFiles[configFileKeys[0]]
  : {};

// Config parsed from environment variables to keep credentials safe from GitHub scanners
const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId || "",
  appId: metaEnv.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId || "",
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey || "",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain || "",
  firestoreDatabaseId: metaEnv.VITE_FIREBASE_FIRESTORE_DB_ID || firebaseConfigJson.firestoreDatabaseId || "",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket || "",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId || "",
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfigJson.measurementId || ""
};

const dbId = firebaseConfig.firestoreDatabaseId && 
             firebaseConfig.firestoreDatabaseId !== "(default)" &&
             !firebaseConfig.firestoreDatabaseId.includes(".") &&
             !firebaseConfig.firestoreDatabaseId.includes("firebasestorage")
  ? firebaseConfig.firestoreDatabaseId
  : undefined;

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = dbId ? getFirestore(app, dbId) : getFirestore(app);

// Initialize Firebase Analytics asynchronously since it's only supported in certain browser environments
export let analytics: Analytics | null = null;

isSupported().then((supported) => {
  if (supported && firebaseConfig.measurementId) {
    analytics = getAnalytics(app);
  }
}).catch((err) => {
  console.warn("Firebase Analytics is not supported in this environment:", err);
});
