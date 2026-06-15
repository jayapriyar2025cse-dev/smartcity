import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Building2, LayoutDashboard, PlusCircle, ClipboardList,
  BarChart3, LogOut, User, Shield, Bell, UserCircle, Menu, X
} from 'lucide-react';

const CitizenNav = () => (
  <>
    <NavLink to="/dashboard"     className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><LayoutDashboard size={18} /> Dashboard</NavLink>
    <NavLink to="/submit"        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><PlusCircle size={18} />      Submit Complaint</NavLink>
    <NavLink to="/history"       className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><ClipboardList size={18} />   My Complaints</NavLink>
    <NavLink to="/notifications" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Bell size={18} />            Notifications</NavLink>
    <NavLink to="/profile"       className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><UserCircle size={18} />      Profile</NavLink>
  </>
);

const AdminNav = () => (
  <>
    <NavLink to="/admin"         className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><BarChart3 size={18} />    Admin Dashboard</NavLink>
    <NavLink to="/notifications" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Bell size={18} />         Notifications</NavLink>
    <NavLink to="/profile"       className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><UserCircle size={18} />   Profile</NavLink>
  </>
);

export default function Sidebar() {
  const { user, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <>
      {/* Overlay */}
      <div className={`sidebar-overlay ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />

      {/* Hamburger button (mobile) */}
      <button className="hamburger" onClick={() => setOpen(!open)} style={{ position: 'fixed', top: 16, left: 16, zIndex: 300 }}>
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, background: 'rgba(59,130,246,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={20} color="#3b82f6" />
          </div>
          <div>
            <h2>Smart City Hub</h2>
            <p>AI Decision Platform</p>
          </div>
        </div>
      </div>

      <div className="sidebar-nav">
        <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '0 12px', marginBottom: 8 }}>
          Navigation
        </div>
        {userRole === 'admin' ? <AdminNav /> : <CitizenNav />}
      </div>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '10px 0', borderTop: '1px solid #334155' }}>
          {user?.photoURL ? (
            <img src={user.photoURL} alt="avatar" style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid #334155' }} />
          ) : (
            <div style={{ width: 36, height: 36, background: userRole === 'admin' ? 'rgba(168,85,247,0.2)' : 'rgba(59,130,246,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {userRole === 'admin' ? <Shield size={16} color="#a855f7" /> : <User size={16} color="#3b82f6" />}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.displayName || 'User'}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', textTransform: 'capitalize' }}>{userRole}</div>
          </div>
        </div>
        <button className="btn btn-outline btn-sm btn-full" onClick={handleLogout}>
          <LogOut size={14} /> Sign Out
        </button>
      </div>
      </div>

      {/* Mobile bottom bar with logout */}
      <div className="mobile-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {userRole === 'admin' ? <Shield size={14} color="#a855f7" /> : <User size={14} color="#3b82f6" />}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{user?.displayName || 'User'}</span>
        </div>
        <button className="btn btn-outline btn-sm" onClick={handleLogout}>
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </>
  );
}
