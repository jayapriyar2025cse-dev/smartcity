const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

// ── Import all function modules ───────────────────────────────
const { onNewComplaint }     = require('./onNewComplaint');
const { trendDetection }     = require('./trendDetection');
const { updateCityMetrics }  = require('./cityMetrics');
const { scheduledMetrics }   = require('./scheduledMetrics');

// Trigger: fires every time a new complaint document is created
exports.onNewComplaint = functions.firestore
  .document('complaints/{complaintId}')
  .onCreate(async (snap, context) => {
    const complaint = { id: context.params.complaintId, ...snap.data() };
    console.log(`[AI Engine] New complaint: ${complaint.title}`);
    await onNewComplaint(complaint, db);
  });

// Trigger: fires on any complaint write (create/update) for metrics
exports.onComplaintWrite = functions.firestore
  .document('complaints/{complaintId}')
  .onWrite(async (change, context) => {
    await updateCityMetrics(db);
  });

// Scheduled: runs every 30 minutes to detect trends & update health score
exports.scheduledAIAnalysis = functions.pubsub
  .schedule('every 30 minutes')
  .onRun(async (context) => {
    console.log('[Scheduler] Running AI trend analysis...');
    await trendDetection(db);
    await scheduledMetrics(db);
  });

// HTTP: manually trigger AI analysis (for demo/testing)
exports.triggerAnalysis = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  try {
    await trendDetection(db);
    await updateCityMetrics(db);
    res.json({ success: true, message: 'AI analysis completed', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// HTTP: get full AI analysis report
exports.getAIReport = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  try {
    const [complaintsSnap, alertsSnap, metricsSnap] = await Promise.all([
      db.collection('complaints').orderBy('timestamp', 'desc').limit(100).get(),
      db.collection('alerts').orderBy('createdAt', 'desc').limit(20).get(),
      db.collection('cityMetrics').doc('current').get(),
    ]);
    res.json({
      complaints: complaintsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      alerts: alertsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      metrics: metricsSnap.exists ? metricsSnap.data() : {},
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
