/**
 * PepRD — generador de factura/cotización PDF (Puppeteer)
 * Paleta: cream #f6f3ec, teal #2d5f5a, gold #c89b3c, navy #1a2332
 */
const path = require('path');
const fs = require('fs');
const config = require('../config');

const OUT_DIR = path.join(__dirname, '../../public/invoices');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

let _puppeteer = null;
function loadPuppeteer() {
  if (_puppeteer) return _puppeteer;
  try { _puppeteer = require('puppeteer'); return _puppeteer; } catch { return null; }
}

const fmt = (n) => `${config.business.currencySymbol} ${Number(n || 0).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function generateDocNumber(prefix = 'COT') {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${yy}${mm}-${rand}`;
}

// Try to parse "5mg" / "10 mg" / "2.5mg" out of the product description so the
// mg column in the table shows something sensible even though the data model
// doesn't have a dedicated field yet.
function extractMg(desc) {
  const m = String(desc || '').match(/(\d+(?:\.\d+)?)\s*mg\b/i);
  return m ? m[1] : '';
}

function buildHTML({ clientName, clientPhone, docNumber, date, items, notes, type = 'RECIBO' }) {
  const subtotal = items.reduce((s, i) => s + (Number(i.cantidad) * Number(i.precio)), 0);
  const itbis    = items.some(i => i.itbis)
    ? items.reduce((s, i) => s + (i.itbis ? Number(i.cantidad) * Number(i.precio) * 0.18 : 0), 0)
    : 0;
  const total    = subtotal + itbis;

  const itemsHTML = items.map((it) => {
    const mg = extractMg(it.desc);
    return `
    <tr>
      <td class="product">${esc(String(it.desc || '').substring(0, 90))}</td>
      <td class="center">${esc(mg)}</td>
      <td class="center">${esc(it.cantidad)}</td>
      <td class="price">${fmt(it.precio)}</td>
      <td class="total">${fmt(Number(it.cantidad) * Number(it.precio))}</td>
    </tr>`;
  }).join('');

  const subtitle = type === 'FACTURA' ? 'Factura' : (type === 'COTIZACIÓN' ? 'Cotización' : 'Recibo de Orden');

  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>${esc(type)} ${esc(docNumber)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital,wght@0,400;1,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root {
    --cream: #f3ede4;
    --cream-light: #f8f4ed;
    --cream-dark: #e8e0d4;
    --teal: #1a5c50;
    --teal-dark: #144a40;
    --ink: #2c2c2c;
    --muted: #8a8577;
    --border: #ddd5c8;
    --white: #ffffff;
    --amber: #c4870a;
  }
  @page { size: A4; margin: 12mm 10mm; }
  *,*::before,*::after { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'DM Sans', Helvetica, Arial, sans-serif; background:var(--cream); color:var(--ink); line-height:1.5; -webkit-font-smoothing:antialiased; font-size:13px; }
  .receipt-wrap { max-width:700px; margin:0 auto; padding:0; }
  .receipt { background:var(--white); border:1px solid var(--border); border-radius:12px; overflow:hidden; }

  .receipt-header { padding:36px 44px 28px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:flex-start; }
  .brand-block h1 { font-family:'DM Serif Display', Georgia, serif; font-size:32px; font-weight:400; color:var(--ink); letter-spacing:-.02em; line-height:1; }
  .brand-block h1 em { color:var(--teal); font-style:italic; }
  .brand-sub { font-size:11px; color:var(--muted); margin-top:6px; text-transform:uppercase; letter-spacing:.1em; font-weight:600; }
  .brand-tagline { font-size:10px; color:var(--muted); margin-top:10px; font-family:'JetBrains Mono', monospace; letter-spacing:.05em; }
  .meta-block { text-align:right; }
  .meta-row { margin-bottom:12px; }
  .meta-row:last-child { margin-bottom:0; }
  .meta-label { font-size:10px; text-transform:uppercase; letter-spacing:.1em; font-weight:600; color:var(--muted); margin-bottom:3px; }
  .meta-value { font-family:'JetBrains Mono', monospace; font-weight:600; font-size:14px; color:var(--ink); }
  .meta-value.date { font-weight:500; font-size:13px; }

  .items-section { padding:28px 44px 10px; }
  .section-title { font-size:10px; text-transform:uppercase; letter-spacing:.12em; font-weight:700; color:var(--muted); margin-bottom:16px; }
  .items-table { width:100%; border-collapse:collapse; }
  .items-table thead th { font-size:10px; text-transform:uppercase; letter-spacing:.08em; font-weight:600; color:var(--muted); text-align:left; padding:0 0 10px; border-bottom:1px solid var(--border); }
  .items-table thead th.center { text-align:center; }
  .items-table thead th.right { text-align:right; }
  .items-table tbody td { padding:12px 0; font-size:14px; vertical-align:middle; border-bottom:1px solid var(--cream); }
  .items-table tbody td.product { font-weight:500; padding-right:8px; word-wrap:break-word; }
  .items-table tbody td.center { text-align:center; font-family:'JetBrains Mono', monospace; font-size:13px; }
  .items-table tbody td.price { text-align:right; font-family:'JetBrains Mono', monospace; font-size:13px; }
  .items-table tbody td.total { text-align:right; font-family:'JetBrains Mono', monospace; font-size:13px; font-weight:600; color:var(--teal); }

  .totals { padding:18px 44px 28px; }
  .totals-box { margin-left:auto; width:280px; }
  .totals-row { display:flex; justify-content:space-between; padding:6px 0; font-size:13px; color:var(--muted); }
  .totals-row span:last-child { font-family:'JetBrains Mono', monospace; color:var(--ink); }
  .totals-row.total { border-top:2px solid var(--teal); margin-top:10px; padding-top:14px; font-size:17px; font-weight:700; color:var(--ink); }
  .totals-row.total span:first-child { text-transform:uppercase; font-size:11px; letter-spacing:.12em; color:var(--muted); font-weight:700; align-self:center; }
  .totals-row.total span:last-child { color:var(--teal); font-family:'DM Serif Display', serif; font-style:italic; font-size:22px; font-weight:400; }

  .info-grid { display:grid; grid-template-columns:1fr 1fr; border-top:1px solid var(--border); }
  .info-block { padding:24px 44px; }
  .info-block:first-child { border-right:1px solid var(--border); }
  .info-block p { font-size:13px; line-height:1.7; color:var(--ink); }
  .info-block .field { margin-bottom:14px; }
  .info-block .field:last-child { margin-bottom:0; }
  .info-block .field-label { font-size:10px; text-transform:uppercase; letter-spacing:.1em; font-weight:600; color:var(--muted); margin-bottom:4px; }
  .info-block .field-value { font-size:14px; color:var(--ink); }
  .info-block .field-value.name { font-weight:600; font-size:15px; }
  .info-block .field-value.mono { font-family:'JetBrains Mono', monospace; font-size:13px; }
  .info-block .notes { font-size:12px; color:var(--ink); line-height:1.6; white-space:pre-wrap; word-wrap:break-word; }

  .receipt-footer { padding:18px 44px; border-top:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; font-size:11px; color:var(--muted); background:var(--cream-light); }
  .receipt-footer a { color:var(--teal); text-decoration:none; font-weight:600; }
</style></head>
<body>
  <div class="receipt-wrap">
    <div class="receipt">
      <div class="receipt-header">
        <div class="brand-block">
          <h1><em>Pep</em>RD</h1>
          <div class="brand-sub">${esc(subtitle)}</div>
          <div class="brand-tagline">${esc(config.business.city)} · RD</div>
        </div>
        <div class="meta-block">
          <div class="meta-row">
            <div class="meta-label">Nº de Orden</div>
            <div class="meta-value">${esc(docNumber)}</div>
          </div>
          <div class="meta-row">
            <div class="meta-label">Fecha</div>
            <div class="meta-value date">${esc(date)}</div>
          </div>
        </div>
      </div>

      <div class="items-section">
        <div class="section-title">Detalle de Productos</div>
        <table class="items-table">
          <thead>
            <tr>
              <th style="width:44%">Producto</th>
              <th class="center" style="width:12%">mg</th>
              <th class="center" style="width:12%">Viales</th>
              <th class="right" style="width:16%">Precio Unit.</th>
              <th class="right" style="width:16%">Total</th>
            </tr>
          </thead>
          <tbody>${itemsHTML}</tbody>
        </table>
      </div>

      <div class="totals">
        <div class="totals-box">
          <div class="totals-row"><span>Productos</span><span>${fmt(subtotal)}</span></div>
          ${itbis > 0 ? `<div class="totals-row"><span>ITBIS (18%)</span><span>${fmt(itbis)}</span></div>` : ''}
          <div class="totals-row total"><span>Total</span><span>${fmt(total)}</span></div>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-block">
          <div class="section-title">Contacto</div>
          <div class="field">
            <div class="field-label">Teléfono</div>
            <div class="field-value mono">${esc(clientPhone || '—')}</div>
          </div>
          <div class="field">
            <div class="field-label">WhatsApp</div>
            <div class="field-value mono">${esc(config.business.phone)}</div>
          </div>
          <div class="field">
            <div class="field-label">Email</div>
            <div class="field-value mono">${esc(config.business.email)}</div>
          </div>
        </div>
        <div class="info-block">
          <div class="section-title">Cliente</div>
          <div class="field">
            <div class="field-label">Nombre</div>
            <div class="field-value name">${esc(clientName || 'Cliente')}</div>
          </div>
          ${notes ? `
          <div class="field">
            <div class="field-label">Notas</div>
            <div class="notes">${esc(notes)}</div>
          </div>` : ''}
        </div>
      </div>

      <div class="receipt-footer">
        <span>Solo para investigación · No aprobado para consumo humano</span>
        <a href="${esc(config.business.website)}">${esc(String(config.business.website || '').replace(/^https?:\/\//, ''))}</a>
      </div>
    </div>
  </div>
</body></html>`;
}

async function generateInvoicePDF({ clientName, clientPhone, docNumber, date, items, notes, type = 'COTIZACIÓN' }) {
  const puppeteer = loadPuppeteer();
  if (!puppeteer) throw new Error('puppeteer no instalado. Corre: npm install puppeteer');

  const html = buildHTML({ clientName, clientPhone, docNumber, date, items, notes, type });
  const filename = `${docNumber}.pdf`;
  const outPath = path.join(OUT_DIR, filename);

  // --no-sandbox: Ubuntu 23.10+ disables unprivileged user namespaces by default
  // so Chromium can't use its sandbox without kernel.unprivileged_userns_clone=1.
  // Safe here because the HTML we render is our own template and all user-supplied
  // fields are HTML-escaped (see esc()). Re-evaluate if we ever render arbitrary
  // user-supplied HTML.
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: outPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '12mm', right: '10mm', bottom: '12mm', left: '10mm' },
    });
  } finally {
    await browser.close();
  }

  return outPath;
}

// Back-compat: some callers expect this name
const generateInvoiceFromTemplate = generateInvoicePDF;

module.exports = { generateInvoicePDF, generateInvoiceFromTemplate, generateDocNumber, buildHTML };
