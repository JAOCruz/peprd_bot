const config = require('../config');
const { formatCurrency } = require('../utils/formatting');

const B = config.business;

const DISCLAIMER = `\n\n_⚠️ Productos para uso de investigación. No apto para consumo humano. Consulta con un profesional de la salud antes de cualquier uso._`;

const msg = {
  greeting: (name) =>
    `Hola${name ? ' ' + name : ''} 🧬 Soy *${B.botName}* de *${B.name}*.\n${B.tagline}\n\n¿En qué te ayudo?`,

  mainMenu: () =>
    `📋 *Menú*\n\n` +
    `1️⃣ Ver catálogo de péptidos\n` +
    `2️⃣ Hacer un pedido\n` +
    `3️⃣ Consulta sobre un péptido\n` +
    `4️⃣ Envíos, pagos y contacto\n` +
    `5️⃣ Hablar con ventas\n\n` +
    `_Responde con el número._`,

  categoryList: (categories) => {
    if (!categories.length) return '_Aún no hay categorías disponibles._';
    const lines = categories.map((c, i) => `${i + 1}. ${c.emoji || '•'} ${c.name}`);
    return `🧬 *Catálogo*\n\n${lines.join('\n')}\n\n_Escribe el número de la categoría._`;
  },

  productList: (products) => {
    if (!products.length) return '_No hay productos en esta categoría todavía._';
    const lines = products.map((p, i) => `${i + 1}. *${p.name}*${p.unit && p.unit !== 'unidad' ? ` (${p.unit})` : ''} — ${formatCurrency(p.price)}${p.description ? `\n   _${p.description}_` : ''}`);
    return `${lines.join('\n\n')}\n\n_Escribe el número para añadir al pedido, o "volver" para cambiar categoría._`;
  },

  cartSummary: (items, subtotal, deliveryFee = 0) => {
    const lines = items.map((it) => `• ${it.quantity}x ${it.product_name} — ${formatCurrency(it.unit_price * it.quantity)}`);
    const total = subtotal + deliveryFee;
    return `🧾 *Tu pedido*\n\n${lines.join('\n')}\n\nSubtotal: ${formatCurrency(subtotal)}${deliveryFee ? `\nEnvío: ${formatCurrency(deliveryFee)}` : ''}\n*Total: ${formatCurrency(total)}*`;
  },

  askQuantity: (productName) => `¿Cuántas unidades de *${productName}* quieres? (escribe un número)`,

  askFulfillment: () =>
    `¿Cómo prefieres recibir tu pedido?\n\n1️⃣ Recoger en Santo Domingo\n2️⃣ Envío discreto a domicilio${config.delivery.enabled ? '' : ' (no disponible)'}\n\n_Escribe el número._`,

  askAddress: () => `Escríbeme la *dirección de envío* (calle, número, sector, ciudad, referencia y tu nombre).`,

  askPayment: () =>
    `💳 ¿Método de pago?\n\n1️⃣ Transferencia bancaria RD\n2️⃣ Efectivo al entregar (solo SD)\n3️⃣ Crypto (USDT)\n\n_Escribe el número._`,

  askSchedule: () => `📅 ¿Alguna fecha preferida de entrega? (envíos locales típicamente 1-3 días, escribe "lo antes posible" si no importa)`,

  orderConfirmed: (orderNumber, total, fulfillment) =>
    `✅ *Pedido recibido*\n\nNúmero: *${orderNumber}*\nTotal: *${formatCurrency(total)}*\nModo: ${fulfillment === 'delivery' ? 'Envío discreto 📦' : 'Recoger en SD 🏪'}\n\nEl equipo de ventas te contactará en breve para confirmar pago y detalles de envío.${DISCLAIMER}`,

  info: () =>
    `📍 *${B.name}*\n\n` +
    `🕒 *Horario:* ${B.hours}\n` +
    `📍 *Base:* ${B.city}, RD\n` +
    `📞 *WhatsApp:* ${B.phone}\n` +
    `📧 *Correo:* ${B.email}\n` +
    `🌐 *Web:* https://peprd.io\n\n` +
    `*Envíos:* discretos a toda la isla, 1-3 días típicamente.\n` +
    `*Pagos:* transferencia bancaria RD, efectivo (solo SD), USDT.\n` +
    `*Pureza:* ≥99% confirmada por HPLC en cada lote.\n\n` +
    `_¿Algo más en lo que te ayude?_`,

  peptideConsultIntro: () =>
    `🧬 *Consulta sobre un péptido*\n\nDime el nombre del péptido o lo que estás investigando (ej: "BPC-157 para reparación de tejidos", "diferencia entre Tirzepatide y Semaglutide", "dosis típica de TB-500").\n\nTe doy información general de investigación — no es consejo médico.`,

  handoff: () =>
    `👤 Te conecto con el equipo de ventas. Mientras tanto, cuéntame qué necesitas y te responderemos lo antes posible.\n\nWhatsApp directo: ${config.business.phone}`,

  fallback: () => `No capté bien eso. Escribe *menu* para ver las opciones.`,

  goodbye: () => `Gracias por escribirnos 🧬 Cualquier cosa, aquí estamos.`,

  DISCLAIMER,
};

module.exports = msg;
