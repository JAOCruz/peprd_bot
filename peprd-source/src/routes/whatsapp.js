const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { sendMessage } = require('../whatsapp/sender');
const { getConnectionStatus } = require('../whatsapp/connection');

const router = express.Router();

router.get('/status', (_req, res) => {
  res.json(getConnectionStatus());
});

router.post('/send', requireAuth, async (req, res, next) => {
  try {
    const { phone, text } = req.body;
    if (!phone || !text) return res.status(400).json({ error: 'phone y text requeridos' });
    await sendMessage(phone, text);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
