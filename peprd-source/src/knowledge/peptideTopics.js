/**
 * PepRD — base de conocimiento educativa sobre péptidos de investigación.
 *
 * SOLO información general. El bot NUNCA da consejo médico, dosis personales, ni protocolos.
 * Siempre remite al usuario a un profesional de la salud.
 */

const PEPTIDE_TOPICS = {
  bpc157: {
    title: 'BPC-157',
    keywords: ['bpc', 'bpc-157', 'bpc157', 'body protection', 'reparacion tejido', 'tendón', 'tendon', 'articulación', 'articulacion'],
    content:
      `🧬 *BPC-157 (Body Protection Compound)*\n\n` +
      `Péptido sintético derivado de una proteína gástrica. En literatura de investigación se asocia a procesos de reparación tisular (tendones, ligamentos, tracto GI) en modelos animales.\n\n` +
      `*Pureza:* ≥99% HPLC\n` +
      `*Presentaciones:* 5mg, 10mg\n\n` +
      `⚠️ Información de investigación. No es consejo médico. Consulta con un profesional antes de cualquier uso.`,
    refs: ['Sikiric et al., Curr Pharm Des.'],
  },

  tb500: {
    title: 'TB-500',
    keywords: ['tb500', 'tb-500', 'thymosin beta', 'thymosin', 'timosina beta'],
    content:
      `🩹 *TB-500 (Thymosin Beta-4 fragmento)*\n\n` +
      `Péptido estudiado por su rol en migración celular y reparación. Frecuentemente combinado con BPC-157 en protocolos de investigación.\n\n` +
      `*Presentaciones:* 5mg, 10mg, blend BPC+TB (incluye vial BAC).\n\n` +
      `⚠️ Uso de investigación. Consulta con un profesional.`,
    refs: ['Goldstein, Ann N Y Acad Sci.'],
  },

  retatrutide: {
    title: 'Retatrutide',
    keywords: ['retatrutide', 'reta', 'triple agonista', 'glp gip glucagon', 'perdida peso'],
    content:
      `⚖️ *Retatrutide*\n\n` +
      `Triple agonista GLP-1 / GIP / Glucagon en desarrollo por Eli Lilly. En ensayos fase 2 reportó pérdida de peso superior a Tirzepatide y Semaglutide en modelos estudiados.\n\n` +
      `*Presentaciones:* 5mg, 10mg\n\n` +
      `⚠️ Molécula de investigación, no aprobada para uso clínico. Consulta con un médico.`,
    refs: ['Jastreboff et al., NEJM 2023.'],
  },

  tirzepatide: {
    title: 'Tirzepatide',
    keywords: ['tirzepatide', 'tirz', 'mounjaro', 'zepbound', 'dual agonista', 'glp gip'],
    content:
      `⚖️ *Tirzepatide*\n\n` +
      `Dual agonista GLP-1 / GIP. Comercializado como Mounjaro (diabetes) y Zepbound (obesidad) en algunos mercados.\n\n` +
      `*Presentaciones:* 10mg, 20mg\n\n` +
      `⚠️ Para uso clínico debe ser prescrito por un médico. Producto de investigación.`,
    refs: ['Jastreboff et al., NEJM 2022.'],
  },

  semaglutide: {
    title: 'Semaglutide',
    keywords: ['semaglutide', 'sema', 'ozempic', 'wegovy', 'glp-1'],
    content:
      `⚖️ *Semaglutide*\n\n` +
      `Análogo GLP-1. Comercializado como Ozempic / Wegovy en algunos mercados. Amplia literatura en control glucémico y pérdida de peso.\n\n` +
      `*Presentaciones:* 5mg, 10mg\n\n` +
      `⚠️ Uso de investigación en PepRD. Para aplicación clínica: consulta con un médico.`,
    refs: ['Wilding et al., NEJM 2021.'],
  },

  cjc_ipa: {
    title: 'CJC-1295 + Ipamorelin',
    keywords: ['cjc', 'cjc-1295', 'cjc1295', 'ipamorelin', 'ipa', 'ghrh', 'secretagogo gh', 'hgh'],
    content:
      `🧪 *CJC-1295 + Ipamorelin*\n\n` +
      `Combo estudiado frecuentemente: CJC-1295 (GHRH análogo, versiones DAC/no-DAC) + Ipamorelin (ghrelin mimetic selectivo). En literatura se reportan pulsos sinérgicos de GH.\n\n` +
      `*Presentaciones:* individuales o blend\n\n` +
      `⚠️ Uso de investigación. No es consejo médico.`,
    refs: ['Teichman et al., J Clin Endocrinol Metab.'],
  },

  ghk_cu: {
    title: 'GHK-Cu',
    keywords: ['ghk', 'ghk-cu', 'ghkcu', 'cobre', 'copper peptide', 'piel', 'cabello'],
    content:
      `✨ *GHK-Cu (tripéptido con cobre)*\n\n` +
      `Tripéptido Gly-His-Lys quelado con cobre. Estudiado en regeneración dérmica, cicatrización y folículo piloso.\n\n` +
      `*Presentaciones:* GHK 50mg, GHK-Cu 50mg, blends cosméticos\n\n` +
      `⚠️ Uso de investigación.`,
    refs: ['Pickart et al., Biomed Res Int.'],
  },

  pt141: {
    title: 'PT-141 (Bremelanotide)',
    keywords: ['pt-141', 'pt141', 'bremelanotide', 'libido', 'melanocortin'],
    content:
      `💞 *PT-141 (Bremelanotide)*\n\n` +
      `Agonista de receptores de melanocortina MC3/MC4. Estudiado por su rol en libido femenina y masculina.\n\n` +
      `*Presentaciones:* 10mg vial\n\n` +
      `⚠️ Uso de investigación. Consulta con un profesional.`,
    refs: ['Clayton et al., Obstet Gynecol 2016.'],
  },

  epitalon: {
    title: 'Epitalon',
    keywords: ['epitalon', 'epithalon', 'telomero', 'telomerasa', 'pineal', 'longevidad'],
    content:
      `⏳ *Epitalon*\n\n` +
      `Tetrapéptido sintético (Ala-Glu-Asp-Gly) estudiado por su potencial modulación de la telomerasa y el eje pineal.\n\n` +
      `*Presentaciones:* 50mg vial\n\n` +
      `⚠️ Investigación en fase experimental.`,
    refs: ['Khavinson, Biomed Khim.'],
  },

  nad: {
    title: 'NAD+',
    keywords: ['nad', 'nad+', 'nicotinamida', 'longevidad', 'mitocondria'],
    content:
      `⏳ *NAD+ (Nicotinamida Adenina Dinucleótido)*\n\n` +
      `Coenzima crítica en metabolismo energético y señalización sirtuinas. Niveles decrecen con edad.\n\n` +
      `*Presentaciones:* 500mg vial\n\n` +
      `⚠️ Para aplicación clínica consulta con un médico.`,
    refs: ['Verdin, Science 2015.'],
  },
};

module.exports = { PEPTIDE_TOPICS };
