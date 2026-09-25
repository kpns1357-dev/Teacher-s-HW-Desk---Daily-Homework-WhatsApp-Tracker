import { initFirebase } from './firebase';
import { 
  collection, doc, getDocs, setDoc, query, where, orderBy, getDoc 
} from 'firebase/firestore';

const LOCAL_STORAGE_KEY_BATCHES = 'hw_batches_data';
const LOCAL_STORAGE_KEY_LOGS = 'hw_logs_data';

// Default initial batches for demonstration
const defaultBatches = [
  {
    id: 'batch-1',
    name: 'Class 8th',
    subject: 'General',
    whatsappGroupLink: '',
    whatsappGroupNumber: '',
    students: [
      { id: 's1', name: 'Sample Student 1', rollNo: '01' },
      { id: 's2', name: 'Sample Student 2', rollNo: '02' }
    ]
  },
  {
    id: 'batch-2',
    name: 'Class 9th',
    subject: 'General',
    whatsappGroupLink: '',
    whatsappGroupNumber: '',
    students: [
      { id: 's3', name: 'Sample Student 1', rollNo: '01' },
      { id: 's4', name: 'Sample Student 2', rollNo: '02' }
    ]
  },
  {
    id: 'batch-3',
    name: 'Class 10th',
    subject: 'General',
    whatsappGroupLink: '',
    whatsappGroupNumber: '',
    students: [
      { id: 's5', name: 'Sample Student 1', rollNo: '01' },
      { id: 's6', name: 'Sample Student 2', rollNo: '02' }
    ]
  }
];

// 1. Load Batches (Direct from Firestore with local fallback)
export const loadBatches = async () => {
  const fb = initFirebase();
  if (fb && fb.db) {
    try {
      const snap = await getDocs(collection(fb.db, 'batches'));
      if (!snap.empty) {
        const batches = [];
        snap.forEach(d => batches.push({ id: d.id, ...d.data() }));
        localStorage.setItem(LOCAL_STORAGE_KEY_BATCHES, JSON.stringify(batches));
        return batches;
      }
    } catch (e) {
      console.warn("Firestore fetch batches failed, falling back to local:", e);
    }
  }

  const local = localStorage.getItem(LOCAL_STORAGE_KEY_BATCHES);
  if (local) {
    try {
      return JSON.parse(local);
    } catch (e) {
      console.error(e);
    }
  }
  localStorage.setItem(LOCAL_STORAGE_KEY_BATCHES, JSON.stringify(defaultBatches));
  return defaultBatches;
};

// 2. Save Batches (Auto-syncs directly to Firestore)
export const saveBatches = async (batches) => {
  localStorage.setItem(LOCAL_STORAGE_KEY_BATCHES, JSON.stringify(batches));
  const fb = initFirebase();
  if (fb && fb.db) {
    try {
      for (const batch of batches) {
        await setDoc(doc(fb.db, 'batches', batch.id), batch);
      }
    } catch (e) {
      console.warn("Failed saving batches to Firestore:", e);
    }
  }
};

// 3. Save Homework Record (Instant Auto-save to Firestore)
export const saveHomeworkRecord = async (record) => {
  let logs = [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_LOGS);
    if (raw) logs = JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }

  const existingIdx = logs.findIndex(l => l.batchId === record.batchId && l.date === record.date);
  if (existingIdx >= 0) {
    logs[existingIdx] = record;
  } else {
    logs.unshift(record);
  }
  localStorage.setItem(LOCAL_STORAGE_KEY_LOGS, JSON.stringify(logs));

  // Auto-save to Firestore in background
  const fb = initFirebase();
  if (fb && fb.db) {
    try {
      const recordDocId = `${record.batchId}_${record.date}`;
      await setDoc(doc(fb.db, 'homework_logs', recordDocId), record);
    } catch (e) {
      console.warn("Firestore saveHomeworkRecord error:", e);
    }
  }
};

// 4. Get Homework Record
export const getHomeworkRecord = async (batchId, date) => {
  const fb = initFirebase();
  if (fb && fb.db) {
    try {
      const recordDocId = `${batchId}_${date}`;
      const snap = await getDoc(doc(fb.db, 'homework_logs', recordDocId));
      if (snap.exists()) {
        return snap.data();
      }
    } catch (e) {
      console.warn("Firestore getHomeworkRecord fallback:", e);
    }
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_LOGS);
    if (raw) {
      const logs = JSON.parse(raw);
      return logs.find(l => l.batchId === batchId && l.date === date) || null;
    }
  } catch (e) {
    console.error(e);
  }
  return null;
};
