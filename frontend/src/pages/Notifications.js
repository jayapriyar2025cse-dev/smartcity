import React, { useState, useEffect } from 'react';
import { getAlerts, markAlertRead } from '../utils/firestoreService';
import { detectTrends, generateWardAlerts, detectHotspots } from '../utils/aiEngine';
import { getAllComplaints } from '../utils/firestoreService';
import Sidebar from '../components/Sidebar';
import { Bell, AlertTriangle, TrendingUp, MapPin, Zap, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';

const TYPE_META = {
  SURGE:                  { icon: TrendingUp,    color: '#f97316', label: 'Complaint Surge'    },
  CATEGORY_SPIKE:         { icon: Zap,           color: '#eab308', label: 'Category Spike'     },
  HOTSPOT:                { icon: MapPin,        color: '#ef4444', label: 'Hotspot Detected'   },
  WARD_OVERLOAD:          { icon: Bell,          color: '#f97316', label: 'Ward Overload'       },
  WARD_SPIKE:             { icon: MapPin,        color: '#f97316', label: 'Ward Spike'          },
  HIGH_PRIORITY_CATEGORY: { icon: AlertTriangle, color: '#ef4444', label: 'High Priority'       },
};

export default function Notifications() {
  const [alerts, setAlerts]         = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter]         = useState('all');
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    const unsub1 = getAlerts((data) => { setAlerts(data); setLoading(false); });
    const unsub2 = getAllComplaints(setComplaints);
    return () => { unsub1(); unsub2(); };
  }, []);

  // Merge Firestore alerts + locally computed alerts
  const localAlerts = [
    ...detectTrends(complaints).map((a, i) => ({ id: `local-${i}`, ...a, severity: a.severity, createdAt: new Date().toISOString(), read: false, source: 'local' })),
    ...generateWardAlerts(complaints).map((a, i) => ({ id: `ward-${i}`, type: 'WARD_OVERLOAD', message: a.message, priority: a.severity, createdAt: new Date().toISOString(), read: false, source: 'local' })),
    ...detectHotspots(complaints).filter((h) => h.isHighPriority).map((h, i) => ({ id: `hot-${i}`, type: 'HOTSPOT', message: `High Priority Zone at [${h.lat.toFixed(3)}, ${h.lng.toFixed(3)}] — ${h.count} complaints`, priority: 'critical', createdAt: new Date().toISOString(), read: false, source: 'local' })),
  ];

  const allAlerts = alerts.length > 0 ? alerts : localAlerts;
  const unread    = allAlerts.filter((a) => !a.read).length;

  const filtered = filter === 'all'    ? allAlerts
                 : filter === 'unread' ? allAlerts.filter((a) => !a.read)
                 : allAlerts.filter((a) => a.priority === filter);

  const handleRead = async (id) => {
    if (id.startsWith('local')) return;
    await markAlertRead(id);
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, read: true } : a));
  };

  const markAllRead = async () => {
    for (const a of alerts.filter((a) => !a.read)) await markAlertRead(a.id);
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const formatDate = (ts) => {
    try { return format(new Date(ts?.toDate?.() || ts), 'MMM d, HH:mm'); } catch { return 'Now'; }
  };

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Bell size={24} /> Notifications
              {unread > 0 && <span className="badge badge-critical">{unread} new</span>}
            </h1>
            <p>AI-generated alerts and city issue notifications</p>
          </div>
          {unread > 0 && (
            <button className="btn btn-outline btn-sm" onClick={markAllRead}>
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="filters-bar" style={{ marginBottom: 20 }}>
          {[
            { value: 'all',      label: `All (${allAlerts.length})` },
            { value: 'unread',   label: `Unread (${unread})` },
            { value: 'critical', label: '🚨 Critical' },
            { value: 'high',     label: '⚠️ High' },
          ].map((f) => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                borderColor: filter === f.value ? '#3b82f6' : '#334155',
                background:  filter === f.value ? 'rgba(59,130,246,0.15)' : 'transparent',
                color:       filter === f.value ? '#3b82f6' : '#64748b' }}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
            <Bell size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
            <div>No notifications found</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((alert) => {
              const meta  = TYPE_META[alert.type] || { icon: Bell, color: '#64748b', label: alert.type };
              const Icon  = meta.icon;
              const isCrit = alert.priority === 'critical';
              return (
                <div key={alert.id}
                  onClick={() => handleRead(alert.id)}
                  style={{ display: 'flex', gap: 14, padding: '16px 20px', background: alert.read ? '#1e293b' : 'rgba(59,130,246,0.05)', border: `1px solid ${alert.read ? '#334155' : isCrit ? '#ef444433' : '#f9731633'}`, borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s', opacity: alert.read ? 0.7 : 1 }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#263548'}
                  onMouseLeave={(e) => e.currentTarget.style.background = alert.read ? '#1e293b' : 'rgba(59,130,246,0.05)'}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: meta.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} color={meta.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {meta.label}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {!alert.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} />}
                        <span style={{ fontSize: 11, color: '#475569' }}>{formatDate(alert.createdAt)}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.5 }}>{alert.message}</div>
                    <div style={{ marginTop: 6 }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: isCrit ? 'rgba(239,68,68,0.15)' : 'rgba(249,115,22,0.15)', color: isCrit ? '#ef4444' : '#f97316', fontWeight: 600 }}>
                        {isCrit ? '🚨 CRITICAL' : '⚠️ HIGH'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
