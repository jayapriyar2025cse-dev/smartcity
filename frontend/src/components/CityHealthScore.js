import React from 'react';
import { calculateCityHealthScore } from '../utils/aiEngine';

export default function CityHealthScore({ complaints, metrics }) {
  // Use live Firestore metrics if available, else compute locally
  const health = metrics
    ? {
        score: metrics.cityHealthScore || 0,
        grade: metrics.healthGrade || 'D',
        color: (metrics.cityHealthScore || 0) >= 80 ? '#22c55e' : (metrics.cityHealthScore || 0) >= 60 ? '#eab308' : (metrics.cityHealthScore || 0) >= 40 ? '#f97316' : '#ef4444',
        breakdown: {
          complaints: Math.max(0, 100 - Math.min((metrics.complaintsCount || 0) * 0.5, 30) - Math.min((metrics.pendingCount || 0) * 0.8, 20)),
          pollution: Math.round(100 - ((metrics.pollution || 50) / 100) * 100),
          traffic: Math.round(100 - ((metrics.traffic || 50) / 100) * 100),
          pollutionRaw: metrics.pollution || 50,
          trafficRaw: metrics.traffic || 50,
        }
      }
    : calculateCityHealthScore(complaints);

  const { score, grade, color, breakdown } = health;

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div className="section-title" style={{ justifyContent: 'center' }}>
        🏙️ City Health Score
        {metrics && <span style={{ fontSize: 11, color: '#22c55e', marginLeft: 8, fontWeight: 400 }}>● Live</span>}
      </div>

      <div className="health-ring" style={{ margin: '16px auto' }}>
        <svg width="180" height="180" viewBox="0 0 180 180">
          <circle cx="90" cy="90" r={radius} fill="none" stroke="#1e293b" strokeWidth="12" />
          <circle cx="90" cy="90" r={radius} fill="none"
            stroke={color} strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 90 90)"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="health-score-text">
          <div className="score" style={{ color }}>{score}</div>
          <div className="grade" style={{ color, fontWeight: 700, fontSize: 18 }}>{grade}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 16 }}>
        <ScoreBreakdown label="Complaints" value={breakdown.complaints} />
        <ScoreBreakdown label="Pollution" value={breakdown.pollution} extra={`AQI: ${breakdown.pollutionRaw}`} />
        <ScoreBreakdown label="Traffic" value={breakdown.traffic} extra={`${breakdown.trafficRaw}% density`} />
      </div>

      <div style={{ marginTop: 16, padding: '10px 16px', background: 'rgba(59,130,246,0.08)', borderRadius: 8, fontSize: 13, color: '#94a3b8' }}>
        {score >= 80 ? '✅ City is in excellent health' :
         score >= 60 ? '⚠️ City needs moderate attention' :
         score >= 40 ? '🔶 City requires urgent action' :
         '🚨 Critical — immediate intervention needed'}
      </div>

      {/* Tamil Nadu city breakdown */}
      {metrics?.sensorData && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, color: '#475569', marginBottom: 8 }}>Tamil Nadu City Sensors</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {Object.entries(metrics.sensorData).map(([city, data]) => (
              <div key={city} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 8px', background: '#0f172a', borderRadius: 6 }}>
                <span style={{ color: '#94a3b8' }}>{city}</span>
                <span style={{ color: '#64748b' }}>AQI: {data.pollution} | Traffic: {data.traffic}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const ScoreBreakdown = ({ label, value, extra }) => (
  <div style={{ background: '#0f172a', borderRadius: 8, padding: '10px 8px' }}>
    <div style={{ fontSize: 20, fontWeight: 700, color: value >= 70 ? '#22c55e' : value >= 50 ? '#eab308' : '#ef4444' }}>
      {value}
    </div>
    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{label}</div>
    {extra && <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{extra}</div>}
  </div>
);
