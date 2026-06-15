import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing          from './pages/Landing';
import Login            from './pages/Login';
import Register         from './pages/Register';
import CitizenDashboard from './pages/CitizenDashboard';
import AdminDashboard   from './pages/AdminDashboard';
import SubmitComplaint  from './pages/SubmitComplaint';
import ComplaintHistory from './pages/ComplaintHistory';
import ComplaintDetail  from './pages/ComplaintDetail';
import Profile          from './pages/ProfileNew';
import Notifications    from './pages/Notifications';
import './App.css';

const ProtectedRoute = ({ children, role }) => {
  const { user, userRole } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (role && userRole !== role) return <Navigate to={userRole === 'admin' ? '/admin' : '/dashboard'} />;
  return children;
};

const AppRoutes = () => {
  const { user, userRole } = useAuth();
  return (
    <Routes>
      {/* Public */}
      <Route path="/"         element={<Landing />} />
      <Route path="/home"      element={<Landing />} />
      <Route path="/login"    element={!user ? <Login />    : <Navigate to={userRole === 'admin' ? '/admin' : '/dashboard'} />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />

      {/* Citizen */}
      <Route path="/dashboard" element={<ProtectedRoute role="citizen"><CitizenDashboard /></ProtectedRoute>} />
      <Route path="/submit"    element={<ProtectedRoute role="citizen"><SubmitComplaint /></ProtectedRoute>} />
      <Route path="/history"   element={<ProtectedRoute role="citizen"><ComplaintHistory /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />

      {/* Shared (both roles) */}
      <Route path="/complaint/:id"  element={<ProtectedRoute><ComplaintDetail /></ProtectedRoute>} />
      <Route path="/notifications"  element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/profile"        element={<ProtectedRoute><Profile /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to={user ? (userRole === 'admin' ? '/admin' : '/dashboard') : '/'} />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' } }} />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
