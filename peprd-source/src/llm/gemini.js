const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');
const { SYSTEM_PROMPT, QUOTE_PROMPT, CHAT_PROMPT } = require('./prompts');
const minimax = require('./minimax');

const MODEL_CHAIN = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest'];

let client = null;
function getClient() {
  if (!config.llm.geminiApiKey) return null;
  if (!client) client = new GoogleGenerativeAI(config.llm.geminiApiKey);
  return client;
}

async function generate(prompt, { model } = {}) {
  const c = getClient();
  if (!c) throw new Error('Gemini not configured');
  const models = model ? [model] : MODEL_CHAIN;
  let lastErr;
  for (const m of models) {
    try {
      const gen = c.getGenerativeModel({ model: m, systemInstruction: SYSTEM_PROMPT });
      const result = await gen.generateContent(prompt);
      return result.response.text().trim();
    } catch (err) {
      lastErr = err;
      console.warn(`[Gemini] ${m} failed:`, err.message?.slice(0, 120));
    }
  }
  throw lastErr || new Error('All Gemini models failed');
}

async function generateWithFallback(prompt, opts) {
  try {
    return await generate(prompt, opts);
  } catch (err) {
    console.warn('[Gemini] all models failed, trying MiniMax:', err.message?.slice(0, 120));
    try {
      return await minimax.generate(prompt);
    } catch (err2) {
      console.warn('[MiniMax] also failed:', err2.message?.slice(0, 120));
      return null;
    }
  }
}

async function generateQuote({ brief, clientName }) {
  return generateWithFallback(QUOTE_PROMPT({ brief, clientName }));
}

async function generateReply({ userMessage, clientName, recentHistory }) {
  return generateWithFallback(CHAT_PROMPT({ userMessage, clientName, recentHistory }));
}

module.exports = { generate, generateWithFallback, generateQuote, generateReply };
