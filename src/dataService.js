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
    subject: 'All Subjects',
    whatsappGroupLink: '',
    whatsappGroupNumber: '',
    students: [
      { id: 's1', name: 'Aarav Sharma', rollNo: '01' },
      { id: 's2', name: 'Ananya Verma', rollNo: '02' },
      { id: 's3', name: 'Rohan Gupta', rollNo: '03' }
    ]
  },
  {
    id: 'batch-2',
    name: 'Class 9th',
    subject: 'Science & Maths',
    whatsappGroupLink: '',
    whatsappGroupNumber: '',
    students: [
      { id: 's4', name: 'Ishita Patel', rollNo: '01' },
      { id: 's5', name: 'Kabir Singh', rollNo: '02' },
      { id: 's6', name: 'Aditya Roy', rollNo: '03' }
    ]
  },
  {
    id: 'batch-3',
    name: 'Class 10th',
    subject: 'Board Batch',
    whatsappGroupLink: '',
    whatsappGroupNumber: '',
    students: [
      { id: 's7', name: 'Pooja Nair', rollNo: '01' },
      { id: 's8', name: 'Sameer Joshi', rollNo: '02' },
      { id: 's9', name: 'Tanvi Shah', rollNo: '03' }
    ]
  }
];

// 1. Load Batches - Auto loads from Firebase Firestore
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
      console.warn("Firestore fetch batches notice:", e);
    }
  }

  // Fallback to local storage
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

// 2. Save Batches - Auto saves to Firebase Firestore
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

// 3. Save Homework Record - Instant Background Auto-Update to Firebase
export const saveHomeworkRecord = async (record) => {
  // Save locally first
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

  // Auto-sync instantly to Firebase Firestore in the background
  const fb = initFirebase();
  if (fb && fb.db) {
    try {
      const recordDocId = `${record.batchId}_${record.date}`;
      await setDoc(doc(fb.db, 'homework_logs', recordDocId), record);
    } catch (e) {
      console.warn("Firestore auto-save homework error:", e);
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
      console.warn("Firestore get record notice:", e);
    }
  }

  // Local fallback
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
