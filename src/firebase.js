import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Multi-layer Obfuscated & XOR Cipher Protected Config
// Nobody inspecting the page, code, or strings will find any plain API key or Firebase project credentials.
const CIPHER = "T1NgQkltRmZwckFDZUNgaHlyWkJ/GUZpZnxaTEl9Zx9+QGhvT21GX359TkRnGHxtZ0BoGWdvfFBzf15yZG14bWRBf0NmaWBCTnJ4RXhtE15zfUZfY0BFQ05ifFpObRNfZn1CXEh9fBlIGWBYZnJkG3NHG1pJGEZcSEMfR0tyYEZzR2xQcH1sXUlpH0BIGBpDZmlgXUlHE1twfWQaeX17Q2VDYBpOfUYaSBgeXkttE15wck5cSUdZXkkZfENIfUZQS30TX2NDXUNJGXhcSUdsRHB/YBtzGF5GTmljHGNEeBtLcnhcSEMbRUgYG0ZOGBNTS1MbUE59YF5LcmRaSBgeX3BHRlNwfWBCSRh8UE5tE1NzfU5GZkdsXUlpY1ljRxtGSRlkQnAYRl9wG2RGSEd4RklBRkFjQEVDZX5zUmdAbx9kQGcYZHljWWNHbF1Jb0ZBY0BFQ2d+RR9kQG9TZ35BGGdQcxtlRE5Gc0BFUGdtcxtzR2MfcG1vXWVubxlwbmRDZX54Q2dQexpjRBoX";

const decryptConfig = () => {
  try {
    const rawRot = atob(CIPHER);
    const unrot = rawRot.split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ 42)).join('');
    const jsonStr = atob(unrot);
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("Internal cipher load error");
    return null;
  }
};

export const initFirebase = () => {
  try {
    const config = decryptConfig();
    if (!config || !config.projectId) return null;
    const app = getApps().length > 0 ? getApp() : initializeApp(config);
    const db = getFirestore(app);
    return { app, db };
  } catch (err) {
    console.warn("Firebase auto-init notice:", err);
    return null;
  }
};
