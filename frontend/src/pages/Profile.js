import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserComplaints } from '../utils/firestoreService';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';
import { User, Mail, Shield, ClipboardList, CheckCircle, Clock, AlertCircle, Camera } from 'lucide-react';
import { useEffect } from 'react';

export default function Profile() {
  const { user, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [tab, setTab] = useState('info');

  useEffect(() => {
    if (!user) return;
    const unsub = getUserComplaints(user.uid, setComplaints);
    return unsub;
  }, [user]);

  const stats = {
    total:      complaints.length,
    pending:    complaints.filter((c) => c.status === 'Pending').length,
    inProgress: complaints.filter((c) => c.status === 'In Progress').length,
    resolved:   complaints.filter((c) => c.status === 'Resolved').length,
  };

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header">
          <h1>My Profile</h1>
          <p>Manage your account and view your activity</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 }}>

          {/* Left — Avatar card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="avatar" style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid #334155' }} />
                ) : (
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: userRole === 'admin' ? 'rgba(168,85,247,0.2)' : 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: userRole === 'admin' ? '#a855f7' : '#3b82f6', margin: '0 auto' }}>
                    {initials}
                  </div>
                )}
              </div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{user?.displayName || 'User'}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{user?.email}</div>
              <div style={{ marginTop: 10 }}>
                <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', background: userRole === 'admin' ? 'rgba(168,85,247,0.15)' : 'rgba(59,130,246,0.15)', color: userRole === 'admin' ? '#a855f7' : '#3b82f6' }}>
                  {userRole === 'admin' ? '🛡️ Admin' : '👤 Citizen'}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="card">
              <div className="section-title"><ClipboardList size={15} /> My Activity</div>
              {[
                { label: 'Total Submitted', value: stats.total,      color: '#3b82f6', icon: <ClipboardList size={14} /> },
                { label: 'Pending',         value: stats.pending,    color: '#ef4444', icon: <AlertCircle size={14} /> },
                { label: 'In Progress',     value: stats.inProgress, color: '#f97316', icon: <Clock size={14} /> },
                { label: 'Resolved',        value: stats.resolved,   color: '#22c55e', icon: <CheckCircle size={14} /> },
              ].map((s) => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1e293b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 13 }}>
                    <span style={{ color: s.color }}>{s.icon}</span> {s.label}
                  </div>
                  <span style={{ fontWeight: 700, color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, background: '#1e293b', padding: 4, borderRadius: 10, border: '1px solid #334155' }}>
              {['info', 'security'].map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  style={{ flex: 1, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, textTransform: 'capitalize', transition: 'all 0.2s',
                    background: tab === t ? '#3b82f6' : 'transparent',
                    color:      tab === t ? 'white'   : '#64748b' }}>
                  {t === 'info' ? '👤 Account Info' : '🔒 Security'}
                </button>
              ))}
            </div>

            {tab === 'info' && (
              <div className="card">
                <div className="section-title"><User size={15} /> Account Information</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { label: 'Full Name',  value: user?.displayName || 'Not set', icon: <User size={14} /> },
                    { label: 'Email',      value: user?.email,                    icon: <Mail size={14} /> },
                    { label: 'Role',       value: userRole,                       icon: <Shield size={14} /> },
                    { label: 'User ID',    value: user?.uid?.slice(0, 16) + '...', icon: <ClipboardList size={14} /> },
                  ].map((item) => (
                    <div key={item.label} style={{ display: 'flex', gap: 14, padding: '14px 16px', background: '#0f172a', borderRadius: 8 }}>
                      <span style={{ color: '#475569', marginTop: 2 }}>{item.icon}</span>
                      <div>
                        <div style={{ fontSize: 11, color: '#475569', marginBottom: 3 }}>{item.label}</div>
                        <div style={{ fontSize: 14, fontWeight: 500, textTransform: 'capitalize' }}>{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'security' && (
              <div className="card">
                <div className="section-title">🔒 Security Settings</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ padding: '16px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#22c55e', marginBottom: 4 }}>✅ Account Active</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>Your account is active and secure</div>
                  </div>
                  <div style={{ padding: '16px', background: '#0f172a', borderRadius: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Sign-in Method</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>
                      {user?.providerData?.[0]?.providerId === 'google.com' ? '🔵 Google Account' : '📧 Email & Password'}
                    </div>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={async () => { await logout(); navigate('/'); toast.success('Logged out successfully'); }}>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
