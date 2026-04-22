const messages = require('../messages');
const stateManager = require('../stateManager');
const Product = require('../../models/Product');
const { naturalReply } = require('../llmFallback');

async function handle(ctx) {
  const { text, send, session, phone, client } = ctx;

  if (session.step === 'start' || !session.step) {
    const categories = await Product.listCategories();
    await stateManager.patchData(phone, { categories: categories.map((c) => c.slug) });
    await stateManager.setStep(phone, 'choose_category');
    await send(messages.categoryList(categories), { flow: 'menu', step: 'choose_category' });
    return;
  }

  if (session.step === 'choose_category') {
    if (/^(volver|menu|inicio|atr[aá]s|salir)/i.test(text)) {
      await stateManager.setFlow(phone, 'main_menu', 'start');
      return require('./main_menu').handle({ ...ctx, session: await stateManager.get(phone) });
    }
    const idx = parseInt(text, 10) - 1;
    const slugs = session.data?.categories || [];
    if (Number.isNaN(idx) || idx < 0 || idx >= slugs.length) {
      const reply = await naturalReply({
        phone, client, userText: text,
        flowContext: 'Eligiendo una categoría del menú. Las categorías están listadas arriba.',
      });
      if (reply) await send(reply, { flow: 'menu', step: 'choose_category' });
      const categories = await Product.listCategories();
      await send(messages.categoryList(categories), { flow: 'menu', step: 'choose_category' });
      return;
    }
    const slug = slugs[idx];
    const products = await Product.listByCategory(slug);
    await stateManager.patchData(phone, { currentCategory: slug, productIds: products.map((p) => p.id) });
    await stateManager.setStep(phone, 'show_products');
    await send(messages.productList(products), { flow: 'menu', step: 'show_products' });
    return;
  }

  if (session.step === 'show_products') {
    if (/^(volver|menu|inicio|atr[aá]s|salir|categor)/i.test(text)) {
      await stateManager.setStep(phone, 'start');
      return handle({ ...ctx, session: await stateManager.get(phone) });
    }
    const idx = parseInt(text, 10) - 1;
    const ids = session.data?.productIds || [];
    if (Number.isNaN(idx) || idx < 0 || idx >= ids.length) {
      const reply = await naturalReply({
        phone, client, userText: text,
        flowContext: 'Viendo productos de una categoría. Puede elegir un número o escribir "volver".',
      });
      if (reply) await send(reply, { flow: 'menu', step: 'show_products' });
      const products = await Product.listByCategory(session.data?.currentCategory);
      await send(messages.productList(products), { flow: 'menu', step: 'show_products' });
      return;
    }
    await stateManager.setFlow(phone, 'order', 'add_item', {
      pendingProductId: ids[idx],
      cart: session.data?.cart || [],
    });
    return require('./order').handle({ ...ctx, session: await stateManager.get(phone) });
  }
}

module.exports = { handle };
