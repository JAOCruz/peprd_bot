const { getSocket } = require('./connection');
const { normalizeJid } = require('./sender');

async function sendList(phone, { title, body, footer, buttonText, sections }) {
  const sock = getSocket();
  if (!sock) throw new Error('WhatsApp not connected');
  const jid = normalizeJid(phone);
  await sock.sendMessage(jid, {
    text: `${title ? `*${title}*\n\n` : ''}${body}`,
    footer,
    title,
    buttonText,
    sections,
  });
}

async function sendButtons(phone, { body, buttons, footer }) {
  const sock = getSocket();
  if (!sock) throw new Error('WhatsApp not connected');
  const jid = normalizeJid(phone);
  const templateButtons = buttons.map((b, i) => ({
    index: i + 1,
    quickReplyButton: { displayText: b.text, id: b.id },
  }));
  await sock.sendMessage(jid, { text: body, footer, templateButtons });
}

module.exports = { sendList, sendButtons };
