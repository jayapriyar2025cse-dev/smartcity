import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Building2, Mail, Lock, LogIn } from 'lucide-react';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]         = useState({ email: '', password: '' });
  const [loading, setLoading]   = useState(false);
  const [gLoading, setGLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(form.email, form.password);
      toast.success('Welcome back!');
      const role = u?.role || 'citizen';
      navigate(role === 'admin' ? '/admin' : '/dashboard');
    } catch {
      toast.error('Invalid email or password');
    } finally { setLoading(false); }
  };

  // Real Firebase Google Sign-In — opens actual Google account picker
  const handleGoogle = async () => {
    setGLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Signed in with Google!');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Google sign-in failed. Please try again.');
    } finally { setGLoading(false); }
  };

  const demoLogin = async (role) => {
    const creds = role === 'admin'
      ? { email: 'admin@smartcity.gov', password: 'admin123' }
      : { email: 'citizen@demo.com',    password: 'citizen123' };
    setLoading(true);
    try {
      await login(creds.email, creds.password);
      toast.success('Welcome!');
      navigate(role === 'admin' ? '/admin' : '/dashboard');
    } catch { toast.error('Demo login failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="card">
          <div className="auth-header">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 56, height: 56, background: 'rgba(59,130,246,0.15)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={28} color="#3b82f6" />
              </div>
            </div>
            <h1>Smart City Hub</h1>
            <p>AI-Powered Decision Platform — Tamil Nadu</p>
          </div>

          {/* Real Google Sign-In */}
          <button onClick={handleGoogle} disabled={gLoading}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '11px 16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, color: '#1e293b', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 16, transition: 'box-shadow 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}>
            <GoogleIcon /> {gLoading ? 'Signing in...' : 'Continue with Google'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: '#334155' }} />
            <span style={{ fontSize: 12, color: '#475569' }}>or sign in with email</span>
            <div style={{ flex: 1, height: 1, background: '#334155' }} />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input className="form-input" style={{ paddingLeft: 36 }} type="email" placeholder="you@example.com"
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input className="form-input" style={{ paddingLeft: 36 }} type="password" placeholder="••••••••"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              </div>
            </div>
            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
              <LogIn size={16} /> {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="divider" />

          <div style={{ marginBottom: 8, fontSize: 12, color: '#475569', textAlign: 'center' }}>Quick demo access</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => demoLogin('citizen')}>
              👤 Demo Citizen
            </button>
            <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => demoLogin('admin')}>
              🛡️ Demo Admin
            </button>
          </div>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' }}>
            New user?{' '}
            <Link to="/register" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
