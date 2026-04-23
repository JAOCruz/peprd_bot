const pool = require('../db/pool');

const MAX_NOTE_LEN = 4000;

const ClientNote = {
  async create({ clientId, authorId, body }) {
    const trimmed = String(body || '').trim().slice(0, MAX_NOTE_LEN);
    if (!trimmed) {
      const err = new Error('Note body is required');
      err.status = 400;
      throw err;
    }
    const { rows } = await pool.query(
      `INSERT INTO client_notes (client_id, author_id, body)
       VALUES ($1, $2, $3) RETURNING *`,
      [clientId, authorId || null, trimmed]
    );
    return rows[0];
  },

  async findByClient(clientId) {
    const { rows } = await pool.query(
      `SELECT n.*, u.name AS author_name
       FROM client_notes n
       LEFT JOIN users u ON u.id = n.author_id
       WHERE n.client_id = $1
       ORDER BY n.created_at DESC`,
      [clientId]
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM client_notes WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async delete(id) {
    const { rowCount } = await pool.query('DELETE FROM client_notes WHERE id = $1', [id]);
    return rowCount > 0;
  },
};

module.exports = ClientNote;
module.exports.MAX_NOTE_LEN = MAX_NOTE_LEN;
