import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';
import { firebaseConfigured, auth, db } from '../firebase';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';

export default function Profile() {
  const { user, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [mobile, setMobile] = React.useState(window.innerWidth <= 768);

  React.useEffect(() => {
    const handler = () => setMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const [name, setName]       = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [pwOpen, setPwOpen]   = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw]   = useState(false);

  useEffect(() => {
    if (user) setName(user.displayName || '');
  }, [user?.uid]); // eslint-disable-line

  const saveProfile = async () => {
    if (!name.trim()) return toast.error('Name cannot be empty');
    setSaving(true);
    try {
      if (firebaseConfigured && auth?.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name.trim() });
        if (db) await updateDoc(doc(db, 'users', user.uid), { name: name.trim() });
      } else {
        const s = JSON.parse(localStorage.getItem('smartcity_user') || '{}');
        s.displayName = name.trim();
        localStorage.setItem('smartcity_user', JSON.stringify(s));
      }
      toast.success('Profile updated!');
      setEditing(false);
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const savePassword = async () => {
    if (!currentPw)          return toast.error('Enter current password');
    if (newPw.length < 6)    return toast.error('Min 6 characters');
    if (newPw !== confirmPw) return toast.error('Passwords do not match');
    setSavingPw(true);
    try {
      if (firebaseConfigured && auth?.currentUser) {
        const cred = EmailAuthProvider.credential(user.email, currentPw);
        await reauthenticateWithCredential(auth.currentUser, cred);
        await updatePassword(auth.currentUser, newPw);
      } else {
        const reg = JSON.parse(localStorage.getItem('smartcity_registered') || '[]');
        const idx = reg.findIndex(u => u.uid === user.uid);
        if (idx !== -1 && reg[idx].password === currentPw) {
          reg[idx].password = newPw;
          localStorage.setItem('smartcity_registered', JSON.stringify(reg));
        } else return toast.error('Wrong current password');
      }
      toast.success('Password changed!');
      setPwOpen(false); setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSavingPw(false); }
  };

  const card = {
    background: '#1e293b', border: '1px solid #334155',
    borderRadius: 16, padding: 20, marginBottom: 16,
  };

  const inputStyle = (active) => ({
    width: '100%', padding: '13px 14px', fontSize: 15,
    background: '#0f172a', border: `1px solid ${active ? '#3b82f6' : '#334155'}`,
    borderRadius: 10, color: active ? '#f1f5f9' : '#64748b',
    fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
    WebkitAppearance: 'none',
  });

  const bigBtn = (bg, color = '#fff', border = 'none') => ({
    width: '100%', padding: '16px 20px', fontSize: 16, fontWeight: 700,
    background: bg, color, border, borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    cursor: 'pointer', minHeight: 56, marginBottom: 12,
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
    WebkitAppearance: 'none', appearance: 'none',
  });

  const label = (text) => (
    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 6, letterSpacing: 1 }}>{text}</div>
  );

  const initials = (user?.displayName || user?.email || 'U').slice(0, 2).toUpperCase();

  const pageContent = (
    <div style={{
      padding: '80px 16px 120px',
      maxWidth: 520,
      margin: '0 auto',
      fontFamily: 'Inter, sans-serif',
      color: '#f1f5f9',
    }}>
      <h2 style={{ marginBottom: 20, fontSize: 22, fontWeight: 800 }}>My Profile</h2>

      {/* Avatar */}
      <div style={{ ...card, textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: userRole === 'admin' ? 'rgba(168,85,247,0.2)' : 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, color: userRole === 'admin' ? '#a855f7' : '#3b82f6', margin: '0 auto 12px' }}>
          {user?.photoURL ? <img src={user.photoURL} alt="" style={{ width: 72, height: 72, borderRadius: '50%' }} /> : initials}
        </div>
        <div style={{ fontWeight: 700, fontSize: 18 }}>{name || user?.email}</div>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{user?.email}</div>
        <div style={{ marginTop: 10, display: 'inline-block', padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: userRole === 'admin' ? 'rgba(168,85,247,0.15)' : 'rgba(59,130,246,0.15)', color: userRole === 'admin' ? '#a855f7' : '#3b82f6' }}>
          {userRole === 'admin' ? '🛡️ Admin' : '👤 Citizen'}
        </div>
      </div>

      {/* Edit Profile */}
      <div style={card}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>✏️ Edit Profile</div>

        <div style={{ marginBottom: 14 }}>
          {label('FULL NAME')}
          <input value={name} onChange={e => setName(e.target.value)} disabled={!editing} placeholder="Your full name" style={inputStyle(editing)} />
        </div>

        <div style={{ marginBottom: 20 }}>
          {label('EMAIL')}
          <input value={user?.email || ''} disabled style={inputStyle(false)} />
        </div>

        {!editing ? (
          <button onClick={() => setEditing(true)} style={bigBtn('#3b82f6')}>
            ✏️ Edit Profile
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setEditing(false); setName(user?.displayName || ''); }} style={{ ...bigBtn('transparent', '#94a3b8', '1px solid #334155'), flex: 1, marginBottom: 0 }}>
              ✕ Cancel
            </button>
            <button onClick={saveProfile} disabled={saving} style={{ ...bigBtn('#22c55e'), flex: 1, marginBottom: 0 }}>
              {saving ? 'Saving...' : '✓ Save'}
            </button>
          </div>
        )}
      </div>

      {/* Change Password */}
      <div style={card}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>🔒 Change Password</div>

        {!pwOpen ? (
          <button onClick={() => setPwOpen(true)} style={bigBtn('#1e3a5f', '#f1f5f9', '1px solid #3b82f6')}>
            🔒 Change Password
          </button>
        ) : (
          <div>
            {[
              { lbl: 'CURRENT PASSWORD', val: currentPw, set: setCurrentPw, ph: 'Current password' },
              { lbl: 'NEW PASSWORD',     val: newPw,     set: setNewPw,     ph: 'Min 6 characters' },
              { lbl: 'CONFIRM PASSWORD', val: confirmPw, set: setConfirmPw, ph: 'Repeat new password' },
            ].map(({ lbl, val, set, ph }) => (
              <div key={lbl} style={{ marginBottom: 14 }}>
                {label(lbl)}
                <input type="password" value={val} onChange={e => set(e.target.value)} placeholder={ph} style={inputStyle(true)} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={() => setPwOpen(false)} style={{ ...bigBtn('transparent', '#94a3b8', '1px solid #334155'), flex: 1, marginBottom: 0 }}>
                ✕ Cancel
              </button>
              <button onClick={savePassword} disabled={savingPw} style={{ ...bigBtn('#3b82f6'), flex: 1, marginBottom: 0 }}>
                {savingPw ? 'Saving...' : 'Update'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sign Out */}
      <button onClick={async () => { await logout(); navigate('/'); toast.success('Logged out'); }}
        style={bigBtn('rgba(239,68,68,0.12)', '#ef4444', '1px solid rgba(239,68,68,0.3)')}>
        🚪 Sign Out
      </button>
    </div>
  );

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        {pageContent}
      </main>
    </div>
  );
}
