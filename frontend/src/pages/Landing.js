import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Building2, MapPin, Zap, ArrowRight, Mail, Lock, LogIn, X } from 'lucide-react';

const features = [
  { icon: '🤖', title: 'AI Decision Engine',  desc: 'Automatically detects hotspots, ranks complaints by priority and suggests actions' },
  { icon: '🗺️', title: 'Live Heatmap',        desc: 'Real-time map showing complaint density across Tamil Nadu cities' },
  { icon: '📊', title: 'Smart Analytics',      desc: 'Charts and trends showing city health over time' },
  { icon: '🚨', title: 'Instant Alerts',       desc: 'Automatic alerts when complaint surges or hotspots are detected' },
  { icon: '🏙️', title: 'City Health Score',    desc: 'Live score out of 100 based on complaints, pollution and traffic' },
  { icon: '🎙️', title: 'Voice Input',          desc: 'Submit complaints using your voice — no typing needed' },
];

const stats  = [
  { value: '18+',  label: 'Active Complaints' },
  { value: '5',    label: 'Tamil Nadu Cities'  },
  { value: '100%', label: 'Free to Use'        },
  { value: 'AI',   label: 'Powered Engine'     },
];

const cities = ['Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem'];

// Google SVG icon
const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// Inline Sign-In Modal
const SignInModal = ({ onClose }) => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(form.email, form.password);
      toast.success('Welcome back!');
      const role = u?.role || (u?.user ? 'citizen' : 'citizen');
      navigate(role === 'admin' ? '/admin' : '/dashboard');
    } catch {
      toast.error('Invalid email or password');
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const result = await loginWithGoogle();
      toast.success('Signed in with Google!');
      // Check role from Firestore
      const role = result?.role || 'citizen';
      navigate(role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error('Google sign-in failed. Please try again.');
    } finally { setLoading(false); }
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: 32, width: '100%', maxWidth: 400, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', position: 'relative' }}>

        {/* Close */}
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, background: 'rgba(59,130,246,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Building2 size={24} color="#3b82f6" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Sign In</h2>
          <p style={{ fontSize: 13, color: '#64748b' }}>Access your Smart City Hub account</p>
        </div>

        {/* Google */}
        <button onClick={handleGoogle} disabled={loading}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '10px 16px', background: 'transparent', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 16, transition: 'background 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#263548'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
          <GoogleIcon /> Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: '#334155' }} />
          <span style={{ fontSize: 12, color: '#475569' }}>or</span>
          <div style={{ flex: 1, height: 1, background: '#334155' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
              <input style={{ width: '100%', padding: '9px 12px 9px 32px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', fontSize: 14, boxSizing: 'border-box' }}
                type="email" placeholder="you@example.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
              <input style={{ width: '100%', padding: '9px 12px 9px 32px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', fontSize: 14, boxSizing: 'border-box' }}
                type="password" placeholder="••••••••" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
          </div>
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '11px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <LogIn size={15} /> {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Demo buttons */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, color: '#475569', textAlign: 'center', marginBottom: 8 }}>Quick demo access</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => demoLogin('citizen')} disabled={loading}
              style={{ flex: 1, padding: '8px', background: 'transparent', border: '1px solid #334155', borderRadius: 8, color: '#94a3b8', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              👤 Demo Citizen
            </button>
            <button onClick={() => demoLogin('admin')} disabled={loading}
              style={{ flex: 1, padding: '8px', background: 'transparent', border: '1px solid #334155', borderRadius: 8, color: '#94a3b8', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              🛡️ Demo Admin
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#64748b' }}>
          No account?{' '}
          <Link to="/register" onClick={onClose} style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>Create one free</Link>
        </p>
      </div>
    </div>
  );
};

export default function Landing() {
  const { user, userRole } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);
  const dashLink = user ? (userRole === 'admin' ? '/admin' : '/dashboard') : null;

  return (
    <div style={{ background: '#0f172a', color: '#f1f5f9', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>

      {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}

      {/* Navbar */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 48px', borderBottom: '1px solid #1e293b', position: 'sticky', top: 0, background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(10px)', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: 'rgba(59,130,246,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={20} color="#3b82f6" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#f1f5f9' }}>Smart City Hub</div>
            <div style={{ fontSize: 10, color: '#64748b' }}>Tamil Nadu</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {user ? (
            <Link to={dashLink} style={{ padding: '8px 20px', borderRadius: 8, background: '#3b82f6', color: 'white', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
              Go to Dashboard →
            </Link>
          ) : (
            <>
              <button onClick={() => setShowSignIn(true)}
                style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #334155', color: '#94a3b8', background: 'transparent', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Sign In
              </button>
              <Link to="/register" style={{ padding: '8px 20px', borderRadius: 8, background: '#3b82f6', color: 'white', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '80px 48px 60px', background: 'radial-gradient(ellipse at top, #1e3a5f 0%, #0f172a 60%)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 20, fontSize: 13, color: '#3b82f6', marginBottom: 24 }}>
          <Zap size={14} /> AI-Powered Smart City Platform
        </div>
        <h1 style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.1, marginBottom: 20, background: 'linear-gradient(135deg, #f1f5f9, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Smart City Decision Hub<br />for Tamil Nadu
        </h1>
        <p style={{ fontSize: 18, color: '#94a3b8', maxWidth: 560, margin: '0 auto 36px', lineHeight: 1.7 }}>
          Report city issues, track complaints in real-time, and let AI suggest the best actions for government officials.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', background: '#3b82f6', color: 'white', borderRadius: 10, textDecoration: 'none', fontSize: 15, fontWeight: 700 }}>
            Get Started Free <ArrowRight size={16} />
          </Link>
          <button onClick={() => setShowSignIn(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', background: 'rgba(255,255,255,0.05)', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            <LogIn size={16} /> Sign In
          </button>
        </div>

        {/* Cities */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
          {cities.map((city) => (
            <span key={city} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid #1e293b', borderRadius: 20, fontSize: 12, color: '#64748b' }}>
              <MapPin size={10} /> {city}
            </span>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: '#1e293b', borderTop: '1px solid #1e293b', borderBottom: '1px solid #1e293b' }}>
        {stats.map((s) => (
          <div key={s.label} style={{ textAlign: 'center', padding: '32px 16px', background: '#0f172a' }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#3b82f6' }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section style={{ padding: '80px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>Everything you need</h2>
          <p style={{ color: '#64748b', fontSize: 16 }}>Built for citizens and city officials</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, maxWidth: 1000, margin: '0 auto' }}>
          {features.map((f) => (
            <div key={f.title} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 24, transition: 'border-color 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#334155'}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '60px 48px', background: '#1e293b' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>How it works</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, maxWidth: 900, margin: '0 auto' }}>
          {[
            { step: '01', title: 'Submit Complaint', desc: 'Citizens report issues with photo, location and voice description', icon: '📝' },
            { step: '02', title: 'AI Processes',     desc: 'AI engine detects hotspots, assigns priority and generates recommendations', icon: '🤖' },
            { step: '03', title: 'Officials Act',    desc: 'Admin dashboard shows ranked issues with suggested actions to take', icon: '✅' },
          ].map((item) => (
            <div key={item.step} style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, background: 'rgba(59,130,246,0.15)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 16px' }}>
                {item.icon}
              </div>
              <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>STEP {item.step}</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{item.title}</div>
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: 'center', padding: '80px 48px', background: 'radial-gradient(ellipse at center, #1e3a5f 0%, #0f172a 70%)' }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>Ready to make your city smarter?</h2>
        <p style={{ color: '#64748b', marginBottom: 32, fontSize: 16 }}>Join thousands of citizens improving Tamil Nadu</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', background: '#3b82f6', color: 'white', borderRadius: 12, textDecoration: 'none', fontSize: 15, fontWeight: 700 }}>
            Get Started Free <ArrowRight size={16} />
          </Link>
          <button onClick={() => setShowSignIn(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', background: 'transparent', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            <LogIn size={16} /> Sign In
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '24px', borderTop: '1px solid #1e293b', color: '#475569', fontSize: 13 }}>
        © 2024 Smart City Hub — AI-Powered Decision Platform for Tamil Nadu
      </footer>
    </div>
  );
}
