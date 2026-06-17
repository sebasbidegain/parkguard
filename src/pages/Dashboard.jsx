import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, AlertTriangle, CheckCircle, Clock, FileText } from 'lucide-react';
import { getTickets, getStats } from '../db/database';
import { getOffenseLabel, getStatusInfo } from '../utils/offenseTypes';
import { formatDate, generateTicketNumber, formatPlate } from '../utils/formatters';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    setStats(getStats());
    setRecent(getTickets({ limit: 5 }));
  }, []);

  return (
    <div className="dashboard">
      <div className="welcome-card card">
        <h2>Welcome to ParkGuard</h2>
        <p>Issue and manage parking violation tickets</p>
        <button className="btn btn-primary btn-full" onClick={() => navigate('/new')} style={{ marginTop: 12 }}>
          <PlusCircle size={18} />
          Issue New Ticket
        </button>
      </div>

      {stats && (
        <div className="stats-row">
          <div className="stat-card card">
            <FileText size={20} color="var(--primary)" />
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-card card">
            <AlertTriangle size={20} color="var(--warning)" />
            <span className="stat-number">{stats.byStatus.find(s => s.status === 'issued')?.count || 0}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat-card card">
            <CheckCircle size={20} color="var(--success)" />
            <span className="stat-number">{stats.byStatus.find(s => s.status === 'paid')?.count || 0}</span>
            <span className="stat-label">Paid</span>
          </div>
          <div className="stat-card card">
            <Clock size={20} color="var(--danger)" />
            <span className="stat-number">{stats.byStatus.find(s => s.status === 'overdue')?.count || 0}</span>
            <span className="stat-label">Overdue</span>
          </div>
        </div>
      )}

      {stats?.repeatOffenders?.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3 className="section-title">
            <AlertTriangle size={18} style={{ verticalAlign: 'middle', marginRight: 6, color: 'var(--warning)' }} />
            Repeat Offenders
          </h3>
          {stats.repeatOffenders.map(o => (
            <div key={o.plate} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              onClick={() => navigate(`/tickets?search=${o.plate}`)}>
              <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 16 }}>{o.plate}</span>
              <span className="status-badge" style={{ background: '#fef3c7', color: '#92400e' }}>{o.count} tickets</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 className="section-title" style={{ margin: 0 }}>Recent Tickets</h3>
          {recent.length > 0 && (
            <button className="btn btn-sm btn-outline" onClick={() => navigate('/tickets')}>View All</button>
          )}
        </div>

        {recent.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <p>No tickets yet. Issue your first one!</p>
          </div>
        ) : (
          recent.map(ticket => {
            const statusInfo = getStatusInfo(ticket.status);
            return (
              <div key={ticket.id} className="card ticket-card" onClick={() => navigate(`/ticket/${ticket.id}`)}>
                <div className="card-header">
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 15 }}>
                    {formatPlate(ticket.plate_number)}
                  </span>
                  <span className="status-badge" style={{ background: statusInfo.color + '20', color: statusInfo.color }}>
                    {statusInfo.label}
                  </span>
                </div>
                <div style={{ fontSize: 14, color: 'var(--gray-600)' }}>
                  {getOffenseLabel(ticket.offense_type)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>
                  {generateTicketNumber(ticket.id)} · {formatDate(ticket.created_at)}
                </div>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        .welcome-card {
          background: linear-gradient(135deg, var(--primary) 0%, #2563eb 100%);
          color: white;
          text-align: center;
        }
        .welcome-card h2 { color: white; font-size: 20px; margin-bottom: 4px; }
        .welcome-card p { opacity: 0.85; font-size: 14px; }
        .welcome-card .btn-primary {
          background: rgba(255,255,255,0.2);
          backdrop-filter: blur(4px);
        }
        .stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-top: 12px;
        }
        .stat-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px 8px;
        }
        .stat-number { font-size: 22px; font-weight: 700; color: var(--gray-800); }
        .stat-label { font-size: 11px; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.3px; }
        .ticket-card { cursor: pointer; transition: box-shadow 0.2s; }
        .ticket-card:hover { box-shadow: var(--shadow-md); }
      `}</style>
    </div>
  );
}
