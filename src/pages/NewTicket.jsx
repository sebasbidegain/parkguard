import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Video, MapPin, Save, X, Plus } from 'lucide-react';
import { createTicket, addMedia } from '../db/database';
import { getActiveOffenseTypes, getOffenseFine } from '../utils/offenseTypes';
import { formatCurrency } from '../utils/formatters';

export default function NewTicket() {
  const navigate = useNavigate();
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const [form, setForm] = useState({
    plateNumber: '',
    offenseType: '',
    description: '',
    locationAddress: '',
    notes: '',
  });
  const [location, setLocation] = useState(null);
  const [media, setMedia] = useState([]);
  const [saving, setSaving] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handlePhotoCapture(e) {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setMedia(prev => [...prev, { type: 'photo', data: reader.result, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  }

  function handleVideoCapture(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      alert('Video too large. Max 50MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setMedia(prev => [...prev, { type: 'video', data: reader.result, name: file.name }]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function removeMedia(index) {
    setMedia(prev => prev.filter((_, i) => i !== index));
  }

  function getLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        update('locationAddress', `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
        setGettingLocation(false);
      },
      err => {
        alert('Could not get location: ' + err.message);
        setGettingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.plateNumber.trim()) {
      alert('Plate number is required');
      return;
    }
    if (!form.offenseType) {
      alert('Select an offense type');
      return;
    }

    setSaving(true);
    try {
      const ticketId = createTicket({
        plateNumber: form.plateNumber.toUpperCase().trim(),
        offenseType: form.offenseType,
        description: form.description,
        locationLat: location?.lat,
        locationLng: location?.lng,
        locationAddress: form.locationAddress,
        notes: form.notes,
      });

      for (const m of media) {
        addMedia(ticketId, m.type, m.data);
      }

      navigate(`/ticket/${ticketId}`);
    } catch (err) {
      alert('Error saving ticket: ' + err.message);
      setSaving(false);
    }
  }

  const selectedFine = form.offenseType ? getOffenseFine(form.offenseType) : null;

  return (
    <div className="new-ticket">
      <h2 className="section-title">Issue New Ticket</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>License Plate *</label>
          <input
            type="text"
            placeholder="e.g. ABC 1234"
            value={form.plateNumber}
            onChange={e => update('plateNumber', e.target.value)}
            style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontSize: 20, fontWeight: 700, letterSpacing: 2 }}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label>Offense Type *</label>
          <select value={form.offenseType} onChange={e => update('offenseType', e.target.value)}>
            <option value="">Select offense...</option>
            {getActiveOffenseTypes().map(o => (
              <option key={o.key} value={o.key}>{o.label} — {formatCurrency(o.fine)}</option>
            ))}
          </select>
          {selectedFine && (
            <div className="fine-preview">
              Fine: <strong>{formatCurrency(selectedFine)}</strong>
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            placeholder="Additional details about the violation..."
            value={form.description}
            onChange={e => update('description', e.target.value)}
            rows={3}
          />
        </div>

        <div className="form-group">
          <label>Location</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="Address or coordinates"
              value={form.locationAddress}
              onChange={e => update('locationAddress', e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="button" className="btn btn-outline btn-sm" onClick={getLocation} disabled={gettingLocation}>
              <MapPin size={16} />
              {gettingLocation ? '...' : 'GPS'}
            </button>
          </div>
          {location && (
            <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 4 }}>
              ✓ GPS coordinates captured
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Evidence (Photos & Video)</label>
          <div className="media-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => photoInputRef.current?.click()}>
              <Camera size={16} /> Photo
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => videoInputRef.current?.click()}>
              <Video size={16} /> Video
            </button>
          </div>
          <input ref={photoInputRef} type="file" accept="image/*" capture="environment" multiple
            onChange={handlePhotoCapture} style={{ display: 'none' }} />
          <input ref={videoInputRef} type="file" accept="video/*" capture="environment"
            onChange={handleVideoCapture} style={{ display: 'none' }} />

          {media.length > 0 && (
            <div className="media-preview-grid">
              {media.map((m, i) => (
                <div key={i} className="media-thumb">
                  {m.type === 'photo' ? (
                    <img src={m.data} alt={`Evidence ${i + 1}`} />
                  ) : (
                    <video src={m.data} />
                  )}
                  <button type="button" className="remove-media" onClick={() => removeMedia(i)}>
                    <X size={14} />
                  </button>
                  <span className="media-type-badge">{m.type === 'photo' ? '📷' : '🎥'}</span>
                </div>
              ))}
              <button type="button" className="media-thumb add-more" onClick={() => photoInputRef.current?.click()}>
                <Plus size={24} />
              </button>
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Notes</label>
          <textarea
            placeholder="Internal notes (vehicle color, make, model, etc.)..."
            value={form.notes}
            onChange={e => update('notes', e.target.value)}
            rows={2}
          />
        </div>

        <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
          <Save size={18} />
          {saving ? 'Saving...' : 'Issue Ticket'}
        </button>
      </form>

      <style>{`
        .fine-preview {
          margin-top: 6px;
          padding: 8px 12px;
          background: #fef3c7;
          border-radius: var(--radius-sm);
          font-size: 14px;
          color: #92400e;
        }
        .media-actions {
          display: flex;
          gap: 8px;
          margin-bottom: 10px;
        }
        .media-preview-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 8px;
        }
        .media-thumb {
          position: relative;
          aspect-ratio: 1;
          border-radius: var(--radius-sm);
          overflow: hidden;
          background: var(--gray-100);
        }
        .media-thumb img, .media-thumb video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .remove-media {
          position: absolute;
          top: 4px;
          right: 4px;
          background: rgba(0,0,0,0.6);
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .media-type-badge {
          position: absolute;
          bottom: 4px;
          left: 4px;
          font-size: 14px;
        }
        .add-more {
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px dashed var(--gray-300);
          cursor: pointer;
          color: var(--gray-400);
          background: var(--gray-50);
        }
      `}</style>
    </div>
  );
}
