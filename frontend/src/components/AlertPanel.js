import React from 'react';
import { AlertTriangle, TrendingUp, MapPin, Bell, Zap } from 'lucide-react';
import { detectTrends, generateWardAlerts, detectHotspots } from '../utils/aiEngine';
import { markAlertRead } from '../utils/firestoreService';

const TYPE_ICONS = {
  SURGE: TrendingUp, CATEGORY_SPIKE: Zap, HOTSPOT: MapPin,
  WARD_OVERLOAD: Bell, WARD_SPIKE: MapPin, HIGH_PRIORITY_CATEGORY: AlertTriangle,
};

export default function AlertPanel({ complaints, firestoreAlerts = [] }) {
  // Merge Firestore alerts with locally computed alerts
  const localAlerts = [
    ...detectTrends(complaints).map((a) => ({ ...a, source: 'local' })),
    ...generateWardAlerts(complaints).map((a) => ({ type: 'WARD_OVERLOAD', message: a.message, severity: a.severity, source: 'local' })),
    ...detectHotspots(complaints).filter((h) => h.isHighPriority).map((h) => ({
      type: 'HOTSPOT',
      message: `High Priority Zone at [${h.lat.toFixed(3)}, ${h.lng.toFixed(3)}] — ${h.count} complaints`,
      severity: 'critical', source: 'local'
    }))
  ];

  // Firestore alerts take priority, show local if no Firestore
  const allAlerts = firestoreAlerts.length > 0
    ? firestoreAlerts.map((a) => ({ ...a, severity: a.priority, source: 'firestore' }))
    : localAlerts;

  const unreadCount = allAlerts.filter((a) => !a.read).length;

  if (allAlerts.length === 0) {
    return (
      <div className="card">
        <div className="section-title"><Bell size={16} /> AI Alerts</div>
        <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b', fontSize: 14 }}>
          ✅ No active alerts — city is running smoothly
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="section-title" style={{ justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={16} color="#ef4444" /> AI Alerts
          {unreadCount > 0 && <span className="badge badge-critical">{unreadCount} new</span>}
          {firestoreAlerts.length > 0 && <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 400 }}>● Live</span>}
        </span>
      </div>

      <div style={{ maxHeight: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {allAlerts.slice(0, 15).map((alert, i) => {
          const Icon = TYPE_ICONS[alert.type] || Bell;
          const isCritical = alert.severity === 'critical';
          return (
            <div key={alert.id || i}
              className={`alert alert-${isCritical ? 'critical' : 'high'}`}
              style={{ opacity: alert.read ? 0.6 : 1, cursor: alert.id ? 'pointer' : 'default' }}
              onClick={() => alert.id && !alert.read && markAlertRead(alert.id)}>
              <Icon size={15} style={{ flexShrink: 0, marginTop: 2 }} color={isCritical ? '#ef4444' : '#f97316'} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: isCritical ? '#ef4444' : '#f97316', marginBottom: 2 }}>
                  {isCritical ? '🚨 CRITICAL' : '⚠️ HIGH'} · {alert.type?.replace(/_/g, ' ')}
                  {!alert.read && alert.id && <span style={{ marginLeft: 6, fontSize: 10, color: '#3b82f6' }}>● new</span>}
                </div>
                <div style={{ fontSize: 12, color: '#cbd5e1' }}>{alert.message}</div>
                {alert.createdAt && (
                  <div style={{ fontSize: 10, color: '#475569', marginTop: 3 }}>
                    {new Date(alert.createdAt?.toDate?.() || alert.createdAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
