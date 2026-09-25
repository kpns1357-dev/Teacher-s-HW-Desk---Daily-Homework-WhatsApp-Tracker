const LOCAL_STORAGE_KEY_BATCHES = 'hw_batches_data';
const LOCAL_STORAGE_KEY_LOGS = 'hw_logs_data';
const LOCAL_STORAGE_KEY_API_URL = 'hw_backend_api_url';
const LOCAL_STORAGE_KEY_TEACHER_KEY = 'hw_backend_teacher_key';

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

export const getBackendConfig = () => ({
  apiUrl: localStorage.getItem(LOCAL_STORAGE_KEY_API_URL) || import.meta.env.VITE_BACKEND_API_URL || '',
  teacherKey: localStorage.getItem(LOCAL_STORAGE_KEY_TEACHER_KEY) || import.meta.env.VITE_TEACHER_KEY || ''
});

export const saveBackendConfig = (apiUrl, teacherKey) => {
  localStorage.setItem(LOCAL_STORAGE_KEY_API_URL, apiUrl || '');
  localStorage.setItem(LOCAL_STORAGE_KEY_TEACHER_KEY, teacherKey || '');
};

// 1. Load Batches
export const loadBatches = async () => {
  const { apiUrl, teacherKey } = getBackendConfig();
  if (apiUrl) {
    try {
      const res = await fetch(`${apiUrl.replace(/\/$/, '')}/api/batches`, {
        headers: { 'x-teacher-key': teacherKey }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.batches && data.batches.length > 0) {
          localStorage.setItem(LOCAL_STORAGE_KEY_BATCHES, JSON.stringify(data.batches));
          return data.batches;
        }
      }
    } catch (e) {
      console.warn("Backend proxy offline or unreachable, using local:", e);
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

// 2. Save Batches
export const saveBatches = async (batches) => {
  localStorage.setItem(LOCAL_STORAGE_KEY_BATCHES, JSON.stringify(batches));

  const { apiUrl, teacherKey } = getBackendConfig();
  if (apiUrl) {
    try {
      await fetch(`${apiUrl.replace(/\/$/, '')}/api/batches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-teacher-key': teacherKey
        },
        body: JSON.stringify({ batches })
      });
    } catch (e) {
      console.warn("Failed saving batches to backend proxy:", e);
    }
  }
};

// 3. Save Homework Record (Automatic sync)
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

  // Sync to secure backend proxy
  const { apiUrl, teacherKey } = getBackendConfig();
  if (apiUrl) {
    try {
      await fetch(`${apiUrl.replace(/\/$/, '')}/api/homework`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-teacher-key': teacherKey
        },
        body: JSON.stringify(record)
      });
    } catch (e) {
      console.warn("Failed to auto-sync homework record to private backend:", e);
    }
  }
};

// 4. Get Homework Record
export const getHomeworkRecord = async (batchId, date) => {
  const { apiUrl, teacherKey } = getBackendConfig();
  if (apiUrl) {
    try {
      const res = await fetch(`${apiUrl.replace(/\/$/, '')}/api/homework/${batchId}/${date}`, {
        headers: { 'x-teacher-key': teacherKey }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.record) return data.record;
      }
    } catch (e) {
      console.warn("Backend proxy get record fallback:", e);
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
