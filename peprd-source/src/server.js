const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const config = require('./config');
const { reconnectSavedSessions } = require('./whatsapp/connection');
const { handleIncomingMessage } = require('./whatsapp/handler');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const clientRoutes = require('./routes/clients');
const caseRoutes = require('./routes/cases');
const messageRoutes = require('./routes/messages');
const whatsappRoutes = require('./routes/whatsapp');
const dashboardRoutes = require('./routes/dashboard');
const mediaRoutes = require('./routes/media');
const invoiceRoutes = require('./routes/invoices');
const broadcastRoutes = require('./routes/broadcasts');
const { sendBroadcast } = require('./routes/broadcasts');
const servicesRoutes = require('./routes/services');
const documentRoutes = require('./routes/documents');

const app = express();

app.set('trust proxy', 1);
app.use(helmet({
  // The admin SPA is served from the same origin; keep CSP off for now so Vite's
  // inline-module bootstrap + Google Fonts don't break. Revisit when we harden the client.
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/broadcasts', broadcastRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/documents', documentRoutes);

// Scheduler: check every 60s for scheduled broadcasts due to send
setInterval(async () => {
  try {
    const Broadcast = require('./models/Broadcast');
    const pending = await Broadcast.getPendingScheduled();
    for (const b of pending) {
      console.log(`[Scheduler] Sending scheduled broadcast #${b.id}`);
      sendBroadcast(b.id).catch(err => console.error('[Scheduler] Error:', err.message));
    }
  } catch (err) {
    console.error('[Scheduler] Check error:', err.message);
  }
}, 60000);

// Serve built admin panel (client/dist) in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get(/^\/(?!api\/|health$).*/, (req, res, next) => {
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) next();
  });
});

// Error handler: log full detail server-side, return generic message to client.
app.use((err, req, res, next) => {
  if (config.nodeEnv === 'production') {
    console.error('Unhandled error:', err.message);
  } else {
    console.error('Unhandled error:', err);
  }
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port} [${config.nodeEnv}]`);

  // Auto-reconnect saved WhatsApp sessions
  reconnectSavedSessions(handleIncomingMessage).catch(err => {
    console.error('[WA] Auto-reconnect error:', err.message);
  });
});
