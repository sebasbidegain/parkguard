import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, Award } from 'lucide-react';
import { getStats } from '../db/database';
import { getOffenseLabel, getStatusInfo } from '../utils/offenseTypes';

export default function Stats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    setStats(getStats());
  }, []);

  if (!stats) return null;

  const maxOffenseCount = stats.byOffense.length > 0
    ? Math.max(...stats.byOffense.map(o => o.count))
    : 0;

  return (
    <div className="stats-page">
      <h2 className="section-title">
        <BarChart3 size={20} style={{ verticalAlign: 'middle', marginRight: 6 }} />
        Statistics
      </h2>

      <div className="card" style={{ textAlign: 'center', padding: 24 }}>
        <div style={{ fontSize: 48, fontWeight: 700, color: 'var(--primary)' }}>{stats.total}</div>
        <div style={{ fontSize: 14, color: 'var(--gray-500)' }}>Total Tickets Issued</div>
      </div>

      {stats.byStatus.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
            <TrendingUp size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            By Status
          </h3>
          <div className="status-bars">
            {stats.byStatus.map(s => {
              const info = getStatusInfo(s.status);
              const pct = stats.total > 0 ? (s.count / stats.total) * 100 : 0;
              return (
                <div key={s.status} className="bar-item">
                  <div className="bar-label">
                    <span style={{ color: info.color, fontWeight: 600 }}>{info.label}</span>
                    <span style={{ color: 'var(--gray-500)' }}>{s.count}</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${pct}%`, background: info.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {stats.byOffense.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
            <Award size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Top Offenses
          </h3>
          <div className="status-bars">
            {stats.byOffense.map((o, i) => {
              const pct = maxOffenseCount > 0 ? (o.count / maxOffenseCount) * 100 : 0;
              return (
                <div key={o.type} className="bar-item">
                  <div className="bar-label">
                    <span style={{ fontWeight: 500 }}>{getOffenseLabel(o.type)}</span>
                    <span style={{ color: 'var(--gray-500)' }}>{o.count}</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${pct}%`, background: `hsl(${220 + i * 15}, 70%, 55%)` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {stats.repeatOffenders.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
            <AlertTriangle size={16} style={{ verticalAlign: 'middle', marginRight: 6, color: 'var(--warning)' }} />
            Repeat Offenders
          </h3>
          {stats.repeatOffenders.map((o, i) => (
            <div key={o.plate} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 0', borderBottom: i < stats.repeatOffenders.length - 1 ? '1px solid var(--gray-100)' : 'none'
            }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 15 }}>{o.plate}</span>
              <span className="status-badge" style={{ background: '#fef3c7', color: '#92400e' }}>
                {o.count} tickets
              </span>
            </div>
          ))}
        </div>
      )}

      {stats.total === 0 && (
        <div className="empty-state">
          <BarChart3 size={48} />
          <p>No data yet. Issue some tickets to see statistics!</p>
        </div>
      )}

      <style>{`
        .status-bars { display: flex; flex-direction: column; gap: 10px; }
        .bar-item { }
        .bar-label {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          margin-bottom: 4px;
        }
        .bar-track {
          height: 8px;
          background: var(--gray-100);
          border-radius: 4px;
          overflow: hidden;
        }
        .bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease;
          min-width: 4px;
        }
      `}</style>
    </div>
  );
}
