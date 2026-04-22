function isNumber(val) {
  const n = Number(val);
  return !Number.isNaN(n) && Number.isFinite(n);
}

function isPositiveInt(val) {
  const n = parseInt(val, 10);
  return Number.isInteger(n) && n > 0;
}

function isNonEmpty(str) {
  return typeof str === 'string' && str.trim().length > 0;
}

function isEmail(str) {
  return typeof str === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(str);
}

module.exports = { isNumber, isPositiveInt, isNonEmpty, isEmail };
