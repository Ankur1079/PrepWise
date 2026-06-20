import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Config parsed from firebase-applet-config.json
const firebaseConfig = {
  projectId: "gen-lang-client-0665878873",
  appId: "1:95695576774:web:023349b9845b46d63141c7",
  apiKey: "AIzaSyBKgwCRBKKJCcjE_RHxcO26R7ihMrPPQoc",
  authDomain: "gen-lang-client-0665878873.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-05d58df7-8475-429d-81d4-e4d92d5352cc",
  storageBucket: "gen-lang-client-0665878873.firebasestorage.app",
  messagingSenderId: "95695576774"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
