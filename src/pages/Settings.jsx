import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Eye, EyeOff, Save, AlertTriangle, GripVertical } from 'lucide-react';
import { addOffenseType, updateOffenseType, toggleOffenseType, deleteOffenseType, reorderOffenseTypes } from '../db/database';
import { getAllOffenseTypes, refreshOffenseCache } from '../utils/offenseTypes';
import { formatCurrency } from '../utils/formatters';

export default function Settings() {
  const navigate = useNavigate();
  const [offenses, setOffenses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState('');
  const [editFine, setEditFine] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newFine, setNewFine] = useState('');
  const [error, setError] = useState('');

  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [draggingIndex, setDraggingIndex] = useState(null);

  function reload() {
    refreshOffenseCache();
    setOffenses(getAllOffenseTypes());
  }

  useEffect(() => { reload(); }, []);

  function startEdit(o) {
    setEditingId(o.id);
    setEditLabel(o.label);
    setEditFine(String(o.fine));
    setError('');
  }

  function saveEdit() {
    if (!editLabel.trim()) { setError('Label is required'); return; }
    const fine = parseFloat(editFine);
    if (isNaN(fine) || fine < 0) { setError('Fine must be a valid positive number'); return; }
    updateOffenseType(editingId, editLabel.trim(), fine);
    setEditingId(null);
    setError('');
    reload();
  }

  function handleAdd() {
    if (!newLabel.trim()) { setError('Label is required'); return; }
    const fine = parseFloat(newFine);
    if (isNaN(fine) || fine < 0) { setError('Fine must be a valid positive number'); return; }
    const key = newLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
    addOffenseType(key, newLabel.trim(), fine);
    setNewLabel('');
    setNewFine('');
    setShowAdd(false);
    setError('');
    reload();
  }

  function handleToggle(o) {
    toggleOffenseType(o.id, !o.active);
    reload();
  }

  function handleDelete(o) {
    const success = deleteOffenseType(o.id);
    if (!success) {
      setError(`Cannot delete "${o.label}" — it's used by existing tickets. Disable it instead.`);
      return;
    }
    setError('');
    reload();
  }

  function handleDragStart(index) {
    dragItem.current = index;
    setDraggingIndex(index);
  }

  function handleDragEnter(index) {
    dragOverItem.current = index;
    setDragOverIndex(index);
  }

  function handleDragEnd() {
    if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
      setDraggingIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...offenses];
    const [removed] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOverItem.current, 0, removed);

    setOffenses(reordered);
    reorderOffenseTypes(reordered.map(o => o.id));
    refreshOffenseCache();

    dragItem.current = null;
    dragOverItem.current = null;
    setDraggingIndex(null);
    setDragOverIndex(null);
  }

  function handleTouchStart(index, e) {
    dragItem.current = index;
    setDraggingIndex(index);
    e.currentTarget.closest('.offense-row').style.opacity = '0.5';
  }

  function handleTouchMove(e) {
    const touch = e.touches[0];
    const elements = document.querySelectorAll('.offense-row');
    for (let i = 0; i < elements.length; i++) {
      const rect = elements[i].getBoundingClientRect();
      if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        dragOverItem.current = i;
        setDragOverIndex(i);
        break;
      }
    }
  }

  function handleTouchEnd(e) {
    const elements = document.querySelectorAll('.offense-row');
    elements.forEach(el => el.style.opacity = '');
    handleDragEnd();
  }

  return (
    <div className="settings-page">
      <button className="btn btn-sm btn-outline" onClick={() => navigate(-1)} style={{ marginBottom: 12 }}>
        <ArrowLeft size={16} /> Back
      </button>

      <h2 className="section-title">Offense Types & Fines</h2>
      <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 16 }}>
        Drag to reorder, tap to edit, or use the buttons to enable/disable and delete.
      </p>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#991b1b', display: 'flex', gap: 8, alignItems: 'center' }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <button className="btn btn-primary btn-sm" onClick={() => { setShowAdd(!showAdd); setError(''); }}>
          <Plus size={16} /> Add Offense Type
        </button>
      </div>

      {showAdd && (
        <div className="card" style={{ border: '2px solid var(--primary-light)', marginBottom: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10, color: 'var(--primary)' }}>New Offense Type</div>
          <div className="form-group" style={{ marginBottom: 10 }}>
            <label>Name</label>
            <input type="text" placeholder="e.g. Blocking Emergency Exit" value={newLabel}
              onChange={e => setNewLabel(e.target.value)} autoFocus />
          </div>
          <div className="form-group" style={{ marginBottom: 10 }}>
            <label>Fine Amount ($)</label>
            <input type="number" placeholder="0.00" min="0" step="0.01" value={newFine}
              onChange={e => setNewFine(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={handleAdd}>
              <Save size={14} /> Save
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => { setShowAdd(false); setError(''); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="offense-list">
        {offenses.map((o, index) => (
          <div
            key={o.id}
            className={`card offense-row${draggingIndex === index ? ' dragging' : ''}${dragOverIndex === index && draggingIndex !== index ? ' drag-over' : ''}`}
            style={{ opacity: o.active ? 1 : 0.5 }}
            draggable={editingId !== o.id}
            onDragStart={() => handleDragStart(index)}
            onDragEnter={() => handleDragEnter(index)}
            onDragOver={e => e.preventDefault()}
            onDragEnd={handleDragEnd}
          >
            {editingId === o.id ? (
              <div>
                <div className="form-group" style={{ marginBottom: 10 }}>
                  <label>Name</label>
                  <input type="text" value={editLabel} onChange={e => setEditLabel(e.target.value)} autoFocus />
                </div>
                <div className="form-group" style={{ marginBottom: 10 }}>
                  <label>Fine ($)</label>
                  <input type="number" min="0" step="0.01" value={editFine} onChange={e => setEditFine(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary btn-sm" onClick={saveEdit}><Save size={14} /> Save</button>
                  <button className="btn btn-outline btn-sm" onClick={() => { setEditingId(null); setError(''); }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  className="drag-handle"
                  onTouchStart={e => handleTouchStart(index, e)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <GripVertical size={18} />
                </div>
                <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => startEdit(o)}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {o.label}
                    {!o.active && <span style={{ fontSize: 11, color: 'var(--gray-400)', marginLeft: 6 }}>(disabled)</span>}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 600 }}>{formatCurrency(o.fine)}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="icon-btn" title={o.active ? 'Disable' : 'Enable'} onClick={() => handleToggle(o)}>
                    {o.active ? <Eye size={18} color="var(--success)" /> : <EyeOff size={18} color="var(--gray-400)" />}
                  </button>
                  <button className="icon-btn" title="Delete" onClick={() => handleDelete(o)}>
                    <Trash2 size={18} color="var(--danger)" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`
        .offense-list {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .offense-row {
          transition: transform 0.15s, box-shadow 0.15s, opacity 0.2s;
          user-select: none;
        }
        .offense-row.dragging {
          opacity: 0.4 !important;
          transform: scale(0.98);
          box-shadow: none;
        }
        .offense-row.drag-over {
          border-top: 3px solid var(--primary-light);
          margin-top: -3px;
        }
        .drag-handle {
          color: var(--gray-400);
          cursor: grab;
          padding: 4px 2px;
          display: flex;
          align-items: center;
          touch-action: none;
          flex-shrink: 0;
        }
        .drag-handle:active {
          cursor: grabbing;
          color: var(--primary);
        }
        .icon-btn {
          background: none;
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-sm);
          padding: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .icon-btn:hover {
          background: var(--gray-100);
        }
      `}</style>
    </div>
  );
}
