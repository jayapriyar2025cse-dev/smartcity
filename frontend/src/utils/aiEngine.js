// ============================================================
// AI ENGINE - Smart City Decision Hub
// ============================================================

export const CATEGORY_PRIORITY = {
  Accident: 10, Fire: 9, Flood: 8, 'Power Outage': 7,
  Pollution: 6, 'Road Damage': 5, 'Water Supply': 5,
  Garbage: 4, Noise: 3, Other: 2
};

const RECOMMENDATIONS = {
  Accident:      ['Deploy emergency response team', 'Install traffic signal', 'Add speed breakers', 'Increase police patrol'],
  Fire:          ['Dispatch fire brigade immediately', 'Evacuate nearby residents', 'Check gas pipelines'],
  Flood:         ['Deploy water pumps', 'Open relief camps', 'Alert drainage department'],
  'Power Outage':['Dispatch electrical team', 'Check transformer units', 'Activate backup generators'],
  Pollution:     ['Deploy pollution control unit', 'Issue factory inspection order', 'Restrict heavy vehicles'],
  'Road Damage': ['Schedule road repair crew', 'Place warning signs', 'Reroute traffic'],
  'Water Supply':['Dispatch water tankers', 'Inspect pipeline network', 'Check water treatment plant'],
  Garbage:       ['Deploy 2 garbage trucks', 'Schedule extra collection rounds', 'Issue sanitation notice'],
  Noise:         ['Send noise compliance team', 'Issue noise violation notice'],
  Other:         ['Assign field officer for inspection', 'Log for review']
};

// Helper — get lat/lng from either format
const getLat = (c) => c.latitude  || c.location?.lat  || null;
const getLng = (c) => c.longitude || c.location?.lng  || null;

// Helper — get timestamp from either format
const getTime = (c) => {
  try {
    const ts = c.timestamp || c.createdAt;
    if (ts?.toDate) return ts.toDate().getTime();
    return new Date(ts).getTime();
  } catch { return Date.now(); }
};

// ── 1. HOTSPOT DETECTION ──────────────────────────────────────
export const detectHotspots = (complaints) => {
  const grid = {};
  complaints.forEach((c) => {
    const lat = getLat(c);
    const lng = getLng(c);
    if (!lat || !lng) return;
    const key = `${parseFloat(lat).toFixed(2)}_${parseFloat(lng).toFixed(2)}`;
    if (!grid[key]) grid[key] = { complaints: [], lat: parseFloat(lat), lng: parseFloat(lng) };
    grid[key].complaints.push(c);
  });

  return Object.entries(grid)
    .filter(([, v]) => v.complaints.length >= 3)
    .map(([key, v]) => ({
      key,
      lat: v.lat,
      lng: v.lng,
      count: v.complaints.length,
      categories: [...new Set(v.complaints.map((c) => c.category))],
      isHighPriority: v.complaints.length >= 5
    }));
};

// ── 2. TREND DETECTION ───────────────────────────────────────
export const detectTrends = (complaints) => {
  const now = Date.now();
  const last24h = complaints.filter((c) => now - getTime(c) < 86400000);
  const prev24h = complaints.filter((c) => {
    const age = now - getTime(c);
    return age >= 86400000 && age < 172800000;
  });

  const alerts = [];
  if (prev24h.length > 0 && last24h.length > prev24h.length * 1.5) {
    alerts.push({
      type: 'SURGE',
      message: `Complaint surge detected! ${last24h.length} complaints in last 24h (${Math.round((last24h.length / prev24h.length - 1) * 100)}% increase)`,
      severity: 'high'
    });
  }

  const catCount = {};
  last24h.forEach((c) => { catCount[c.category] = (catCount[c.category] || 0) + 1; });
  Object.entries(catCount).forEach(([cat, count]) => {
    if (count >= 5) {
      alerts.push({
        type: 'CATEGORY_SPIKE',
        message: `${count} ${cat} complaints in last 24 hours — immediate action required`,
        severity: count >= 10 ? 'critical' : 'high',
        category: cat
      });
    }
  });

  return alerts;
};

// ── 3. PRIORITY RANKING ──────────────────────────────────────
export const rankByPriority = (complaints) => {
  return complaints
    .map((c) => {
      const categoryScore = CATEGORY_PRIORITY[c.category] || 2;
      const ageHours      = (Date.now() - getTime(c)) / 3600000;
      const ageScore      = Math.min(ageHours / 24, 5);
      const statusScore   = c.status === 'Pending' ? 3 : c.status === 'In Progress' ? 1 : 0;
      return { ...c, priorityScore: Math.round((categoryScore * 2 + ageScore + statusScore) * 10) / 10 };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);
};

// ── 4. RECOMMENDATION ENGINE ─────────────────────────────────
export const getRecommendations = (complaint) => {
  return (RECOMMENDATIONS[complaint.category] || RECOMMENDATIONS.Other).slice(0, 3);
};

// ── 5. CITY HEALTH SCORE ─────────────────────────────────────
export const calculateCityHealthScore = (complaints, pollutionLevel = null, trafficDensity = null) => {
  const total       = complaints.length;
  const pending     = complaints.filter((c) => c.status === 'Pending').length;
  const highPriority = complaints.filter((c) => (CATEGORY_PRIORITY[c.category] || 2) >= 7).length;
  const pollution   = pollutionLevel ?? 68;
  const traffic     = trafficDensity ?? 72;

  const complaintPenalty    = Math.min(total * 0.5, 30);
  const pendingPenalty      = Math.min(pending * 0.8, 20);
  const highPriorityPenalty = Math.min(highPriority * 2, 20);
  const pollutionPenalty    = (pollution / 100) * 15;
  const trafficPenalty      = (traffic / 100) * 15;

  const score = Math.max(0, Math.round(
    100 - complaintPenalty - pendingPenalty - highPriorityPenalty - pollutionPenalty - trafficPenalty
  ));

  return {
    score,
    grade: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D',
    color: score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : score >= 40 ? '#f97316' : '#ef4444',
    breakdown: {
      complaints: Math.round(100 - complaintPenalty - pendingPenalty - highPriorityPenalty),
      pollution:  Math.round(100 - pollutionPenalty * (100 / 15)),
      traffic:    Math.round(100 - trafficPenalty   * (100 / 15)),
      pollutionRaw: pollution,
      trafficRaw:   traffic
    }
  };
};

// ── 6. WARD ALERTS ───────────────────────────────────────────
export const generateWardAlerts = (complaints) => {
  const wardMap = {};
  complaints.forEach((c) => {
    const ward = c.ward || 'Unknown';
    if (!wardMap[ward]) wardMap[ward] = [];
    wardMap[ward].push(c);
  });

  return Object.entries(wardMap)
    .filter(([, list]) => list.length >= 3)
    .map(([ward, list]) => ({
      ward,
      count: list.length,
      topCategory: Object.entries(
        list.reduce((acc, c) => { acc[c.category] = (acc[c.category] || 0) + 1; return acc; }, {})
      ).sort((a, b) => b[1] - a[1])[0]?.[0],
      message: `High priority issue detected in ${ward} — ${list.length} active complaints`,
      severity: list.length >= 7 ? 'critical' : 'high'
    }));
};
