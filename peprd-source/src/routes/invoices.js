const express = require('express');
const path = require('path');
const { authenticate, requireRole } = require('../middleware/auth');
const Invoice = require('../models/Invoice');
const { generateInvoicePDF, generateInvoiceFromTemplate, generateDocNumber } = require('../documents/generateInvoice');

const router = express.Router();

// Strict validation of invoice items. Rejects malformed input before it hits
// the DB or PDF render — prevents stored XSS, bad totals, and type confusion.
const MAX_ITEMS = 100;
const MAX_PRICE = 10_000_000;
const MAX_QTY = 10_000;
const MAX_DESC = 500;
const MAX_NOTES = 2000;
const MAX_NAME = 200;
const ALLOWED_TYPES = new Set(['COTIZACIÓN', 'FACTURA']);

function validateItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { error: 'items must be a non-empty array' };
  }
  if (items.length > MAX_ITEMS) {
    return { error: `too many items (max ${MAX_ITEMS})` };
  }
  const clean = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (!it || typeof it !== 'object') return { error: `item[${i}] must be an object` };
    const cantidad = Number(it.cantidad);
    const precio = Number(it.precio);
    if (!Number.isFinite(cantidad) || cantidad <= 0 || cantidad > MAX_QTY || !Number.isInteger(cantidad)) {
      return { error: `item[${i}].cantidad must be a positive integer ≤ ${MAX_QTY}` };
    }
    if (!Number.isFinite(precio) || precio < 0 || precio > MAX_PRICE) {
      return { error: `item[${i}].precio must be a number between 0 and ${MAX_PRICE}` };
    }
    const desc = it.desc == null ? '' : String(it.desc).slice(0, MAX_DESC);
    clean.push({ desc, cantidad, precio, itbis: !!it.itbis });
  }
  return { items: clean };
}

function validateInvoiceBody(body, { requireItems = true } = {}) {
  const { type, clientId, clientName, clientPhone, items, notes } = body || {};
  if (type != null && !ALLOWED_TYPES.has(type)) {
    return { error: `type must be one of ${[...ALLOWED_TYPES].join(', ')}` };
  }
  if (requireItems || items !== undefined) {
    const r = validateItems(items);
    if (r.error) return r;
    body.items = r.items;
  }
  if (clientName != null) {
    if (typeof clientName !== 'string' || clientName.length === 0 || clientName.length > MAX_NAME) {
      return { error: `clientName must be 1-${MAX_NAME} chars` };
    }
  }
  if (clientPhone != null && (typeof clientPhone !== 'string' || clientPhone.length > 40)) {
    return { error: 'clientPhone invalid' };
  }
  if (notes != null && (typeof notes !== 'string' || notes.length > MAX_NOTES)) {
    return { error: `notes must be ≤ ${MAX_NOTES} chars` };
  }
  if (clientId != null && !Number.isInteger(Number(clientId))) {
    return { error: 'clientId must be integer' };
  }
  return { ok: true };
}

// ── PUBLIC: get all quotations (no auth) ──
router.get('/quotations', async (req, res) => {
  try {
    const { rows } = await require('../db/pool').query(`
      SELECT i.*,
             cb.name AS created_by_name
      FROM invoices i
      LEFT JOIN users cb ON cb.id = i.created_by
      WHERE i.type = 'COTIZACIÓN'
      ORDER BY i.created_at DESC
      LIMIT 50
    `);
    res.json({ quotations: rows });
  } catch (err) {
    console.error('Get quotations error:', err);
    res.status(500).json({ error: 'Failed to get quotations' });
  }
});

// ── PUBLIC: serve invoice PDF by filename (no auth) ──
router.get('/pdf/:filename', (req, res) => {
  try {
    const filename = path.basename(req.params.filename); // Prevent directory traversal
    const filePath = path.join(__dirname, '../../public/invoices', filename);

    // Validate path is within invoices directory
    const resolvedPath = path.resolve(filePath);
    const invoicesDir = path.resolve(path.join(__dirname, '../../public/invoices'));
    if (!resolvedPath.startsWith(invoicesDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.sendFile(filePath);
  } catch (err) {
    console.error('Serve public PDF error:', err);
    res.status(500).json({ error: 'Failed to serve PDF' });
  }
});

router.use(authenticate);

// ── GET /api/invoices ── list (admin: all | digitador: own)
router.get('/', async (req, res) => {
  try {
    const invoices = req.user.role === 'admin'
      ? await Invoice.findAll()
      : await Invoice.findByCreator(req.user.id);
    res.json({ invoices });
  } catch (err) {
    console.error('List invoices error:', err);
    res.status(500).json({ error: 'Failed to list invoices' });
  }
});

// ── GET /api/invoices/:id ──
router.get('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    // Digitador can only see own invoices
    if (req.user.role === 'digitador' && invoice.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json({ invoice });
  } catch (err) {
    console.error('Get invoice error:', err);
    res.status(500).json({ error: 'Failed to get invoice' });
  }
});

// ── POST /api/invoices ── create (any authenticated user)
router.post('/', async (req, res) => {
  try {
    const v = validateInvoiceBody(req.body, { requireItems: true });
    if (v.error) return res.status(400).json({ error: v.error });
    if (!req.body.clientName) return res.status(400).json({ error: 'clientName is required' });
    const { type, clientId, clientName, clientPhone, items, notes } = req.body;

    // Calculate totals
    const subtotal = items.reduce((s, i) => s + (Number(i.cantidad) * Number(i.precio)), 0);
    const itbis    = items.some(i => i.itbis)
      ? items.reduce((s, i) => s + (i.itbis ? Number(i.cantidad) * Number(i.precio) * 0.18 : 0), 0)
      : 0;
    const total = subtotal + itbis;

    const docNumber = generateDocNumber(type === 'FACTURA' ? 'FAC' : 'COT');

    const invoice = await Invoice.create({
      docNumber, type: type || 'COTIZACIÓN',
      clientId: clientId || null, clientName, clientPhone,
      items, notes, subtotal, itbis, total,
      createdBy: req.user.id,
    });

    res.status(201).json({ invoice });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Doc number already exists' });
    console.error('Create invoice error:', err);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// ── PUT /api/invoices/:id ── edit (draft only, own or admin)
router.put('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    if (req.user.role === 'digitador') {
      if (invoice.created_by !== req.user.id) return res.status(403).json({ error: 'Access denied' });
      if (invoice.status !== 'draft') return res.status(400).json({ error: 'Cannot edit a non-draft invoice' });
    }

    const v = validateInvoiceBody(req.body, { requireItems: false });
    if (v.error) return res.status(400).json({ error: v.error });
    const { type, clientName, clientPhone, items, notes } = req.body;
    const fields = {};
    if (type)        fields.type        = type;
    if (clientName)  fields.client_name = clientName;
    if (clientPhone !== undefined) fields.client_phone = clientPhone;
    if (notes !== undefined)       fields.notes        = notes;

    if (items && Array.isArray(items)) {
      const subtotal = items.reduce((s, i) => s + (Number(i.cantidad) * Number(i.precio)), 0);
      const itbis    = items.some(i => i.itbis)
        ? items.reduce((s, i) => s + (i.itbis ? Number(i.cantidad) * Number(i.precio) * 0.18 : 0), 0)
        : 0;
      fields.items    = JSON.stringify(items);
      fields.subtotal = subtotal;
      fields.itbis    = itbis;
      fields.total    = subtotal + itbis;
    }

    const updated = await Invoice.update(invoice.id, fields);
    res.json({ invoice: updated });
  } catch (err) {
    console.error('Update invoice error:', err);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

// ── DELETE /api/invoices/:id ── (draft only, admin or creator)
router.delete('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (req.user.role === 'digitador' && invoice.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (invoice.status === 'sent') {
      return res.status(400).json({ error: 'Cannot delete a sent invoice' });
    }
    await Invoice.delete(invoice.id);
    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    console.error('Delete invoice error:', err);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

// ── POST /api/invoices/:id/approve ── admin only
router.post('/:id/approve', requireRole('admin'), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (invoice.status !== 'draft') {
      return res.status(400).json({ error: `Invoice is already ${invoice.status}` });
    }
    const updated = await Invoice.approve(invoice.id, req.user.id);
    res.json({ invoice: updated, message: 'Invoice approved' });
  } catch (err) {
    console.error('Approve invoice error:', err);
    res.status(500).json({ error: 'Failed to approve invoice' });
  }
});

// ── POST /api/invoices/:id/send ── admin can always; digitador only if approved
router.post('/:id/send', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Digitador ownership check
    if (req.user.role === 'digitador' && invoice.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Digitador can only send approved invoices
    if (req.user.role === 'digitador' && invoice.status !== 'approved') {
      return res.status(403).json({ error: 'Invoice must be approved by admin before sending' });
    }

    if (invoice.status === 'sent') {
      return res.status(400).json({ error: 'Invoice already sent' });
    }

    // Generate PDF
    let pdfPath = invoice.pdf_path;
    try {
      const today = new Date();
      const dateStr = `${String(today.getDate()).padStart(2,'0')}-${String(today.getMonth()+1).padStart(2,'0')}-${today.getFullYear()}`;
      pdfPath = await generateInvoiceFromTemplate({
        clientName:  invoice.client_name,
        clientPhone: invoice.client_phone,
        docNumber:   invoice.doc_number,
        date:        dateStr,
        items:       typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items,
        notes:       invoice.notes,
        type:        invoice.type,
      });
      console.log(`[Invoice] PDF generated: ${pdfPath}`);
    } catch (pdfErr) {
      console.error('[Invoice] PDF generation failed:', pdfErr.message);
      // Don't block sending if PDF fails — save null
      pdfPath = null;
    }

    const updated = await Invoice.markSent(invoice.id, pdfPath);
    res.json({
      invoice: updated,
      pdfPath,
      message: 'Invoice marked as sent' + (pdfPath ? '. PDF generated.' : '. PDF generation failed (saved anyway).'),
    });
  } catch (err) {
    console.error('Send invoice error:', err);
    res.status(500).json({ error: 'Failed to send invoice' });
  }
});

// ── GET /api/invoices/:id/pdf ── serve the PDF file
router.get('/:id/pdf', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (req.user.role === 'digitador' && invoice.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (!invoice.pdf_path) {
      return res.status(404).json({ error: 'PDF not yet generated. Send the invoice first.' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${invoice.doc_number}.pdf"`);
    res.sendFile(invoice.pdf_path);
  } catch (err) {
    console.error('Serve PDF error:', err);
    res.status(500).json({ error: 'Failed to serve PDF' });
  }
});

module.exports = router;
