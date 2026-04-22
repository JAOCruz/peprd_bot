const { query } = require('../db/pool');

async function listCategories() {
  const { rows } = await query(
    'SELECT * FROM categories WHERE active=TRUE ORDER BY display_order ASC, name ASC'
  );
  return rows;
}

async function listByCategory(categorySlug) {
  const { rows } = await query(
    `SELECT p.* FROM products p
     JOIN categories c ON c.id = p.category_id
     WHERE c.slug=$1 AND p.available=TRUE
     ORDER BY p.name ASC`,
    [categorySlug]
  );
  return rows;
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM products WHERE id=$1', [id]);
  return rows[0] || null;
}

async function findBySku(sku) {
  const { rows } = await query('SELECT * FROM products WHERE sku=$1', [sku]);
  return rows[0] || null;
}

async function listAll() {
  const { rows } = await query('SELECT * FROM products ORDER BY name ASC');
  return rows;
}

module.exports = { listCategories, listByCategory, findById, findBySku, listAll };
