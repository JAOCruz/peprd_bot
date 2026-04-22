const Message = require('../models/Message');
const { generateReply } = require('../llm/gemini');

async function naturalReply({ phone, client, userText, flowContext }) {
  try {
    const recent = await Message.search({ phone, limit: 6 });
    const history = recent.reverse().filter((m) => m.body).slice(-6);
    const augmentedText = flowContext
      ? `${userText}\n\n[Contexto interno (no mencionar): el cliente está en el flujo "${flowContext}"]`
      : userText;
    const reply = await generateReply({
      userMessage: augmentedText,
      clientName: client?.name,
      recentHistory: history,
    });
    return reply && reply.trim() ? reply.trim() : null;
  } catch (err) {
    console.warn('[llmFallback] error:', err.message);
    return null;
  }
}

module.exports = { naturalReply };
