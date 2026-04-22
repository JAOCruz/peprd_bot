/**
 * PepRD — mensajes WhatsApp para Peppi.
 * Tono casual dominicano, profesional pero relajado.
 * NOTA: todos los productos son para uso de investigación, no consumo humano.
 */

const { buildListMessage } = require('../whatsapp/interactive');
const config = require('../config');

const B = config.business;
const DISCLAIMER_SHORT = `⚠️ Productos para uso de investigación. No consejo médico.`;

const MSG = {
  // ── Saludo / Bienvenida ──
  WELCOME_NEW:
    `🧬 ¡Hola! Soy *${B.botName}* de *${B.name}*.\n\n` +
    `${B.tagline}\n\n` +
    `¿En qué te ayudo? Puedes preguntarme por el catálogo, precios o dudas sobre un péptido específico.`,

  WELCOME_NEW_SHORT:
    `🧬 Hola, soy *${B.botName}* de *${B.name}*.\n\n` +
    `¿En qué te ayudo hoy?`,

  WELCOME_BACK: (name) =>
    `🧬 ¡${name}! Qué bueno verte de vuelta.\n\n¿En qué te ayudo?`,

  // ── Menú principal ──
  MAIN_MENU:
    `📋 *Menú — ${B.name}*\n\n` +
    `1️⃣ Cotización / hacer pedido\n` +
    `2️⃣ Agendar recogida / envío\n` +
    `3️⃣ Subir documentos / comprobantes\n` +
    `4️⃣ Estado de mi pedido\n` +
    `5️⃣ Info sobre un péptido\n` +
    `6️⃣ Catálogo y precios\n` +
    `7️⃣ Hablar con ventas\n` +
    `8️⃣ Generar factura/cotización\n` +
    `0️⃣ Salir`,

  MENU_HINT:
    `_Escribe *"menu"* para ver las opciones._`,

  INVALID_OPTION:
    `No capté bien eso. Elige un número del menú, por favor.`,

  // ── Intake ──
  INTAKE_ASK_NAME:
    `Perfecto. Para registrarte, dime tu *nombre completo*.`,

  INTAKE_ASK_EMAIL:
    `Listo. ¿Me das tu *correo electrónico*?\n\n(Escribe "omitir" si no quieres compartirlo)`,

  INTAKE_ASK_ADDRESS:
    `¿Cuál es tu *dirección* para envíos?\n\n(Escribe "omitir" si prefieres más tarde)`,

  INTAKE_ASK_CASE_TYPE:
    `¿Qué tipo de *péptidos* te interesan?\n\n` +
    `1️⃣ GLP-1 / Metabólicos (Sema, Tirz, Reta)\n` +
    `2️⃣ Hormona de crecimiento (CJC, Ipamorelin)\n` +
    `3️⃣ Reparación (BPC-157, TB-500)\n` +
    `4️⃣ Piel y cabello (GHK-Cu, Melanotan)\n` +
    `5️⃣ Nootrópicos (Semax, Selank)\n` +
    `6️⃣ Longevidad (Epitalon, NAD+, MOTS-c)\n` +
    `7️⃣ Sexual / Hormonal (PT-141, HCG)\n` +
    `8️⃣ Sistema inmune (TA-1, LL-37)\n` +
    `9️⃣ Otro`,

  INTAKE_ASK_DESCRIPTION:
    `Cuéntame en pocas palabras qué investigas o qué necesitas. Entre más específico mejor.`,

  INTAKE_ASK_URGENCY:
    `¿Qué tan urgente es tu pedido?\n\n` +
    `1️⃣ 🔴 Urgente (envío prioritario)\n` +
    `2️⃣ 🟡 Esta semana\n` +
    `3️⃣ 🟢 No hay prisa`,

  INTAKE_CONFIRM: (data) =>
    `📝 *Resumen de tu solicitud:*\n\n` +
    `👤 Nombre: ${data.name}\n` +
    `📧 Correo: ${data.email || 'No proporcionado'}\n` +
    `📍 Dirección: ${data.address || 'Pendiente'}\n` +
    `🧬 Categoría: ${data.caseType}\n` +
    `📄 Detalles: ${data.description}\n` +
    `🚨 Prioridad: ${data.urgency}\n\n` +
    `¿Correcto?\n\n` +
    `1️⃣ Sí, confirmar\n` +
    `2️⃣ No, corregir`,

  INTAKE_SUCCESS: (caseNumber) =>
    `✅ Tu solicitud quedó registrada.\n\n` +
    `📋 *Número de referencia:* ${caseNumber}\n\n` +
    `El equipo de ventas te contactará pronto. ${DISCLAIMER_SHORT}`,

  INTAKE_QUICK_QUESTION:
    `Dime, ¿en qué te ayudo? Escríbeme tu pregunta o el péptido que te interesa.`,

  INTAKE_QUICK_RECEIVED:
    `Listo, recibí tu mensaje. Un miembro del equipo te responde en breve.\n\nSi quieres registrarte para seguimiento, escribe *"registrarme"*.`,

  // ── Citas (pickup / envío) ──
  APPOINTMENT_INTRO:
    `📅 *Agendar recogida o envío*\n\n¿Qué tipo de cita?\n\n` +
    `1️⃣ Recogida en Santo Domingo\n` +
    `2️⃣ Coordinación de envío a otra ciudad\n` +
    `3️⃣ Consulta previa (videollamada)\n` +
    `4️⃣ Otro`,

  APPOINTMENT_ASK_DATE:
    `¿Para qué *fecha*?\n\nFormato: *DD/MM/AAAA* (ejemplo: 25/04/2026)`,

  APPOINTMENT_INVALID_DATE:
    `Esa fecha no es válida o ya pasó. Manda una fecha futura en formato *DD/MM/AAAA*.`,

  APPOINTMENT_NO_WEEKEND:
    `Los domingos no operamos. Elige un día de lunes a sábado.`,

  APPOINTMENT_SHOW_SLOTS: (date, slots) =>
    `📅 Disponible para *${date}*:\n\n` +
    slots.map((s, i) => `${i + 1}️⃣ ${s} hrs`).join('\n') +
    `\n\nElige el número del horario.`,

  APPOINTMENT_NO_SLOTS:
    `No tenemos horarios para esa fecha. Prueba otra.`,

  APPOINTMENT_CONFIRM: (data) =>
    `📅 *Confirmación:*\n\n` +
    `📌 Tipo: ${data.type}\n` +
    `📆 Fecha: ${data.date}\n` +
    `🕐 Hora: ${data.time} hrs\n\n` +
    `¿Confirmas?\n\n` +
    `1️⃣ Sí\n` +
    `2️⃣ No, elegir otro horario`,

  APPOINTMENT_SUCCESS: (data) =>
    `✅ Agendado: *${data.date}* a las *${data.time}*.\n\n` +
    `Te mandaremos recordatorio. Si necesitas cambiar, solo escríbeme.`,

  APPOINTMENT_CANCELLED:
    `Cita cancelada. Cuando quieras agendar de nuevo, escribe *menu*.`,

  // ── Documentos (comprobantes de pago, recetas, etc.) ──
  DOCUMENT_INTRO:
    `📎 *Subir documento*\n\n` +
    `¿Qué vas a enviar?\n\n` +
    `1️⃣ Comprobante de pago\n` +
    `2️⃣ Foto de identificación\n` +
    `3️⃣ Receta médica (si aplica)\n` +
    `4️⃣ Captura de producto que quieres\n` +
    `5️⃣ Otro`,

  DOCUMENT_ASK_DESCRIPTION:
    `Dame una *breve descripción* del documento (qué es / para qué).`,

  DOCUMENT_ASK_FILE:
    `Ahora envía el archivo (imagen o PDF).\n\n` +
    `🔒 Tratamos tus datos con confidencialidad.`,

  DOCUMENT_RECEIVED: (docId) =>
    `✅ Recibido.\n\n📋 Referencia: DOC-${docId}\n\n` +
    `¿Subir otro?\n\n1️⃣ Sí\n2️⃣ No, volver al menú`,

  DOCUMENT_INVALID_FILE:
    `No pude recibir el archivo. Mándalo como *imagen* o *PDF*.`,

  // ── Estado de pedido ──
  STATUS_ASK_NUMBER:
    `🔍 *Estado de pedido*\n\nEscribe tu número de referencia (ejemplo: PR-2026-0042)`,

  STATUS_FOUND: (c) =>
    `📋 *Tu pedido*\n\n` +
    `🧾 Ref: ${c.case_number || c.id}\n` +
    `📅 ${c.created_at ? new Date(c.created_at).toLocaleString('es-DO') : ''}\n` +
    `📌 Estado: ${c.status}\n` +
    `📝 ${c.description || ''}`,

  STATUS_LIST: (cases) =>
    `📋 *Tus pedidos:*\n\n` +
    cases.map((c, i) => `${i + 1}️⃣ ${c.case_number || c.id} — ${c.status}`).join('\n') +
    `\n\n_Escribe el número para ver detalles._`,

  STATUS_NO_CASES:
    `No encontré pedidos a tu nombre. Si tienes un número de referencia, mándamelo.`,

  STATUS_NOT_FOUND:
    `No encontré ese número. Verifícalo y prueba de nuevo.`,

  // ── Hablar con ventas (antes: lawyer) ──
  TALK_TO_SALES:
    `👤 Te conecto con el equipo de ventas.\n\n` +
    `📱 ${B.phone}\n` +
    `📧 ${B.email}\n\n` +
    `Mientras, cuéntame qué necesitas y te respondemos apenas podamos.`,

  TALK_TO_LAWYER:
    `👤 Te conecto con el equipo de ventas.\n\n📱 ${B.phone}\n\nCuéntame qué necesitas y te respondemos en breve.`,

  TALK_TO_LAWYER_URGENT:
    `🚨 Urgencia: te atendemos directo al ${B.phone}.\n\nMándame el contexto ahora y alguien te llama.`,

  // ── Generales ──
  GOODBYE:
    `Gracias por escribir a ${B.name} 🧬 Cualquier cosa, aquí estamos.`,

  HELP:
    `Puedes escribir:\n\n` +
    `• *menu* — ver opciones\n` +
    `• *catálogo* — ver péptidos disponibles\n` +
    `• *precio de [péptido]* — cotizar\n` +
    `• *envío* — info sobre logística\n` +
    `• *ventas* — hablar con el equipo\n\n` +
    `O simplemente pregúntame lo que necesitas.`,

  ERROR_GENERAL:
    `Algo falló de mi lado. Intenta de nuevo o escríbele directo al equipo: ${B.phone}`,

  DISCLAIMER: DISCLAIMER_SHORT,
};

// ── Listas interactivas de WhatsApp (opcional) ──
const LIST = {
  MAIN_MENU: {
    title: 'Menú',
    body: 'Elige una opción',
    footer: B.name,
    buttonText: 'Ver opciones',
    sections: [
      {
        title: 'Acciones',
        rows: [
          { id: '1', title: 'Cotización / Pedido' },
          { id: '2', title: 'Agendar recogida' },
          { id: '3', title: 'Subir documento' },
          { id: '4', title: 'Estado del pedido' },
          { id: '5', title: 'Info sobre péptido' },
          { id: '6', title: 'Catálogo y precios' },
          { id: '7', title: 'Hablar con ventas' },
          { id: '8', title: 'Generar factura' },
          { id: '0', title: 'Salir' },
        ],
      },
    ],
  },

  CASE_TYPE: {
    title: 'Categoría',
    body: '¿Qué tipo de péptidos te interesan?',
    buttonText: 'Elegir',
    sections: [
      {
        title: 'Categorías',
        rows: [
          { id: '1', title: 'GLP-1 / Metabólicos' },
          { id: '2', title: 'Hormona de crecimiento' },
          { id: '3', title: 'Reparación tisular' },
          { id: '4', title: 'Piel y cabello' },
          { id: '5', title: 'Nootrópicos' },
          { id: '6', title: 'Longevidad' },
          { id: '7', title: 'Sexual / Hormonal' },
          { id: '8', title: 'Sistema inmune' },
          { id: '9', title: 'Otro' },
        ],
      },
    ],
  },

  APPOINTMENT_TYPE: {
    title: 'Tipo de cita',
    body: '¿Qué necesitas agendar?',
    buttonText: 'Elegir',
    sections: [
      {
        title: 'Opciones',
        rows: [
          { id: '1', title: 'Recogida en SD' },
          { id: '2', title: 'Envío a otra ciudad' },
          { id: '3', title: 'Consulta previa' },
          { id: '4', title: 'Otro' },
        ],
      },
    ],
  },

  DOCUMENT_TYPE: {
    title: 'Tipo de documento',
    body: '¿Qué vas a enviar?',
    buttonText: 'Elegir',
    sections: [
      {
        title: 'Opciones',
        rows: [
          { id: '1', title: 'Comprobante de pago' },
          { id: '2', title: 'Identificación' },
          { id: '3', title: 'Receta médica' },
          { id: '4', title: 'Captura de producto' },
          { id: '5', title: 'Otro' },
        ],
      },
    ],
  },
};

module.exports = { MSG, LIST };
