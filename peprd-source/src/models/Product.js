const pool = require('../db/pool');

const ALLOWED_UPDATE = new Set([
  'category_slug', 'name', 'description', 'price', 'unit',
  'active', 'stock', 'low_stock_threshold', 'sku',
]);

const Product = {
  async create({ categorySlug, name, description, price, unit, stock, lowStockThreshold, sku }) {
    const { rows } = await pool.query(
      `INSERT INTO products (category_slug, name, description, price, unit, stock, low_stock_threshold, sku)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        categorySlug || null,
        name,
        description || null,
        price || null,
        unit || 'vial',
        stock ?? 0,
        lowStockThreshold ?? 5,
        sku || null,
      ]
    );
    return rows[0];
  },

  async findAll({ category, active, q, limit = 500 } = {}) {
    const where = [];
    const params = [];
    if (category) { params.push(category); where.push(`category_slug = $${params.length}`); }
    if (active !== undefined) { params.push(active); where.push(`active = $${params.length}`); }
    if (q) { params.push(`%${q}%`); where.push(`(name ILIKE $${params.length} OR COALESCE(description,'') ILIKE $${params.length} OR COALESCE(sku,'') ILIKE $${params.length})`); }
    params.push(limit);
    const { rows } = await pool.query(
      `SELECT * FROM products ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY category_slug ASC NULLS LAST, name ASC LIMIT $${params.length}`,
      params
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async update(id, fields) {
    const safe = {};
    for (const k of Object.keys(fields || {})) {
      if (ALLOWED_UPDATE.has(k)) safe[k] = fields[k];
    }
    const keys = Object.keys(safe);
    if (!keys.length) return this.findById(id);
    const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const values = Object.values(safe);
    const { rows } = await pool.query(
      `UPDATE products SET ${sets}, updated_at = NOW() WHERE id = $${keys.length + 1} RETURNING *`,
      [...values, id]
    );
    return rows[0] || null;
  },

  async adjustStock(id, delta, reason = null) {
    const { rows } = await pool.query(
      `UPDATE products SET stock = GREATEST(0, COALESCE(stock,0) + $2), updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, parseInt(delta, 10)]
    );
    if (reason) {
      try {
        await pool.query(
          `INSERT INTO stock_movements (product_id, delta, reason, created_at) VALUES ($1, $2, $3, NOW())`,
          [id, parseInt(delta, 10), String(reason).slice(0, 255)]
        );
      } catch (err) {
        if (err.code !== '42P01') console.warn('[Product.adjustStock] movement log failed:', err.message);
      }
    }
    return rows[0] || null;
  },

  async delete(id) {
    const { rowCount } = await pool.query('DELETE FROM products WHERE id = $1', [id]);
    return rowCount > 0;
  },

  async stats() {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*)::int                                                                 AS total,
        COUNT(*) FILTER (WHERE active IS TRUE)::int                                   AS active,
        COUNT(*) FILTER (WHERE active IS TRUE AND COALESCE(stock,0) = 0)::int         AS out_of_stock,
        COUNT(*) FILTER (WHERE active IS TRUE AND COALESCE(stock,0) > 0
          AND COALESCE(stock,0) <= COALESCE(low_stock_threshold, 5))::int             AS low_stock,
        COALESCE(SUM(COALESCE(stock,0) * COALESCE(price,0)), 0)::numeric              AS inventory_value
      FROM products
    `);
    return rows[0];
  },

  async countByCategory() {
    const { rows } = await pool.query(`
      SELECT category_slug, COUNT(*)::int AS count,
             COALESCE(SUM(COALESCE(stock,0)), 0)::int AS total_stock,
             COALESCE(SUM(COALESCE(stock,0) * COALESCE(price,0)), 0)::numeric AS value
      FROM products
      WHERE active IS TRUE
      GROUP BY category_slug
      ORDER BY category_slug ASC NULLS LAST
    `);
    return rows;
  },
};

module.exports = Product;
