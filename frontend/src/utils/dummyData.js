// 100 Tamil Nadu Smart City Complaints
// Hotspot zones: Ward 1 (13.06, 80.24), Ward 5 (13.01, 80.21), Ward 10 (13.05, 80.28)

const now = Date.now();
const h = (hrs) => new Date(now - 3600000 * hrs).toISOString();

// Ward center coordinates for Tamil Nadu
const WARD_COORDS = {
  'Chennai - Ward 1':  { lat: 13.0604, lng: 80.2496 },
  'Chennai - Ward 2':  { lat: 13.0650, lng: 80.2550 },
  'Chennai - Ward 3':  { lat: 13.0700, lng: 80.2600 },
  'Chennai - Ward 4':  { lat: 13.0750, lng: 80.2650 },
  'Chennai - Ward 5':  { lat: 13.0130, lng: 80.2108 },
  'Chennai - Ward 6':  { lat: 13.0180, lng: 80.2150 },
  'Chennai - Ward 7':  { lat: 13.0694, lng: 80.1948 },
  'Chennai - Ward 8':  { lat: 13.0740, lng: 80.1990 },
  'Chennai - Ward 9':  { lat: 13.0524, lng: 80.2341 },
  'Chennai - Ward 10': { lat: 13.0500, lng: 80.2824 },
  'Chennai - Ward 11': { lat: 13.0550, lng: 80.2870 },
  'Chennai - Ward 12': { lat: 13.0569, lng: 80.2425 },
  'Chennai - Ward 13': { lat: 13.1143, lng: 80.1548 },
  'Chennai - Ward 14': { lat: 13.0012, lng: 80.2565 },
  'Chennai - Ward 15': { lat: 12.9815, lng: 80.2180 },
  'Coimbatore - Ward 1': { lat: 11.0168, lng: 76.9558 },
  'Coimbatore - Ward 2': { lat: 11.0010, lng: 76.9674 },
  'Coimbatore - Ward 3': { lat: 11.0200, lng: 76.9700 },
  'Madurai - Ward 1':  { lat: 9.9252,  lng: 78.1198 },
  'Madurai - Ward 2':  { lat: 9.9195,  lng: 78.1193 },
  'Madurai - Ward 3':  { lat: 9.9300,  lng: 78.1250 },
  'Trichy - Ward 1':   { lat: 10.8050, lng: 78.6856 },
  'Trichy - Ward 2':   { lat: 10.8100, lng: 78.6900 },
  'Salem - Ward 1':    { lat: 11.6643, lng: 78.1460 },
  'Salem - Ward 2':    { lat: 11.6700, lng: 78.1500 },
  'Salem - Ward 3':    { lat: 11.6580, lng: 78.1420 },
  'Salem - Ward 4':    { lat: 11.6620, lng: 78.1480 },
};

// Small offset to simulate nearby complaints in same hotspot zone
const jitter = (val, range = 0.003) => val + (Math.random() - 0.5) * range;

const makeComplaint = (id, title, category, ward, status, hrs, userId, description, upvotes) => {
  const coords = WARD_COORDS[ward] || { lat: 13.0604, lng: 80.2496 };
  return {
    id: String(id),
    title,
    description: description || `${title} reported in ${ward}. Immediate attention required.`,
    category,
    ward,
    status,
    latitude:  jitter(coords.lat),
    longitude: jitter(coords.lng),
    location:  { lat: jitter(coords.lat), lng: jitter(coords.lng) },
    userId:    userId || 'citizen-001',
    upvotes:   upvotes || Math.floor(Math.random() * 50) + 5,
    timestamp: h(hrs),
    createdAt: h(hrs),
  };
};

export const DUMMY_COMPLAINTS = [
  // ── HOTSPOT ZONE 1: Chennai Ward 1 (6 complaints = HIGH PRIORITY ZONE) ──
  makeComplaint(1,  'Garbage Overflow on Anna Salai',        'Garbage',     'Chennai - Ward 1',  'Pending',     1,  'user1@gmail.com',  'Garbage bins overflowing near Anna Salai bus stop', 42),
  makeComplaint(2,  'Deep Pothole near LIC Building',        'Road Damage', 'Chennai - Ward 1',  'Pending',     2,  'user2@gmail.com',  'Deep pothole causing accidents near LIC building', 38),
  makeComplaint(3,  'Heavy Traffic Jam at Anna Salai',       'Other',       'Chennai - Ward 1',  'Pending',     3,  'user3@gmail.com',  'Traffic jam causing 2hr delays on Anna Salai', 29),
  makeComplaint(4,  'Air Pollution from Vehicles',           'Pollution',   'Chennai - Ward 1',  'Pending',     4,  'user4@gmail.com',  'Severe air pollution from heavy vehicles', 55),
  makeComplaint(5,  'Garbage Dump near Residential Area',    'Garbage',     'Chennai - Ward 1',  'Pending',     5,  'user5@gmail.com',  'Illegal garbage dumping near residential colony', 33),
  makeComplaint(6,  'Broken Road Divider',                   'Road Damage', 'Chennai - Ward 1',  'In Progress', 6,  'user6@gmail.com',  'Road divider broken causing accidents', 21),

  // ── HOTSPOT ZONE 2: Chennai Ward 5 (6 complaints = HIGH PRIORITY ZONE) ──
  makeComplaint(7,  'Road Accident Blackspot Kathipara',     'Accident',    'Chennai - Ward 5',  'Pending',     1,  'user7@gmail.com',  '4 accidents in last 10 days at Kathipara junction', 67),
  makeComplaint(8,  'Pothole at Kathipara Junction',         'Road Damage', 'Chennai - Ward 5',  'Pending',     2,  'user8@gmail.com',  'Large pothole causing vehicle damage', 44),
  makeComplaint(9,  'Traffic Signal Not Working',            'Other',       'Chennai - Ward 5',  'Pending',     3,  'user9@gmail.com',  'Traffic signal broken causing accidents', 51),
  makeComplaint(10, 'Garbage near Kathipara Flyover',        'Garbage',     'Chennai - Ward 5',  'Pending',     4,  'user10@gmail.com', 'Garbage piling up near flyover entrance', 28),
  makeComplaint(11, 'Smoke from Nearby Factory',             'Pollution',   'Chennai - Ward 5',  'Pending',     5,  'user11@gmail.com', 'Black smoke from factory affecting residents', 36),
  makeComplaint(12, 'Flooding after Rain',                   'Flood',       'Chennai - Ward 5',  'In Progress', 6,  'user12@gmail.com', 'Waterlogging after rain near junction', 48),

  // ── HOTSPOT ZONE 3: Chennai Ward 10 (6 complaints = HIGH PRIORITY ZONE) ──
  makeComplaint(13, 'Garbage Dumping near Marina Beach',     'Garbage',     'Chennai - Ward 10', 'Pending',     1,  'user13@gmail.com', 'Illegal garbage dumping near beach entrance', 72),
  makeComplaint(14, 'Broken Footpath on Beach Road',         'Road Damage', 'Chennai - Ward 10', 'Pending',     2,  'user14@gmail.com', 'Broken tiles on footpath causing injuries', 39),
  makeComplaint(15, 'Noise Pollution near Marina',           'Noise',       'Chennai - Ward 10', 'Pending',     3,  'user15@gmail.com', 'Loud music and noise near beach at night', 25),
  makeComplaint(16, 'Sewage Overflow on Beach Road',         'Water Supply','Chennai - Ward 10', 'Pending',     4,  'user16@gmail.com', 'Sewage overflowing onto beach road', 61),
  makeComplaint(17, 'Street Lights Not Working',             'Other',       'Chennai - Ward 10', 'Pending',     5,  'user17@gmail.com', 'Street lights out on 2km stretch', 33),
  makeComplaint(18, 'Flash Flood near Marina',               'Flood',       'Chennai - Ward 10', 'In Progress', 6,  'user18@gmail.com', 'Flooding near Marina beach after heavy rain', 89),

  // ── Chennai Ward 2 (5 complaints = Hotspot) ──
  makeComplaint(19, 'Garbage Overflow Ward 2',               'Garbage',     'Chennai - Ward 2',  'Pending',     7,  'user19@gmail.com', 'Garbage bins not cleared for 5 days', 31),
  makeComplaint(20, 'Road Crack on Main Road',               'Road Damage', 'Chennai - Ward 2',  'Pending',     8,  'user20@gmail.com', 'Large crack on main road causing accidents', 27),
  makeComplaint(21, 'Heavy Traffic near School',             'Other',       'Chennai - Ward 2',  'Pending',     9,  'user21@gmail.com', 'Heavy traffic near school during peak hours', 19),
  makeComplaint(22, 'Smoke from Burning Waste',              'Pollution',   'Chennai - Ward 2',  'Pending',     10, 'user22@gmail.com', 'Burning waste causing air pollution', 44),
  makeComplaint(23, 'Garbage Issue near Market',             'Garbage',     'Chennai - Ward 2',  'Pending',     11, 'user23@gmail.com', 'Market waste not collected for days', 38),

  // ── Chennai Ward 3 (5 complaints = Hotspot) ──
  makeComplaint(24, 'Garbage Overflow Ward 3',               'Garbage',     'Chennai - Ward 3',  'Pending',     12, 'user24@gmail.com', 'Overflowing garbage bins near bus stop', 22),
  makeComplaint(25, 'Pothole on Ring Road',                  'Road Damage', 'Chennai - Ward 3',  'Pending',     13, 'user25@gmail.com', 'Deep pothole on ring road', 35),
  makeComplaint(26, 'Traffic Jam at Junction',               'Other',       'Chennai - Ward 3',  'Pending',     14, 'user26@gmail.com', 'Daily traffic jam at main junction', 18),
  makeComplaint(27, 'Air Pollution from Vehicles',           'Pollution',   'Chennai - Ward 3',  'Pending',     15, 'user27@gmail.com', 'Heavy vehicle pollution near school', 29),
  makeComplaint(28, 'Garbage Dump near Park',                'Garbage',     'Chennai - Ward 3',  'Pending',     16, 'user28@gmail.com', 'Illegal dumping near children park', 41),

  // ── Chennai Ward 4 ──
  makeComplaint(29, 'Garbage Overflow Ward 4',               'Garbage',     'Chennai - Ward 4',  'Pending',     17, 'user29@gmail.com', 'Garbage overflow near residential area', 26),
  makeComplaint(30, 'Road Crack Ward 4',                     'Road Damage', 'Chennai - Ward 4',  'Pending',     18, 'user30@gmail.com', 'Road crack causing vehicle damage', 32),
  makeComplaint(31, 'Heavy Traffic Ward 4',                  'Other',       'Chennai - Ward 4',  'In Progress', 19, 'user31@gmail.com', 'Heavy traffic near hospital', 15),
  makeComplaint(32, 'Smoke Issue Ward 4',                    'Pollution',   'Chennai - Ward 4',  'Pending',     20, 'user32@gmail.com', 'Smoke from nearby factory', 37),
  makeComplaint(33, 'Garbage Issue Ward 4',                  'Garbage',     'Chennai - Ward 4',  'Resolved',    21, 'user33@gmail.com', 'Garbage not collected for 3 days', 20),

  // ── Chennai Ward 6 ──
  makeComplaint(34, 'Flooding on Poonamallee Road',          'Flood',       'Chennai - Ward 6',  'In Progress', 4,  'user34@gmail.com', 'Waterlogging after rain on Poonamallee road', 44),
  makeComplaint(35, 'Road Crack Ward 6',                     'Road Damage', 'Chennai - Ward 6',  'Pending',     22, 'user35@gmail.com', 'Road crack near school zone', 28),
  makeComplaint(36, 'Heavy Traffic Ward 6',                  'Other',       'Chennai - Ward 6',  'Pending',     23, 'user36@gmail.com', 'Traffic congestion near market', 16),
  makeComplaint(37, 'Smoke Issue Ward 6',                    'Pollution',   'Chennai - Ward 6',  'Pending',     24, 'user37@gmail.com', 'Industrial smoke affecting residents', 33),

  // ── Chennai Ward 7 ──
  makeComplaint(38, 'Sewage Overflow Koyambedu',             'Water Supply','Chennai - Ward 7',  'Pending',     3,  'user38@gmail.com', 'Sewage overflow near Koyambedu market', 55),
  makeComplaint(39, 'Garbage near Koyambedu Market',         'Garbage',     'Chennai - Ward 7',  'Pending',     5,  'user39@gmail.com', 'Garbage bins not cleared for 6 days', 38),
  makeComplaint(40, 'Open Drain near Vadapalani',            'Water Supply','Chennai - Ward 7',  'Pending',     7,  'user40@gmail.com', 'Open drain causing foul smell', 36),
  makeComplaint(41, 'Road Damage near Market',               'Road Damage', 'Chennai - Ward 7',  'Pending',     25, 'user41@gmail.com', 'Road damage near vegetable market', 24),

  // ── Chennai Ward 8 ──
  makeComplaint(42, 'Garbage Overflow Ward 8',               'Garbage',     'Chennai - Ward 8',  'Pending',     26, 'user42@gmail.com', 'Garbage overflow near bus terminus', 29),
  makeComplaint(43, 'Road Crack Ward 8',                     'Road Damage', 'Chennai - Ward 8',  'Pending',     27, 'user43@gmail.com', 'Road crack near hospital', 21),
  makeComplaint(44, 'Heavy Traffic Ward 8',                  'Other',       'Chennai - Ward 8',  'Pending',     28, 'user44@gmail.com', 'Traffic jam near railway station', 17),
  makeComplaint(45, 'Smoke Issue Ward 8',                    'Pollution',   'Chennai - Ward 8',  'Pending',     29, 'user45@gmail.com', 'Smoke from burning garbage', 31),

  // ── Chennai Ward 9 ──
  makeComplaint(46, 'Sewage Overflow Usman Road',            'Water Supply','Chennai - Ward 9',  'In Progress', 5,  'user46@gmail.com', 'Sewage overflow on Usman Road near T.Nagar', 55),
  makeComplaint(47, 'Garbage Overflow Ward 9',               'Garbage',     'Chennai - Ward 9',  'Pending',     30, 'user47@gmail.com', 'Garbage overflow near T.Nagar', 34),
  makeComplaint(48, 'Road Damage Ward 9',                    'Road Damage', 'Chennai - Ward 9',  'Pending',     31, 'user48@gmail.com', 'Road damage near shopping complex', 26),
  makeComplaint(49, 'Pollution Ward 9',                      'Pollution',   'Chennai - Ward 9',  'Pending',     32, 'user49@gmail.com', 'Air pollution from vehicles', 19),

  // ── Chennai Ward 11 ──
  makeComplaint(50, 'Garbage Overflow Ward 11',              'Garbage',     'Chennai - Ward 11', 'Pending',     33, 'user50@gmail.com', 'Garbage overflow near residential area', 23),
  makeComplaint(51, 'Road Crack Ward 11',                    'Road Damage', 'Chennai - Ward 11', 'Pending',     34, 'user51@gmail.com', 'Road crack near school', 18),
  makeComplaint(52, 'Water Supply Issue Ward 11',            'Water Supply','Chennai - Ward 11', 'Pending',     35, 'user52@gmail.com', 'No water supply for 2 days', 42),

  // ── Chennai Ward 12 ──
  makeComplaint(53, 'Broken Footpath Nungambakkam',          'Road Damage', 'Chennai - Ward 12', 'Resolved',    36, 'user53@gmail.com', 'Broken tiles on footpath', 14),
  makeComplaint(54, 'Garbage Overflow Ward 12',              'Garbage',     'Chennai - Ward 12', 'Pending',     37, 'user54@gmail.com', 'Garbage overflow near office complex', 27),
  makeComplaint(55, 'Pollution Ward 12',                     'Pollution',   'Chennai - Ward 12', 'Pending',     38, 'user55@gmail.com', 'Vehicle pollution near junction', 22),

  // ── Chennai Ward 13 ──
  makeComplaint(56, 'Factory Smoke Ambattur',                'Pollution',   'Chennai - Ward 13', 'Pending',     2,  'user56@gmail.com', 'Black smoke from Ambattur factory', 29),
  makeComplaint(57, 'Air Pollution Ennore Port',             'Pollution',   'Chennai - Ward 13', 'Pending',     5,  'user57@gmail.com', 'Severe pollution from thermal plant', 72),
  makeComplaint(58, 'Garbage Ward 13',                       'Garbage',     'Chennai - Ward 13', 'Pending',     39, 'user58@gmail.com', 'Garbage near industrial area', 19),

  // ── Chennai Ward 14 ──
  makeComplaint(59, 'Power Outage Adyar Colony',             'Power Outage','Chennai - Ward 14', 'Pending',     6,  'user59@gmail.com', 'No electricity for 10 hours', 33),
  makeComplaint(60, 'Garbage Ward 14',                       'Garbage',     'Chennai - Ward 14', 'Pending',     40, 'user60@gmail.com', 'Garbage overflow near colony', 21),
  makeComplaint(61, 'Road Damage Ward 14',                   'Road Damage', 'Chennai - Ward 14', 'Pending',     41, 'user61@gmail.com', 'Road damage near Adyar bridge', 28),

  // ── Chennai Ward 15 ──
  makeComplaint(62, 'Flash Flood Velachery',                 'Flood',       'Chennai - Ward 15', 'Pending',     1,  'user62@gmail.com', 'Velachery lake overflow flooding streets', 89),
  makeComplaint(63, 'Street Lights OMR Road',                'Other',       'Chennai - Ward 15', 'Resolved',    48, 'user63@gmail.com', 'Street lights not working on OMR', 21),
  makeComplaint(64, 'Garbage Ward 15',                       'Garbage',     'Chennai - Ward 15', 'Pending',     42, 'user64@gmail.com', 'Garbage overflow near IT park', 25),

  // ── Coimbatore Ward 1 ──
  makeComplaint(65, 'Pothole Avinashi Road',                 'Road Damage', 'Coimbatore - Ward 1','Pending',    7,  'user65@gmail.com', 'Multiple potholes near RS Puram', 28),
  makeComplaint(66, 'Garbage Coimbatore Station',            'Garbage',     'Coimbatore - Ward 1','Pending',    4,  'user66@gmail.com', 'Waste piling near station entrance', 23),
  makeComplaint(67, 'Traffic Jam Coimbatore',                'Other',       'Coimbatore - Ward 1','Pending',    43, 'user67@gmail.com', 'Traffic jam near Gandhipuram', 17),
  makeComplaint(68, 'Smoke Issue Coimbatore',                'Pollution',   'Coimbatore - Ward 1','Pending',    44, 'user68@gmail.com', 'Industrial smoke near residential area', 31),
  makeComplaint(69, 'Garbage Issue Coimbatore',              'Garbage',     'Coimbatore - Ward 1','Pending',    45, 'user69@gmail.com', 'Garbage not collected for 4 days', 19),

  // ── Coimbatore Ward 2 ──
  makeComplaint(70, 'Road Crack Coimbatore',                 'Road Damage', 'Coimbatore - Ward 2','Pending',    46, 'user70@gmail.com', 'Road crack near textile market', 24),
  makeComplaint(71, 'Garbage Overflow Coimbatore W2',        'Garbage',     'Coimbatore - Ward 2','Pending',    47, 'user71@gmail.com', 'Garbage overflow near bus stand', 18),
  makeComplaint(72, 'Water Supply Issue Coimbatore',         'Water Supply','Coimbatore - Ward 2','Pending',    48, 'user72@gmail.com', 'No water supply for 2 days', 35),

  // ── Coimbatore Ward 3 ──
  makeComplaint(73, 'Pothole Coimbatore W3',                 'Road Damage', 'Coimbatore - Ward 3','Pending',    49, 'user73@gmail.com', 'Pothole near college road', 22),
  makeComplaint(74, 'Garbage Coimbatore W3',                 'Garbage',     'Coimbatore - Ward 3','Pending',    50, 'user74@gmail.com', 'Garbage near market area', 16),

  // ── Madurai Ward 1 ──
  makeComplaint(75, 'Water Scarcity Madurai',                'Water Supply','Madurai - Ward 1',  'Pending',     8,  'user75@gmail.com', 'No water supply for 3 days', 60),
  makeComplaint(76, 'Garbage Madurai W1',                    'Garbage',     'Madurai - Ward 1',  'Pending',     51, 'user76@gmail.com', 'Garbage overflow near Meenakshi temple', 27),
  makeComplaint(77, 'Road Damage Madurai',                   'Road Damage', 'Madurai - Ward 1',  'Pending',     52, 'user77@gmail.com', 'Road damage near temple entrance', 33),
  makeComplaint(78, 'Pollution Madurai',                     'Pollution',   'Madurai - Ward 1',  'Pending',     53, 'user78@gmail.com', 'Vehicle pollution near temple', 21),

  // ── Madurai Ward 2 ──
  makeComplaint(79, 'Water Scarcity Madurai W2',             'Water Supply','Madurai - Ward 2',  'Pending',     8,  'user79@gmail.com', 'No water supply in Tallakulam area', 60),
  makeComplaint(80, 'Garbage Madurai W2',                    'Garbage',     'Madurai - Ward 2',  'Pending',     54, 'user80@gmail.com', 'Garbage overflow near market', 24),
  makeComplaint(81, 'Road Crack Madurai',                    'Road Damage', 'Madurai - Ward 2',  'Pending',     55, 'user81@gmail.com', 'Road crack near bus stand', 19),

  // ── Madurai Ward 3 ──
  makeComplaint(82, 'Garbage Madurai W3',                    'Garbage',     'Madurai - Ward 3',  'Pending',     56, 'user82@gmail.com', 'Garbage not collected for 5 days', 22),
  makeComplaint(83, 'Flood Madurai',                         'Flood',       'Madurai - Ward 3',  'In Progress', 57, 'user83@gmail.com', 'Flooding near Vaigai river', 45),

  // ── Trichy Ward 1 ──
  makeComplaint(84, 'Noise Pollution Trichy Bus Stand',      'Noise',       'Trichy - Ward 1',   'In Progress', 10, 'user84@gmail.com', 'Excessive noise near hospital', 17),
  makeComplaint(85, 'Garbage Trichy W1',                     'Garbage',     'Trichy - Ward 1',   'Pending',     58, 'user85@gmail.com', 'Garbage overflow near bus stand', 23),
  makeComplaint(86, 'Road Damage Trichy',                    'Road Damage', 'Trichy - Ward 1',   'Pending',     59, 'user86@gmail.com', 'Road damage near Rock Fort', 28),
  makeComplaint(87, 'Water Supply Trichy',                   'Water Supply','Trichy - Ward 1',   'Pending',     60, 'user87@gmail.com', 'Water supply disrupted for 2 days', 31),

  // ── Trichy Ward 2 ──
  makeComplaint(88, 'Garbage Trichy W2',                     'Garbage',     'Trichy - Ward 2',   'Pending',     61, 'user88@gmail.com', 'Garbage overflow near market', 19),
  makeComplaint(89, 'Pollution Trichy',                      'Pollution',   'Trichy - Ward 2',   'Pending',     62, 'user89@gmail.com', 'Industrial pollution near residential area', 26),
  makeComplaint(90, 'Road Crack Trichy',                     'Road Damage', 'Trichy - Ward 2',   'Pending',     63, 'user90@gmail.com', 'Road crack near college', 15),

  // ── Salem Ward 1 ──
  makeComplaint(91, 'Accident Salem Steel Plant Road',       'Accident',    'Salem - Ward 1',    'Pending',     2,  'user91@gmail.com', 'No speed breakers near school zone', 48),
  makeComplaint(92, 'Garbage Salem W1',                      'Garbage',     'Salem - Ward 1',    'Pending',     64, 'user92@gmail.com', 'Garbage overflow near steel plant', 22),
  makeComplaint(93, 'Road Damage Salem',                     'Road Damage', 'Salem - Ward 1',    'Pending',     65, 'user93@gmail.com', 'Road damage near industrial area', 27),

  // ── Salem Ward 2 ──
  makeComplaint(94, 'Garbage Salem W2',                      'Garbage',     'Salem - Ward 2',    'Pending',     66, 'user94@gmail.com', 'Garbage not collected for 4 days', 18),
  makeComplaint(95, 'Pollution Salem',                       'Pollution',   'Salem - Ward 2',    'Pending',     67, 'user95@gmail.com', 'Factory smoke affecting residents', 33),

  // ── Salem Ward 3 ──
  makeComplaint(96, 'Power Outage Salem',                    'Power Outage','Salem - Ward 3',    'Pending',     68, 'user96@gmail.com', 'Power outage for 8 hours', 29),
  makeComplaint(97, 'Garbage Salem W3',                      'Garbage',     'Salem - Ward 3',    'Pending',     69, 'user97@gmail.com', 'Garbage overflow near market', 21),

  // ── Salem Ward 4 ──
  makeComplaint(98, 'Flood Salem',                           'Flood',       'Salem - Ward 4',    'In Progress', 70, 'user98@gmail.com', 'Flooding near Salem lake', 37),
  makeComplaint(99, 'Road Damage Salem W4',                  'Road Damage', 'Salem - Ward 4',    'Pending',     71, 'user99@gmail.com', 'Road damage near bus terminus', 24),
  makeComplaint(100,'Fire Incident Salem',                   'Fire',        'Salem - Ward 4',    'Pending',     1,  'user100@gmail.com','Fire incident near market area', 56),
];

export const CATEGORIES = [
  'Accident', 'Fire', 'Flood', 'Power Outage', 'Pollution',
  'Road Damage', 'Water Supply', 'Garbage', 'Noise', 'Other'
];

export const WARDS = Object.keys(WARD_COORDS);

const toRad = (v) => (v * Math.PI) / 180;
const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const getNearestWard = (lat, lng) => {
  let nearest = null, minDist = Infinity;
  for (const [ward, coords] of Object.entries(WARD_COORDS)) {
    const dist = haversine(lat, lng, coords.lat, coords.lng);
    if (dist < minDist) { minDist = dist; nearest = ward; }
  }
  return nearest;
};

export const STATUS_COLORS = {
  Pending:      '#ef4444',
  'In Progress':'#f97316',
  Resolved:     '#22c55e'
};

export const CATEGORY_COLORS = {
  Accident:      '#dc2626',
  Fire:          '#ea580c',
  Flood:         '#2563eb',
  'Power Outage':'#ca8a04',
  Pollution:     '#7c3aed',
  'Road Damage': '#9f1239',
  'Water Supply':'#0891b2',
  Garbage:       '#65a30d',
  Noise:         '#d97706',
  Other:         '#6b7280'
};
