const messages = require('../messages');
const stateManager = require('../stateManager');

async function handle(ctx) {
  const { send, phone } = ctx;
  await send(messages.info(), { flow: 'info', step: 'done' });
  await stateManager.reset(phone);
}

module.exports = { handle };
