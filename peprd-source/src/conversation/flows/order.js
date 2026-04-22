const messages = require('../messages');
const stateManager = require('../stateManager');
const Product = require('../../models/Product');
const Order = require('../../models/Order');
const config = require('../../config');
const { naturalReply } = require('../llmFallback');

function cartSubtotal(cart = []) {
  return cart.reduce((s, it) => s + Number(it.unit_price) * it.quantity, 0);
}

async function soften(ctx, flowContext, reAskMessage, step) {
  const { send, phone, client, text } = ctx;
  const reply = await naturalReply({ phone, client, userText: text, flowContext });
  if (reply) await send(reply, { flow: 'order', step });
  await send(reAskMessage, { flow: 'order', step });
}

async function handle(ctx) {
  const { text, send, session, phone, client } = ctx;
  const step = session.step || 'start';
  const data = session.data || {};

  if (step === 'start') {
    await send('🛒 Perfecto, vamos a armar tu pedido. Déjame mostrarte lo que tenemos.', { flow: 'order', step: 'browse' });
    await stateManager.setFlow(phone, 'menu', 'start', { cart: data.cart || [] });
    return require('./menu').handle({ ...ctx, session: await stateManager.get(phone) });
  }

  if (step === 'add_item') {
    const product = await Product.findById(data.pendingProductId);
    if (!product) {
      await send(messages.fallback());
      return;
    }
    await stateManager.setStep(phone, 'ask_quantity', { pendingProduct: product });
    await send(messages.askQuantity(product.name), { flow: 'order', step: 'ask_quantity' });
    return;
  }

  if (step === 'ask_quantity') {
    const qty = parseInt(text, 10);
    if (Number.isNaN(qty) || qty < 1) {
      return soften(ctx,
        `Pidiendo cantidad del producto "${data.pendingProduct?.name}".`,
        `¿Cuántas unidades de *${data.pendingProduct?.name}* deseas? (escribe un número)`,
        'ask_quantity');
    }
    const product = data.pendingProduct;
    const cart = [...(data.cart || []), {
      product_id: product.id,
      product_name: product.name,
      quantity: qty,
      unit_price: Number(product.price),
    }];
    await stateManager.patchData(phone, { cart, pendingProduct: null, pendingProductId: null });
    const subtotal = cartSubtotal(cart);
    await send(messages.cartSummary(cart, subtotal), { flow: 'order', step: 'cart_actions' });
    await send(
      '¿Deseas algo más?\n\n1️⃣ Agregar otro producto\n2️⃣ Finalizar pedido\n3️⃣ Vaciar carrito',
      { flow: 'order', step: 'cart_actions' }
    );
    await stateManager.setStep(phone, 'cart_actions');
    return;
  }

  if (step === 'cart_actions') {
    const n = parseInt(text, 10);
    if (n === 1) {
      await stateManager.setFlow(phone, 'menu', 'start', { cart: data.cart || [] });
      return require('./menu').handle({ ...ctx, session: await stateManager.get(phone) });
    }
    if (n === 2) {
      if (!(data.cart || []).length) { await send('Tu carrito está vacío.'); return; }
      await stateManager.setStep(phone, 'ask_fulfillment');
      await send(messages.askFulfillment(), { flow: 'order', step: 'ask_fulfillment' });
      return;
    }
    if (n === 3) {
      await stateManager.patchData(phone, { cart: [] });
      await send('🧹 Carrito vaciado.');
      await stateManager.setFlow(phone, 'main_menu', 'start');
      return require('./main_menu').handle({ ...ctx, session: await stateManager.get(phone) });
    }
    return soften(ctx,
      'En el carrito, eligiendo acción (1 agregar, 2 finalizar, 3 vaciar).',
      '¿Qué prefieres?\n\n1️⃣ Agregar otro producto\n2️⃣ Finalizar pedido\n3️⃣ Vaciar carrito',
      'cart_actions');
  }

  if (step === 'ask_fulfillment') {
    const n = parseInt(text, 10);
    if (n === 1) {
      await stateManager.patchData(phone, { fulfillment: 'pickup', deliveryFee: 0 });
      await stateManager.setStep(phone, 'ask_schedule');
      await send(messages.askSchedule(), { flow: 'order', step: 'ask_schedule' });
      return;
    }
    if (n === 2) {
      if (!config.delivery.enabled) { await send('Lo sentimos, delivery no está disponible.'); return; }
      await stateManager.patchData(phone, { fulfillment: 'delivery', deliveryFee: config.delivery.feeBase });
      await stateManager.setStep(phone, 'ask_address');
      await send(messages.askAddress(), { flow: 'order', step: 'ask_address' });
      return;
    }
    return soften(ctx,
      'Eligiendo entrega (1 recoger, 2 delivery).',
      messages.askFulfillment(),
      'ask_fulfillment');
  }

  if (step === 'ask_address') {
    await stateManager.patchData(phone, { deliveryAddress: text });
    await stateManager.setStep(phone, 'ask_schedule');
    await send(messages.askSchedule(), { flow: 'order', step: 'ask_schedule' });
    return;
  }

  if (step === 'ask_schedule') {
    await stateManager.patchData(phone, { scheduleText: text });
    await stateManager.setStep(phone, 'ask_payment');
    await send(messages.askPayment(), { flow: 'order', step: 'ask_payment' });
    return;
  }

  if (step === 'ask_payment') {
    const map = { 1: 'cash', 2: 'transfer', 3: 'card' };
    const method = map[parseInt(text, 10)];
    if (!method) {
      return soften(ctx,
        'Eligiendo método de pago (1 efectivo, 2 transferencia, 3 tarjeta).',
        messages.askPayment(),
        'ask_payment');
    }
    await stateManager.patchData(phone, { paymentMethod: method });
    const d = { ...(await stateManager.get(phone)).data };
    const subtotal = cartSubtotal(d.cart);
    await send(
      messages.cartSummary(d.cart, subtotal, d.deliveryFee || 0) +
      `\n\nEntrega: ${d.fulfillment === 'delivery' ? d.deliveryAddress : 'Recoger en tienda'}\nFecha: ${d.scheduleText}\nPago: ${method}\n\n¿Confirmar pedido? (responde *sí* o *no*)`,
      { flow: 'order', step: 'confirm' }
    );
    await stateManager.setStep(phone, 'confirm');
    return;
  }

  if (step === 'confirm') {
    if (!/^s[ií]|^si|^confirmar|^ok$/i.test(text.trim())) {
      await send('Pedido cancelado. Escribe *menu* para empezar de nuevo.');
      await stateManager.reset(phone);
      return;
    }
    const d = data;
    const order = await Order.create({
      clientId: client.id,
      items: d.cart,
      fulfillment: d.fulfillment,
      deliveryAddress: d.deliveryAddress,
      deliveryFee: d.deliveryFee || 0,
      paymentMethod: d.paymentMethod,
      scheduledFor: null,
      notes: d.scheduleText ? `Solicitado para: ${d.scheduleText}` : null,
    });
    await send(messages.orderConfirmed(order.order_number, order.total, order.fulfillment), { flow: 'order', step: 'done' });
    await stateManager.reset(phone);
    return;
  }
}

module.exports = { handle };
