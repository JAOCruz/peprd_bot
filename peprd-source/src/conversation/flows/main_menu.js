const messages = require('../messages');
const stateManager = require('../stateManager');
const Message = require('../../models/Message');
const { generateReply } = require('../../llm/gemini');

const KEYWORD_ROUTES = [
  { flow: 'menu',            re: /\b(cat[aá]logo|men[uú]|productos?|p[eé]ptidos?|qu[eé] tienen|qu[eé] venden)\b/i },
  { flow: 'order',           re: /\b(pedido|ordenar|comprar|cotizar|reservar|quiero.*(vial|mg|p[eé]ptido|bpc|tb[- ]?500|sema|tirz|retat))\b/i },
  { flow: 'peptide_consult', re: /\b(consulta|pregunta|qu[eé] es|para qu[eé] sirve|diferencia|dosis|protocolo|info(rmaci[oó]n)?.*(p[eé]ptido|bpc|tb|sema|retat|tirz)|bpc|tb[- ]?500|sema(glutide)?|tirzepatide|retatrutide|ipamorelin|ghk|mots|epitalon|pt[- ]?141|nad\+?)\b/i },
  { flow: 'info',            re: /\b(horario|ubicaci[oó]n|direcci[oó]n|d[oó]nde est[aá]n|tel[eé]fono|contacto|env[ií]o|env[ií]os|delivery|entrega|pago|precio|factura)\b/i },
  { flow: 'handoff',         re: /\b(persona|humano|agente|hablar con|representante|vendedor|ventas)\b/i },
];

async function transition(ctx, flow) {
  await stateManager.setFlow(ctx.phone, flow, 'start');
  ctx.session = await stateManager.get(ctx.phone);
  return require(`./${flow}`).handle(ctx);
}

async function handle(ctx) {
  const { text, send, session, phone, client } = ctx;

  if (session.step === 'start' || !session.step) {
    await send(messages.greeting(client?.name), { flow: 'main_menu', step: 'choose' });
    await send(messages.mainMenu(), { flow: 'main_menu', step: 'choose' });
    await stateManager.setStep(phone, 'choose');
    return;
  }

  const trimmed = (text || '').trim();
  const selection = parseInt(trimmed, 10);

  if (!Number.isNaN(selection) && selection >= 1 && selection <= 5) {
    const map = { 1: 'menu', 2: 'order', 3: 'peptide_consult', 4: 'info', 5: 'handoff' };
    return transition(ctx, map[selection]);
  }

  for (const { flow, re } of KEYWORD_ROUTES) {
    if (re.test(trimmed)) return transition(ctx, flow);
  }

  const recent = await Message.search({ phone, limit: 6 });
  const history = recent.reverse().filter((m) => m.body).slice(-6);

  const reply = await generateReply({
    userMessage: trimmed,
    clientName: client?.name,
    recentHistory: history,
  });

  if (reply) {
    await send(reply, { flow: 'main_menu', step: 'choose' });
  } else {
    await send(messages.fallback(), { flow: 'main_menu', step: 'choose' });
    await send(messages.mainMenu(), { flow: 'main_menu', step: 'choose' });
  }
}

module.exports = { handle };
