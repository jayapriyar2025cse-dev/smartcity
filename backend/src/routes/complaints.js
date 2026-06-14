const express = require('express');
const router = express.Router();
const { db } = require('../utils/firebase');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// GET /api/complaints — Admin: all complaints with optional filters
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { category, status, ward, limit = 100 } = req.query;
    let query = db.collection('complaints').orderBy('createdAt', 'desc').limit(Number(limit));
    if (category) query = query.where('category', '==', category);
    if (status) query = query.where('status', '==', status);
    if (ward) query = query.where('ward', '==', ward);
    const snap = await query.get();
    const complaints = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ complaints, total: complaints.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/complaints/my — Citizen: own complaints
router.get('/my', verifyToken, async (req, res) => {
  try {
    const snap = await db.collection('complaints')
      .where('userId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .get();
    res.json({ complaints: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/complaints — Submit new complaint
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, description, category, ward, location, imageUrl } = req.body;
    if (!title || !category) return res.status(400).json({ error: 'Title and category are required' });

    const complaint = {
      id: uuidv4(), title, description, category, ward: ward || null,
      location: location || null, imageUrl: imageUrl || null,
      userId: req.user.uid, status: 'Pending', upvotes: 0,
      createdAt: new Date().toISOString()
    };
    await db.collection('complaints').doc(complaint.id).set(complaint);
    res.status(201).json({ complaint });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/complaints/:id/status — Admin: update status
router.patch('/:id/status', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'In Progress', 'Resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    await db.collection('complaints').doc(req.params.id).update({ status, updatedAt: new Date().toISOString() });
    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
