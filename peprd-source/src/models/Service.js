const pool = require('../db/pool');

const Service = {
  async create({ name, description, category, price }) {
    const { rows } = await pool.query(
      `INSERT INTO services (name, description, category, price, active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING *`,
      [name, description || null, category || null, price]
    );
    return rows[0];
  },

  async findAll() {
    const { rows } = await pool.query(
      `SELECT * FROM services WHERE active = true ORDER BY category, name`
    );
    return rows;
  },

  async findByCategory(category) {
    const { rows } = await pool.query(
      `SELECT * FROM services WHERE category = $1 AND active = true ORDER BY name`,
      [category]
    );
    return rows;
  },

  async findByName(name) {
    const { rows } = await pool.query(
      `SELECT * FROM services WHERE LOWER(name) LIKE LOWER($1) AND active = true LIMIT 1`,
      [`%${name}%`]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT * FROM services WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async getCategories() {
    const { rows } = await pool.query(
      `SELECT DISTINCT category FROM services WHERE active = true AND category IS NOT NULL ORDER BY category`
    );
    return rows.map(r => r.category);
  },

  async update(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const { rows } = await pool.query(
      `UPDATE services SET ${sets}, updated_at = NOW() WHERE id = $${keys.length + 1} RETURNING *`,
      [...values, id]
    );
    return rows[0] || null;
  },

  async delete(id) {
    await pool.query(`UPDATE services SET active = false WHERE id = $1`, [id]);
  },
};

module.exports = Service;
