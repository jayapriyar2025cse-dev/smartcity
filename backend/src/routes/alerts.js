const express = require('express');
const router = express.Router();
const { db } = require('../utils/firebase');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// GET /api/alerts — Get all alerts
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const snap = await db.collection('alerts').orderBy('createdAt', 'desc').limit(50).get();
    res.json({ alerts: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/alerts — Create alert (called by AI engine)
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { message, severity, type } = req.body;
    const ref = await db.collection('alerts').add({ message, severity, type, read: false, createdAt: new Date().toISOString() });
    res.status(201).json({ id: ref.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/alerts/:id/read — Mark alert as read
router.patch('/:id/read', verifyToken, async (req, res) => {
  try {
    await db.collection('alerts').doc(req.params.id).update({ read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
