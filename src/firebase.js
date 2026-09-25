import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Priority 1: Values from .env file
// Priority 2: Stored values from in-app settings (localStorage)
const getEnvConfig = () => ({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
});

export const getStoredFirebaseConfig = () => {
  const envConfig = getEnvConfig();
  if (envConfig.projectId) {
    return envConfig;
  }

  try {
    const saved = localStorage.getItem('hw_firebase_config');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Error reading stored firebase config", e);
  }
  return envConfig;
};

export const saveFirebaseConfig = (config) => {
  localStorage.setItem('hw_firebase_config', JSON.stringify(config));
};

export const initFirebase = () => {
  const config = getStoredFirebaseConfig();
  if (!config || !config.projectId) {
    return null;
  }
  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(config);
    const db = getFirestore(app);
    return { app, db };
  } catch (err) {
    console.warn("Failed to initialize Firebase with current config:", err);
    return null;
  }
};
