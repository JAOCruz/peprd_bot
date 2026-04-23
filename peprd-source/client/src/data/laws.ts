export type LawCategory =
  | 'Notariado y Registros'
  | 'Electoral y Civil'
  | 'Judicial'
  | 'Tributario y Financiero'
  | 'Pensiones y AFP'
  | 'Gobierno y Municipios'
  | 'Servicios Públicos'
  | 'Migracion y Seguridad'
  | 'Otros';

export interface LawLink {
  id: string;
  institution: string;
  category: LawCategory;
  description: string;
  url: string;
  relatedDocCategories: string[];
}

export const LAWS: LawLink[] = [
  {
    id: 'ley-notariado',
    institution: 'Ley de Notariado',
    category: 'Notariado y Registros',
    description: 'Texto completo de la Ley de Notariado dominicana en formato PDF.',
    url: 'https://poderjudicial.gob.do/wp-content/uploads/2021/06/LEY_ley_notariado.pdf',
    relatedDocCategories: ['CONTRATOS CIVILES', 'NOTIFICACIONES'],
  },
  {
    id: 'jce',
    institution: 'Junta Central Electoral (JCE)',
    category: 'Electoral y Civil',
    description: 'Portal oficial de la JCE para consultas electorales y de estado civil.',
    url: 'https://jce.gob.do',
    relatedDocCategories: ['CONTRATOS CIVILES', 'INSTANCIAS y ESCRITOS'],
  },
  {
    id: 'catastro',
    institution: 'Catastro Nacional',
    category: 'Notariado y Registros',
    description: 'Sistema nacional de catastro para registro de propiedades.',
    url: 'https://www.catastro.gob.do',
    relatedDocCategories: ['CONTRATOS CIVILES'],
  },
  {
    id: 'ri',
    institution: 'Registro de Inmuebles (RI)',
    category: 'Notariado y Registros',
    description: 'Registro oficial de propiedad inmueble dominicana.',
    url: 'https://ri.gob.do',
    relatedDocCategories: ['CONTRATOS CIVILES'],
  },
  {
    id: 'map-coedom',
    institution: 'MAP – COEDOM',
    category: 'Gobierno y Municipios',
    description: 'Ministerio de Administración Pública con información de organismos del Estado.',
    url: 'https://map.gob.do/COEDOM/Home/Details/288?Ruta=2',
    relatedDocCategories: ['INSTANCIAS y ESCRITOS'],
  },
  {
    id: 'dgjp',
    institution: 'DGJP – Consulta tu Pensión',
    category: 'Pensiones y AFP',
    description: 'Dirección General de Jubilaciones y Pensiones - Consulta de pensiones.',
    url: 'https://www.dgjp.gob.do/servicios/consulta-tu-pension/',
    relatedDocCategories: ['INSTANCIAS y ESCRITOS'],
  },
  {
    id: 'dgii',
    institution: 'DGII – Impuestos Internos',
    category: 'Tributario y Financiero',
    description: 'Dirección General de Impuestos Internos para asuntos tributarios.',
    url: 'https://dgii.gov.do/Paginas/default.aspx',
    relatedDocCategories: ['CONTRATOS CIVILES', 'INSTANCIAS y ESCRITOS'],
  },
  {
    id: 'afp-popular',
    institution: 'AFP Popular',
    category: 'Pensiones y AFP',
    description: 'Administradora de Fondos de Pensiones Popular.',
    url: 'https://www.afppopular.com.do',
    relatedDocCategories: ['INSTANCIAS y ESCRITOS'],
  },
  {
    id: 'afp-reservas',
    institution: 'AFP Reservas',
    category: 'Pensiones y AFP',
    description: 'Administradora de Fondos de Pensiones Reservas.',
    url: 'https://www.afpreservas.com',
    relatedDocCategories: ['INSTANCIAS y ESCRITOS'],
  },
  {
    id: 'poder-judicial-nna',
    institution: 'Poder Judicial – Sala Civil NNA',
    category: 'Judicial',
    description: 'Sala Civil del Tribunal de Niños, Niñas y Adolescentes de Santo Domingo.',
    url: 'https://poderjudicial.gob.do/sala/sala-civil-del-tribunal-de-ninos-ninas-y-adolescente-de-santo-domingo/',
    relatedDocCategories: ['INSTANCIAS y ESCRITOS', 'NOTIFICACIONES'],
  },
  {
    id: 'senado',
    institution: 'Senado de la República Dominicana',
    category: 'Gobierno y Municipios',
    description: 'Portal oficial del Senado de la República Dominicana.',
    url: 'https://www.senadord.gob.do',
    relatedDocCategories: ['INSTANCIAS y ESCRITOS'],
  },
  {
    id: 'cea',
    institution: 'CEA – Consejo Estatal del Azúcar',
    category: 'Gobierno y Municipios',
    description: 'Consejo Estatal del Azúcar.',
    url: 'https://www.cea.gob.do',
    relatedDocCategories: ['CONTRATOS CIVILES'],
  },
  {
    id: 'banco-nacional',
    institution: 'Banco Nacional de Fomento',
    category: 'Tributario y Financiero',
    description: 'Institución financiera estatal dominicana.',
    url: 'https://www.bn.gob.do',
    relatedDocCategories: ['CONTRATOS CIVILES'],
  },
  {
    id: 'hacienda',
    institution: 'Ministerio de Hacienda',
    category: 'Tributario y Financiero',
    description: 'Ministerio de Hacienda de la República Dominicana.',
    url: 'https://www.hacienda.gob.do',
    relatedDocCategories: ['INSTANCIAS y ESCRITOS'],
  },
  {
    id: 'liga-municipal',
    institution: 'Liga Municipal Dominicana',
    category: 'Gobierno y Municipios',
    description: 'Organización que representa los gobiernos municipales dominicanos.',
    url: 'https://lmd.gob.do',
    relatedDocCategories: ['CONTRATOS CIVILES'],
  },
  {
    id: 'migracion-1',
    institution: 'Migración (migracion.gob.do)',
    category: 'Migracion y Seguridad',
    description: 'Dirección General de Migración de la República Dominicana.',
    url: 'https://migracion.gob.do',
    relatedDocCategories: ['INSTANCIAS y ESCRITOS', 'NOTIFICACIONES'],
  },
  {
    id: 'migracion-2',
    institution: 'Ministerio de Interior y Policía (MIP)',
    category: 'Migracion y Seguridad',
    description: 'Ministerio responsable de migración y seguridad interna.',
    url: 'https://mip.gob.do/direcciongeneraldemigracion/',
    relatedDocCategories: ['INSTANCIAS y ESCRITOS', 'NOTIFICACIONES'],
  },
  {
    id: 'pgr',
    institution: 'Procurador General de la República (PGR)',
    category: 'Judicial',
    description: 'Máximo órgano de acusación en la República Dominicana.',
    url: 'https://pgr.gob.do',
    relatedDocCategories: ['INSTANCIAS y ESCRITOS', 'NOTIFICACIONES'],
  },
  {
    id: 'ayuntamiento-dn',
    institution: 'Ayuntamiento del Distrito Nacional',
    category: 'Gobierno y Municipios',
    description: 'Gobierno municipal del Distrito Nacional (Santo Domingo).',
    url: 'https://www.google.com/search?q=Ayuntamiento+del+Distrito+Nacional',
    relatedDocCategories: ['CONTRATOS CIVILES', 'INSTANCIAS y ESCRITOS'],
  },
  {
    id: 'ayuntamiento-sc',
    institution: 'Ayuntamiento San Cristóbal',
    category: 'Gobierno y Municipios',
    description: 'Gobierno municipal de San Cristóbal.',
    url: 'https://ayuntamientosancristobal.gob.do',
    relatedDocCategories: ['CONTRATOS CIVILES'],
  },
  {
    id: 'ayuntamiento-santiago',
    institution: 'Ayuntamiento Santiago',
    category: 'Gobierno y Municipios',
    description: 'Gobierno municipal de Santiago de los Caballeros.',
    url: 'https://ayuntamientosantiago.gob.do',
    relatedDocCategories: ['CONTRATOS CIVILES'],
  },
  {
    id: 'sambil',
    institution: 'Sambil Santo Domingo',
    category: 'Otros',
    description: 'Centro comercial en Santo Domingo.',
    url: 'https://sambil.do',
    relatedDocCategories: [],
  },
  {
    id: 'edesur',
    institution: 'EDESUR',
    category: 'Servicios Públicos',
    description: 'Distribuidora de Electricidad del Sur.',
    url: 'https://www.edesur.com.do',
    relatedDocCategories: ['CONTRATOS CIVILES'],
  },
  {
    id: 'mem',
    institution: 'Ministerio de Energía y Minas (MEM)',
    category: 'Servicios Públicos',
    description: 'Ministerio responsable de energía y recursos minerales.',
    url: 'https://mem.gob.do',
    relatedDocCategories: ['CONTRATOS CIVILES'],
  },
  {
    id: 'raquel-arbaje',
    institution: 'Raquel Arbaje – Primera Dama',
    category: 'Gobierno y Municipios',
    description: 'Oficina de la Primera Dama.',
    url: 'https://raquelarbaje.do',
    relatedDocCategories: [],
  },
  {
    id: 'adn-registro',
    institution: 'ADN – Registro Civil y Conservaduría',
    category: 'Notariado y Registros',
    description: 'Archivo General de la Nación - Registro Civil y Conservaduría de Hipotecas.',
    url: 'https://adn.gob.do/registro-civil-y-conservaduria-de-hipotecas/',
    relatedDocCategories: ['CONTRATOS CIVILES', 'NOTIFICACIONES'],
  },
  {
    id: 'sb-ley-155',
    institution: 'SB – Ley 155-17 Lavado de Activos',
    category: 'Tributario y Financiero',
    description: 'Superintendencia de Bancos - Ley 155-17 sobre lavado de activos y financiamiento del terrorismo.',
    url: 'https://www.sb.gob.do/regulacion/compendio-de-leyes-y-reglamentos/ley-no-155-17-lavado-de-activos-y-el-financiamiento-del-terrorismo/',
    relatedDocCategories: ['INSTANCIAS y ESCRITOS', 'CONTRATOS CIVILES'],
  },
];
