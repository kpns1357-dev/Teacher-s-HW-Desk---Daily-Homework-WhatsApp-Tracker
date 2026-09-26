import { initFirebase } from './firebase';
import { 
  collection, doc, getDocs, setDoc, deleteDoc, getDoc 
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut
} from 'firebase/auth';

const LOCAL_STORAGE_KEY_BATCHES = 'hw_batches_data';
const LOCAL_STORAGE_KEY_LOGS = 'hw_logs_data';
const LOCAL_STORAGE_INITIALIZED = 'hw_initialized';
const LOCAL_STORAGE_TEACHERS = 'hw_teachers_list';

// Internal domain used to bridge User IDs seamlessly to Firebase Auth
const AUTH_DOMAIN_SUFFIX = '@teacherdesk.internal';
export const formatAuthEmail = (userId) => {
  const clean = userId.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
  return `${clean}${AUTH_DOMAIN_SUFFIX}`;
};

// Default initial teacher credentials if none exist
// Default Password is "Teacher@123" (stored as SHA-256 hash below)
const DEFAULT_TEACHER_HASH = 'd041c3d3ca4ed64c5b54c5d807bd9a0bd2d6ae3609ecd2d06ac383db449360e1';

// SHA-256 Browser Encryption Function
export async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 1. Load Teachers List (Firestore + Local)
export const loadTeachers = async () => {
  const fb = initFirebase();
  if (fb && fb.db) {
    try {
      const snap = await getDocs(collection(fb.db, 'authorized_teachers'));
      if (!snap.empty) {
        const list = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        localStorage.setItem(LOCAL_STORAGE_TEACHERS, JSON.stringify(list));
        return list;
      }
    } catch (e) {
      console.warn("Firestore fetch teachers failed:", e);
    }
  }

  const local = localStorage.getItem(LOCAL_STORAGE_TEACHERS);
  if (local) {
    try {
      return JSON.parse(local);
    } catch (e) {
      console.error(e);
    }
  }

  const defaultList = [
    {
      id: 'admin',
      userId: 'admin',
      name: 'Head Teacher',
      passwordHash: DEFAULT_TEACHER_HASH,
      createdAt: new Date().toISOString()
    }
  ];
  localStorage.setItem(LOCAL_STORAGE_TEACHERS, JSON.stringify(defaultList));
  return defaultList;
};

// 2. Add New Teacher (Registers in Firebase Auth + Firestore)
export const addTeacher = async (userId, plainPassword, name = '') => {
  const cleanId = userId.trim().toLowerCase();
  const passwordHash = await sha256(plainPassword);
  const email = formatAuthEmail(cleanId);

  const fb = initFirebase();
  let authUid = null;

  // Create Firebase Auth user
  if (fb && fb.auth) {
    try {
      const userCred = await createUserWithEmailAndPassword(fb.auth, email, plainPassword);
      authUid = userCred.user.uid;
    } catch (authErr) {
      // If user already exists in Firebase Auth, attempt to sign in or proceed
      console.warn("Firebase Auth createUser warning:", authErr.code || authErr.message);
    }
  }

  const newTeacher = {
    id: cleanId,
    userId: cleanId,
    authEmail: email,
    authUid: authUid || null,
    name: name.trim() || cleanId,
    passwordHash: passwordHash,
    createdAt: new Date().toISOString()
  };

  const teachers = await loadTeachers();
  const existingIdx = teachers.findIndex(t => t.userId === cleanId);
  if (existingIdx >= 0) {
    teachers[existingIdx] = newTeacher;
  } else {
    teachers.push(newTeacher);
  }

  localStorage.setItem(LOCAL_STORAGE_TEACHERS, JSON.stringify(teachers));

  if (fb && fb.db) {
    try {
      await setDoc(doc(fb.db, 'authorized_teachers', cleanId), newTeacher, { merge: true });
    } catch (e) {
      console.warn("Firestore addTeacher failed:", e);
    }
  }

  return newTeacher;
};

// 3. Verify Teacher Credentials using Firebase Authentication
export const verifyTeacher = async (userId, inputPassword) => {
  const cleanId = userId.trim().toLowerCase();
  const email = formatAuthEmail(cleanId);
  const inputHash = await sha256(inputPassword);

  const fb = initFirebase();

  // Try Firebase Authentication First
  if (fb && fb.auth) {
    try {
      const cred = await signInWithEmailAndPassword(fb.auth, email, inputPassword);
      if (cred && cred.user) {
        return {
          success: true,
          teacher: {
            userId: cleanId,
            authUid: cred.user.uid,
            name: cred.user.displayName || cleanId
          }
        };
      }
    } catch (authErr) {
      // If user not found in Firebase Auth yet (e.g. initial admin), auto-register if credentials match
      if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
        if ((cleanId === 'admin' || cleanId === 'teacher1') && inputHash === DEFAULT_TEACHER_HASH) {
          try {
            const newCred = await createUserWithEmailAndPassword(fb.auth, email, inputPassword);
            return {
              success: true,
              teacher: {
                userId: cleanId,
                authUid: newCred.user.uid,
                name: 'Head Teacher'
              }
            };
          } catch (createErr) {
            console.warn("Auto-register initial admin in Firebase Auth:", createErr);
          }
        }
      }
      console.warn("Firebase Auth verify check:", authErr.code || authErr.message);
    }
  }

  // Fallback: Verify against Firestore database
  if (fb && fb.db) {
    try {
      const snap = await getDoc(doc(fb.db, 'authorized_teachers', cleanId));
      if (snap.exists()) {
        const data = snap.data();
        if (data.passwordHash === inputHash) {
          // If Firestore matched, try registering into Firebase Auth in background
          if (fb.auth) {
            createUserWithEmailAndPassword(fb.auth, email, inputPassword).catch(() => {});
          }
          return { success: true, teacher: data };
        }
      }
    } catch (e) {
      console.warn("Firestore verify fallback:", e);
    }
  }

  // Fallback: Local teachers cache
  const teachers = await loadTeachers();
  const found = teachers.find(t => t.userId === cleanId);
  if (found && found.passwordHash === inputHash) {
    return { success: true, teacher: found };
  }

  if ((cleanId === 'admin' || cleanId === 'teacher1') && inputHash === DEFAULT_TEACHER_HASH) {
    return { success: true, teacher: { userId: cleanId, name: 'Teacher' } };
  }

  return { success: false, error: 'Incorrect User ID or Password' };
};

// 4. Sign out from Firebase Authentication
export const signOutTeacher = async () => {
  const fb = initFirebase();
  if (fb && fb.auth) {
    try {
      await fbSignOut(fb.auth);
    } catch (e) {
      console.warn("Firebase signout warning:", e);
    }
  }
};

// 5. Delete Teacher / Remove Authorization
export const deleteTeacher = async (userId) => {
  const cleanId = userId.trim().toLowerCase();
  
  // Update local list
  const teachers = await loadTeachers();
  const filtered = teachers.filter(t => t.userId !== cleanId);
  localStorage.setItem(LOCAL_STORAGE_TEACHERS, JSON.stringify(filtered));

  // Delete from Firestore
  const fb = initFirebase();
  if (fb && fb.db) {
    try {
      await deleteDoc(doc(fb.db, 'authorized_teachers', cleanId));
    } catch (e) {
      console.warn("Firestore deleteTeacher failed:", e);
    }
  }

  return filtered;
};

// --- BATCHES & HOMEWORK DATA LOGIC ---

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

export const saveBatches = async (batches) => {
  localStorage.setItem(LOCAL_STORAGE_INITIALIZED, 'true');
  localStorage.setItem(LOCAL_STORAGE_KEY_BATCHES, JSON.stringify(batches));

  const fb = initFirebase();
  if (fb && fb.db) {
    try {
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

// 5. Get All Homework Logs for a Batch (Sorted by date desc)
export const getBatchLogs = async (batchId) => {
  let list = [];
  const fb = initFirebase();
  if (fb && fb.db) {
    try {
      const snap = await getDocs(collection(fb.db, 'homework_logs'));
      snap.forEach(d => {
        const item = d.data();
        if (item.batchId === batchId) {
          list.push(item);
        }
      });
    } catch (e) {
      console.warn("Firestore getBatchLogs fallback:", e);
    }
  }

  if (list.length === 0) {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY_LOGS);
      if (raw) {
        const logs = JSON.parse(raw);
        list = logs.filter(l => l.batchId === batchId);
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Sort newest date first
  return list.sort((a, b) => b.date.localeCompare(a.date));
};

// 6. Check for 3-Day Consecutive Incomplete/Not Done Defaulters
// Looks through the last 3 logged session days for each student in the batch
export const check3DayDefaulters = async (batchId, students) => {
  const allLogs = await getBatchLogs(batchId);
  // Only look at normal checking days (exclude full holidays / no_homework days)
  const validLogs = allLogs.filter(l => l.batchStatus === 'normal' && l.entries && l.entries.length > 0);

  if (validLogs.length < 3) {
    return []; // Need at least 3 historical logs to evaluate 3 consecutive days
  }

  const last3Logs = validLogs.slice(0, 3);
  const defaulters = [];

  students.forEach(student => {
    let uncompletedCount = 0;
    const historyDates = [];

    last3Logs.forEach(log => {
      const entry = log.entries.find(e => e.studentId === student.id || e.studentName === student.name);
      if (entry && (entry.status === 'not_done' || entry.status === 'incomplete')) {
        uncompletedCount++;
        historyDates.push({ date: log.date, status: entry.status });
      }
    });

    if (uncompletedCount >= 3) {
      defaulters.push({
        studentId: student.id,
        studentName: student.name,
        rollNo: student.rollNo,
        consecutiveDays: 3,
        dates: historyDates.map(h => h.date)
      });
    }
  });

  return defaulters;
};
