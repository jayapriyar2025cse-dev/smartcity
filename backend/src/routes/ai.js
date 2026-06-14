const express = require('express');
const router = express.Router();
const { db } = require('../utils/firebase');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// ── AI Logic (mirrored from frontend for server-side use) ─────
const CATEGORY_PRIORITY = {
  Accident: 10, Fire: 9, Flood: 8, 'Power Outage': 7, Pollution: 6,
  'Road Damage': 5, 'Water Supply': 5, Garbage: 4, Noise: 3, Other: 2
};

const RECOMMENDATIONS = {
  Accident: ['Deploy emergency response team', 'Install traffic signal', 'Add speed breakers'],
  Fire: ['Dispatch fire brigade immediately', 'Evacuate nearby residents'],
  Flood: ['Deploy water pumps', 'Open relief camps', 'Alert drainage department'],
  'Power Outage': ['Dispatch electrical team', 'Check transformer units'],
  Pollution: ['Deploy pollution control unit', 'Issue factory inspection order'],
  'Road Damage': ['Schedule road repair crew', 'Place warning signs'],
  'Water Supply': ['Dispatch water tankers', 'Inspect pipeline network'],
  Garbage: ['Deploy 2 garbage trucks', 'Schedule extra collection rounds'],
  Noise: ['Send noise compliance team', 'Issue noise violation notice'],
  Other: ['Assign field officer for inspection']
};

const detectHotspots = (complaints) => {
  const grid = {};
  complaints.forEach((c) => {
    if (!c.location?.lat) return;
    const key = `${parseFloat(c.location.lat).toFixed(2)}_${parseFloat(c.location.lng).toFixed(2)}`;
    if (!grid[key]) grid[key] = { complaints: [], lat: c.location.lat, lng: c.location.lng };
    grid[key].complaints.push(c);
  });
  return Object.entries(grid)
    .filter(([, v]) => v.complaints.length >= 3)
    .map(([key, v]) => ({ key, lat: v.lat, lng: v.lng, count: v.complaints.length, isHighPriority: v.complaints.length >= 5 }));
};

const rankByPriority = (complaints) =>
  complaints.map((c) => {
    const categoryScore = CATEGORY_PRIORITY[c.category] || 2;
    const ageHours = (Date.now() - new Date(c.createdAt).getTime()) / 3600000;
    const ageScore = Math.min(ageHours / 24, 5);
    const statusScore = c.status === 'Pending' ? 3 : c.status === 'In Progress' ? 1 : 0;
    return { ...c, priorityScore: Math.round((categoryScore * 2 + ageScore + statusScore) * 10) / 10 };
  }).sort((a, b) => b.priorityScore - a.priorityScore);

// GET /api/ai/analysis — Full AI analysis of all complaints
router.get('/analysis', verifyToken, requireAdmin, async (req, res) => {
  try {
    const snap = await db.collection('complaints').orderBy('createdAt', 'desc').limit(500).get();
    const complaints = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const hotspots = detectHotspots(complaints);
    const prioritized = rankByPriority(complaints.filter((c) => c.status !== 'Resolved')).slice(0, 10);

    // Trend detection
    const now = Date.now();
    const last24h = complaints.filter((c) => now - new Date(c.createdAt).getTime() < 86400000).length;
    const prev24h = complaints.filter((c) => { const age = now - new Date(c.createdAt).getTime(); return age >= 86400000 && age < 172800000; }).length;
    const surgePct = prev24h > 0 ? Math.round((last24h / prev24h - 1) * 100) : 0;

    // City health score
    const pending = complaints.filter((c) => c.status === 'Pending').length;
    const highPriority = complaints.filter((c) => (CATEGORY_PRIORITY[c.category] || 2) >= 7).length;
    const score = Math.max(0, Math.round(100 - Math.min(complaints.length * 0.5, 30) - Math.min(pending * 0.8, 20) - Math.min(highPriority * 2, 20) - 10));

    res.json({
      hotspots,
      prioritized: prioritized.map((c) => ({
        ...c,
        recommendations: (RECOMMENDATIONS[c.category] || RECOMMENDATIONS.Other).slice(0, 3)
      })),
      trends: { last24h, prev24h, surgePct, isSurge: surgePct > 50 },
      cityHealthScore: score,
      summary: { total: complaints.length, pending, resolved: complaints.filter((c) => c.status === 'Resolved').length }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ai/recommendations/:complaintId
router.get('/recommendations/:complaintId', verifyToken, async (req, res) => {
  try {
    const doc = await db.collection('complaints').doc(req.params.complaintId).get();
    if (!doc.exists) return res.status(404).json({ error: 'Complaint not found' });
    const complaint = doc.data();
    res.json({ recommendations: (RECOMMENDATIONS[complaint.category] || RECOMMENDATIONS.Other).slice(0, 3) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
