const { auth } = require('../utils/firebase');

// Verify Firebase ID token from Authorization header
const verifyToken = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const token = header.split('Bearer ')[1];
    req.user = await auth.verifyIdToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Admin-only middleware — checks custom claim or Firestore role
const requireAdmin = async (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { db } = require('../utils/firebase');
  const userDoc = await db.collection('users').doc(req.user.uid).get();
  if (!userDoc.exists || userDoc.data().role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = { verifyToken, requireAdmin };
