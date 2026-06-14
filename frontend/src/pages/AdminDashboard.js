import React, { useState, useEffect } from 'react';
import { updateComplaintStatus } from '../utils/firestoreService';
import { useRealTimeData } from '../hooks/useRealTimeData';
import { CATEGORIES, WARDS, CATEGORY_COLORS } from '../utils/dummyData';
import { detectHotspots, detectTrends, rankByPriority } from '../utils/aiEngine';
import Sidebar from '../components/Sidebar';
import CityHealthScore from '../components/CityHealthScore';
import AlertPanel from '../components/AlertPanel';
import PriorityList from '../components/PriorityList';
import ComplaintMap from '../components/ComplaintMap';
import { CategoryChart, StatusPieChart, TrendChart, WardChart } from '../components/Charts';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  LayoutDashboard, Map, BarChart3, List, AlertTriangle,
  CheckCircle, Clock, XCircle, Users, TrendingUp, ShieldAlert
} from 'lucide-react';
import FraudDetection from '../components/FraudDetection';

const TABS = [
  { id: 'overview',   label: 'Overview',       icon: LayoutDashboard },
  { id: 'map',        label: 'Heatmap',         icon: Map },
  { id: 'analytics',  label: 'Analytics',       icon: BarChart3 },
  { id: 'complaints', label: 'All Complaints',  icon: List },
  { id: 'ai',         label: 'AI Engine',       icon: AlertTriangle },
  { id: 'fraud',      label: 'AI Fraud',        icon: ShieldAlert },
];

export default function AdminDashboard() {
  // Real-time data from Firestore (or localStorage fallback)
  const { complaints: liveComplaints, alerts, metrics, loading } = useRealTimeData();
  const [localComplaints, setLocalComplaints] = useState([]);
  const [activeTab, setActiveTab]   = useState('overview');
  const [filters, setFilters]       = useState({ category: '', status: '', ward: '' });
  const [updatingId, setUpdatingId] = useState(null);

  // Sync live complaints into local state for optimistic updates
  useEffect(() => { setLocalComplaints(liveComplaints); }, [liveComplaints]);

  const complaints = localComplaints.length > 0 ? localComplaints : liveComplaints;

  const filteredComplaints = complaints.filter((c) => {
    if (filters.category && c.category !== filters.category) return false;
    if (filters.status  && c.status   !== filters.status)   return false;
    if (filters.ward    && c.ward     !== filters.ward)      return false;
    return true;
  });

  const stats = {
    total:      complaints.length,
    pending:    complaints.filter((c) => c.status === 'Pending').length,
    inProgress: complaints.filter((c) => c.status === 'In Progress').length,
    resolved:   complaints.filter((c) => c.status === 'Resolved').length,
    hotspots:   detectHotspots(complaints).length,
    alerts:     alerts.filter((a) => !a.read).length || detectTrends(complaints).length,
  };

  const handleStatusUpdate = async (id, status) => {
    setUpdatingId(id);
    try {
      await updateComplaintStatus(id, status);
      // Optimistic update
      setLocalComplaints((prev) => prev.map((c) => c.id === id ? { ...c, status } : c));
      toast.success(`Status updated to ${status}`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (ts) => {
    try { return format(new Date(ts?.toDate?.() || ts), 'MMM d, HH:mm'); } catch { return 'N/A'; }
  };

  if (loading) return (
    <div className="layout">
      <Sidebar />
      <main className="main-content"><div className="loading"><div className="spinner" /></div></main>
    </div>
  );

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content fade-in">

        {/* Header */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>Admin Dashboard</h1>
            <p>AI-Powered Smart City Decision Hub — Tamil Nadu</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div className="pulse" style={{ width: 8, height: 8, background: '#22c55e', borderRadius: '50%' }} />
            <span style={{ fontSize: 12, color: '#22c55e' }}>
              Live {metrics ? '(Firestore)' : '(Local)'}
            </span>
          </div>
        </div>

        {/* Stat Cards Row 1 */}
        <div className="grid-4" style={{ marginBottom: 16 }}>
          <StatCard label="Total Complaints" value={stats.total}      icon={<List size={20} />}        color="#3b82f6" />
          <StatCard label="Pending"          value={stats.pending}    icon={<XCircle size={20} />}     color="#ef4444" />
          <StatCard label="In Progress"      value={stats.inProgress} icon={<Clock size={20} />}       color="#f97316" />
          <StatCard label="Resolved"         value={stats.resolved}   icon={<CheckCircle size={20} />} color="#22c55e" />
        </div>

        {/* Stat Cards Row 2 */}
        <div className="grid-3" style={{ marginBottom: 24 }}>
          <StatCard label="AI Hotspots"    value={stats.hotspots} icon={<TrendingUp size={20} />}    color="#a855f7" />
          <StatCard label="Active Alerts"  value={stats.alerts}   icon={<AlertTriangle size={20} />} color="#eab308" />
          <StatCard label="Wards Affected" value={new Set(complaints.map((c) => c.ward).filter(Boolean)).size} icon={<Users size={20} />} color="#06b6d4" />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#1e293b', padding: 4, borderRadius: 10, border: '1px solid #334155', overflowX: 'auto' }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', transition: 'all 0.2s',
                background: activeTab === id ? '#3b82f6' : 'transparent',
                color:      activeTab === id ? 'white'   : '#64748b' }}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="grid-2">
              <CityHealthScore complaints={complaints} metrics={metrics} />
              <AlertPanel complaints={complaints} firestoreAlerts={alerts} />
            </div>
            <div className="grid-2">
              <CategoryChart complaints={complaints} />
              <StatusPieChart complaints={complaints} />
            </div>
            <PriorityList complaints={complaints} />
          </div>
        )}

        {/* ── MAP TAB ── */}
        {activeTab === 'map' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card">
              <div className="section-title"><Map size={16} /> Complaint Heatmap & Hotspot Detection</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
                🔴 Red circles = High Priority Zones (5+ complaints) &nbsp;|&nbsp; 🟠 Orange = Hotspots (3+ complaints) &nbsp;|&nbsp; Dots = Individual complaints
              </div>
              <ComplaintMap complaints={filteredComplaints} showHeatmap={true} />
            </div>
            <div className="card">
              <div className="section-title">🔥 Detected Hotspots</div>
              {detectHotspots(complaints).length === 0 ? (
                <div style={{ color: '#64748b', fontSize: 14 }}>No hotspots detected</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {detectHotspots(complaints).map((h, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#0f172a', borderRadius: 8, border: `1px solid ${h.isHighPriority ? '#ef444433' : '#f9731633'}` }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: h.isHighPriority ? '#ef4444' : '#f97316', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{h.count} complaints</span>
                        <span style={{ color: '#64748b', fontSize: 12, marginLeft: 8 }}>at [{h.lat.toFixed(3)}, {h.lng.toFixed(3)}]</span>
                        <span style={{ color: '#94a3b8', fontSize: 12, marginLeft: 8 }}>{h.categories.join(', ')}</span>
                      </div>
                      {h.isHighPriority && <span className="badge badge-critical">HIGH PRIORITY ZONE</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ANALYTICS TAB ── */}
        {activeTab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="grid-2">
              <TrendChart complaints={complaints} />
              <WardChart  complaints={complaints} />
            </div>
            <div className="grid-2">
              <CategoryChart  complaints={complaints} />
              <StatusPieChart complaints={complaints} />
            </div>
          </div>
        )}

        {/* ── ALL COMPLAINTS TAB ── */}
        {activeTab === 'complaints' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div className="section-title" style={{ marginBottom: 0 }}>
                All Complaints ({filteredComplaints.length})
                {metrics && <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 400, marginLeft: 8 }}>● Live</span>}
              </div>
              <div className="filters-bar" style={{ margin: 0 }}>
                <select className="filter-select" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
                  <option value="">All Categories</option>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <select className="filter-select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                  <option value="">All Status</option>
                  <option>Pending</option><option>In Progress</option><option>Resolved</option>
                </select>
                <select className="filter-select" value={filters.ward} onChange={(e) => setFilters({ ...filters, ward: e.target.value })}>
                  <option value="">All Wards</option>
                  {WARDS.map((w) => <option key={w}>{w}</option>)}
                </select>
              </div>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Title</th><th>Category</th><th>Ward</th><th>Status</th><th>Date</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredComplaints.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 500, color: '#f1f5f9', fontSize: 13 }}>{c.title}</div>
                        <div style={{ fontSize: 11, color: '#475569', marginTop: 2, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description}</div>
                      </td>
                      <td>
                        <span style={{ background: (CATEGORY_COLORS[c.category] || '#6b7280') + '22', color: CATEGORY_COLORS[c.category] || '#6b7280', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>
                          {c.category}
                        </span>
                      </td>
                      <td style={{ fontSize: 13 }}>{c.ward || '—'}</td>
                      <td>
                        <span className={`badge badge-${c.status === 'Pending' ? 'pending' : c.status === 'In Progress' ? 'progress' : 'resolved'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: '#475569' }}>{formatDate(c.createdAt || c.timestamp)}</td>
                      <td>
                        <select value={c.status} disabled={updatingId === c.id}
                          onChange={(e) => handleStatusUpdate(c.id, e.target.value)}
                          style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#94a3b8', padding: '4px 8px', fontSize: 12, cursor: 'pointer' }}>
                          <option>Pending</option>
                          <option>In Progress</option>
                          <option>Resolved</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── AI ENGINE TAB ── */}
        {activeTab === 'ai' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card">
              <div className="section-title">📡 Trend Detection Engine</div>
              {detectTrends(complaints).length === 0 ? (
                <div style={{ color: '#64748b', fontSize: 14 }}>✅ No anomalies detected in complaint trends</div>
              ) : detectTrends(complaints).map((a, i) => (
                <div key={i} className={`alert alert-${a.severity === 'critical' ? 'critical' : 'high'}`}>
                  <AlertTriangle size={16} />
                  <div>
                    <strong style={{ fontSize: 13 }}>{a.type.replace(/_/g, ' ')}</strong>
                    <div style={{ fontSize: 13, marginTop: 2 }}>{a.message}</div>
                  </div>
                </div>
              ))}
            </div>

            <PriorityList complaints={complaints} />

            <div className="grid-2">
              <CityHealthScore complaints={complaints} metrics={metrics} />
              <div className="card">
                <div className="section-title">🧠 AI Decision Logic</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { icon: '🔥', title: 'Hotspot Detection',     desc: '3+ complaints in ~1km radius → hotspot. 5+ → High Priority Zone' },
                    { icon: '📈', title: 'Trend Analysis',         desc: '50%+ increase in 24h complaint rate triggers surge alert' },
                    { icon: '⚡', title: 'Priority Scoring',       desc: 'Score = (Category Weight × 2) + Age Score + Status Score' },
                    { icon: '🤖', title: 'Recommendation Engine',  desc: 'Category-based action suggestions mapped to city departments' },
                    { icon: '🏙️', title: 'Health Score',           desc: 'Score = 100 − complaint penalties − pollution − traffic density' },
                    { icon: '☁️', title: 'Cloud Functions',        desc: 'Firebase triggers run AI logic server-side on every new complaint' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 12px', background: '#0f172a', borderRadius: 8 }}>
                      <span style={{ fontSize: 20 }}>{item.icon}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{item.title}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* ── FRAUD TAB ── */}
        {activeTab === 'fraud' && <FraudDetection complaints={complaints} />}

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
      <div style={{ color, opacity: 0.5 }}>{icon}</div>
    </div>
  </div>
);
