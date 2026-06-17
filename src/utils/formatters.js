export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatPlate(plate) {
  return plate?.toUpperCase().trim() || '';
}

export function formatCurrency(amount) {
  return `$${Number(amount).toFixed(2)}`;
}

export function generateTicketNumber(id) {
  const now = new Date();
  const year = now.getFullYear();
  return `VPT-${year}-${String(id).padStart(6, '0')}`;
}
