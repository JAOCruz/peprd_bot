const { query } = require('../db/pool');

async function findByPhone(phone) {
  const { rows } = await query('SELECT * FROM clients WHERE phone=$1', [phone]);
  return rows[0] || null;
}

async function upsert(phone, fields = {}) {
  const existing = await findByPhone(phone);
  if (existing) {
    const keys = Object.keys(fields);
    if (!keys.length) return existing;
    const set = keys.map((k, i) => `${k}=$${i + 2}`).join(', ');
    const values = keys.map((k) => fields[k]);
    const { rows } = await query(
      `UPDATE clients SET ${set}, last_interaction_at=NOW() WHERE phone=$1 RETURNING *`,
      [phone, ...values]
    );
    return rows[0];
  }
  const { rows } = await query(
    'INSERT INTO clients (phone, name, email, address, city, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [phone, fields.name || null, fields.email || null, fields.address || null, fields.city || null, fields.notes || null]
  );
  return rows[0];
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM clients WHERE id=$1', [id]);
  return rows[0] || null;
}

async function list({ limit = 50, offset = 0 } = {}) {
  const { rows } = await query(
    'SELECT * FROM clients ORDER BY last_interaction_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );
  return rows;
}

module.exports = { findByPhone, findById, upsert, list };
