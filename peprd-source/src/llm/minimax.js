const axios = require('axios');
const config = require('../config');
const { SYSTEM_PROMPT } = require('./prompts');

const MINIMAX_URL = 'https://api.minimax.chat/v1/text/chatcompletion_v2';

async function generate(prompt, { model = 'abab6.5s-chat' } = {}) {
  if (!config.llm.minimaxApiKey) throw new Error('MiniMax not configured');
  const { data } = await axios.post(
    MINIMAX_URL,
    {
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${config.llm.minimaxApiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );
  return data?.choices?.[0]?.message?.content || '';
}

module.exports = { generate };
