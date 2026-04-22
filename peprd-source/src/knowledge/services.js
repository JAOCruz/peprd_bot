/**
 * PepRD — Catálogo de péptidos de investigación
 * Precios aproximados de peprd.io (DOP). Verificar antes de producción.
 *
 * modalidad = 'unico' (precio por vial)
 */

const SERVICE_CATEGORIES = {
  glp1: {
    name: 'GLP-1 / Metabólicos',
    emoji: '⚖️',
    description: 'Péptidos para investigación metabólica y apetito',
    items: [
      { name: 'Retatrutide 5mg',                    modalidad: 'unico', prices: { unico: 3660 } },
      { name: 'Retatrutide 10mg',                   modalidad: 'unico', prices: { unico: 6400 } },
      { name: 'Tirzepatide 10mg',                   modalidad: 'unico', prices: { unico: 4880 } },
      { name: 'Tirzepatide 20mg',                   modalidad: 'unico', prices: { unico: 8540 } },
      { name: 'Semaglutide 5mg',                    modalidad: 'unico', prices: { unico: 3050 } },
      { name: 'Semaglutide 10mg',                   modalidad: 'unico', prices: { unico: 4880 } },
      { name: 'Cagrilintide 5mg',                   modalidad: 'unico', prices: { unico: 3660 } },
      { name: 'Semaglutide + Cagrilintide blend',   modalidad: 'unico', prices: { unico: 4880 } },
      { name: 'Mazdutide 5mg',                      modalidad: 'unico', prices: { unico: 4270 } },
      { name: 'Survodutide 5mg',                    modalidad: 'unico', prices: { unico: 4880 } },
      { name: 'AOD-9604 5mg',                       modalidad: 'unico', prices: { unico: 1830 } },
      { name: '5-Amino-1MQ 100mg',                  modalidad: 'unico', prices: { unico: 3050 } },
      { name: 'HGH Frag 176-191 5mg',               modalidad: 'unico', prices: { unico: 1830 } },
      { name: 'Tesamorelin 5mg',                    modalidad: 'unico', prices: { unico: 3050 } },
      { name: 'SLU-PP-332 10mg',                    modalidad: 'unico', prices: { unico: 3660 } },
    ],
  },

  gh: {
    name: 'Hormona de crecimiento',
    emoji: '🧪',
    description: 'Secretagogos de GH y análogos IGF',
    items: [
      { name: 'CJC-1295 DAC 5mg',             modalidad: 'unico', prices: { unico: 2440 } },
      { name: 'CJC-1295 No-DAC 5mg',          modalidad: 'unico', prices: { unico: 2440 } },
      { name: 'Ipamorelin 5mg',               modalidad: 'unico', prices: { unico: 2440 } },
      { name: 'CJC-1295 + Ipamorelin blend',  modalidad: 'unico', prices: { unico: 2745 } },
      { name: 'Sermorelin 5mg',               modalidad: 'unico', prices: { unico: 2135 } },
      { name: 'GHRP-2 5mg',                   modalidad: 'unico', prices: { unico: 2135 } },
      { name: 'GHRP-6 5mg',                   modalidad: 'unico', prices: { unico: 2135 } },
      { name: 'Hexarelin 5mg',                modalidad: 'unico', prices: { unico: 2440 } },
      { name: 'Somatropin 10IU',              modalidad: 'unico', prices: { unico: 3660 } },
      { name: 'IGF-1 LR3 1mg',                modalidad: 'unico', prices: { unico: 4270 } },
      { name: 'PEG-MGF 2mg',                  modalidad: 'unico', prices: { unico: 3050 } },
      { name: 'GDF-8 inhibidor 1mg',          modalidad: 'unico', prices: { unico: 4880 } },
    ],
  },

  reparacion: {
    name: 'Reparación tisular',
    emoji: '🩹',
    description: 'BPC-157, TB-500 y blends',
    items: [
      { name: 'BPC-157 5mg',                 modalidad: 'unico', prices: { unico: 2135 } },
      { name: 'BPC-157 10mg',                modalidad: 'unico', prices: { unico: 3660 } },
      { name: 'TB-500 5mg',                  modalidad: 'unico', prices: { unico: 2745 } },
      { name: 'TB-500 10mg',                 modalidad: 'unico', prices: { unico: 4880 } },
      { name: 'BPC-157 + TB-500 10mg blend', modalidad: 'unico', prices: { unico: 6100 } },
      { name: 'ARA-290 16mg',                modalidad: 'unico', prices: { unico: 4880 } },
    ],
  },

  piel: {
    name: 'Piel y cabello',
    emoji: '✨',
    description: 'GHK, GHK-Cu, Melanotan y estética',
    items: [
      { name: 'GHK 50mg',             modalidad: 'unico', prices: { unico: 1830 } },
      { name: 'GHK-Cu 50mg',          modalidad: 'unico', prices: { unico: 2135 } },
      { name: 'AHK-Cu 50mg',          modalidad: 'unico', prices: { unico: 2135 } },
      { name: 'Melanotan 1 10mg',     modalidad: 'unico', prices: { unico: 2440 } },
      { name: 'Melanotan 2 10mg',     modalidad: 'unico', prices: { unico: 2440 } },
      { name: 'Glow Blend',           modalidad: 'unico', prices: { unico: 3660 } },
      { name: 'SNAP-8 25mg',          modalidad: 'unico', prices: { unico: 1830 } },
      { name: 'Glutathione 600mg',    modalidad: 'unico', prices: { unico: 2440 } },
      { name: 'Hyaluronic Acid vial', modalidad: 'unico', prices: { unico: 2135 } },
    ],
  },

  nootropicos: {
    name: 'Nootrópicos',
    emoji: '🧠',
    description: 'Semax, Selank, Cerebrolysin',
    items: [
      { name: 'Cerebrolysin 5ml', modalidad: 'unico', prices: { unico: 2440 } },
      { name: 'Selank 10mg',      modalidad: 'unico', prices: { unico: 1830 } },
      { name: 'Semax 20mg',       modalidad: 'unico', prices: { unico: 1830 } },
      { name: 'P21 10mg',         modalidad: 'unico', prices: { unico: 2440 } },
      { name: 'PE 22-28 5mg',     modalidad: 'unico', prices: { unico: 1830 } },
      { name: 'Pinealon 20mg',    modalidad: 'unico', prices: { unico: 2135 } },
      { name: 'DSIP 5mg',         modalidad: 'unico', prices: { unico: 1525 } },
      { name: 'Dermorphin 5mg',   modalidad: 'unico', prices: { unico: 2745 } },
    ],
  },

  longevidad: {
    name: 'Longevidad',
    emoji: '⏳',
    description: 'Epitalon, NAD+, MOTS-c, SS-31',
    items: [
      { name: 'Epitalon 50mg',             modalidad: 'unico', prices: { unico: 2135 } },
      { name: 'FOXO4-DRI 10mg',            modalidad: 'unico', prices: { unico: 4880 } },
      { name: 'MOTS-c 10mg',               modalidad: 'unico', prices: { unico: 2440 } },
      { name: 'SS-31 (Elamipretide) 10mg', modalidad: 'unico', prices: { unico: 4880 } },
      { name: 'NAD+ 500mg',                modalidad: 'unico', prices: { unico: 2745 } },
      { name: 'Thymalin 10mg',             modalidad: 'unico', prices: { unico: 2135 } },
      { name: 'Vilon 20mg',                modalidad: 'unico', prices: { unico: 2135 } },
      { name: 'Testagen 20mg',             modalidad: 'unico', prices: { unico: 2135 } },
      { name: 'PNC-27 5mg',                modalidad: 'unico', prices: { unico: 4880 } },
    ],
  },

  hormonales: {
    name: 'Sexual / Hormonal',
    emoji: '💞',
    description: 'PT-141, Oxytocin, Kisspeptin, HCG',
    items: [
      { name: 'PT-141 (Bremelanotide) 10mg', modalidad: 'unico', prices: { unico: 2440 } },
      { name: 'Oxytocin 5mg',                modalidad: 'unico', prices: { unico: 1830 } },
      { name: 'Kisspeptin-10 5mg',           modalidad: 'unico', prices: { unico: 2440 } },
      { name: 'HCG 5000IU',                  modalidad: 'unico', prices: { unico: 2135 } },
      { name: 'HMG 75IU',                    modalidad: 'unico', prices: { unico: 2135 } },
    ],
  },

  inmune: {
    name: 'Sistema inmune',
    emoji: '🛡️',
    description: 'Thymosin Alpha-1, LL-37, KPV, VIP',
    items: [
      { name: 'Thymosin Alpha-1 5mg', modalidad: 'unico', prices: { unico: 3050 } },
      { name: 'LL-37 5mg',            modalidad: 'unico', prices: { unico: 2440 } },
      { name: 'KPV 20mg',             modalidad: 'unico', prices: { unico: 1830 } },
      { name: 'VIP 5mg',              modalidad: 'unico', prices: { unico: 2440 } },
    ],
  },

  soporte: {
    name: 'Soporte / Reconstitución',
    emoji: '💧',
    description: 'BAC Water, B12, solventes y consumibles',
    items: [
      { name: 'BAC Water 3ml',       modalidad: 'unico', prices: { unico: 300 } },
      { name: 'BAC Water 30ml',      modalidad: 'unico', prices: { unico: 900 } },
      { name: 'Acetic Acid 0.6%',    modalidad: 'unico', prices: { unico: 600 } },
      { name: 'Vitamina B12 5mg',    modalidad: 'unico', prices: { unico: 900 } },
      { name: 'Melatonin 20mg',      modalidad: 'unico', prices: { unico: 900 } },
      { name: 'L-Carnitine 500mg',   modalidad: 'unico', prices: { unico: 1200 } },
      { name: 'Lipo-C (Lipotropic)', modalidad: 'unico', prices: { unico: 1525 } },
      { name: 'Adamax 10mg',         modalidad: 'unico', prices: { unico: 2440 } },
      { name: 'Klow Blend',          modalidad: 'unico', prices: { unico: 5490 } },
    ],
  },
};

function formatPrice(amount) {
  const n = Number(amount || 0);
  return `RD$${n.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

module.exports = { SERVICE_CATEGORIES, formatPrice };
