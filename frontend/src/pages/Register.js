import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Building2, User, Mail, Lock, UserPlus } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'citizen' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form.email, form.password, form.name, form.role);
      toast.success('Account created successfully!');
    } catch (err) {
      toast.error(err.message.includes('email-already-in-use') ? 'Email already registered' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="card">
          <div className="auth-header">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 56, height: 56, background: 'rgba(34,197,94,0.15)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={28} color="#22c55e" />
              </div>
            </div>
            <h1>Create Account</h1>
            <p>Join the Smart City platform</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input className="form-input" style={{ paddingLeft: 36 }} placeholder="John Doe" value={form.name} onChange={set('name')} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input className="form-input" style={{ paddingLeft: 36 }} type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input className="form-input" style={{ paddingLeft: 36 }} type="password" placeholder="Min. 6 characters" value={form.password} onChange={set('password')} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Account Type</label>
              <select className="form-select" value={form.role} onChange={set('role')}>
                <option value="citizen">Citizen</option>
                <option value="admin">City Official (Admin)</option>
              </select>
            </div>
            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
              <UserPlus size={16} /> {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' }}>
            Already have an account? <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
