const { sendMessage } = require('./sender');
const { routeMessage } = require('../conversation/engine');

function extractText(msg) {
  const m = msg.message || {};
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.buttonsResponseMessage?.selectedButtonId ||
    m.listResponseMessage?.singleSelectReply?.selectedRowId ||
    ''
  ).trim();
}

async function handleIncoming(_sock, msg) {
  const jid = msg.key.remoteJid;
  if (!jid || jid.endsWith('@g.us') || jid.endsWith('@broadcast')) return;
  const phone = jid.split('@')[0];
  const text = extractText(msg);
  if (!text) return;

  await routeMessage({
    phone,
    text,
    send: async (body) => sendMessage(phone, body),
  });
}

module.exports = { handleIncoming };
