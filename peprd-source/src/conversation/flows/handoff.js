const messages = require('../messages');
const stateManager = require('../stateManager');

async function handle(ctx) {
  const { send, phone } = ctx;
  await send(messages.handoff(), { flow: 'handoff', step: 'done' });
  await stateManager.reset(phone);
}

module.exports = { handle };
