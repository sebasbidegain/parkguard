import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, FileText } from 'lucide-react';
import { getTickets } from '../db/database';
import { getOffenseLabel, getStatusInfo, getActiveOffenseTypes, STATUSES } from '../utils/offenseTypes';
import { formatDate, generateTicketNumber, formatPlate } from '../utils/formatters';

export default function TicketList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [filterOffense, setFilterOffense] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const results = getTickets({
      search: search || undefined,
      offenseType: filterOffense || undefined,
      status: filterStatus || undefined,
      limit: 100,
    });
    setTickets(results);
  }, [search, filterOffense, filterStatus]);

  return (
    <div className="ticket-list">
      <h2 className="section-title">All Tickets</h2>

      <div className="search-bar card" style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 12px' }}>
        <Search size={18} color="var(--gray-400)" />
        <input
          type="text"
          placeholder="Search plates, addresses..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ border: 'none', outline: 'none', flex: 1, fontSize: 15, padding: '6px 0' }}
        />
        <button className="btn btn-sm btn-outline" onClick={() => setShowFilters(!showFilters)}
          style={{ padding: '6px 10px' }}>
          <Filter size={16} />
        </button>
      </div>

      {showFilters && (
        <div className="card" style={{ marginTop: 8 }}>
          <div className="form-group" style={{ marginBottom: 8 }}>
            <label style={{ marginBottom: 4 }}>Offense Type</label>
            <select value={filterOffense} onChange={e => setFilterOffense(e.target.value)}>
              <option value="">All offenses</option>
              {getActiveOffenseTypes().map(o => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ marginBottom: 4 }}>Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div style={{ marginTop: 12, fontSize: 13, color: 'var(--gray-500)' }}>
        {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} found
      </div>

      {tickets.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} />
          <p>No tickets match your search</p>
        </div>
      ) : (
        <div style={{ marginTop: 8 }}>
          {tickets.map(ticket => {
            const statusInfo = getStatusInfo(ticket.status);
            return (
              <div key={ticket.id} className="card" style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/ticket/${ticket.id}`)}>
                <div className="card-header">
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 16 }}>
                    {formatPlate(ticket.plate_number)}
                  </span>
                  <span className="status-badge" style={{ background: statusInfo.color + '20', color: statusInfo.color }}>
                    {statusInfo.label}
                  </span>
                </div>
                <div style={{ fontSize: 14, color: 'var(--gray-600)' }}>
                  {getOffenseLabel(ticket.offense_type)}
                </div>
                {ticket.location_address && (
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>📍</span> {ticket.location_address}
                  </div>
                )}
                <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>
                  {generateTicketNumber(ticket.id)} · {formatDate(ticket.created_at)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
