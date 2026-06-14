// ============================================================
// Cloud Function: cityMetrics
// Calculates City Health Score and updates cityMetrics collection
// Score = 100 - complaint penalties - pollution - traffic
// ============================================================

const CATEGORY_PRIORITY = {
  Accident: 10, Fire: 9, Flood: 8, 'Power Outage': 7,
  Pollution: 6, 'Road Damage': 5, 'Water Supply': 5,
  Garbage: 4, Noise: 3, Other: 2
};

// Tamil Nadu city dummy sensor data
const CITY_SENSOR_DATA = {
  Chennai:     { pollution: 68, traffic: 72, population: 7088000 },
  Coimbatore:  { pollution: 45, traffic: 55, population: 1601438 },
  Madurai:     { pollution: 52, traffic: 48, population: 1017865 },
  Trichy:      { pollution: 38, traffic: 42, population: 916857  },
  Salem:       { pollution: 41, traffic: 38, population: 831038  },
};

const calculateScore = (complaints, pollution, traffic) => {
  const total      = complaints.length;
  const pending    = complaints.filter((c) => c.status === 'Pending').length;
  const highPri    = complaints.filter((c) => (CATEGORY_PRIORITY[c.category] || 2) >= 7).length;

  const complaintPenalty    = Math.min(total * 0.5, 30);
  const pendingPenalty      = Math.min(pending * 0.8, 20);
  const highPriorityPenalty = Math.min(highPri * 2, 20);
  const pollutionPenalty    = (pollution / 100) * 15;
  const trafficPenalty      = (traffic / 100) * 15;

  return Math.max(0, Math.round(
    100 - complaintPenalty - pendingPenalty - highPriorityPenalty - pollutionPenalty - trafficPenalty
  ));
};

const updateCityMetrics = async (db) => {
  // Fetch all active complaints
  const snap = await db.collection('complaints').get();
  const complaints = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const total    = complaints.length;
  const pending  = complaints.filter((c) => c.status === 'Pending').length;
  const progress = complaints.filter((c) => c.status === 'In Progress').length;
  const resolved = complaints.filter((c) => c.status === 'Resolved').length;

  // Category breakdown
  const byCategory = complaints.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {});

  // Ward breakdown
  const byWard = complaints.reduce((acc, c) => {
    if (c.ward) acc[c.ward] = (acc[c.ward] || 0) + 1;
    return acc;
  }, {});

  // Use Chennai as default sensor data
  const sensor = CITY_SENSOR_DATA['Chennai'];
  const score  = calculateScore(complaints, sensor.pollution, sensor.traffic);

  const metrics = {
    complaintsCount: total,
    pendingCount:    pending,
    inProgressCount: progress,
    resolvedCount:   resolved,
    resolutionRate:  total > 0 ? Math.round((resolved / total) * 100) : 0,
    byCategory,
    byWard,
    pollution:       sensor.pollution,
    traffic:         sensor.traffic,
    cityHealthScore: score,
    healthGrade:     score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D',
    sensorData:      CITY_SENSOR_DATA,
    updatedAt:       new Date().toISOString()
  };

  await db.collection('cityMetrics').doc('current').set(metrics, { merge: true });
  console.log(`[City Metrics] Score: ${score} | Total: ${total} | Pending: ${pending}`);
  return metrics;
};

module.exports = { updateCityMetrics, CITY_SENSOR_DATA };
