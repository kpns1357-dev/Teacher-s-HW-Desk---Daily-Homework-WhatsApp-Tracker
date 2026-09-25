import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// Initialize Firebase Admin securely using Private Service Account credentials
if (!admin.apps.length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✅ Firebase Admin SDK initialized from service account JSON');
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', e);
    }
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      })
    });
    console.log('✅ Firebase Admin SDK initialized from env credentials');
  } else {
    console.warn('⚠️ Firebase Admin credentials not provided in environment. Running in mock/offline mode.');
  }
}

const db = admin.apps.length ? admin.firestore() : null;

// --- ZERO-LOGIN AUTO-SAVING API ROUTES ---

// 1. Health & status check
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    firebaseAdminConnected: !!db
  });
});

// 2. Get all batches
app.get('/api/batches', async (req, res) => {
  if (!db) return res.json({ batches: [] });
  try {
    const snap = await db.collection('batches').get();
    const batches = [];
    snap.forEach(doc => batches.push({ id: doc.id, ...doc.data() }));
    res.json({ batches });
  } catch (err) {
    console.error('Error fetching batches:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Save batches (Auto-save)
app.post('/api/batches', async (req, res) => {
  if (!db) return res.json({ success: true, mocked: true });
  const { batches } = req.body;
  if (!Array.isArray(batches)) {
    return res.status(400).json({ error: 'Batches must be an array.' });
  }
  try {
    const batchWriter = db.batch();
    for (const b of batches) {
      const ref = db.collection('batches').doc(b.id);
      batchWriter.set(ref, b, { merge: true });
    }
    await batchWriter.commit();
    res.json({ success: true, count: batches.length });
  } catch (err) {
    console.error('Error saving batches:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Save daily homework record (Instant background auto-save)
app.post('/api/homework', async (req, res) => {
  if (!db) return res.json({ success: true, mocked: true });
  const record = req.body;
  if (!record || !record.batchId || !record.date) {
    return res.status(400).json({ error: 'batchId and date are required.' });
  }
  try {
    const docId = `${record.batchId}_${record.date}`;
    await db.collection('homework_logs').doc(docId).set(record, { merge: true });
    res.json({ success: true, docId });
  } catch (err) {
    console.error('Error saving homework record:', err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Get homework record by batch and date
app.get('/api/homework/:batchId/:date', async (req, res) => {
  if (!db) return res.json({ record: null });
  const { batchId, date } = req.params;
  try {
    const docId = `${batchId}_${date}`;
    const snap = await db.collection('homework_logs').doc(docId).get();
    if (snap.exists) {
      res.json({ record: snap.data() });
    } else {
      res.json({ record: null });
    }
  } catch (err) {
    console.error('Error fetching homework record:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🔒 Zero-auth private auto-saving homework proxy running on port ${PORT}`);
});
