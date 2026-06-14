import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserComplaints } from '../utils/firestoreService';
import { DUMMY_COMPLAINTS, CATEGORIES, STATUS_COLORS, CATEGORY_COLORS } from '../utils/dummyData';
import Sidebar from '../components/Sidebar';
import { format } from 'date-fns';
import { Search, Filter, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ComplaintHistory() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const unsub = getUserComplaints(user.uid, (data) => {
        setComplaints(data);
        setFiltered(data);
        setLoading(false);
      });
      return unsub;
    } catch {
      setComplaints([]);
      setFiltered([]);
      setLoading(false);
    }
  }, [user.uid]);

  useEffect(() => {
    let result = complaints;
    if (search) result = result.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter) result = result.filter((c) => c.status === statusFilter);
    if (categoryFilter) result = result.filter((c) => c.category === categoryFilter);
    setFiltered(result);
  }, [search, statusFilter, categoryFilter, complaints]);

  const formatDate = (ts) => {
    try { return format(new Date(ts?.toDate?.() || ts), 'MMM d, yyyy HH:mm'); } catch { return 'N/A'; }
  };

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header">
          <h1>My Complaint History</h1>
          <p>{filtered.length} complaint{filtered.length !== 1 ? 's' : ''} found</p>
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input className="form-input" style={{ paddingLeft: 32 }} placeholder="Search complaints..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option>Pending</option>
            <option>In Progress</option>
            <option>Resolved</option>
          </select>
          <select className="filter-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((c) => (
              <div key={c.id} className="card card-sm" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {c.imageUrl && (
                  <img src={c.imageUrl} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{c.title}</div>
                    <Link to={`/complaint/${c.id}`} style={{ color:'#3b82f6', display:'flex', alignItems:'center' }}><Eye size={14}/></Link>
                  </div>
                    <span className={`badge badge-${c.status === 'Pending' ? 'pending' : c.status === 'In Progress' ? 'progress' : 'resolved'}`}>
                      {c.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.description}
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                    <span style={{ background: (CATEGORY_COLORS[c.category] || '#6b7280') + '22', color: CATEGORY_COLORS[c.category] || '#6b7280', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
                      {c.category}
                    </span>
                    {c.ward && <span style={{ fontSize: 12, color: '#64748b' }}>📍 {c.ward}</span>}
                    <span style={{ fontSize: 12, color: '#475569' }}>🕐 {formatDate(c.createdAt)}</span>
                    {c.location && <span style={{ fontSize: 12, color: '#475569' }}>🗺️ {c.location.lat?.toFixed(3)}, {c.location.lng?.toFixed(3)}</span>}
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
                <Filter size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <div>No complaints match your filters</div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
