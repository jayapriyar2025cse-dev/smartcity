// ============================================================
// FRAUD DETECTION ENGINE  (client-side, no API key needed)
// Scores every complaint using behavioural + metadata signals
// ============================================================

const getTime = (c) => {
  try {
    const ts = c.timestamp || c.createdAt;
    if (ts?.toDate) return ts.toDate().getTime();
    return new Date(ts).getTime();
  } catch { return Date.now(); }
};

// Weight of each fraud signal (0–1 contribution to final score)
const SIGNALS = {
  duplicateTitle:    0.35,
  rapidSubmission:   0.25, // <5 min gap between same-user complaints
  noLocation:        0.15,
  lowUpvotes:        0.10,
  suspiciousWords:   0.20,
  categorySpam:      0.15,
  oddHours:          0.10, // 2 am – 5 am
  imageAiFlagged:    0.40, // from Hive AI backend result
  imageManipulated:  0.35,
};

const BAD_WORDS = ['test', 'fake', 'dummy', 'asdf', 'qwerty', 'abc', 'xxx', '123', 'sample'];

// ── Score one complaint against the full dataset ─────────────
export const scoreComplaint = (complaint, all) => {
  let raw = 0;
  const signals = [];

  const byUser = all.filter((c) => c.userId === complaint.userId && c.id !== complaint.id);
  const t      = getTime(complaint);

  // Duplicate title from same user
  if (byUser.some((c) => c.title?.toLowerCase() === complaint.title?.toLowerCase())) {
    raw += SIGNALS.duplicateTitle; signals.push('Duplicate title');
  }

  // Rapid submission (<5 min)
  if (byUser.some((c) => Math.abs(getTime(c) - t) < 300_000)) {
    raw += SIGNALS.rapidSubmission; signals.push('Rapid submission');
  }

  // No GPS location attached
  if (!complaint.latitude && !complaint.location?.lat) {
    raw += SIGNALS.noLocation; signals.push('No GPS location');
  }

  // Low upvotes on old complaint (>12 h old, <3 upvotes)
  const ageH = (Date.now() - t) / 3_600_000;
  if (ageH > 12 && (complaint.upvotes || 0) < 3) {
    raw += SIGNALS.lowUpvotes; signals.push('Low community validation');
  }

  // Suspicious keywords
  const text = `${complaint.title} ${complaint.description}`.toLowerCase();
  if (BAD_WORDS.some((w) => text.includes(w))) {
    raw += SIGNALS.suspiciousWords; signals.push('Suspicious keywords');
  }

  // Category spam (same category >3× from same user)
  if (byUser.filter((c) => c.category === complaint.category).length >= 3) {
    raw += SIGNALS.categorySpam; signals.push('Category spam');
  }

  // Odd submission hours
  const hour = new Date(t).getHours();
  if (hour >= 2 && hour <= 5) {
    raw += SIGNALS.oddHours; signals.push('Odd submission time');
  }

  // Hive AI image verification result (stored in Firestore)
  const iv = complaint.imageVerification;
  if (iv) {
    if (iv.aiScore > 0.5)           { raw += SIGNALS.imageAiFlagged;   signals.push('AI-generated image'); }
    if (iv.manipulationScore > 0.5) { raw += SIGNALS.imageManipulated; signals.push('Manipulated image'); }
  }

  const score = Math.min(Math.round(raw * 100), 99);
  return {
    ...complaint,
    fraudScore:   score,
    fraudSignals: signals,
    isFake:       score >= 45,
    riskLevel:    score >= 70 ? 'HIGH' : score >= 45 ? 'MEDIUM' : 'LOW',
  };
};

// ── Analyse the full complaint list ──────────────────────────
export const analyzeFraud = (complaints) => {
  const scored = complaints.map((c) => scoreComplaint(c, complaints));
  const fake   = scored.filter((c) => c.isFake);
  const real   = scored.filter((c) => !c.isFake);

  // Per-user roll-up
  const userMap = {};
  scored.forEach((c) => {
    const uid = c.userId || 'unknown';
    if (!userMap[uid]) userMap[uid] = { userId: uid, total: 0, fake: 0, scores: [] };
    userMap[uid].total++;
    userMap[uid].scores.push(c.fraudScore);
    if (c.isFake) userMap[uid].fake++;
  });

  const highRiskUsers = Object.values(userMap)
    .map((u) => ({
      ...u,
      avgScore:   Math.round(u.scores.reduce((a, b) => a + b, 0) / u.scores.length),
      fakeRate:   Math.round((u.fake / u.total) * 100),
      // Trust score: starts at 100, penalised by fake rate and avg fraud score
      trustScore: Math.max(0, 100 - Math.round((u.fake / u.total) * 60) - Math.round(u.scores.reduce((a, b) => a + b, 0) / u.scores.length * 0.4)),
    }))
    .filter((u) => u.fake > 0 || u.avgScore > 25)
    .sort((a, b) => b.fake - a.fake || b.avgScore - a.avgScore)
    .slice(0, 10);

  // Fraud alerts
  const fraudAlerts = [];
  if (fake.length >= 5)
    fraudAlerts.push({ severity: 'critical', message: `${fake.length} suspicious complaints detected — possible coordinated fraud`, type: 'MASS_FRAUD' });
  highRiskUsers.filter((u) => u.fake >= 3).forEach((u) =>
    fraudAlerts.push({ severity: 'high', message: `Repeat offender: ${u.userId} — ${u.fake} flagged complaints (${u.fakeRate}% fraud rate)`, type: 'REPEAT_OFFENDER' })
  );
  if (scored.filter((c) => c.riskLevel === 'HIGH').length >= 3)
    fraudAlerts.push({ severity: 'medium', message: `${scored.filter((c) => c.riskLevel === 'HIGH').length} high-risk complaints need manual review`, type: 'HIGH_RISK_BATCH' });

  // Category breakdown for chart
  const catMap = {};
  scored.forEach((c) => {
    if (!catMap[c.category]) catMap[c.category] = { category: c.category, real: 0, fake: 0 };
    c.isFake ? catMap[c.category].fake++ : catMap[c.category].real++;
  });

  return {
    scored,
    fake,
    real,
    highRiskUsers,
    fraudAlerts,
    categoryBreakdown: Object.values(catMap),
    stats: {
      total:          complaints.length,
      fakeCount:      fake.length,
      realCount:      real.length,
      fakeRate:       Math.round((fake.length / Math.max(complaints.length, 1)) * 100),
      avgFraudScore:  Math.round(scored.reduce((a, c) => a + c.fraudScore, 0) / Math.max(scored.length, 1)),
    },
  };
};
