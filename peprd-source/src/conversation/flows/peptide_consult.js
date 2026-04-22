const messages = require('../messages');
const stateManager = require('../stateManager');
const { generateReply } = require('../../llm/gemini');
const Message = require('../../models/Message');

async function handle(ctx) {
  const { text, send, session, phone, client } = ctx;

  if (session.step === 'start' || !session.step) {
    await send(messages.peptideConsultIntro(), { flow: 'peptide_consult', step: 'ask' });
    await stateManager.setStep(phone, 'ask');
    return;
  }

  if (session.step === 'ask') {
    await send('🔬 Buscando información...', { flow: 'peptide_consult', step: 'answering' });
    const recent = await Message.search({ phone, limit: 8 });
    const history = recent.reverse().filter((m) => m.body).slice(-8);

    const query = `
Consulta de investigación del cliente sobre péptidos:
"""
${text}
"""

Da información general de investigación (mecanismo de acción, usos en estudios, rango de dosis típica reportada en literatura si aplica). Sé breve (3-5 líneas) y claro.

REGLAS ESTRICTAS:
- Aclara que es información de investigación, no consejo médico
- Sugiere consultar a un profesional de la salud antes de cualquier uso
- No receta ni da protocolos específicos personalizados
- Si el cliente menciona condiciones médicas personales, redirige: "para tu caso específico, mejor consulta un médico"
- Termina invitando a ver el catálogo si el péptido está disponible: "escribe *menu* para ver el catálogo"
`;

    try {
      const reply = await generateReply({
        userMessage: query,
        clientName: client?.name,
        recentHistory: history,
      });

      if (reply) {
        await send(reply, { flow: 'peptide_consult', step: 'followup' });
      } else {
        await send('Déjame consultarlo con el equipo y te respondo. Mientras, puedes escribir *menu* para ver el catálogo.', { flow: 'peptide_consult', step: 'followup' });
      }
    } catch (err) {
      await send('Tuve un problema consultando. Un agente te responderá pronto.', { flow: 'peptide_consult', step: 'followup' });
    }

    await send(messages.DISCLAIMER.trim(), { flow: 'peptide_consult', step: 'followup' });
    await send('¿Otra consulta o quieres ver el catálogo? Escribe *menu* para volver al inicio.', {
      flow: 'peptide_consult',
      step: 'followup',
    });
    await stateManager.setStep(phone, 'followup');
    return;
  }

  if (session.step === 'followup') {
    if (/^(menu|volver|inicio|salir)/i.test(text)) {
      await stateManager.setFlow(phone, 'main_menu', 'start');
      return require('./main_menu').handle({ ...ctx, session: await stateManager.get(phone) });
    }
    await stateManager.setStep(phone, 'ask');
    return handle({ ...ctx, session: await stateManager.get(phone), text });
  }
}

module.exports = { handle };
