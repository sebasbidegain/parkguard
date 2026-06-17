import { getOffenseTypes as getFromDb } from '../db/database';

let _cache = null;

export function refreshOffenseCache() {
  _cache = null;
}

function getCachedTypes() {
  if (!_cache) _cache = getFromDb(false);
  return _cache;
}

function getAllTypes() {
  return getFromDb(true);
}

export { getCachedTypes as getActiveOffenseTypes, getAllTypes as getAllOffenseTypes };

export const STATUSES = [
  { id: 'issued', label: 'Issued', color: '#ef4444' },
  { id: 'notified', label: 'Notified', color: '#f59e0b' },
  { id: 'paid', label: 'Paid', color: '#22c55e' },
  { id: 'appealed', label: 'Appealed', color: '#8b5cf6' },
  { id: 'dismissed', label: 'Dismissed', color: '#6b7280' },
  { id: 'overdue', label: 'Overdue', color: '#dc2626' },
];

export function getOffenseLabel(key) {
  const types = getFromDb(true);
  return types.find(o => o.key === key)?.label || key;
}

export function getOffenseFine(key) {
  const types = getFromDb(true);
  return types.find(o => o.key === key)?.fine || 50;
}

export function getStatusInfo(id) {
  return STATUSES.find(s => s.id === id) || STATUSES[0];
}
