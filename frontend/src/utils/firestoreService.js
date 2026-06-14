// Data service - Firestore when Firebase configured, localStorage otherwise
import { firebaseConfigured, db } from '../firebase';
import {
  collection, addDoc, doc, updateDoc, query,
  where, orderBy, onSnapshot, serverTimestamp, limit
} from 'firebase/firestore';
import { DUMMY_COMPLAINTS } from './dummyData';

// ── LOCAL STORAGE HELPERS ─────────────────────────────────────
const seedLocalData = () => {
  // Always re-seed with latest data
  const seeded = DUMMY_COMPLAINTS.map((c) => ({
    ...c,
    timestamp: c.createdAt,
  }));
  localStorage.setItem('smartcity_complaints', JSON.stringify(seeded));
};

const getLocal  = ()     => { seedLocalData(); return JSON.parse(localStorage.getItem('smartcity_complaints') || '[]'); };
const saveLocal = (list) => localStorage.setItem('smartcity_complaints', JSON.stringify(list));

// Convert image to base64 (no Firebase Storage needed - free plan)
const toBase64 = (file) => new Promise((resolve) => {
  const reader = new FileReader();
  reader.onload = (e) => resolve(e.target.result);
  reader.readAsDataURL(file);
});

// ── SUBMIT COMPLAINT ──────────────────────────────────────────
export const submitComplaint = async (data, imageFile, userId) => {
  const imageUrl = imageFile ? await toBase64(imageFile) : null;

  const complaintData = {
    title:             data.title,
    description:       data.description,
    category:          data.category,
    ward:              data.ward || null,
    latitude:          data.location?.lat || null,
    longitude:         data.location?.lng || null,
    imageUrl,
    imageVerification: data.imageVerification || null,
    userId,
    status:    'Pending',
    upvotes:   0,
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  if (firebaseConfigured && db) {
    const docRef = await addDoc(collection(db, 'complaints'), {
      ...complaintData,
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...complaintData };
  }

  const complaint = { id: `complaint-${Date.now()}`, ...complaintData };
  const list = getLocal();
  list.unshift(complaint);
  saveLocal(list);
  return complaint;
};

// ── GET USER COMPLAINTS ───────────────────────────────────────
export const getUserComplaints = (userId, callback) => {
  if (firebaseConfigured && db) {
    const q = query(
      collection(db, 'complaints'),
      where('userId', '==', userId)
    );
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => {
        const ta = a.timestamp?.toDate?.() || new Date(a.timestamp || 0);
        const tb = b.timestamp?.toDate?.() || new Date(b.timestamp || 0);
        return tb - ta;
      });
      callback(data);
    });
  }
  callback(getLocal().filter((c) => c.userId === userId));
  return () => {};
};

// ── GET ALL COMPLAINTS ────────────────────────────────────────
export const getAllComplaints = (callback) => {
  if (firebaseConfigured && db) {
    const q = query(collection(db, 'complaints'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }
  callback(getLocal());
  return () => {};
};

// ── UPDATE STATUS ─────────────────────────────────────────────
export const updateComplaintStatus = async (id, status) => {
  if (firebaseConfigured && db) {
    await updateDoc(doc(db, 'complaints', id), { status, updatedAt: serverTimestamp() });
    return;
  }
  const list = getLocal();
  const idx  = list.findIndex((c) => c.id === id);
  if (idx !== -1) { list[idx].status = status; saveLocal(list); }
};

// ── ALERTS ────────────────────────────────────────────────────
export const getAlerts = (callback) => {
  if (firebaseConfigured && db) {
    const q = query(collection(db, 'alerts'), orderBy('createdAt', 'desc'), limit(30));
    return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }
  callback(JSON.parse(localStorage.getItem('smartcity_alerts') || '[]'));
  return () => {};
};

export const markAlertRead = async (id) => {
  if (firebaseConfigured && db) {
    await updateDoc(doc(db, 'alerts', id), { read: true });
    return;
  }
  const alerts = JSON.parse(localStorage.getItem('smartcity_alerts') || '[]');
  const idx    = alerts.findIndex((a) => a.id === id);
  if (idx !== -1) { alerts[idx].read = true; localStorage.setItem('smartcity_alerts', JSON.stringify(alerts)); }
};

// ── CITY METRICS ──────────────────────────────────────────────
export const getCityMetrics = (callback) => {
  if (firebaseConfigured && db) {
    return onSnapshot(doc(db, 'cityMetrics', 'current'), (snap) => {
      callback(snap.exists() ? snap.data() : null);
    });
  }
  const complaints = getLocal();
  callback({
    complaintsCount: complaints.length,
    pendingCount:    complaints.filter((c) => c.status === 'Pending').length,
    resolvedCount:   complaints.filter((c) => c.status === 'Resolved').length,
    pollution: 68, traffic: 72,
    cityHealthScore: 42, healthGrade: 'C',
  });
  return () => {};
};
