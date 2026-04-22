const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const config = require('../config');
const { handleIncoming } = require('./handler');

let sock = null;
let connectionStatus = { connected: false, qr: null, lastError: null };

async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(config.whatsapp.sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'warn' }),
    printQRInTerminal: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      connectionStatus.qr = qr;
      qrcode.generate(qr, { small: true });
      console.log('[WA] Scan the QR above to connect.');
    }
    if (connection === 'open') {
      connectionStatus = { connected: true, qr: null, lastError: null };
      console.log('[WA] Connected.');
    }
    if (connection === 'close') {
      connectionStatus.connected = false;
      const reason = lastDisconnect?.error?.output?.statusCode;
      connectionStatus.lastError = lastDisconnect?.error?.message || null;
      const shouldReconnect = reason !== DisconnectReason.loggedOut;
      console.log(`[WA] Disconnected (${reason}). Reconnect: ${shouldReconnect}`);
      if (shouldReconnect) setTimeout(() => startWhatsApp().catch(console.error), 3000);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;
      try {
        await handleIncoming(sock, msg);
      } catch (err) {
        console.error('[WA] handleIncoming error', err);
      }
    }
  });

  return sock;
}

function getSocket() { return sock; }
function getConnectionStatus() { return connectionStatus; }

module.exports = { startWhatsApp, getSocket, getConnectionStatus };
