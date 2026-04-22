const { query } = require('../db/pool');

async function log({ phone, clientId, direction, body, mediaUrl, flow, step }) {
  const { rows } = await query(
    `INSERT INTO messages (phone, client_id, direction, body, media_url, flow, step)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [phone, clientId || null, direction, body || null, mediaUrl || null, flow || null, step || null]
  );
  return rows[0];
}

async function search({ q, phone, limit = 100 }) {
  const params = [];
  const where = [];
  if (q) { params.push(`%${q}%`); where.push(`body ILIKE $${params.length}`); }
  if (phone) { params.push(phone); where.push(`phone=$${params.length}`); }
  params.push(limit);
  const sql = `SELECT * FROM messages ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC LIMIT $${params.length}`;
  const { rows } = await query(sql, params);
  return rows;
}

module.exports = { log, search };
