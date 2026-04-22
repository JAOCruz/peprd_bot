const Client = require('../models/Client');
const Message = require('../models/Message');
const stateManager = require('./stateManager');
const { detectIntent } = require('./nlp');
const flows = require('./flows');

async function routeMessage({ phone, text, send }) {
  const client = await Client.upsert(phone, {});
  await Message.log({ phone, clientId: client.id, direction: 'in', body: text });

  const wrappedSend = async (body, opts = {}) => {
    await Message.log({
      phone,
      clientId: client.id,
      direction: 'out',
      body,
      flow: opts.flow,
      step: opts.step,
    });
    await send(body, opts);
  };

  const session = await stateManager.get(phone);
  const ctx = { phone, text, client, session, send: wrappedSend };

  if (session.flow && flows[session.flow]) {
    await flows[session.flow].handle(ctx);
    return;
  }

  const intent = detectIntent(text);
  const flowName = intent.flow || 'main_menu';
  await stateManager.setFlow(phone, flowName, 'start', intent.data || {});
  ctx.session = await stateManager.get(phone);
  await flows[flowName].handle(ctx);
}

module.exports = { routeMessage };
