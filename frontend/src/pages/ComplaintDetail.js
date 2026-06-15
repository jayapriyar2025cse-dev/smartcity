import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAllComplaints, updateComplaintStatus } from '../utils/firestoreService';
import { getRecommendations, CATEGORY_PRIORITY } from '../utils/aiEngine';
import { CATEGORY_COLORS, STATUS_COLORS } from '../utils/dummyData';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ArrowLeft, MapPin, Clock, Tag, User, Zap, CheckCircle, AlertTriangle } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function ComplaintDetail() {
  const { id }          = useParams();
  const navigate        = useNavigate();
  const { userRole }    = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const unsub = getAllComplaints((list) => {
      const found = list.find((c) => c.id === id);
      setComplaint(found || null);
      setLoading(false);
    });
    return unsub;
  }, [id]);

  const handleStatusChange = async (status) => {
    try {
      await updateComplaintStatus(id, status);
      setComplaint((prev) => ({ ...prev, status }));
      toast.success(`Status updated to ${status}`);
    } catch { toast.error('Failed to update'); }
  };

  const formatDate = (ts) => {
    try { return format(new Date(ts?.toDate?.() || ts), 'MMM d, yyyy HH:mm'); } catch { return 'N/A'; }
  };

  if (loading) return (
    <div className="layout"><Sidebar />
      <main className="main-content"><div className="loading"><div className="spinner" /></div></main>
    </div>
  );

  if (!complaint) return (
    <div className="layout"><Sidebar />
      <main className="main-content">
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b' }}>
          <AlertTriangle size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <div style={{ fontSize: 18, fontWeight: 600 }}>Complaint not found</div>
          <button className="btn btn-outline btn-sm" style={{ marginTop: 16 }} onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </main>
    </div>
  );

  const recs         = complaint.recommendations?.length ? complaint.recommendations : getRecommendations(complaint);
  const priorityScore = complaint.priorityScore || CATEGORY_PRIORITY[complaint.category] || 2;
  const catColor     = CATEGORY_COLORS[complaint.category] || '#6b7280';
  const statusClass  = complaint.status === 'Pending' ? 'pending' : complaint.status === 'In Progress' ? 'progress' : 'resolved';
  const lat = complaint.latitude  || complaint.location?.lat  || null;
  const lng = complaint.longitude || complaint.location?.lng  || null;

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content fade-in">
        {/* Back button */}
        <button className="btn btn-outline btn-sm" style={{ marginBottom: 20 }} onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> Back
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Main card */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                <div>
                  <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{complaint.title}</h1>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ background: catColor + '22', color: catColor, padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{complaint.category}</span>
                    <span className={`badge badge-${statusClass}`}>{complaint.status}</span>
                    {complaint.isHotspot && <span className="badge badge-critical">🔥 Hotspot</span>}
                  </div>
                </div>
                {userRole === 'admin' && (
                  <select value={complaint.status} onChange={(e) => handleStatusChange(e.target.value)}
                    style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#94a3b8', padding: '8px 12px', fontSize: 13, cursor: 'pointer' }}>
                    <option>Pending</option><option>In Progress</option><option>Resolved</option>
                  </select>
                )}
              </div>

              <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.7, marginBottom: 20 }}>{complaint.description}</p>

              {/* Meta info */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {[
                  { icon: <MapPin size={14} />,   label: 'Ward',     value: complaint.ward || 'Unknown' },
                  { icon: <Clock size={14} />,    label: 'Reported', value: formatDate(complaint.createdAt || complaint.timestamp) },
                  { icon: <Tag size={14} />,      label: 'Category', value: complaint.category },
                  { icon: <Zap size={14} />,      label: 'Priority Score', value: priorityScore },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#0f172a', borderRadius: 8 }}>
                    <span style={{ color: '#475569' }}>{item.icon}</span>
                    <div>
                      <div style={{ fontSize: 11, color: '#475569' }}>{item.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Image */}
            {complaint.imageUrl ? (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #334155', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  🖼️ Submitted Photo
                  {complaint.imageVerification && (
                    <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                      background: complaint.imageVerification.status === 'Verified' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                      color: complaint.imageVerification.status === 'Verified' ? '#22c55e' : '#ef4444' }}>
                      {complaint.imageVerification.status === 'Verified' ? '✔ Verified' : '⚠ Suspicious'}
                    </span>
                  )}
                </div>
                <img src={complaint.imageUrl} alt="complaint" style={{ width: '100%', maxHeight: 360, objectFit: 'cover', display: 'block' }} />
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', color: '#475569', fontSize: 13, padding: '32px 0' }}>
                📷 No image submitted
              </div>
            )}

            {/* AI Recommendations */}
            <div className="card">
              <div className="section-title"><Zap size={16} color="#eab308" /> AI Recommendations</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recs.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 8 }}>
                    <div style={{ width: 24, height: 24, background: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                    <span style={{ fontSize: 14, color: '#cbd5e1' }}>→ {r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Map */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card">
              <div className="section-title"><MapPin size={16} /> Location</div>
              {lat && lng ? (
                <div style={{ height: 280, borderRadius: 8, overflow: 'hidden', border: '1px solid #334155' }}>
                  <MapContainer center={[lat, lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                    <Marker position={[lat, lng]} />
                  </MapContainer>
                </div>
              ) : (
                <div style={{ height: 280, background: '#0f172a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: 13 }}>
                  No location data
                </div>
              )}
              {lat && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#475569' }}>
                  📍 {parseFloat(lat).toFixed(4)}, {parseFloat(lng).toFixed(4)}
                </div>
              )}
            </div>

            {/* Status timeline */}
            <div className="card">
              <div className="section-title"><CheckCircle size={16} /> Status Timeline</div>
              {['Pending', 'In Progress', 'Resolved'].map((s, i) => {
                const statuses = ['Pending', 'In Progress', 'Resolved'];
                const currentIdx = statuses.indexOf(complaint.status);
                const isDone = i <= currentIdx;
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 2 ? '1px solid #1e293b' : 'none' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: isDone ? STATUS_COLORS[s] + '22' : '#1e293b', border: `2px solid ${isDone ? STATUS_COLORS[s] : '#334155'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isDone && <CheckCircle size={14} color={STATUS_COLORS[s]} />}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: isDone ? 600 : 400, color: isDone ? STATUS_COLORS[s] : '#475569' }}>{s}</span>
                    {complaint.status === s && <span style={{ fontSize: 11, color: STATUS_COLORS[s], marginLeft: 'auto' }}>● Current</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
