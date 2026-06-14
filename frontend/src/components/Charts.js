import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import { CATEGORY_COLORS, STATUS_COLORS } from '../utils/dummyData';

const darkTooltip = {
  contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' },
  labelStyle: { color: '#94a3b8' }
};

// ── Category Bar Chart ────────────────────────────────────────
export const CategoryChart = ({ complaints }) => {
  const data = Object.entries(
    complaints.reduce((acc, c) => { acc[c.category] = (acc[c.category] || 0) + 1; return acc; }, {})
  ).map(([name, count]) => ({ name, count, fill: CATEGORY_COLORS[name] || '#6b7280' }))
   .sort((a, b) => b.count - a.count);

  return (
    <div className="card">
      <div className="section-title">📊 Complaints by Category</div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} angle={-30} textAnchor="end" height={50} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
          <Tooltip {...darkTooltip} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ── Status Pie Chart ──────────────────────────────────────────
export const StatusPieChart = ({ complaints }) => {
  const data = Object.entries(
    complaints.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value, color: STATUS_COLORS[name] || '#6b7280' }));

  return (
    <div className="card">
      <div className="section-title">🔵 Status Distribution</div>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
            dataKey="value" paddingAngle={3}>
            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <Tooltip {...darkTooltip} />
          <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// ── Trend Line Chart (last 7 days) ────────────────────────────
export const TrendChart = ({ complaints }) => {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const data = days.map((day) => {
    const label = day.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
    const count = complaints.filter((c) => {
      const cd = new Date(c.createdAt?.toDate?.() || c.createdAt);
      return cd.toDateString() === day.toDateString();
    }).length;
    return { label, count };
  });

  return (
    <div className="card">
      <div className="section-title">📈 7-Day Complaint Trend</div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 0, right: 16, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
          <Tooltip {...darkTooltip} />
          <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// ── Ward Bar Chart ────────────────────────────────────────────
export const WardChart = ({ complaints }) => {
  const data = Object.entries(
    complaints.reduce((acc, c) => { acc[c.ward || 'Unknown'] = (acc[c.ward || 'Unknown'] || 0) + 1; return acc; }, {})
  ).map(([ward, count]) => ({ ward, count })).sort((a, b) => b.count - a.count).slice(0, 8);

  return (
    <div className="card">
      <div className="section-title">🗺️ Complaints by Ward</div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
          <YAxis dataKey="ward" type="category" tick={{ fill: '#94a3b8', fontSize: 12 }} width={60} />
          <Tooltip {...darkTooltip} />
          <Bar dataKey="count" fill="#a855f7" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
