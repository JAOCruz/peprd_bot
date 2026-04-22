const express = require('express');
const { requireAuth } = require('../middleware/auth');
const Message = require('../models/Message');

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const rows = await Message.search({
      q: req.query.q,
      phone: req.query.phone,
      limit: parseInt(req.query.limit || '100', 10),
    });
    res.json(rows);
  } catch (err) { next(err); }
});

module.exports = router;
