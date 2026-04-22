const express = require('express');
const { routeMessage } = require('../conversation/engine');
const stateManager = require('../conversation/stateManager');

const router = express.Router();

const TEST_PREFIX = 'test-';

router.post('/message', async (req, res, next) => {
  try {
    const { text, sessionId } = req.body || {};
    if (!text || !String(text).trim()) {
      return res.status(400).json({ error: 'text requerido' });
    }
    const phone = `${TEST_PREFIX}${sessionId || 'default'}`;

    const responses = [];
    await routeMessage({
      phone,
      text: String(text).trim(),
      send: async (body, opts = {}) => {
        responses.push({ body, flow: opts.flow || null, step: opts.step || null });
      },
    });

    const session = await stateManager.get(phone);
    res.json({ responses, session: { flow: session.flow, step: session.step, data: session.data } });
  } catch (err) { next(err); }
});

router.post('/reset', async (req, res, next) => {
  try {
    const { sessionId } = req.body || {};
    const phone = `${TEST_PREFIX}${sessionId || 'default'}`;
    await stateManager.reset(phone);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.get('/state', async (req, res, next) => {
  try {
    const sessionId = req.query.sessionId || 'default';
    const phone = `${TEST_PREFIX}${sessionId}`;
    const session = await stateManager.get(phone);
    res.json({ flow: session.flow, step: session.step, data: session.data });
  } catch (err) { next(err); }
});

module.exports = router;
