import { initFirebase } from './firebase';
import { 
  collection, doc, getDocs, setDoc, deleteDoc, updateDoc, 
  query, where, orderBy, getDoc 
} from 'firebase/firestore';

const LOCAL_STORAGE_KEY_BATCHES = 'hw_batches_data';
const LOCAL_STORAGE_KEY_LOGS = 'hw_logs_data';

// Default initial batches for demonstration
const defaultBatches = [
  {
    id: 'batch-1',
    name: 'Class 9 - Batch A (Science)',
    subject: 'Science',
    whatsappGroupLink: '',
    whatsappGroupNumber: '',
    students: [
      { id: 's1', name: 'Aarav Sharma', rollNo: '01' },
      { id: 's2', name: 'Ananya Verma', rollNo: '02' },
      { id: 's3', name: 'Rohan Gupta', rollNo: '03' },
      { id: 's4', name: 'Ishita Patel', rollNo: '04' },
      { id: 's5', name: 'Kabir Singh', rollNo: '05' }
    ]
  },
  {
    id: 'batch-2',
    name: 'Class 10 - Batch B (Maths)',
    subject: 'Mathematics',
    whatsappGroupLink: '',
    whatsappGroupNumber: '',
    students: [
      { id: 's6', name: 'Aditya Roy', rollNo: '10' },
      { id: 's7', name: 'Pooja Nair', rollNo: '11' },
      { id: 's8', name: 'Sameer Joshi', rollNo: '12' },
      { id: 's9', name: 'Tanvi Shah', rollNo: '13' }
    ]
  },
  {
    id: 'batch-3',
    name: 'Class 8 - Batch C (English)',
    subject: 'English',
    whatsappGroupLink: '',
    whatsappGroupNumber: '',
    students: [
      { id: 's10', name: 'Dev Mishra', rollNo: '21' },
      { id: 's11', name: 'Meera Iyer', rollNo: '22' },
      { id: 's12', name: 'Ritik Paul', rollNo: '23' }
    ]
  }
];

export const loadBatches = async () => {
  const fb = initFirebase();
  if (fb && fb.db) {
    try {
      const snap = await getDocs(collection(fb.db, 'batches'));
      if (!snap.empty) {
        const batches = [];
        snap.forEach(d => batches.push({ id: d.id, ...d.data() }));
        return batches;
      }
    } catch (e) {
      console.warn("Firestore fetch batches failed, falling back to local:", e);
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

export const saveHomeworkRecord = async (record) => {
  // Save locally
  let logs = [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_LOGS);
    if (raw) logs = JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  // Replace or prepend
  const existingIdx = logs.findIndex(l => l.batchId === record.batchId && l.date === record.date);
  if (existingIdx >= 0) {
    logs[existingIdx] = record;
  } else {
    logs.unshift(record);
  }
  localStorage.setItem(LOCAL_STORAGE_KEY_LOGS, JSON.stringify(logs));

  // Sync to Firestore
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

export const getBatchHistory = async (batchId) => {
  let records = [];
  const fb = initFirebase();
  if (fb && fb.db) {
    try {
      const q = query(collection(fb.db, 'homework_logs'), where('batchId', '==', batchId), orderBy('date', 'desc'));
      const snap = await getDocs(q);
      snap.forEach(d => records.push(d.data()));
      if (records.length > 0) return records;
    } catch (e) {
      console.warn("Firestore getBatchHistory fallback:", e);
    }
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_LOGS);
    if (raw) {
      const logs = JSON.parse(raw);
      return logs.filter(l => l.batchId === batchId).sort((a,b) => b.date.localeCompare(a.date));
    }
  } catch (e) {
    console.error(e);
  }
  return [];
};
