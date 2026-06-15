import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserComplaints, deleteComplaint } from '../utils/firestoreService';
import { CATEGORIES, CATEGORY_COLORS } from '../utils/dummyData';
import Sidebar from '../components/Sidebar';
import { format } from 'date-fns';
import { Search, Filter, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function ComplaintHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

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

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this complaint? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await deleteComplaint(id);
      setComplaints((prev) => prev.filter((c) => c.id !== id));
      toast.success('Complaint deleted');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (ts) => {
    try { return format(new Date(ts?.toDate?.() || ts), 'MMM d, yyyy'); } catch { return 'N/A'; }
  };

  const statusColor = (s) => s === 'Pending' ? 'pending' : s === 'In Progress' ? 'progress' : 'resolved';

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header">
          <h1>My Complaint History</h1>
          <p>{filtered.length} complaint{filtered.length !== 1 ? 's' : ''} found</p>
        </div>

        <div className="filters-bar">
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input className="form-input" style={{ paddingLeft: 32 }} placeholder="Search..."
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
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
            <Filter size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <div>No complaints found</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((c) => (
              <div key={c.id} className="card card-sm">
                {/* Top row: status badge + delete button */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span className={`badge badge-${statusColor(c.status)}`}>{c.status}</span>
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId === c.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px', borderRadius: 8,
                      border: '1px solid #ef4444',
                      background: 'rgba(239,68,68,0.15)',
                      color: '#ef4444', fontSize: 14, fontWeight: 700,
                      cursor: 'pointer', minHeight: 40, minWidth: 90,
                      WebkitTapHighlightColor: 'transparent',
                      touchAction: 'manipulation',
                    }}
                  >
                    <Trash2 size={16} />
                    {deletingId === c.id ? '...' : 'Delete'}
                  </button>
                </div>

                {/* Content row: image + details */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  {c.imageUrl && (
                    <img src={c.imageUrl} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{ fontWeight: 600, fontSize: 15, cursor: 'pointer', marginBottom: 4 }}
                      onClick={() => navigate(`/complaint/${c.id}`)}
                    >
                      {c.title}
                    </div>
                    <div style={{ fontSize: 13, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.description}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      <span style={{ background: (CATEGORY_COLORS[c.category] || '#6b7280') + '22', color: CATEGORY_COLORS[c.category] || '#6b7280', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
                        {c.category}
                      </span>
                      {c.ward && <span style={{ fontSize: 12, color: '#64748b' }}>📍 {c.ward}</span>}
                      <span style={{ fontSize: 12, color: '#475569' }}>🕐 {formatDate(c.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
