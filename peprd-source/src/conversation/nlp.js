const RULES = [
  { flow: 'menu', patterns: [/\bmen[uú]\b/i, /productos?/i, /qu[eé] tienen/i, /qu[eé] venden/i] },
  { flow: 'order', patterns: [/pedido/i, /ordenar?/i, /comprar/i, /quiero/i, /me llevo/i] },
  { flow: 'custom_cake', patterns: [/bizcocho/i, /pastel/i, /torta/i, /cake/i, /cumplea[nñ]os/i, /boda/i, /personalizad/i] },
  { flow: 'info', patterns: [/horario/i, /ubicaci[oó]n/i, /direcci[oó]n/i, /d[oó]nde/i, /tel[eé]fono/i, /contacto/i, /delivery/i, /entrega/i] },
  { flow: 'main_menu', patterns: [/^hola/i, /buen[oa]s/i, /^saludos/i, /\bmenu\b/i, /ayuda/i, /empezar/i] },
];

function detectIntent(text) {
  const t = (text || '').trim();
  if (/^\s*\d+\s*$/.test(t)) return { flow: 'main_menu', data: { selection: parseInt(t, 10) } };
  for (const rule of RULES) {
    if (rule.patterns.some((re) => re.test(t))) return { flow: rule.flow };
  }
  return { flow: 'main_menu' };
}

module.exports = { detectIntent };
