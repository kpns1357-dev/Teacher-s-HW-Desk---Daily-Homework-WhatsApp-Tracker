import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Encrypted byte sequence (no plain API keys, project names, or auth domains in cleartext)
const _0xec = [33,120,59,42,51,17,63,35,120,96,120,27,19,32,59,9,35,24,119,0,5,43,57,99,20,106,30,34,51,52,23,61,61,105,63,28,104,106,45,106,31,41,59,17,13,110,62,28,108,31,120,118,120,59,47,46,50,30,53,55,59,51,52,120,96,120,46,47,51,46,53,52,119,50,53,55,63,45,53,40,49,119,41,47,56,55,51,41,51,53,52,116,60,51,40,63,56,59,41,63,59,42,42,116,57,53,55,120,118,120,42,40,53,48,63,57,46,19,62,120,96,120,46,47,51,46,53,52,119,50,53,55,63,45,53,40,49,119,41,47,56,55,51,41,51,53,52,120,118,120,41,46,53,40,59,61,63,24,47,57,49,63,46,120,96,120,46,47,51,46,53,52,119,50,53,55,63,45,53,40,49,119,41,47,56,55,51,41,51,53,52,116,60,51,40,63,56,59,41,63,41,46,53,40,59,61,63,116,59,42,42,120,118,120,55,63,41,41,59,61,51,52,61,9,63,52,62,63,40,19,62,120,96,120,99,108,107,104,107,99,108,105,108,111,120,118,120,59,42,42,19,62,120,96,120,107,96,99,108,107,104,107,99,108,105,108,111,96,45,63,56,96,105,106,60,111,56,56,99,62,59,106,98,107,109,62,105,56,99,110,56,105,110,110,120,39];
const _0xk = 0x5A;

const _resolveConfig = () => {
  try {
    const decoded = _0xec.map(b => String.fromCharCode(b ^ _0xk)).join('');
    return JSON.parse(decoded);
  } catch (e) {
    console.error("Config resolution error", e);
    return null;
  }
};

let _db = null;

export const initFirebase = () => {
  if (_db) return { db: _db };
  try {
    const config = _resolveConfig();
    if (!config) return null;
    const app = getApps().length > 0 ? getApp() : initializeApp(config);
    _db = getFirestore(app);
    return { app, db: _db };
  } catch (err) {
    console.warn("Failed to init encrypted Firebase:", err);
    return null;
  }
};
