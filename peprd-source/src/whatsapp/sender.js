const { getSocket } = require('./connection');

function normalizeJid(phone) {
  if (!phone) return null;
  if (phone.includes('@')) return phone;
  return `${String(phone).replace(/\D/g, '')}@s.whatsapp.net`;
}

async function sendMessage(phone, text) {
  const sock = getSocket();
  if (!sock) throw new Error('WhatsApp not connected');
  await sock.sendMessage(normalizeJid(phone), { text });
}

async function sendImage(phone, imagePath, caption) {
  const sock = getSocket();
  if (!sock) throw new Error('WhatsApp not connected');
  await sock.sendMessage(normalizeJid(phone), { image: { url: imagePath }, caption: caption || '' });
}

async function sendDocument(phone, docPath, fileName, mimetype = 'application/pdf') {
  const sock = getSocket();
  if (!sock) throw new Error('WhatsApp not connected');
  await sock.sendMessage(normalizeJid(phone), { document: { url: docPath }, fileName, mimetype });
}

module.exports = { sendMessage, sendImage, sendDocument, normalizeJid };
