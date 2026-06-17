import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, DollarSign, Trash2, Edit3, AlertTriangle } from 'lucide-react';
import { getTicketById, updateTicketStatus, deleteTicket, getPlateHistory } from '../db/database';
import { getOffenseLabel, getOffenseFine, getStatusInfo, STATUSES } from '../utils/offenseTypes';
import { formatDate, generateTicketNumber, formatPlate, formatCurrency } from '../utils/formatters';

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [plateHistory, setPlateHistory] = useState([]);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);

  useEffect(() => {
    const t = getTicketById(Number(id));
    if (!t) {
      navigate('/');
      return;
    }
    setTicket(t);
    const history = getPlateHistory(t.plate_number).filter(h => h.id !== t.id);
    setPlateHistory(history);
  }, [id, navigate]);

  function handleStatusChange(newStatus) {
    updateTicketStatus(Number(id), newStatus);
    setTicket(prev => ({ ...prev, status: newStatus }));
    setShowStatusPicker(false);
  }

  function handleDelete() {
    deleteTicket(Number(id));
    navigate('/');
  }

  if (!ticket) return null;

  const statusInfo = getStatusInfo(ticket.status);
  const fine = getOffenseFine(ticket.offense_type);

  return (
    <div className="ticket-detail">
      <button className="btn btn-sm btn-outline" onClick={() => navigate(-1)} style={{ marginBottom: 12 }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 4 }}>
              {generateTicketNumber(ticket.id)}
            </div>
            <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 28, color: 'var(--gray-900)', letterSpacing: 2 }}>
              {formatPlate(ticket.plate_number)}
            </div>
          </div>
          <button
            className="status-badge"
            style={{ background: statusInfo.color + '20', color: statusInfo.color, border: 'none', cursor: 'pointer', fontSize: 13 }}
            onClick={() => setShowStatusPicker(!showStatusPicker)}
          >
            {statusInfo.label} ▾
          </button>
        </div>

        {showStatusPicker && (
          <div className="status-picker">
            {STATUSES.map(s => (
              <button key={s.id} className="status-option"
                style={{ color: s.color, background: ticket.status === s.id ? s.color + '15' : 'transparent' }}
                onClick={() => handleStatusChange(s.id)}>
                {s.label}
              </button>
            ))}
          </div>
        )}

        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Offense</span>
            <span className="detail-value">{getOffenseLabel(ticket.offense_type)}</span>
          </div>
          <div className="detail-item">
            <DollarSign size={14} />
            <span className="detail-label">Fine</span>
            <span className="detail-value" style={{ color: 'var(--danger)', fontWeight: 700 }}>
              {formatCurrency(fine)}
            </span>
          </div>
          <div className="detail-item">
            <Clock size={14} />
            <span className="detail-label">Issued</span>
            <span className="detail-value">{formatDate(ticket.created_at)}</span>
          </div>
          {ticket.location_address && (
            <div className="detail-item">
              <MapPin size={14} />
              <span className="detail-label">Location</span>
              <span className="detail-value">{ticket.location_address}</span>
            </div>
          )}
        </div>

        {ticket.description && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', marginBottom: 4, textTransform: 'uppercase' }}>
              Description
            </div>
            <p style={{ fontSize: 14, color: 'var(--gray-700)', lineHeight: 1.5 }}>{ticket.description}</p>
          </div>
        )}

        {ticket.notes && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', marginBottom: 4, textTransform: 'uppercase' }}>
              Notes
            </div>
            <p style={{ fontSize: 14, color: 'var(--gray-700)', lineHeight: 1.5 }}>{ticket.notes}</p>
          </div>
        )}
      </div>

      {ticket.media?.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3 className="section-title">Evidence ({ticket.media.length})</h3>
          <div className="media-grid">
            {ticket.media.map((m, i) => (
              <div key={m.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedMedia(m)}>
                {m.type === 'photo' ? (
                  <img src={m.data} alt={`Evidence ${i + 1}`} />
                ) : (
                  <video src={m.data} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {plateHistory.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3 className="section-title">
            <AlertTriangle size={16} style={{ verticalAlign: 'middle', marginRight: 4, color: 'var(--warning)' }} />
            Other Tickets for This Plate ({plateHistory.length})
          </h3>
          {plateHistory.map(h => (
            <div key={h.id} className="card" style={{ cursor: 'pointer', padding: 12 }}
              onClick={() => navigate(`/ticket/${h.id}`)}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{getOffenseLabel(h.offense_type)}</div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{formatDate(h.created_at)}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
        <button className="btn btn-danger btn-sm" onClick={() => setShowDeleteConfirm(true)}>
          <Trash2 size={16} /> Delete
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Delete Ticket?</h3>
            <p style={{ color: 'var(--gray-500)', margin: '8px 0 16px' }}>
              This will permanently delete ticket {generateTicketNumber(ticket.id)} and all evidence.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {selectedMedia && (
        <div className="modal-overlay" onClick={() => setSelectedMedia(null)}>
          <div className="media-full" onClick={e => e.stopPropagation()}>
            <button className="close-full" onClick={() => setSelectedMedia(null)}>✕</button>
            {selectedMedia.type === 'photo' ? (
              <img src={selectedMedia.data} alt="Evidence" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 8 }} />
            ) : (
              <video src={selectedMedia.data} controls autoPlay style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 8 }} />
            )}
          </div>
        </div>
      )}

      <style>{`
        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--gray-200);
        }
        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .detail-label {
          font-size: 11px;
          color: var(--gray-400);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .detail-value {
          font-size: 14px;
          color: var(--gray-700);
        }
        .status-picker {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 10px;
          padding: 10px;
          background: var(--gray-50);
          border-radius: var(--radius-sm);
        }
        .status-option {
          border: 1px solid currentColor;
          border-radius: 20px;
          padding: 4px 12px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          background: transparent;
        }
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          padding: 20px;
        }
        .modal {
          background: white;
          border-radius: var(--radius);
          padding: 20px;
          max-width: 320px;
          width: 100%;
        }
        .media-full {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .close-full {
          position: absolute;
          top: -30px;
          right: 0;
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
