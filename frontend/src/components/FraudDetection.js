import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ShieldAlert, ShieldCheck, AlertTriangle, Users, TrendingUp, Eye } from 'lucide-react';
import { analyzeFraud } from '../utils/fraudEngine';

// ── Colour helpers ────────────────────────────────────────────
const RISK_COLOR  = { HIGH: '#ef4444', MEDIUM: '#f97316', LOW: '#22c55e' };
const RISK_BG     = { HIGH: 'rgba(239,68,68,0.12)', MEDIUM: 'rgba(249,115,22,0.12)', LOW: 'rgba(34,197,94,0.12)' };
const ALERT_COLOR = { critical: '#ef4444', high: '#f97316', medium: '#eab308' };
const PIE_COLORS  = ['#22c55e', '#ef4444'];

// ── Sub-components ────────────────────────────────────────────

const GlowCard = ({ children, color = '#3b82f6', style = {} }) => (
  <div style={{
    background: '#1e293b', border: `1px solid ${color}44`,
    borderRadius: 12, padding: 20,
    boxShadow: `0 0 18px ${color}22, 0 4px 24px rgba(0,0,0,0.4)`,
    ...style,
  }}>
    {children}
  </div>
);

const AiChip = ({ label, color = '#3b82f6' }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
    background: `${color}22`, color, border: `1px solid ${color}55`,
    letterSpacing: 0.4,
  }}>
    <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
    {label}
  </span>
);

const ConfidenceBar = ({ score }) => {
  const color = score >= 70 ? '#ef4444' : score >= 45 ? '#f97316' : '#22c55e';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: '#0f172a', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.6s ease', boxShadow: `0 0 6px ${color}` }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 32 }}>{score}%</span>
    </div>
  );
};

const VerificationBadge = ({ status }) => {
  const ok = status === 'Verified';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
      color: ok ? '#22c55e' : '#ef4444',
      border: `1px solid ${ok ? '#22c55e' : '#ef4444'}55`,
      boxShadow: `0 0 8px ${ok ? '#22c55e' : '#ef4444'}33`,
    }}>
      {ok ? <ShieldCheck size={11} /> : <ShieldAlert size={11} />}
      {ok ? '✔ Verified' : '⚠ Suspicious'}
    </span>
  );
};

const TrustMeter = ({ score }) => {
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#eab308' : '#ef4444';
  const label = score >= 70 ? 'Trusted' : score >= 40 ? 'Moderate' : 'High Risk';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
        <span style={{ color: '#64748b' }}>Trust Score</span>
        <span style={{ color, fontWeight: 700 }}>{score} — {label}</span>
      </div>
      <div style={{ height: 5, background: '#0f172a', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 3, boxShadow: `0 0 6px ${color}` }} />
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────
export default function FraudDetection({ complaints }) {
  const { scored, fake, real, highRiskUsers, fraudAlerts, categoryBreakdown, stats } =
    useMemo(() => analyzeFraud(complaints), [complaints]);

  const pieData = [
    { name: 'Verified', value: stats.realCount },
    { name: 'Suspicious', value: stats.fakeCount },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── AI Status Banner ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
        background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(59,130,246,0.1))',
        border: '1px solid rgba(168,85,247,0.3)', borderRadius: 12,
        boxShadow: '0 0 24px rgba(168,85,247,0.15)',
      }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#a855f7', boxShadow: '0 0 10px #a855f7' }} className="pulse" />
        <span style={{ fontWeight: 700, fontSize: 14, color: '#a855f7' }}>AI FRAUD DETECTION ENGINE</span>
        <AiChip label="ACTIVE" color="#a855f7" />
        <AiChip label={`${complaints.length} COMPLAINTS SCANNED`} color="#3b82f6" />
        <AiChip label={`${stats.fakeRate}% FRAUD RATE`} color={stats.fakeRate > 20 ? '#ef4444' : '#22c55e'} />
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid-4">
        <GlowCard color="#22c55e">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#22c55e' }}>{stats.realCount}</div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Verified Complaints</div>
            </div>
            <ShieldCheck size={22} color="#22c55e" style={{ opacity: 0.6 }} />
          </div>
        </GlowCard>
        <GlowCard color="#ef4444">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#ef4444' }}>{stats.fakeCount}</div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Suspicious Complaints</div>
            </div>
            <ShieldAlert size={22} color="#ef4444" style={{ opacity: 0.6 }} />
          </div>
        </GlowCard>
        <GlowCard color="#f97316">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#f97316' }}>{stats.fakeRate}%</div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Fraud Rate</div>
            </div>
            <TrendingUp size={22} color="#f97316" style={{ opacity: 0.6 }} />
          </div>
        </GlowCard>
        <GlowCard color="#a855f7">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#a855f7' }}>{highRiskUsers.length}</div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>High-Risk Users</div>
            </div>
            <Users size={22} color="#a855f7" style={{ opacity: 0.6 }} />
          </div>
        </GlowCard>
      </div>

      {/* ── Fraud Alerts ── */}
      {fraudAlerts.length > 0 && (
        <GlowCard color="#ef4444">
          <div className="section-title" style={{ color: '#ef4444' }}>
            <AlertTriangle size={16} /> Fraud Alerts
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {fraudAlerts.map((a, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '10px 14px', borderRadius: 8,
                background: `${ALERT_COLOR[a.severity]}15`,
                border: `1px solid ${ALERT_COLOR[a.severity]}44`,
                borderLeft: `4px solid ${ALERT_COLOR[a.severity]}`,
              }}>
                <AlertTriangle size={14} color={ALERT_COLOR[a.severity]} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: ALERT_COLOR[a.severity], marginBottom: 2 }}>
                    {a.severity.toUpperCase()} · {a.type.replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontSize: 13, color: '#cbd5e1' }}>{a.message}</div>
                </div>
              </div>
            ))}
          </div>
        </GlowCard>
      )}

      {/* ── Charts row ── */}
      <div className="grid-2">
        {/* Fake vs Real by category */}
        <GlowCard color="#3b82f6">
          <div className="section-title"><Eye size={15} /> Fake vs Real by Category</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryBreakdown} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="category" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="real" name="Verified" fill="#22c55e" radius={[3, 3, 0, 0]} />
              <Bar dataKey="fake" name="Suspicious" fill="#ef4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlowCard>

        {/* Pie chart */}
        <GlowCard color="#a855f7">
          <div className="section-title"><ShieldAlert size={15} /> Complaint Authenticity</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]}
                    style={{ filter: `drop-shadow(0 0 6px ${PIE_COLORS[i]})` }} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </GlowCard>
      </div>

      {/* ── Suspicious Complaints List ── */}
      <GlowCard color="#ef4444">
        <div className="section-title" style={{ color: '#ef4444' }}>
          <ShieldAlert size={15} /> Suspicious Complaints ({fake.length})
        </div>
        {fake.length === 0 ? (
          <div style={{ color: '#64748b', fontSize: 14, padding: '12px 0' }}>✅ No suspicious complaints detected</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Complaint</th>
                  <th>Category</th>
                  <th>User</th>
                  <th>Risk Level</th>
                  <th>Fraud Score</th>
                  <th>Signals</th>
                  <th>Image</th>
                </tr>
              </thead>
              <tbody>
                {fake.slice(0, 15).map((c) => (
                  <tr key={c.id}>
                    <td style={{ color: '#f1f5f9', fontWeight: 500, maxWidth: 180 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                    </td>
                    <td style={{ fontSize: 12 }}>{c.category}</td>
                    <td style={{ fontSize: 11, color: '#64748b', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.userId}
                    </td>
                    <td>
                      <span style={{
                        padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                        background: RISK_BG[c.riskLevel], color: RISK_COLOR[c.riskLevel],
                        boxShadow: `0 0 6px ${RISK_COLOR[c.riskLevel]}44`,
                      }}>
                        {c.riskLevel}
                      </span>
                    </td>
                    <td style={{ minWidth: 120 }}><ConfidenceBar score={c.fraudScore} /></td>
                    <td style={{ maxWidth: 200 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {c.fraudSignals.map((s, i) => (
                          <span key={i} style={{ fontSize: 10, padding: '1px 6px', background: 'rgba(239,68,68,0.1)', color: '#f87171', borderRadius: 3 }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      {c.imageVerification
                        ? <VerificationBadge status={c.imageVerification.status} />
                        : <span style={{ fontSize: 11, color: '#475569' }}>No image</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlowCard>

      {/* ── High-Risk Users ── */}
      <GlowCard color="#a855f7">
        <div className="section-title" style={{ color: '#a855f7' }}>
          <Users size={15} /> High-Risk Users
        </div>
        {highRiskUsers.length === 0 ? (
          <div style={{ color: '#64748b', fontSize: 14, padding: '12px 0' }}>✅ No high-risk users detected</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {highRiskUsers.map((u, i) => (
              <div key={i} style={{
                padding: '14px 16px', background: '#0f172a', borderRadius: 10,
                border: `1px solid ${u.fakeRate > 50 ? '#ef444433' : '#33415533'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontWeight: 800, fontSize: 13,
                      background: u.fakeRate > 50 ? 'rgba(239,68,68,0.2)' : 'rgba(249,115,22,0.2)',
                      color: u.fakeRate > 50 ? '#ef4444' : '#f97316',
                      boxShadow: `0 0 8px ${u.fakeRate > 50 ? '#ef444444' : '#f9731644'}`,
                    }}>
                      {i + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{u.userId}</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
                        {u.total} complaints · {u.fake} flagged · {u.fakeRate}% fraud rate
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <AiChip label={`Avg Score: ${u.avgScore}%`} color={u.avgScore > 50 ? '#ef4444' : '#f97316'} />
                    {u.fake >= 3 && <AiChip label="REPEAT OFFENDER" color="#ef4444" />}
                  </div>
                </div>
                <TrustMeter score={u.trustScore} />
              </div>
            ))}
          </div>
        )}
      </GlowCard>

    </div>
  );
}
