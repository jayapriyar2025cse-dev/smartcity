import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBmIJ-Y0tzFEFvtkwIt-0wLBiOrcEbV0IQ",
  authDomain: "smart-city-datahub-4142b.firebaseapp.com",
  projectId: "smart-city-datahub-4142b",
  storageBucket: "smart-city-datahub-4142b.firebasestorage.app",
  messagingSenderId: "703007401770",
  appId: "1:703007401770:web:8388065713b82ae6f46053",
  measurementId: "G-LM2MWGX9Z4"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
export const firebaseConfigured = true;
