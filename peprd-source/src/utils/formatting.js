const config = require('../config');

function formatCurrency(amount) {
  const n = Number(amount || 0);
  return `${config.business.currencySymbol}${n.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function normalizePhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `1${digits}`;
  return digits;
}

function truncate(text, n = 80) {
  if (!text) return '';
  return text.length > n ? text.slice(0, n - 1) + '…' : text;
}

module.exports = { formatCurrency, normalizePhone, truncate };
