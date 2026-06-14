// ============================================================
// Cloud Function: trendDetection
// Runs every 30 minutes via scheduler
// Detects: Complaint surges, Category spikes, Rapid increase alerts
// ============================================================

const trendDetection = async (db) => {
  const now = Date.now();
  const MS_24H = 86400000;
  const MS_48H = 172800000;

  // Fetch last 48h complaints
  const since48h = new Date(now - MS_48H).toISOString();
  const snap = await db.collection('complaints')
    .where('timestamp', '>=', since48h)
    .get();

  const complaints = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const last24h = complaints.filter((c) => now - new Date(c.timestamp).getTime() < MS_24H);
  const prev24h = complaints.filter((c) => {
    const age = now - new Date(c.timestamp).getTime();
    return age >= MS_24H && age < MS_48H;
  });

  console.log(`[Trend] Last 24h: ${last24h.length} | Prev 24h: ${prev24h.length}`);

  const alerts = [];

  // ── Overall surge detection ───────────────────────────────
  if (prev24h.length > 0) {
    const surgePercent = Math.round((last24h.length / prev24h.length - 1) * 100);
    if (surgePercent >= 50) {
      alerts.push({
        message: `📈 Complaint surge: ${last24h.length} complaints in last 24h (${surgePercent}% increase vs previous day)`,
        priority: surgePercent >= 100 ? 'critical' : 'high',
        type: 'SURGE',
        metadata: { last24h: last24h.length, prev24h: prev24h.length, surgePercent }
      });
    }
  }

  // ── Category-level spike detection ───────────────────────
  const catCount = {};
  last24h.forEach((c) => { catCount[c.category] = (catCount[c.category] || 0) + 1; });

  for (const [category, count] of Object.entries(catCount)) {
    if (count >= 5) {
      alerts.push({
        message: `⚡ ${count} ${category} complaints in last 24 hours — Immediate departmental action required`,
        priority: count >= 10 ? 'critical' : 'high',
        type: 'CATEGORY_SPIKE',
        metadata: { category, count }
      });
    }
  }

  // ── Ward-level spike detection ────────────────────────────
  const wardCount = {};
  last24h.forEach((c) => { if (c.ward) wardCount[c.ward] = (wardCount[c.ward] || 0) + 1; });

  for (const [ward, count] of Object.entries(wardCount)) {
    if (count >= 5) {
      alerts.push({
        message: `🗺️ ${ward} has ${count} new complaints in 24h — Deploy inspection team`,
        priority: 'high',
        type: 'WARD_SPIKE',
        metadata: { ward, count }
      });
    }
  }

  // ── Save all new alerts to Firestore ─────────────────────
  const batch = db.batch();
  for (const alert of alerts) {
    const ref = db.collection('alerts').doc();
    batch.set(ref, {
      ...alert,
      location: alert.metadata?.ward ? { ward: alert.metadata.ward } : null,
      read: false,
      createdAt: new Date().toISOString()
    });
    console.log(`[Trend Alert] ${alert.priority.toUpperCase()}: ${alert.message}`);
  }

  if (alerts.length > 0) await batch.commit();
  console.log(`[Trend Detection] Done. ${alerts.length} alerts generated.`);
};

module.exports = { trendDetection };
