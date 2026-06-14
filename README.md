# 🏙️ AI-Powered Smart City Decision Hub

A full-stack hackathon-ready web application for AI-driven city management.

## 🗂️ Folder Structure

```
smart-city-hub/
├── frontend/                    # React app (Vercel)
│   ├── public/index.html
│   └── src/
│       ├── App.js               # Router + auth guards
│       ├── App.css              # Global dark theme styles
│       ├── firebase.js          # Firebase client config
│       ├── context/
│       │   └── AuthContext.js   # Auth state management
│       ├── pages/
│       │   ├── Login.js
│       │   ├── Register.js
│       │   ├── CitizenDashboard.js
│       │   ├── SubmitComplaint.js
│       │   ├── ComplaintHistory.js
│       │   └── AdminDashboard.js  ← Main AI dashboard
│       ├── components/
│       │   ├── Sidebar.js
│       │   ├── Charts.js          ← Recharts (bar, pie, line, ward)
│       │   ├── ComplaintMap.js    ← Leaflet + heatmap + hotspots
│       │   ├── CityHealthScore.js ← Animated SVG ring
│       │   ├── AlertPanel.js      ← AI-generated alerts
│       │   └── PriorityList.js    ← AI ranked + recommendations
│       └── utils/
│           ├── aiEngine.js        ← Core AI logic
│           ├── dummyData.js       ← Sample data for demo
│           └── firestoreService.js
├── backend/                     # Express API (optional)
│   └── src/
│       ├── index.js
│       ├── utils/firebase.js    # Firebase Admin SDK
│       ├── middleware/auth.js   # JWT verification
│       └── routes/
│           ├── complaints.js
│           ├── ai.js
│           └── alerts.js
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
└── firebase.json
```

## ⚡ Quick Start

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** → Email/Password
4. Enable **Firestore Database** (start in test mode)
5. Enable **Storage**
6. Go to Project Settings → Your apps → Add Web App
7. Copy the config values

### 2. Frontend Setup

```bash
cd frontend
cp .env.example .env
# Fill in your Firebase values in .env
npm install
npm start
```

### 3. Backend Setup (Optional — frontend works standalone)

```bash
cd backend
cp .env.example .env
# Add Firebase Admin SDK credentials
npm install
npm run dev
```

To get Firebase Admin credentials:
- Firebase Console → Project Settings → Service Accounts → Generate new private key

### 4. Deploy Firestore Rules

```bash
npm install -g firebase-tools
firebase login
firebase init
firebase deploy --only firestore:rules,storage
```

## 🔑 Environment Variables

### Frontend (.env)
```
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
```

### Backend (.env)
```
PORT=5000
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=
```

## 🤖 AI Engine Logic

| Feature | Logic |
|---|---|
| **Hotspot Detection** | 3+ complaints in ~1km grid cell → Hotspot; 5+ → High Priority Zone |
| **Trend Detection** | 50%+ complaint increase in 24h → Surge Alert |
| **Priority Ranking** | Score = (Category Weight × 2) + Age Score + Status Score |
| **Recommendations** | Category → mapped action list (e.g., Garbage → "Deploy 2 garbage trucks") |
| **City Health Score** | 100 − complaint penalties − pollution − traffic density |

### Category Priority Weights
```
Accident=10, Fire=9, Flood=8, Power Outage=7, Pollution=6,
Road Damage=5, Water Supply=5, Garbage=4, Noise=3, Other=2
```

## 🚀 Deploy to Vercel

### Frontend
```bash
cd frontend
npm run build
npx vercel --prod
# Set environment variables in Vercel dashboard
```

### Backend
```bash
cd backend
npx vercel --prod
# Set FIREBASE_* env vars in Vercel dashboard
```

## 🎯 Demo Accounts

Register two accounts manually:
- **Citizen**: any email, role = citizen
- **Admin**: any email, role = admin (set in Firestore `users` collection)

Or use the demo buttons on the login page (requires pre-created accounts).

## 📊 Features Checklist

- [x] Citizen complaint submission (title, description, image, GPS location)
- [x] Voice input (Web Speech API)
- [x] Complaint status tracking (Pending / In Progress / Resolved)
- [x] Complaint history with filters
- [x] Admin dashboard with 5 tabs
- [x] Charts: Bar, Pie, Line, Ward distribution (Recharts)
- [x] Interactive map with hotspot circles (Leaflet)
- [x] Heatmap overlay
- [x] AI hotspot detection
- [x] AI trend detection & surge alerts
- [x] AI priority ranking
- [x] AI recommendation engine
- [x] City Health Score (animated SVG ring)
- [x] Alert panel with severity levels
- [x] Real-time Firestore updates
- [x] Firebase Auth (citizen + admin roles)
- [x] Image upload to Firebase Storage
- [x] Firestore security rules
- [x] Vercel deployment config
- [x] Dark modern UI

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6 |
| UI | Custom CSS (dark theme), Lucide icons |
| Charts | Recharts |
| Maps | Leaflet + React-Leaflet |
| Auth | Firebase Authentication |
| Database | Firebase Firestore |
| Storage | Firebase Storage |
| Backend | Node.js + Express |
| Hosting | Vercel |

