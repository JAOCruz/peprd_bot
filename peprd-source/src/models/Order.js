const { query, pool } = require('../db/pool');

function generateOrderNumber() {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `TT-${stamp}-${rand}`;
}

async function create({ clientId, items, fulfillment = 'pickup', deliveryAddress, deliveryFee = 0, paymentMethod, scheduledFor, notes }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const subtotal = items.reduce((s, it) => s + Number(it.unit_price) * it.quantity, 0);
    const total = subtotal + Number(deliveryFee || 0);
    const orderNumber = generateOrderNumber();

    const { rows: orderRows } = await client.query(
      `INSERT INTO orders (client_id, order_number, status, fulfillment, delivery_address, delivery_fee, subtotal, total, payment_method, scheduled_for, notes)
       VALUES ($1,$2,'pending',$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [clientId, orderNumber, fulfillment, deliveryAddress || null, deliveryFee, subtotal, total, paymentMethod || null, scheduledFor || null, notes || null]
    );
    const order = orderRows[0];

    for (const it of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, line_total, customization)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [order.id, it.product_id || null, it.product_name, it.quantity, it.unit_price, Number(it.unit_price) * it.quantity, it.customization || null]
      );
    }

    if (clientId) {
      await client.query(
        'UPDATE clients SET total_orders = total_orders + 1, total_spent = total_spent + $2 WHERE id=$1',
        [clientId, total]
      );
    }

    await client.query('COMMIT');
    return order;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM orders WHERE id=$1', [id]);
  if (!rows[0]) return null;
  const { rows: items } = await query('SELECT * FROM order_items WHERE order_id=$1', [id]);
  return { ...rows[0], items };
}

async function list({ status, limit = 100, offset = 0 } = {}) {
  const params = [];
  let where = '';
  if (status) { params.push(status); where = `WHERE status=$${params.length}`; }
  params.push(limit, offset);
  const { rows } = await query(
    `SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return rows;
}

async function updateStatus(id, status) {
  const { rows } = await query(
    'UPDATE orders SET status=$2, updated_at=NOW() WHERE id=$1 RETURNING *',
    [id, status]
  );
  return rows[0];
}

module.exports = { create, findById, list, updateStatus, generateOrderNumber };
