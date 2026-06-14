import React, { useState } from 'react';
import { rankByPriority, getRecommendations, CATEGORY_PRIORITY } from '../utils/aiEngine';
import { CATEGORY_COLORS, STATUS_COLORS } from '../utils/dummyData';
import { Zap, ChevronDown, ChevronUp } from 'lucide-react';

const RANK_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

export default function PriorityList({ complaints }) {
  const [expanded, setExpanded] = useState(null);
  const ranked = rankByPriority(complaints.filter((c) => c.status !== 'Resolved')).slice(0, 10);

  return (
    <div className="card">
      <div className="section-title"><Zap size={16} color="#eab308" /> AI Priority Rankings</div>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
        Ranked by: Category severity × Age × Status
      </div>

      {ranked.map((c, i) => {
        const recs = getRecommendations(c);
        const isOpen = expanded === c.id;
        const rankColor = RANK_COLORS[Math.min(i, 4)];

        return (
          <div key={c.id} className="priority-item" style={{ cursor: 'pointer' }}
            onClick={() => setExpanded(isOpen ? null : c.id)}>
            <div className="priority-rank" style={{ background: rankColor + '22', color: rankColor }}>
              #{i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.title}
                </span>
                <span style={{ fontSize: 10, background: CATEGORY_COLORS[c.category] + '22', color: CATEGORY_COLORS[c.category], padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>
                  {c.category}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 12, color: '#64748b' }}>
                <span>{c.ward || 'Unknown Ward'}</span>
                <span style={{ color: STATUS_COLORS[c.status] }}>● {c.status}</span>
                <span style={{ color: '#eab308', fontWeight: 600 }}>Score: {c.priorityScore}</span>
              </div>

              {/* AI Recommendations (expanded) */}
              {isOpen && (
                <div style={{ marginTop: 10, padding: '10px', background: 'rgba(59,130,246,0.05)', borderRadius: 8, border: '1px solid rgba(59,130,246,0.15)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', marginBottom: 6 }}>
                    🤖 AI RECOMMENDATIONS
                  </div>
                  {recs.map((r, ri) => (
                    <div key={ri} className="rec-chip">→ {r}</div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ color: '#475569', flexShrink: 0 }}>
              {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>
        );
      })}

      {ranked.length === 0 && (
        <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b', fontSize: 14 }}>
          ✅ No pending issues to prioritize
        </div>
      )}
    </div>
  );
}
