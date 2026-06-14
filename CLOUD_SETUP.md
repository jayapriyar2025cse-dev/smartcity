# ☁️ Cloud Architecture — AI Smart City Hub

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
│  Citizen Portal  │  Admin Dashboard  │  Real-time Updates   │
└──────────────────────────┬──────────────────────────────────┘
                           │ Firebase SDK (real-time)
┌──────────────────────────▼──────────────────────────────────┐
│                  FIREBASE CLOUD                              │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Firebase    │  │  Firestore   │  │ Firebase Storage  │  │
│  │ Auth        │  │  (Real-time) │  │ (Complaint Images)│  │
│  │ Email+Google│  │  4 collections│  │                   │  │
│  └─────────────┘  └──────┬───────┘  └───────────────────┘  │
│                          │ Triggers                          │
│  ┌───────────────────────▼─────────────────────────────┐   │
│  │           CLOUD FUNCTIONS (AI Engine)                │   │
│  │  onNewComplaint → Hotspot + Priority + Alerts        │   │
│  │  trendDetection → Surge alerts (every 30 min)        │   │
│  │  updateCityMetrics → Health score update             │   │
│  │  scheduledMetrics → Seed data + periodic refresh     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Firestore Schema

### Collection: `users`
```
users/{uid}
  ├── name:      string
  ├── email:     string
  ├── role:      "citizen" | "admin"
  ├── photoURL:  string (Google profile pic)
  └── createdAt: timestamp
```

### Collection: `complaints`
```
complaints/{complaintId}
  ├── title:          string
  ├── description:    string
  ├── category:       string  (Accident|Garbage|Pollution|...)
  ├── ward:           string  (Chennai - Ward 10)
  ├── latitude:       number
  ├── longitude:      number
  ├── locationKey:    string  (lat.toFixed(2)_lng.toFixed(2))
  ├── imageUrl:       string | null
  ├── status:         "Pending" | "In Progress" | "Resolved"
  ├── userId:         string
  ├── upvotes:        number
  ├── priorityScore:  number  (set by Cloud Function)
  ├── recommendations: string[] (set by Cloud Function)
  ├── isHotspot:      boolean (set by Cloud Function)
  ├── hotspotLevel:   "HIGH" | "MEDIUM" | null
  ├── aiProcessed:    boolean
  ├── timestamp:      timestamp
  └── createdAt:      timestamp
```

### Collection: `alerts`
```
alerts/{alertId}
  ├── message:   string
  ├── priority:  "critical" | "high" | "medium"
  ├── type:      "HOTSPOT" | "SURGE" | "CATEGORY_SPIKE" | "WARD_OVERLOAD"
  ├── location:  { lat, lng, ward } | null
  ├── metadata:  object
  ├── read:      boolean
  └── createdAt: timestamp
```

### Collection: `cityMetrics`
```
cityMetrics/current
  ├── complaintsCount: number
  ├── pendingCount:    number
  ├── resolvedCount:   number
  ├── resolutionRate:  number
  ├── byCategory:      { Garbage: 5, Accident: 3, ... }
  ├── byWard:          { "Chennai - Ward 10": 4, ... }
  ├── pollution:       number  (AQI)
  ├── traffic:         number  (% density)
  ├── cityHealthScore: number  (0-100)
  ├── healthGrade:     "A"|"B"|"C"|"D"
  ├── sensorData:      { Chennai: { pollution, traffic }, ... }
  └── updatedAt:       timestamp
```

---

## Step-by-Step Firebase Setup (Free Spark Plan)

### Step 1 — Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Add project" → Name: `smart-city-hub`
3. Disable Google Analytics → Create project

### Step 2 — Enable Authentication
1. Build → Authentication → Get started
2. Sign-in method → Email/Password → Enable → Save
3. Sign-in method → Google → Enable → Add support email → Save

### Step 3 — Enable Firestore
1. Build → Firestore Database → Create database
2. Select "Start in test mode" → Next
3. Choose location: `asia-south1` (Mumbai, closest to Tamil Nadu) → Enable

### Step 4 — Enable Storage
1. Build → Storage → Get started
2. Start in test mode → Next → Done

### Step 5 — Get Web App Config
1. Project Settings (gear icon) → Your apps → </> Web
2. Register app name: `smart-city-hub-web`
3. Copy the firebaseConfig values

### Step 6 — Create .env file
```bash
cd C:\smart-city-hub\frontend
copy .env.example .env
# Open .env and paste your Firebase values
```

### Step 7 — Install Firebase SDK
```bash
cd C:\smart-city-hub\frontend
npm install
```

### Step 8 — Run the app
```bash
npm start
# Opens at http://localhost:3000
```

---

## Deploy Cloud Functions (Requires Blaze Plan — Pay-as-you-go)

> Note: Cloud Functions require the Blaze (pay-as-you-go) plan.
> For a hackathon demo, the frontend works fully without deploying functions.
> Functions run automatically when Firebase detects new complaints.

### Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

### Initialize Firebase in project root
```bash
cd C:\smart-city-hub
firebase init
# Select: Functions, Firestore, Storage, Hosting, Emulators
# Use existing project → smart-city-hub
# Functions: JavaScript, No ESLint, Install dependencies: Yes
```

### Install function dependencies
```bash
cd C:\smart-city-hub\functions
npm install
```

### Test locally with emulators (FREE — no billing needed)
```bash
cd C:\smart-city-hub
firebase emulators:start
# Emulator UI: http://localhost:4000
# Functions:   http://localhost:5001
# Firestore:   http://localhost:8080
```

### Deploy to Firebase (Blaze plan required)
```bash
# Deploy everything
firebase deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only rules
firebase deploy --only firestore:rules,storage
```

---

## Enable Google Sign-In (Additional Step)

1. Firebase Console → Authentication → Sign-in method → Google → Enable
2. Add your domain to Authorized domains:
   - `localhost` (already there)
   - `your-app.vercel.app` (add after Vercel deploy)

---

## Deploy Frontend to Vercel (FREE)

```bash
cd C:\smart-city-hub\frontend
npm run build

# Install Vercel CLI
npm install -g vercel
vercel --prod

# In Vercel dashboard → Settings → Environment Variables
# Add all REACT_APP_FIREBASE_* variables
```

---

## Demo Mode (No Firebase — Works Right Now)

The app runs fully offline using localStorage:
- Login: admin@smartcity.gov / admin123
- Login: citizen@demo.com / citizen123
- 18 Tamil Nadu complaints pre-loaded
- All AI features work locally

---

## Optional AWS Integration

For advanced ML processing, add AWS Lambda:

```
Firestore → Cloud Function → AWS Lambda (via HTTP)
                                  ↓
                          Advanced ML model
                          (image classification,
                           NLP complaint analysis)
                                  ↓
                          Results → Firestore
```

AWS services to use:
- Lambda: serverless ML inference
- S3: alternative image storage
- Rekognition: pothole/damage detection from images
- Comprehend: NLP sentiment analysis on complaint text
