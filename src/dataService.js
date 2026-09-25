import { initFirebase } from './firebase';
import { 
  collection, doc, getDocs, setDoc, deleteDoc, getDoc 
} from 'firebase/firestore';

const LOCAL_STORAGE_KEY_BATCHES = 'hw_batches_data';
const LOCAL_STORAGE_KEY_LOGS = 'hw_logs_data';
const LOCAL_STORAGE_INITIALIZED = 'hw_initialized';

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

// 1. Load Batches
export const loadBatches = async () => {
  const fb = initFirebase();
  if (fb && fb.db) {
    try {
      const snap = await getDocs(collection(fb.db, 'batches'));
      if (!snap.empty) {
        const batches = [];
        snap.forEach(d => batches.push({ id: d.id, ...d.data() }));
        localStorage.setItem(LOCAL_STORAGE_KEY_BATCHES, JSON.stringify(batches));
        localStorage.setItem(LOCAL_STORAGE_INITIALIZED, 'true');
        return batches;
      }
    } catch (e) {
      console.warn("Firestore fetch batches failed, checking local:", e);
    }
  }

  // If user already used the app, never restore default batches
  const alreadyInit = localStorage.getItem(LOCAL_STORAGE_INITIALIZED);
  const local = localStorage.getItem(LOCAL_STORAGE_KEY_BATCHES);
  
  if (local !== null) {
    try {
      return JSON.parse(local);
    } catch (e) {
      console.error(e);
    }
  }

  if (alreadyInit) {
    return [];
  }

  localStorage.setItem(LOCAL_STORAGE_INITIALIZED, 'true');
  localStorage.setItem(LOCAL_STORAGE_KEY_BATCHES, JSON.stringify(defaultBatches));
  return defaultBatches;
};

// 2. Save Batches
export const saveBatches = async (batches) => {
  localStorage.setItem(LOCAL_STORAGE_INITIALIZED, 'true');
  localStorage.setItem(LOCAL_STORAGE_KEY_BATCHES, JSON.stringify(batches));

  const fb = initFirebase();
  if (fb && fb.db) {
    try {
      // Find remote batches and delete any that the user deleted locally
      const snap = await getDocs(collection(fb.db, 'batches'));
      const currentIds = new Set(batches.map(b => b.id));
      for (const d of snap.docs) {
        if (!currentIds.has(d.id)) {
          await deleteDoc(doc(fb.db, 'batches', d.id));
        }
      }
      for (const batch of batches) {
        await setDoc(doc(fb.db, 'batches', batch.id), batch, { merge: true });
      }
    } catch (e) {
      console.warn("Firestore saveBatches failed:", e);
    }
  }
};

// 3. Delete Batch specifically
export const deleteBatchFromDB = async (batchId) => {
  const fb = initFirebase();
  if (fb && fb.db) {
    try {
      await deleteDoc(doc(fb.db, 'batches', batchId));
    } catch (e) {
      console.warn("Firestore deleteDoc failed:", e);
    }
  }
};

// 4. Save Homework Record (Instant Auto-save to Firestore)
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
      await setDoc(doc(fb.db, 'homework_logs', recordDocId), record, { merge: true });
    } catch (e) {
      console.warn("Firestore saveHomeworkRecord error:", e);
    }
  }
};

// 5. Get Homework Record
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
