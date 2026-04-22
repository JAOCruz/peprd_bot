/**
 * Enlaces/entidades relevantes para PepRD.
 * Recursos científicos y educativos sobre péptidos.
 */

const INSTITUTIONS = {
  peprd: {
    name: 'PepRD',
    description: 'Tienda online de péptidos de investigación en República Dominicana.',
    url: 'https://peprd.io',
    keywords: ['peprd', 'tienda', 'catálogo', 'catalogo', 'productos', 'web'],
  },
  pubmed: {
    name: 'PubMed',
    description: 'Base de datos de literatura biomédica (NIH/NLM). Búsqueda de estudios sobre péptidos.',
    url: 'https://pubmed.ncbi.nlm.nih.gov',
    keywords: ['pubmed', 'estudios', 'literatura', 'investigación', 'investigacion', 'paper', 'articulo'],
  },
  clinicaltrials: {
    name: 'ClinicalTrials.gov',
    description: 'Registro de ensayos clínicos activos y completados (NIH).',
    url: 'https://clinicaltrials.gov',
    keywords: ['clinical trials', 'ensayos clínicos', 'ensayos clinicos', 'fase 2', 'fase 3', 'trial'],
  },
  fda: {
    name: 'FDA',
    description: 'U.S. Food and Drug Administration — aprobaciones y alertas regulatorias.',
    url: 'https://www.fda.gov',
    keywords: ['fda', 'aprobación', 'aprobacion', 'regulación', 'regulacion'],
  },
  who: {
    name: 'WHO / OMS',
    description: 'Organización Mundial de la Salud — información internacional de salud.',
    url: 'https://www.who.int',
    keywords: ['who', 'oms', 'organización mundial', 'salud global'],
  },
};

module.exports = { INSTITUTIONS };
