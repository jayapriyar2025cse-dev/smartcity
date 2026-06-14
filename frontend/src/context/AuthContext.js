import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile, signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseConfigured, auth, db, googleProvider } from '../firebase';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const DEMO_USERS = [
  { uid: 'admin-001',   email: 'admin@smartcity.gov', password: 'admin123',   name: 'City Admin',   role: 'admin'   },
  { uid: 'citizen-001', email: 'citizen@demo.com',    password: 'citizen123', name: 'John Citizen', role: 'citizen' },
];

const localLogin = (email, password) => new Promise((resolve, reject) => {
  let found = DEMO_USERS.find((u) => u.email === email && u.password === password);
  if (!found) {
    const reg = JSON.parse(localStorage.getItem('smartcity_registered') || '[]');
    found = reg.find((u) => u.email === email && (u.password === password || password === 'google'));
  }
  if (found) resolve({ uid: found.uid, email: found.email, displayName: found.name || found.displayName, role: found.role });
  else reject(new Error('Invalid email or password'));
});

const localRegister = (email, password, name, role) => new Promise((resolve, reject) => {
  const reg = JSON.parse(localStorage.getItem('smartcity_registered') || '[]');
  if (reg.find((u) => u.email === email)) return reject(new Error('email-already-in-use'));
  const user = { uid: `user-${Date.now()}`, email, password, name, role };
  reg.push(user);
  localStorage.setItem('smartcity_registered', JSON.stringify(reg));
  resolve({ uid: user.uid, email, displayName: name, role });
});

export const AuthProvider = ({ children }) => {
  const [user, setUser]         = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!firebaseConfigured || !auth) {
      const saved = localStorage.getItem('smartcity_user');
      if (saved) {
        try { const u = JSON.parse(saved); setUser(u); setUserRole(u.role); } catch {}
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const role = userDoc.exists() ? userDoc.data().role : 'citizen';
          setUser({ ...firebaseUser, role });
          setUserRole(role);
        } catch {
          setUser(firebaseUser);
          setUserRole('citizen');
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    if (!firebaseConfigured || !auth) {
      const u = await localLogin(email, password);
      localStorage.setItem('smartcity_user', JSON.stringify(u));
      setUser(u); setUserRole(u.role);
      return u;
    }
    const cred = await signInWithEmailAndPassword(auth, email, password);
    try {
      const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
      const role = userDoc.exists() ? userDoc.data().role : 'citizen';
      setUserRole(role);
    } catch { setUserRole('citizen'); }
    return cred;
  };

  const loginWithGoogle = async () => {
    if (!firebaseConfigured || !auth || !googleProvider) {
      throw new Error('Google Sign-In requires Firebase configuration');
    }
    const cred    = await signInWithPopup(auth, googleProvider);
    const userRef = doc(db, 'users', cred.user.uid);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        name: cred.user.displayName, email: cred.user.email,
        role: 'citizen', photoURL: cred.user.photoURL || null,
        createdAt: serverTimestamp()
      });
      setUserRole('citizen');
    } else {
      setUserRole(userDoc.data().role);
    }
    return cred;
  };

  const register = async (email, password, name, role = 'citizen') => {
    if (!firebaseConfigured || !auth) {
      const u = await localRegister(email, password, name, role);
      localStorage.setItem('smartcity_user', JSON.stringify(u));
      setUser(u); setUserRole(u.role);
      return u;
    }
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await setDoc(doc(db, 'users', cred.user.uid), { name, email, role, createdAt: serverTimestamp() });
    setUserRole(role);
    return cred;
  };

  const logout = async () => {
    if (!firebaseConfigured || !auth) {
      localStorage.removeItem('smartcity_user');
      setUser(null); setUserRole(null);
      return;
    }
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, userRole, loading, useFirebase: firebaseConfigured, login, loginWithGoogle, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
