const express = require('express');
const path = require('path');
const fs = require('fs');
const { requireAuth } = require('../middleware/auth');
const Order = require('../models/Order');
const Client = require('../models/Client');
const { generateInvoiceHTML, generateInvoicePDF } = require('../documents/generateInvoice');

const router = express.Router();

const INVOICES_DIR = path.join(__dirname, '..', '..', 'public', 'invoices');

router.use(requireAuth);

router.get('/:orderId/html', async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
    const client = order.client_id ? await Client.findById(order.client_id).catch(() => null) : null;
    const result = await generateInvoiceHTML(order, client);
    res.sendFile(result.path);
  } catch (err) { next(err); }
});

router.get('/:orderId/pdf', async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
    const client = order.client_id ? await Client.findById(order.client_id).catch(() => null) : null;
    const cached = path.join(INVOICES_DIR, `${order.order_number}.pdf`);
    if (!fs.existsSync(cached) || req.query.regen === '1') {
      await generateInvoicePDF(order, client);
    }
    res.sendFile(cached);
  } catch (err) {
    if (err.message?.includes('puppeteer no instalado')) {
      return res.status(501).json({ error: 'PDF no disponible. Instala puppeteer: npm install puppeteer' });
    }
    next(err);
  }
});

router.get('/file/:filename', (req, res) => {
  const file = path.join(INVOICES_DIR, req.params.filename.replace(/[^a-zA-Z0-9._-]/g, ''));
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Archivo no encontrado' });
  res.sendFile(file);
});

module.exports = router;
