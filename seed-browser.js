// ============================================================
// PASTE THIS IN BROWSER CONSOLE ON YOUR APP PAGE
// Go to: https://smart-city-hub-573d1.web.app
// Login as Admin, then open DevTools (F12) → Console tab
// Paste this entire script and press Enter
// ============================================================

(async () => {
  const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');
  const { getFirestore, doc, setDoc, writeBatch, collection, Timestamp } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');

  const app = getApps()[0];
  const db = getFirestore(app);
  const now = Date.now();

  const WARDS = {
    'Chennai - Ward 1':  [13.0604, 80.2496], 'Chennai - Ward 2':  [13.0650, 80.2550],
    'Chennai - Ward 3':  [13.0700, 80.2600], 'Chennai - Ward 4':  [13.0750, 80.2650],
    'Chennai - Ward 5':  [13.0130, 80.2108], 'Chennai - Ward 6':  [13.0180, 80.2150],
    'Chennai - Ward 7':  [13.0694, 80.1948], 'Chennai - Ward 8':  [13.0740, 80.1990],
    'Chennai - Ward 9':  [13.0524, 80.2341], 'Chennai - Ward 10': [13.0500, 80.2824],
    'Chennai - Ward 11': [13.0550, 80.2870], 'Chennai - Ward 12': [13.0569, 80.2425],
    'Chennai - Ward 13': [13.1143, 80.1548], 'Chennai - Ward 14': [13.0012, 80.2565],
    'Chennai - Ward 15': [12.9815, 80.2180], 'Coimbatore - Ward 1': [11.0168, 76.9558],
    'Coimbatore - Ward 2': [11.0010, 76.9674], 'Coimbatore - Ward 3': [11.0200, 76.9700],
    'Madurai - Ward 1':  [9.9252, 78.1198],  'Madurai - Ward 2':  [9.9195, 78.1193],
    'Madurai - Ward 3':  [9.9300, 78.1250],  'Trichy - Ward 1':   [10.8050, 78.6856],
    'Trichy - Ward 2':   [10.8100, 78.6900], 'Salem - Ward 1':    [11.6643, 78.1460],
    'Salem - Ward 2':    [11.6700, 78.1500], 'Salem - Ward 3':    [11.6580, 78.1420],
    'Salem - Ward 4':    [11.6620, 78.1480],
  };

  const j = v => parseFloat((v + (Math.random()-0.5)*0.003).toFixed(6));

  const DATA = [
    {id:'1',title:'Garbage Overflow on Anna Salai',category:'Garbage',ward:'Chennai - Ward 1',status:'Pending',hrs:1},
    {id:'2',title:'Deep Pothole near LIC Building',category:'Road Damage',ward:'Chennai - Ward 1',status:'Pending',hrs:2},
    {id:'3',title:'Heavy Traffic Jam at Anna Salai',category:'Other',ward:'Chennai - Ward 1',status:'Pending',hrs:3},
    {id:'4',title:'Air Pollution from Vehicles W1',category:'Pollution',ward:'Chennai - Ward 1',status:'Pending',hrs:4},
    {id:'5',title:'Garbage Dump near Residential W1',category:'Garbage',ward:'Chennai - Ward 1',status:'Pending',hrs:5},
    {id:'6',title:'Broken Road Divider Anna Salai',category:'Road Damage',ward:'Chennai - Ward 1',status:'In Progress',hrs:6},
    {id:'7',title:'Road Accident Blackspot Kathipara',category:'Accident',ward:'Chennai - Ward 5',status:'Pending',hrs:1},
    {id:'8',title:'Pothole at Kathipara Junction',category:'Road Damage',ward:'Chennai - Ward 5',status:'Pending',hrs:2},
    {id:'9',title:'Traffic Signal Not Working W5',category:'Other',ward:'Chennai - Ward 5',status:'Pending',hrs:3},
    {id:'10',title:'Garbage near Kathipara Flyover',category:'Garbage',ward:'Chennai - Ward 5',status:'Pending',hrs:4},
    {id:'11',title:'Smoke from Nearby Factory W5',category:'Pollution',ward:'Chennai - Ward 5',status:'Pending',hrs:5},
    {id:'12',title:'Flooding after Rain Kathipara',category:'Flood',ward:'Chennai - Ward 5',status:'In Progress',hrs:6},
    {id:'13',title:'Garbage Dumping near Marina Beach',category:'Garbage',ward:'Chennai - Ward 10',status:'Pending',hrs:1},
    {id:'14',title:'Broken Footpath on Beach Road',category:'Road Damage',ward:'Chennai - Ward 10',status:'Pending',hrs:2},
    {id:'15',title:'Noise Pollution near Marina',category:'Noise',ward:'Chennai - Ward 10',status:'Pending',hrs:3},
    {id:'16',title:'Sewage Overflow on Beach Road',category:'Water Supply',ward:'Chennai - Ward 10',status:'Pending',hrs:4},
    {id:'17',title:'Street Lights Not Working Beach',category:'Other',ward:'Chennai - Ward 10',status:'Pending',hrs:5},
    {id:'18',title:'Flash Flood near Marina Beach',category:'Flood',ward:'Chennai - Ward 10',status:'In Progress',hrs:6},
    {id:'19',title:'Garbage Overflow Ward 2',category:'Garbage',ward:'Chennai - Ward 2',status:'Pending',hrs:7},
    {id:'20',title:'Road Crack on Main Road W2',category:'Road Damage',ward:'Chennai - Ward 2',status:'Pending',hrs:8},
    {id:'21',title:'Heavy Traffic near School W2',category:'Other',ward:'Chennai - Ward 2',status:'Pending',hrs:9},
    {id:'22',title:'Smoke from Burning Waste W2',category:'Pollution',ward:'Chennai - Ward 2',status:'Pending',hrs:10},
    {id:'23',title:'Garbage Issue near Market W2',category:'Garbage',ward:'Chennai - Ward 2',status:'Pending',hrs:11},
    {id:'24',title:'Garbage Overflow Ward 3',category:'Garbage',ward:'Chennai - Ward 3',status:'Pending',hrs:12},
    {id:'25',title:'Pothole on Ring Road W3',category:'Road Damage',ward:'Chennai - Ward 3',status:'Pending',hrs:13},
    {id:'26',title:'Traffic Jam at Junction W3',category:'Other',ward:'Chennai - Ward 3',status:'Pending',hrs:14},
    {id:'27',title:'Air Pollution near School W3',category:'Pollution',ward:'Chennai - Ward 3',status:'Pending',hrs:15},
    {id:'28',title:'Garbage Dump near Park W3',category:'Garbage',ward:'Chennai - Ward 3',status:'Pending',hrs:16},
    {id:'29',title:'Garbage Overflow Ward 4',category:'Garbage',ward:'Chennai - Ward 4',status:'Pending',hrs:17},
    {id:'30',title:'Road Crack Ward 4',category:'Road Damage',ward:'Chennai - Ward 4',status:'Pending',hrs:18},
    {id:'31',title:'Heavy Traffic near Hospital W4',category:'Other',ward:'Chennai - Ward 4',status:'In Progress',hrs:19},
    {id:'32',title:'Smoke from Factory W4',category:'Pollution',ward:'Chennai - Ward 4',status:'Pending',hrs:20},
    {id:'33',title:'Garbage Issue Ward 4',category:'Garbage',ward:'Chennai - Ward 4',status:'Resolved',hrs:21},
    {id:'34',title:'Flooding on Poonamallee Road',category:'Flood',ward:'Chennai - Ward 6',status:'In Progress',hrs:4},
    {id:'35',title:'Road Crack near School W6',category:'Road Damage',ward:'Chennai - Ward 6',status:'Pending',hrs:22},
    {id:'36',title:'Traffic Congestion near Market W6',category:'Other',ward:'Chennai - Ward 6',status:'Pending',hrs:23},
    {id:'37',title:'Industrial Smoke W6',category:'Pollution',ward:'Chennai - Ward 6',status:'Pending',hrs:24},
    {id:'38',title:'Sewage Overflow Koyambedu',category:'Water Supply',ward:'Chennai - Ward 7',status:'Pending',hrs:3},
    {id:'39',title:'Garbage near Koyambedu Market',category:'Garbage',ward:'Chennai - Ward 7',status:'Pending',hrs:5},
    {id:'40',title:'Open Drain near Vadapalani',category:'Water Supply',ward:'Chennai - Ward 7',status:'Pending',hrs:7},
    {id:'41',title:'Road Damage near Market W7',category:'Road Damage',ward:'Chennai - Ward 7',status:'Pending',hrs:25},
    {id:'42',title:'Garbage Overflow Ward 8',category:'Garbage',ward:'Chennai - Ward 8',status:'Pending',hrs:26},
    {id:'43',title:'Road Crack near Hospital W8',category:'Road Damage',ward:'Chennai - Ward 8',status:'Pending',hrs:27},
    {id:'44',title:'Traffic Jam near Railway Station W8',category:'Other',ward:'Chennai - Ward 8',status:'Pending',hrs:28},
    {id:'45',title:'Smoke from Burning Garbage W8',category:'Pollution',ward:'Chennai - Ward 8',status:'Pending',hrs:29},
    {id:'46',title:'Sewage Overflow Usman Road',category:'Water Supply',ward:'Chennai - Ward 9',status:'In Progress',hrs:5},
    {id:'47',title:'Garbage Overflow T.Nagar',category:'Garbage',ward:'Chennai - Ward 9',status:'Pending',hrs:30},
    {id:'48',title:'Road Damage near Shopping Complex',category:'Road Damage',ward:'Chennai - Ward 9',status:'Pending',hrs:31},
    {id:'49',title:'Air Pollution from Vehicles W9',category:'Pollution',ward:'Chennai - Ward 9',status:'Pending',hrs:32},
    {id:'50',title:'Garbage Overflow Ward 11',category:'Garbage',ward:'Chennai - Ward 11',status:'Pending',hrs:33},
    {id:'51',title:'Road Crack near School W11',category:'Road Damage',ward:'Chennai - Ward 11',status:'Pending',hrs:34},
    {id:'52',title:'No Water Supply Ward 11',category:'Water Supply',ward:'Chennai - Ward 11',status:'Pending',hrs:35},
    {id:'53',title:'Broken Footpath Nungambakkam',category:'Road Damage',ward:'Chennai - Ward 12',status:'Resolved',hrs:36},
    {id:'54',title:'Garbage Overflow Ward 12',category:'Garbage',ward:'Chennai - Ward 12',status:'Pending',hrs:37},
    {id:'55',title:'Vehicle Pollution near Junction W12',category:'Pollution',ward:'Chennai - Ward 12',status:'Pending',hrs:38},
    {id:'56',title:'Factory Smoke Ambattur Estate',category:'Pollution',ward:'Chennai - Ward 13',status:'Pending',hrs:2},
    {id:'57',title:'Air Pollution Ennore Port',category:'Pollution',ward:'Chennai - Ward 13',status:'Pending',hrs:5},
    {id:'58',title:'Garbage near Industrial Area W13',category:'Garbage',ward:'Chennai - Ward 13',status:'Pending',hrs:39},
    {id:'59',title:'Power Outage Adyar Colony',category:'Power Outage',ward:'Chennai - Ward 14',status:'Pending',hrs:6},
    {id:'60',title:'Garbage Overflow Ward 14',category:'Garbage',ward:'Chennai - Ward 14',status:'Pending',hrs:40},
    {id:'61',title:'Road Damage near Adyar Bridge',category:'Road Damage',ward:'Chennai - Ward 14',status:'Pending',hrs:41},
    {id:'62',title:'Flash Flood Velachery',category:'Flood',ward:'Chennai - Ward 15',status:'Pending',hrs:1},
    {id:'63',title:'Street Lights OMR Road',category:'Other',ward:'Chennai - Ward 15',status:'Resolved',hrs:48},
    {id:'64',title:'Garbage Overflow near IT Park',category:'Garbage',ward:'Chennai - Ward 15',status:'Pending',hrs:42},
    {id:'65',title:'Pothole on Avinashi Road',category:'Road Damage',ward:'Coimbatore - Ward 1',status:'Pending',hrs:7},
    {id:'66',title:'Garbage near Coimbatore Station',category:'Garbage',ward:'Coimbatore - Ward 1',status:'Pending',hrs:4},
    {id:'67',title:'Traffic Jam near Gandhipuram',category:'Other',ward:'Coimbatore - Ward 1',status:'Pending',hrs:43},
    {id:'68',title:'Industrial Smoke Coimbatore',category:'Pollution',ward:'Coimbatore - Ward 1',status:'Pending',hrs:44},
    {id:'69',title:'Garbage Not Collected Coimbatore',category:'Garbage',ward:'Coimbatore - Ward 1',status:'Pending',hrs:45},
    {id:'70',title:'Road Crack near Textile Market CBE',category:'Road Damage',ward:'Coimbatore - Ward 2',status:'Pending',hrs:46},
    {id:'71',title:'Garbage Overflow Coimbatore W2',category:'Garbage',ward:'Coimbatore - Ward 2',status:'Pending',hrs:47},
    {id:'72',title:'No Water Supply Coimbatore',category:'Water Supply',ward:'Coimbatore - Ward 2',status:'Pending',hrs:48},
    {id:'73',title:'Pothole near College Road CBE',category:'Road Damage',ward:'Coimbatore - Ward 3',status:'Pending',hrs:49},
    {id:'74',title:'Garbage near Market CBE W3',category:'Garbage',ward:'Coimbatore - Ward 3',status:'Pending',hrs:50},
    {id:'75',title:'Water Scarcity Madurai South',category:'Water Supply',ward:'Madurai - Ward 1',status:'Pending',hrs:8},
    {id:'76',title:'Garbage near Meenakshi Temple',category:'Garbage',ward:'Madurai - Ward 1',status:'Pending',hrs:51},
    {id:'77',title:'Road Damage near Temple Entrance',category:'Road Damage',ward:'Madurai - Ward 1',status:'Pending',hrs:52},
    {id:'78',title:'Vehicle Pollution near Temple',category:'Pollution',ward:'Madurai - Ward 1',status:'Pending',hrs:53},
    {id:'79',title:'Water Scarcity Tallakulam',category:'Water Supply',ward:'Madurai - Ward 2',status:'Pending',hrs:8},
    {id:'80',title:'Garbage Overflow Madurai Market',category:'Garbage',ward:'Madurai - Ward 2',status:'Pending',hrs:54},
    {id:'81',title:'Road Crack near Bus Stand Madurai',category:'Road Damage',ward:'Madurai - Ward 2',status:'Pending',hrs:55},
    {id:'82',title:'Garbage Not Collected Madurai W3',category:'Garbage',ward:'Madurai - Ward 3',status:'Pending',hrs:56},
    {id:'83',title:'Flooding near Vaigai River',category:'Flood',ward:'Madurai - Ward 3',status:'In Progress',hrs:57},
    {id:'84',title:'Noise Pollution near Trichy Hospital',category:'Noise',ward:'Trichy - Ward 1',status:'In Progress',hrs:10},
    {id:'85',title:'Garbage Overflow Trichy Bus Stand',category:'Garbage',ward:'Trichy - Ward 1',status:'Pending',hrs:58},
    {id:'86',title:'Road Damage near Rock Fort',category:'Road Damage',ward:'Trichy - Ward 1',status:'Pending',hrs:59},
    {id:'87',title:'Water Supply Disrupted Trichy',category:'Water Supply',ward:'Trichy - Ward 1',status:'Pending',hrs:60},
    {id:'88',title:'Garbage Overflow Trichy W2',category:'Garbage',ward:'Trichy - Ward 2',status:'Pending',hrs:61},
    {id:'89',title:'Industrial Pollution Trichy',category:'Pollution',ward:'Trichy - Ward 2',status:'Pending',hrs:62},
    {id:'90',title:'Road Crack near College Trichy',category:'Road Damage',ward:'Trichy - Ward 2',status:'Pending',hrs:63},
    {id:'91',title:'Accident Salem Steel Plant Road',category:'Accident',ward:'Salem - Ward 1',status:'Pending',hrs:2},
    {id:'92',title:'Garbage near Steel Plant Salem',category:'Garbage',ward:'Salem - Ward 1',status:'Pending',hrs:64},
    {id:'93',title:'Road Damage near Industrial Area',category:'Road Damage',ward:'Salem - Ward 1',status:'Pending',hrs:65},
    {id:'94',title:'Garbage Not Collected Salem W2',category:'Garbage',ward:'Salem - Ward 2',status:'Pending',hrs:66},
    {id:'95',title:'Factory Smoke Salem',category:'Pollution',ward:'Salem - Ward 2',status:'Pending',hrs:67},
    {id:'96',title:'Power Outage Salem 8 Hours',category:'Power Outage',ward:'Salem - Ward 3',status:'Pending',hrs:68},
    {id:'97',title:'Garbage Overflow Salem Market',category:'Garbage',ward:'Salem - Ward 3',status:'Pending',hrs:69},
    {id:'98',title:'Flooding near Salem Lake',category:'Flood',ward:'Salem - Ward 4',status:'In Progress',hrs:70},
    {id:'99',title:'Road Damage near Bus Terminus Salem',category:'Road Damage',ward:'Salem - Ward 4',status:'Pending',hrs:71},
    {id:'100',title:'Fire Incident near Salem Market',category:'Fire',ward:'Salem - Ward 4',status:'Pending',hrs:1},
  ];

  let count = 0;
  // Process in batches of 20
  for (let i = 0; i < DATA.length; i += 20) {
    const batch = writeBatch(db);
    DATA.slice(i, i+20).forEach(c => {
      const coords = WARDS[c.ward] || [13.0604, 80.2496];
      const ref = doc(collection(db, 'complaints'), c.id);
      batch.set(ref, {
        title: c.title,
        description: `${c.title} reported in ${c.ward}. Immediate attention required.`,
        category: c.category,
        ward: c.ward,
        status: c.status,
        latitude: j(coords[0]),
        longitude: j(coords[1]),
        userId: 'seed-user',
        upvotes: Math.floor(Math.random()*60)+10,
        priorityScore: 0,
        recommendations: [],
        isHotspot: false,
        timestamp: Timestamp.fromDate(new Date(now - c.hrs*3600000)),
        createdAt: Timestamp.fromDate(new Date(now - c.hrs*3600000)),
      });
    });
    await batch.commit();
    count += Math.min(20, DATA.length - i);
    console.log(`✅ Seeded ${count}/100 complaints`);
  }

  // Update city metrics
  await setDoc(doc(db, 'cityMetrics', 'current'), {
    complaintsCount: 100, pendingCount: 85, inProgressCount: 8, resolvedCount: 7,
    resolutionRate: 7, pollution: 68, traffic: 72,
    cityHealthScore: 28, healthGrade: 'D',
    updatedAt: new Date().toISOString()
  });

  console.log('🎉 DONE! 100 complaints added to Firestore. Refresh the page!');
})();
