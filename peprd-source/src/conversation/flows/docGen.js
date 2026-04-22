/**
 * Smart Document Generation Flow
 * 
 * Collects required fields in any order:
 * - Client can send cédula images → auto-extracted
 * - Client can send text with data in any format
 * - AI identifies what was provided, asks only for what's missing
 * - Generates and sends the filled .docx when complete
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { transitionTo, updateData } = require('../stateManager');

/**
 * Quick check: is this message a question/topic change unrelated to the current document flow?
 * Uses a lightweight Gemini call to classify intent.
 */
async function detectOffTopic(text, templateKey) {
  if (!text || text.trim().length < 4) return false;
  // Fast local heuristics first (avoid API call for obvious cases)
  const lower = text.toLowerCase();
  // If it looks like data (cédula pattern, address, number, name), it's on-topic
  if (/\d{3}-\d{7}-\d/.test(text)) return false; // cédula
  if (/^\d[\d,. ]+$/.test(text.trim())) return false; // number/amount
  if (lower.startsWith('calle') || lower.startsWith('av') || lower.includes('#')) return false; // address
  // If it's a question about something else
  const questionWords = ['cómo', 'como', 'cuánto', 'cuanto', 'qué', 'que', 'precio', 'cuál es el precio', 'apostilla', 'costo', 'cuánto cuesta', 'puedo', 'pueden'];
  const isQuestion = questionWords.some(w => lower.includes(w)) && !lower.includes('nombre') && !lower.includes('cédula') && !lower.includes('cedula') && !lower.includes('dirección') && !lower.includes('monto') && !lower.includes('precio de venta');
  return isQuestion;
}
const { TEMPLATES, getNextQuestion, getMissingFields } = require('../../documents/templateFields');
const { extractFields } = require('../../documents/extractor');
const { generateDocument } = require('../../documents/generator');
const fs = require('fs');

/**
 * Format a question for the client
 */
function formatQuestion(field, templateKey, collectedData) {
  const template = TEMPLATES[templateKey];
  const missingCount = getMissingFields(templateKey, collectedData).length;
  
  let q = `📝 `;
  if (missingCount > 1) q += `(${missingCount} datos restantes)\n\n`;
  
  q += `¿Cuál es el *${field.label}*?`;
  
  if (field.fromImage) {
    q += `\n\n_Puedes escribirlo o enviar una foto de la cédula_ 📷`;
  }
  
  return q;
}

/**
 * Build a status summary of collected data
 */
function buildStatusSummary(templateKey, collectedData) {
  const template = TEMPLATES[templateKey];
  const missing = getMissingFields(templateKey, collectedData);
  const collected = template.fields.filter(f => f.required && !f.auto && !f.hidden && collectedData[f.key]);
  
  let msg = `📋 *${template.emoji} ${template.name}*\n\n`;
  
  if (collected.length > 0) {
    msg += `✅ *Datos recibidos:*\n`;
    collected.forEach(f => {
      msg += `• ${f.label}: ${collectedData[f.key]}\n`;
    });
    msg += '\n';
  }
  
  if (missing.length > 0) {
    msg += `⏳ *Falta:*\n`;
    missing.forEach(f => msg += `• ${f.label}\n`);
  }
  
  return msg;
}

async function handle(session, text, msg, savedMedia = null) {
  const step = session.step;
  const data = session.data || {};
  const templateKey = data.docGenTemplate;

  // Step 1: Template was detected, confirm and start
  if (step === 'confirm_template') {
    const template = TEMPLATES[templateKey];

    // If images were sent with the initial request, extract data from them immediately
    let preCollected = {};
    const imagePath = savedMedia?.file_path || null;
    const allMedia = savedMedia?.allMedia || null;

    if (imagePath || allMedia) {
      try {
        console.log('[DocGen] Images detected on confirm_template — pre-extracting...');
        preCollected = await extractFields(text, imagePath, templateKey, {}, allMedia);
        console.log('[DocGen] Pre-extracted:', JSON.stringify(preCollected));
      } catch (err) {
        console.error('[DocGen] Pre-extraction error:', err.message);
        preCollected = {};
      }
    }

    const extracted = Object.entries(preCollected).filter(([, v]) => v);
    const missing = getMissingFields(templateKey, preCollected);

    let intro = `✨ *${template.emoji} ${template.name}*\n\n`;

    if (extracted.length > 0) {
      // Tell user what we already got from their documents
      intro += `📄 *Identifiqué lo siguiente en tus documentos:*\n`;
      extracted.forEach(([k, v]) => {
        const field = template.fields.find(f => f.key === k);
        if (field) intro += `• *${field.label}:* ${v}\n`;
      });
      intro += '\n';
    }

    if (missing.length === 0) {
      // All data already extracted — go straight to generating
      await transitionTo(session, 'doc_generation', 'generating', { ...data, docGenCollected: preCollected });
      return await generateAndSend(session, templateKey, preCollected, msg);
    }

    // Ask only for what's missing
    if (extracted.length > 0) {
      intro += `*Solo falta:*\n`;
      missing.forEach(f => {
        intro += `• ${f.label}`;
        if (f.fromImage) intro += ` _(foto de cédula o texto)_`;
        intro += '\n';
      });
      intro += `\n¿Puedes enviar el *${missing[0].label}*?`;
    } else {
      // Nothing pre-extracted — show full list
      intro += `Voy a preparar este documento. Necesito los siguientes datos:\n\n`;
      const allFields = template.fields.filter(f => f.required && !f.auto && !f.hidden);
      allFields.forEach(f => {
        intro += `• ${f.label}`;
        if (f.fromImage) intro += ` _(foto de cédula o texto)_`;
        intro += '\n';
      });
      intro += `\nPuedes enviar la información en cualquier orden, como texto o fotos de cédulas. Yo identifico los datos automáticamente 🤖\n\n`;
      intro += `*Empecemos:* ¿Cuál es el ${missing[0].label}?`;
      if (missing[0].fromImage) intro += `\n_Puedes enviar foto de cédula 📷_`;
    }

    await transitionTo(session, 'doc_generation', 'collecting', { ...data, docGenCollected: preCollected });
    return intro;
  }

  // Step 2: Collecting data
  if (step === 'collecting') {
    const collected = data.docGenCollected || {};
    
    // Extract data from whatever was sent (text + optional image)
    const imagePath = savedMedia?.file_path || null;
    const allMedia = savedMedia?.allMedia || null; // batch images

    let newData = {};
    
    // If it's a skip/cancel
    if (/^(cancelar|salir|cancel|no\s*gracias|menu|inicio)$/i.test(text.trim()) || text.trim() === '0') {
      await transitionTo(session, 'main_menu', 'show', {});
      return '❌ Proceso cancelado. ¿En qué más te puedo ayudar?';
    }

    // Detect if user completely changed topic (asks a question unrelated to the document)
    const isOffTopic = await detectOffTopic(text, templateKey);
    if (isOffTopic) {
      // Answer their question via smart fallback, then remind about pending doc
      const { searchKnowledge, formatSearchResults } = require('../../knowledge/search');
      const { generateLegalResponse } = require('../../llm/generate');
      const template = TEMPLATES[templateKey];
      const results = searchKnowledge(text);
      const kbContext = results.length > 0 ? formatSearchResults(results, 1) : '';
      const answer = await generateLegalResponse(text, kbContext, []);
      const reminder = `\n\n---\n📝 _Cuando quieras continuar con tu *${template.name}*, simplemente envía el dato que falta o escribe *cancelar* para terminar._`;
      return (answer || 'Claro, con gusto te ayudo con eso.') + reminder;
    }

    // If user says "no" for optional garante
    if (text.trim().toLowerCase() === 'no' || text.trim().toLowerCase() === 'no aplica') {
      const nextMissing = getMissingFields(templateKey, collected);
      if (nextMissing[0] && !nextMissing[0].required) {
        newData[nextMissing[0].key] = null;
        newData[`${nextMissing[0].key}_cedula`] = null;
      }
    } else {
      // Use AI to extract fields from message + image
      try {
        newData = await extractFields(text, imagePath, templateKey, collected, allMedia);
        console.log('[DocGen] Extracted:', JSON.stringify(newData));
      } catch (err) {
        console.error('[DocGen] Extraction error:', err.message);
        newData = {};
      }
    }

    // Merge new data with collected
    const updatedCollected = { ...collected };
    for (const [k, v] of Object.entries(newData)) {
      if (v !== null && v !== undefined && v !== '') {
        updatedCollected[k] = v;
      }
    }

    await updateData(session, { docGenCollected: updatedCollected });

    // Check if we have everything
    const missing = getMissingFields(templateKey, updatedCollected);
    
    if (missing.length === 0) {
      // For acto_venta_vehiculo: ask about optional apoderado before generating
      if (templateKey === 'acto_venta_vehiculo' && updatedCollected.apoderado_asked !== 'yes') {
        await updateData(session, { docGenCollected: { ...updatedCollected, apoderado_asked: 'yes' } });
        await transitionTo(session, 'doc_generation', 'asking_apoderado', { ...data, docGenCollected: { ...updatedCollected, apoderado_asked: 'yes' } });
        return `✅ *Casi listo!* Tengo todos los datos del acto de venta.\n\n` +
          `⚖️ *¿Habrá un apoderado para el trámite en la DGII?*\n` +
          `Un apoderado es una persona autorizada a realizar el trámite de matrícula en la DGII en nombre del vendedor.\n\n` +
          `• Si *sí* → Envía la cédula del apoderado\n` +
          `• Si *no* → Escribe *no*`;
      }
      // All data collected — generate document
      await transitionTo(session, 'doc_generation', 'generating', { ...data, docGenCollected: updatedCollected });
      return await generateAndSend(session, templateKey, updatedCollected, msg);
    }

    // Show what we got + ask for next field
    let response = '';
    
    if (Object.keys(newData).length > 0) {
      // Confirm what was extracted
      const extracted = Object.entries(newData).filter(([k, v]) => v);
      if (extracted.length > 0) {
        response += `✅ *Recibido:*\n`;
        extracted.forEach(([k, v]) => {
          const fieldDef = TEMPLATES[templateKey].fields.find(f => f.key === k);
          if (fieldDef && fieldDef.label) response += `• ${fieldDef.label}: *${v}*\n`;
        });
        response += '\n';
      }
    }

    // Ask for next missing field
    const nextField = missing[0];
    response += formatQuestion(nextField, templateKey, updatedCollected);
    
    return response;
  }

  // Step 2b: Asking about optional apoderado (acto_venta_vehiculo only)
  if (step === 'asking_apoderado') {
    const collected = data.docGenCollected || {};

    // User says no apoderado
    if (/^(no|no aplica|ninguno|sin apoderado)$/i.test(text.trim())) {
      const finalData = { ...collected, has_apoderado: false };
      await transitionTo(session, 'doc_generation', 'generating', { ...data, docGenCollected: finalData });
      return await generateAndSend(session, templateKey, finalData, msg);
    }

    // User sends cédula or image — try to extract apoderado
    const imagePath = savedMedia?.file_path || null;
    const allMedia = savedMedia?.allMedia || null;
    let apoderadoData = {};

    if (imagePath || (allMedia && allMedia.length > 0)) {
      try {
        const imgs = allMedia ? allMedia.filter(m => m.media_type === 'image').map(m => m.file_path) : [imagePath];
        const results = await Promise.all(imgs.map(p => require('../../../documents/extractor').extractFromCedula(p).catch(() => null)));
        const person = results.find(r => r?.nombre);
        if (person) {
          apoderadoData.apoderado_nombre = person.nombre;
          if (person.cedula) apoderadoData.apoderado_cedula = person.cedula;
        }
      } catch (err) {
        console.error('[DocGen] Apoderado extraction error:', err.message);
      }
    } else if (text.trim().length > 3) {
      // Try text extraction for apoderado
      const { extractFromText } = require('../../../documents/extractor');
      const textData = await extractFromText(text, 'apoderado', {}).catch(() => ({}));
      if (textData.apoderado_nombre) apoderadoData = textData;
    }

    if (apoderadoData.apoderado_nombre) {
      const finalData = { ...collected, ...apoderadoData, has_apoderado: true };
      await transitionTo(session, 'doc_generation', 'generating', { ...data, docGenCollected: finalData });
      return `✅ *Apoderado registrado:* ${apoderadoData.apoderado_nombre}\n\n⏳ Generando documento...` +
        '\n' + await generateAndSend(session, templateKey, finalData, msg);
    }

    // Couldn't extract — ask again
    return `No pude leer la cédula del apoderado. Por favor:\n` +
      `• Envía una *foto clara* de su cédula\n` +
      `• O escribe su nombre y número de cédula\n` +
      `• O escribe *no* si no hay apoderado`;
  }

  // Step 3: Generating (shouldn't receive messages here normally)
  if (step === 'generating') {
    return '⏳ Generando tu documento... Un momento.';
  }

  // Default
  await transitionTo(session, 'doc_generation', 'collecting', { ...data, docGenCollected: {} });
  return `Vamos a preparar tu documento. ¿Cuál es el primer dato?`;
}

async function generateAndSend(session, templateKey, collectedData, msg) {
  const template = TEMPLATES[templateKey];
  
  try {
    const outputPath = await generateDocument(templateKey, collectedData);
    
    // Send the file via WhatsApp
    const { sendDocumentToChat } = require('../../whatsapp/sender');
    const jid = msg.key.remoteJid;
    
    await sendDocumentToChat(jid, outputPath, `${template.name}.docx`);
    
    // Transition back to main menu
    await transitionTo(session, 'main_menu', 'show', {});
    
    return `✅ *¡Documento generado exitosamente!*\n\n📎 Tu *${template.name}* está listo. Revísalo y si necesitas ajustes me avisas.\n\n⚠️ _Este documento es un borrador. Debe ser revisado y de referencia, verifica los datos antes de firmar._\n\n¿En qué más te puedo ayudar?`;
    
  } catch (err) {
    console.error('[DocGen] Generation error:', err);
    await transitionTo(session, 'main_menu', 'show', {});
    return `❌ Hubo un error generando el documento. Nuestro equipo lo preparará manualmente y te lo enviará pronto. Disculpe el inconveniente.`;
  }
}

module.exports = { handle };
