import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserComplaints } from '../utils/firestoreService';
import { CATEGORY_COLORS, STATUS_COLORS } from '../utils/dummyData';
import Sidebar from '../components/Sidebar';
import { PlusCircle, ClipboardList, CheckCircle, Clock, AlertCircle, ShieldCheck, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = getUserComplaints(user.uid, (data) => {
      setComplaints(data);
      setLoading(false);
    });
    return unsub;
  }, [user.uid]);

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === 'Pending').length,
    inProgress: complaints.filter((c) => c.status === 'In Progress').length,
    resolved: complaints.filter((c) => c.status === 'Resolved').length,
  };

  const formatDate = (ts) => {
    try { return format(new Date(ts), 'MMM d, yyyy'); } catch { return 'N/A'; }
  };

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>Welcome, {user?.displayName?.split(' ')[0] || 'Citizen'} 👋</h1>
            <p>Track your complaints and city issue reports</p>
          </div>
          <Link to="/submit" className="btn btn-primary">
            <PlusCircle size={16} /> New Complaint
          </Link>
        </div>

        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: 28 }}>
          <StatCard label="Total Submitted" value={stats.total} icon={<ClipboardList size={20} />} color="#3b82f6" />
          <StatCard label="Pending" value={stats.pending} icon={<AlertCircle size={20} />} color="#ef4444" />
          <StatCard label="In Progress" value={stats.inProgress} icon={<Clock size={20} />} color="#f97316" />
          <StatCard label="Resolved" value={stats.resolved} icon={<CheckCircle size={20} />} color="#22c55e" />
        </div>

        {/* Recent complaints */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>Recent Complaints</div>
            <Link to="/history" style={{ fontSize: 13, color: '#3b82f6', textDecoration: 'none' }}>View all →</Link>
          </div>

          {loading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : complaints.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              <ClipboardList size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <div style={{ marginBottom: 12 }}>No complaints yet</div>
              <Link to="/submit" className="btn btn-primary btn-sm">Submit your first complaint</Link>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Title</th><th>Category</th><th>Ward</th><th>Status</th><th>Image</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {complaints.slice(0, 8).map((c) => (
                    <tr key={c.id}>
                      <td style={{ color: '#f1f5f9', fontWeight: 500 }}>{c.title}</td>
                      <td>
                        <span style={{ background: (CATEGORY_COLORS[c.category] || '#6b7280') + '22', color: CATEGORY_COLORS[c.category] || '#6b7280', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
                          {c.category}
                        </span>
                      </td>
                      <td>{c.ward || '—'}</td>
                      <td>
                        <span className={`badge badge-${c.status === 'Pending' ? 'pending' : c.status === 'In Progress' ? 'progress' : 'resolved'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        {c.imageVerification ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                            background: c.imageVerification.status === 'Verified' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                            color: c.imageVerification.status === 'Verified' ? '#22c55e' : '#ef4444',
                            boxShadow: `0 0 6px ${c.imageVerification.status === 'Verified' ? '#22c55e33' : '#ef444433'}`,
                          }}>
                            {c.imageVerification.status === 'Verified'
                              ? <ShieldCheck size={10} />
                              : <ShieldAlert size={10} />}
                            {c.imageVerification.status === 'Verified' ? 'Verified' : 'Suspicious'}
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: '#475569' }}>—</span>
                        )}
                      </td>
                      <td>{formatDate(c.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ marginTop: 20, padding: '16px 20px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ fontSize: 24 }}>🤖</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>AI-Powered Processing</div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
              Your complaints are automatically prioritized by our AI engine and routed to the appropriate city department.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const StatCard = ({ label, value, icon, color }) => (
  <div className="stat-card" style={{ '--accent-color': color }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div className="stat-value" style={{ color }}>{value}</div>
        <div className="stat-label">{label}</div>
      </div>
      <div style={{ color, opacity: 0.6 }}>{icon}</div>
    </div>
  </div>
);
