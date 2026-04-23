const express = require('express');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const Case = require('../models/Case');
const Client = require('../models/Client');
const pool = require('../db/pool');
const { authenticate, requireRole } = require('../middleware/auth');
const config = require('../config');

const router = express.Router();

const complaintLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => ipKeyGenerator(req, res),
  message: { error: 'Rate limit exceeded on complaint detection' },
});

// Rule-based complaint detection (no AI, no quota issues)
function detectComplaint(text) {
  const lower = text.toLowerCase();
  let complaintType = null;
  let score = 0;

  // Strong complaint signals (high confidence)
  if (lower.includes('dinero de vuelta') || lower.includes('devuelva') || lower.includes('reembolso') || lower.includes('quiero mi dinero')) {
    score += 90;
    complaintType = 'producto_defectuoso';
  }

  // Defect/damage keywords
  const defectKeywords = ['defectuoso', 'roto', 'dañado', 'no funciona', 'no sirvió', 'no sirve', 'no funciono', 'broken', 'dañada', 'no prendió'];
  if (defectKeywords.some(k => lower.includes(k))) {
    complaintType = 'producto_defectuoso';
    score += 85;
  }

  // Price complaint keywords
  const priceKeywords = ['caro', 'muy caro', 'precio alto', 'precio muy alto', 'cobró más', 'cobro equivocado', 'precio incorrecto', 'precio es injusto'];
  if (priceKeywords.some(k => lower.includes(k))) {
    complaintType = 'precios_altos';
    score += 80;
  }

  // Service issue keywords
  const serviceKeywords = ['mal servicio', 'servicio malo', 'no me sirvió', 'decepción', 'queja', 'protesta', 'inconformidad'];
  if (serviceKeywords.some(k => lower.includes(k))) {
    complaintType = complaintType || 'servicio_erroneo';
    score += 75;
  }

  // Error/wrong item keywords
  const errorKeywords = ['error', 'equivocado', 'incorrecto', 'mal', 'confusión', 'confundieron', 'mandaron mal', 'equivocación'];
  if (errorKeywords.some(k => lower.includes(k))) {
    complaintType = complaintType || 'info_erronea';
    score += 70;
  }

  // Determine case type based on product mentions
  let caseType = 'reclamaciones'; // default

  // Tienda Física products from PDF
  const tiendaFisicaProducts = [
    'papel', 'carpeta', 'bolígrafo', 'lápiz', 'tijera', 'folder', 'sacapunta', 'sacapuntas',
    'liquid paper', 'sobre', 'cd', 'adhesivo', 'satinado', 'marcador', 'resaltador',
    'fotocopia', 'impresión', 'brochure', 'foto 2x2', 'lamina', 'cartonite'
  ];

  if (tiendaFisicaProducts.some(k => lower.includes(k))) {
    caseType = 'tienda_fisica';
  }

  return {
    is_complaint: score >= 50,
    case_type: score >= 50 ? caseType : null,
    complaint_tag: score >= 50 ? complaintType : null,
    confidence: Math.min(100, score),
  };
}

// Core: detect + create case. Safe to call from internal code without HTTP.
async function detectAndCreateComplaint({ messageText, phone, clientId, messageTimestamp }) {
  if (!messageText || !phone) {
    throw new Error('messageText and phone are required');
  }

  const analysis = detectComplaint(messageText);
  if (!analysis.is_complaint || !analysis.case_type) {
    return { is_complaint: false, case_type: null };
  }

  let client = null;
  if (clientId) {
    client = await Client.findById(clientId);
  } else {
    client = await Client.findByPhone(phone);
  }
  if (!client) {
    const err = new Error('Client not found');
    err.status = 404;
    throw err;
  }

  const caseNumber = `REC-${Date.now()}`;

  // Transaction: case + tags are atomic
  const txClient = await pool.connect();
  try {
    await txClient.query('BEGIN');
    const { rows } = await txClient.query(
      `INSERT INTO cases (case_number, title, description, case_type, client_id, user_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [caseNumber, 'Reclamación reportada vía WhatsApp', messageText, analysis.case_type, client.id, null]
    );
    const caseRecord = rows[0];

    if (analysis.complaint_tag) {
      await txClient.query(
        'INSERT INTO case_tags (case_id, tag_type, tag_value) VALUES ($1, $2, $3)',
        [caseRecord.id, 'complaint_type', analysis.complaint_tag]
      );
    }
    if (messageTimestamp) {
      await txClient.query(
        'INSERT INTO case_tags (case_id, tag_type, tag_value) VALUES ($1, $2, $3)',
        [caseRecord.id, 'source_message_timestamp', String(messageTimestamp)]
      );
      await txClient.query(
        'INSERT INTO case_tags (case_id, tag_type, tag_value) VALUES ($1, $2, $3)',
        [caseRecord.id, 'source_phone', phone]
      );
    }
    await txClient.query('COMMIT');

    console.log(`[Cases] Auto-created complaint case #${caseRecord.id} for ${phone}: ${analysis.case_type} (${analysis.complaint_tag})`);

    return {
      is_complaint: true,
      case_type: analysis.case_type,
      case_id: caseRecord.id,
      case_number: caseRecord.case_number,
      complaint_tag: analysis.complaint_tag,
      confidence: analysis.confidence,
    };
  } catch (e) {
    await txClient.query('ROLLBACK');
    throw e;
  } finally {
    txClient.release();
  }
}

router.use(authenticate);

// Admin/debug surface for complaint detection. Internal WA handler calls the
// function directly (no HTTP), so this route is not on the hot path.
router.post('/detect-and-create', complaintLimiter, async (req, res) => {
  try {
    const result = await detectAndCreateComplaint({
      messageText: req.body.message_text,
      phone: req.body.phone,
      clientId: req.body.client_id,
      messageTimestamp: req.body.message_timestamp,
    });
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('Complaint detection error:', err);
    res.status(500).json({ error: 'Complaint detection failed' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { status, client_id, case_type } = req.query;
    const cases = await Case.findAll({ status, clientId: client_id, caseType: case_type });
    res.json({ cases });
  } catch (err) {
    console.error('List cases error:', err);
    res.status(500).json({ error: 'Failed to list cases' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const caseRecord = await Case.findById(req.params.id);
    if (!caseRecord) return res.status(404).json({ error: 'Case not found' });
    res.json({ case: caseRecord });
  } catch (err) {
    console.error('Get case error:', err);
    res.status(500).json({ error: 'Failed to get case' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { case_number, title, description, case_type, client_id, court, next_hearing } = req.body;
    if (!case_number || !title || !client_id) {
      return res.status(400).json({ error: 'case_number, title, and client_id are required' });
    }
    const caseRecord = await Case.create({
      caseNumber: case_number,
      title,
      description,
      caseType: case_type,
      clientId: client_id,
      userId: req.user.id,
      court,
      nextHearing: next_hearing,
    });
    res.status(201).json({ case: caseRecord });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Case number already exists' });
    }
    console.error('Create case error:', err);
    res.status(500).json({ error: 'Failed to create case' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, description, status, case_type, court, next_hearing } = req.body;
    const fields = {};
    if (title !== undefined) fields.title = title;
    if (description !== undefined) fields.description = description;
    if (status !== undefined) fields.status = status;
    if (case_type !== undefined) fields.case_type = case_type;
    if (court !== undefined) fields.court = court;
    if (next_hearing !== undefined) fields.next_hearing = next_hearing;

    const caseRecord = await Case.update(req.params.id, fields);
    if (!caseRecord) return res.status(404).json({ error: 'Case not found' });
    res.json({ case: caseRecord });
  } catch (err) {
    console.error('Update case error:', err);
    res.status(500).json({ error: 'Failed to update case' });
  }
});

// Mark case as resolved (admin only)
router.post('/:id/resolve', requireRole('admin'), async (req, res) => {
  try {
    const caseRecord = await Case.update(req.params.id, { status: 'resolved' });
    if (!caseRecord) return res.status(404).json({ error: 'Case not found' });
    console.log(`[Cases] Case #${req.params.id} marked as resolved by ${req.user.username}`);
    res.json({ case: caseRecord, message: 'Case marked as resolved' });
  } catch (err) {
    console.error('Resolve case error:', err);
    res.status(500).json({ error: 'Failed to resolve case' });
  }
});

// Reopen a resolved case
router.post('/:id/reopen', requireRole('admin'), async (req, res) => {
  try {
    const caseRecord = await Case.update(req.params.id, { status: 'open' });
    if (!caseRecord) return res.status(404).json({ error: 'Case not found' });
    console.log(`[Cases] Case #${req.params.id} reopened by ${req.user.username}`);
    res.json({ case: caseRecord, message: 'Case reopened' });
  } catch (err) {
    console.error('Reopen case error:', err);
    res.status(500).json({ error: 'Failed to reopen case' });
  }
});

// Assign case to a user (employee/lawyer)
router.post('/:id/assign', requireRole('admin'), async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }
    const caseRecord = await Case.update(req.params.id, { user_id });
    if (!caseRecord) return res.status(404).json({ error: 'Case not found' });
    console.log(`[Cases] Case #${req.params.id} assigned to user ${user_id} by ${req.user.username}`);
    res.json({ case: caseRecord, message: 'Case assigned' });
  } catch (err) {
    console.error('Assign case error:', err);
    res.status(500).json({ error: 'Failed to assign case' });
  }
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const deleted = await Case.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Case not found' });
    res.json({ message: 'Case deleted' });
  } catch (err) {
    console.error('Delete case error:', err);
    res.status(500).json({ error: 'Failed to delete case' });
  }
});

module.exports = router;
module.exports.detectAndCreateComplaint = detectAndCreateComplaint;
