// ============================================================
// Scheduled function: runs every 30 minutes
// Seeds initial Tamil Nadu data if Firestore is empty
// ============================================================
const { updateCityMetrics, CITY_SENSOR_DATA } = require('./cityMetrics');

const TN_SEED_COMPLAINTS = [
  { title: 'Massive pothole on Anna Salai', category: 'Road Damage', status: 'Pending', ward: 'Chennai - Ward 10', latitude: 13.0604, longitude: 80.2496, description: 'Deep pothole near LIC building causing accidents', locationKey: '13.06_80.25', priorityScore: 5 },
  { title: 'Garbage overflowing near Koyambedu Market', category: 'Garbage', status: 'Pending', ward: 'Chennai - Ward 7', latitude: 13.0694, longitude: 80.1948, description: 'Garbage bins not cleared for 6 days', locationKey: '13.07_80.19', priorityScore: 4 },
  { title: 'Sewage overflow on Usman Road', category: 'Water Supply', status: 'In Progress', ward: 'Chennai - Ward 12', latitude: 13.0524, longitude: 80.2341, description: 'Sewage water overflowing onto road near T.Nagar', locationKey: '13.05_80.23', priorityScore: 5 },
  { title: 'Factory smoke near Ambattur Industrial Estate', category: 'Pollution', status: 'Pending', ward: 'Chennai - Ward 5', latitude: 13.1143, longitude: 80.1548, description: 'Black smoke from factory affecting residents', locationKey: '13.11_80.15', priorityScore: 6 },
  { title: 'Road accident blackspot at Kathipara Junction', category: 'Accident', status: 'Pending', ward: 'Chennai - Ward 9', latitude: 13.0130, longitude: 80.2108, description: '4 accidents in last 10 days at this junction', locationKey: '13.01_80.21', priorityScore: 10 },
  { title: 'Flooding on Poonamallee High Road', category: 'Flood', status: 'In Progress', ward: 'Chennai - Ward 6', latitude: 13.0674, longitude: 80.1757, description: 'Waterlogging after rain, vehicles stuck for hours', locationKey: '13.07_80.18', priorityScore: 8 },
  { title: 'Power outage in Adyar Colony', category: 'Power Outage', status: 'Pending', ward: 'Chennai - Ward 14', latitude: 13.0012, longitude: 80.2565, description: 'No electricity for 10 hours, transformer issue', locationKey: '13.00_80.26', priorityScore: 7 },
  { title: 'Garbage dumping near Marina Beach', category: 'Garbage', status: 'Pending', ward: 'Chennai - Ward 10', latitude: 13.0500, longitude: 80.2824, description: 'Illegal garbage dumping near beach entrance', locationKey: '13.05_80.28', priorityScore: 4 },
  { title: 'Pothole on Avinashi Road, Coimbatore', category: 'Road Damage', status: 'Pending', ward: 'Coimbatore - Ward 3', latitude: 11.0168, longitude: 76.9558, description: 'Multiple potholes causing two-wheeler accidents', locationKey: '11.02_76.96', priorityScore: 5 },
  { title: 'Water scarcity in Madurai South', category: 'Water Supply', status: 'Pending', ward: 'Madurai - Ward 2', latitude: 9.9195, longitude: 78.1193, description: 'No water supply for 3 days in Tallakulam area', locationKey: '9.92_78.12', priorityScore: 5 },
  { title: 'Air pollution near Ennore Port', category: 'Pollution', status: 'Pending', ward: 'Chennai - Ward 5', latitude: 13.2167, longitude: 80.3167, description: 'Severe air pollution from thermal plant', locationKey: '13.22_80.32', priorityScore: 6 },
  { title: 'Flash flood in Velachery', category: 'Flood', status: 'Pending', ward: 'Chennai - Ward 15', latitude: 12.9815, longitude: 80.2180, description: 'Velachery lake overflow flooding residential streets', locationKey: '12.98_80.22', priorityScore: 8 },
];

const scheduledMetrics = async (db) => {
  // Check if complaints collection is empty → seed data
  const snap = await db.collection('complaints').limit(1).get();
  if (snap.empty) {
    console.log('[Seed] Firestore empty — seeding Tamil Nadu data...');
    const batch = db.batch();
    const now = new Date();

    TN_SEED_COMPLAINTS.forEach((c, i) => {
      const ref = db.collection('complaints').doc();
      batch.set(ref, {
        ...c,
        userId: 'seed-user',
        imageUrl: null,
        upvotes: Math.floor(Math.random() * 50) + 5,
        aiProcessed: true,
        recommendations: [],
        isHotspot: false,
        timestamp: new Date(now.getTime() - i * 3600000 * 2).toISOString(),
        createdAt: new Date(now.getTime() - i * 3600000 * 2).toISOString(),
      });
    });

    // Seed city sensor metrics
    const metricsRef = db.collection('cityMetrics').doc('current');
    batch.set(metricsRef, {
      pollution: 68, traffic: 72,
      complaintsCount: TN_SEED_COMPLAINTS.length,
      cityHealthScore: 42,
      healthGrade: 'C',
      sensorData: CITY_SENSOR_DATA,
      updatedAt: new Date().toISOString()
    });

    await batch.commit();
    console.log(`[Seed] ${TN_SEED_COMPLAINTS.length} complaints seeded.`);
  }

  // Always update metrics
  await updateCityMetrics(db);
};

module.exports = { scheduledMetrics };
