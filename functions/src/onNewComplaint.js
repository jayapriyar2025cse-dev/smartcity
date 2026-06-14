// ============================================================
// Cloud Function: onNewComplaint
// Triggers when a new complaint is added to Firestore
// Handles: Hotspot detection, Priority assignment, Recommendations, Alert generation
// ============================================================

const CATEGORY_PRIORITY = {
  Accident: 10, Fire: 9, Flood: 8, 'Power Outage': 7,
  Pollution: 6, 'Road Damage': 5, 'Water Supply': 5,
  Garbage: 4, Noise: 3, Other: 2
};

const RECOMMENDATIONS = {
  Accident:      ['Deploy emergency response team', 'Install traffic signal', 'Add speed breakers'],
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

// Round lat/lng to 2 decimal places ≈ ~1km grid cell
const getLocationKey = (lat, lng) =>
  `${parseFloat(lat).toFixed(2)}_${parseFloat(lng).toFixed(2)}`;

const saveAlert = async (db, message, priority, location, type, metadata = {}) => {
  await db.collection('alerts').add({
    message, priority, location: location || null,
    type, metadata, read: false,
    createdAt: new Date().toISOString()
  });
  console.log(`[Alert] ${priority.toUpperCase()}: ${message}`);
};

const onNewComplaint = async (complaint, db) => {
  const batch = db.batch();
  const complaintRef = db.collection('complaints').doc(complaint.id);

  // ── 1. PRIORITY ASSIGNMENT ────────────────────────────────
  const priorityScore = CATEGORY_PRIORITY[complaint.category] || 2;
  const recommendations = (RECOMMENDATIONS[complaint.category] || RECOMMENDATIONS.Other).slice(0, 3);

  batch.update(complaintRef, {
    priorityScore,
    recommendations,
    aiProcessed: true,
    processedAt: new Date().toISOString()
  });

  console.log(`[Priority] ${complaint.category} → Score: ${priorityScore}`);
  console.log(`[Recommendations] ${recommendations.join(' | ')}`);

  // ── 2. HOTSPOT DETECTION ──────────────────────────────────
  if (complaint.latitude && complaint.longitude) {
    const locationKey = getLocationKey(complaint.latitude, complaint.longitude);

    // Query complaints in same ~1km grid cell
    const nearbySnap = await db.collection('complaints')
      .where('locationKey', '==', locationKey)
      .get();

    const nearbyCount = nearbySnap.size + 1; // +1 for current complaint

    // Update location key on current complaint
    batch.update(complaintRef, { locationKey });

    if (nearbyCount >= 5) {
      // HIGH PRIORITY ZONE — 5+ complaints in same area
      batch.update(complaintRef, { isHotspot: true, hotspotLevel: 'HIGH' });

      // Mark all nearby complaints as hotspot
      nearbySnap.docs.forEach((doc) => {
        batch.update(doc.ref, { isHotspot: true, hotspotLevel: 'HIGH' });
      });

      await saveAlert(db,
        `🚨 HIGH PRIORITY ZONE: ${nearbyCount} complaints near ${complaint.ward || 'unknown area'} — Immediate action required`,
        'critical',
        { lat: complaint.latitude, lng: complaint.longitude, ward: complaint.ward },
        'HOTSPOT',
        { count: nearbyCount, category: complaint.category, locationKey }
      );

    } else if (nearbyCount >= 3) {
      // HOTSPOT — 3+ complaints
      batch.update(complaintRef, { isHotspot: true, hotspotLevel: 'MEDIUM' });

      await saveAlert(db,
        `⚠️ Hotspot detected: ${nearbyCount} complaints in ${complaint.ward || 'same area'} — Monitor closely`,
        'high',
        { lat: complaint.latitude, lng: complaint.longitude, ward: complaint.ward },
        'HOTSPOT',
        { count: nearbyCount, locationKey }
      );
    }
  }

  // ── 3. HIGH PRIORITY CATEGORY ALERT ──────────────────────
  if (priorityScore >= 8) {
    await saveAlert(db,
      `🔴 Critical complaint: "${complaint.title}" in ${complaint.ward || 'unknown ward'} — Priority: ${complaint.category}`,
      'critical',
      { ward: complaint.ward },
      'HIGH_PRIORITY_CATEGORY',
      { category: complaint.category, complaintId: complaint.id }
    );
  }

  // ── 4. WARD-LEVEL ALERT ───────────────────────────────────
  if (complaint.ward) {
    const wardSnap = await db.collection('complaints')
      .where('ward', '==', complaint.ward)
      .where('status', '==', 'Pending')
      .get();

    const wardCount = wardSnap.size + 1;
    if (wardCount >= 7) {
      await saveAlert(db,
        `High priority issue detected in ${complaint.ward} — ${wardCount} active complaints pending`,
        'high',
        { ward: complaint.ward },
        'WARD_OVERLOAD',
        { ward: complaint.ward, count: wardCount }
      );
    }
  }

  await batch.commit();
  console.log(`[AI Engine] Complaint ${complaint.id} processed successfully`);
};

module.exports = { onNewComplaint };
