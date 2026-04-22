const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const { errorHandler } = require('./middleware/errorHandler');
const { startWhatsApp } = require('./whatsapp/connection');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', business: config.business.name, bot: config.business.botName });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/products', require('./routes/products'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/whatsapp', require('./routes/whatsapp'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/invoices', require('./routes/invoices'));

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`[${config.business.name}] API running on :${config.port}`);
  if (process.env.DISABLE_WA === 'true') {
    console.log('[WA] Disabled via DISABLE_WA=true — use /api/chat for testing.');
    return;
  }
  startWhatsApp().catch((err) => console.error('WhatsApp start failed:', err));
});
