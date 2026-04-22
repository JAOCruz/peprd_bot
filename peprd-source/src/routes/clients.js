const express = require('express');
const { requireAuth } = require('../middleware/auth');
const Client = require('../models/Client');

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const clients = await Client.list({
      limit: parseInt(req.query.limit || '50', 10),
      offset: parseInt(req.query.offset || '0', 10),
    });
    res.json(clients);
  } catch (err) { next(err); }
});

router.get('/:phone', async (req, res, next) => {
  try {
    const client = await Client.findByPhone(req.params.phone);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(client);
  } catch (err) { next(err); }
});

router.patch('/:phone', async (req, res, next) => {
  try {
    const updated = await Client.upsert(req.params.phone, req.body);
    res.json(updated);
  } catch (err) { next(err); }
});

module.exports = router;
