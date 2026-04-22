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

function generateDocNumber(prefix = 'COT') {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${yy}${mm}-${rand}`;
}

function buildHTML({ clientName, clientPhone, docNumber, date, items, notes, type = 'COTIZACIÓN' }) {
  const subtotal = items.reduce((s, i) => s + (Number(i.cantidad) * Number(i.precio)), 0);
  const itbis    = items.some(i => i.itbis)
    ? items.reduce((s, i) => s + (i.itbis ? Number(i.cantidad) * Number(i.precio) * 0.18 : 0), 0)
    : 0;
  const total    = subtotal + itbis;

  const itemsHTML = items.map((it, i) => `
    <tr class="${i % 2 === 0 ? 'even' : 'odd'}">
      <td class="desc">${(it.desc || '').substring(0, 70)}</td>
      <td class="qty">${it.cantidad}</td>
      <td class="price">${fmt(it.precio)}</td>
      <td class="amount">${fmt(Number(it.cantidad) * Number(it.precio))}</td>
    </tr>`).join('');

  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>${type} ${docNumber}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;1,400;1,600&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  @page { size: Letter; margin: 0; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:"Instrument Sans", Helvetica, Arial, sans-serif; color:#1a2332; font-size:12px; background:#f6f3ec; }
  .container { max-width:900px; margin:0 auto; background:#f6f3ec; }

  .header { padding:32px 40px; display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #2d5f5a; }
  .logo-wrap { display:flex; align-items:center; gap:18px; }
  .logo-box { width:68px; height:68px; background:#1a2332; color:#f6f3ec; border:2px solid #c89b3c; border-radius:10px; display:flex; align-items:center; justify-content:center; font-family:"Fraunces",Georgia,serif; font-style:italic; font-weight:600; font-size:28px; }
  .company-name { font-family:"Fraunces",Georgia,serif; font-style:italic; font-size:28px; font-weight:600; color:#1f4340; letter-spacing:-0.5px; }
  .company-tagline { font-family:"JetBrains Mono",monospace; font-size:10px; color:#6b6f5f; letter-spacing:1.5px; text-transform:uppercase; margin-top:4px; }
  .header-right { text-align:right; font-family:"JetBrains Mono",monospace; font-size:11px; color:#6b6f5f; line-height:1.7; }
  .doc-type { font-family:"JetBrains Mono",monospace; color:#c89b3c; font-size:10px; font-weight:500; letter-spacing:2px; text-transform:uppercase; }
  .doc-number { font-family:"Fraunces",serif; font-style:italic; color:#1f4340; font-size:26px; font-weight:600; margin-top:2px; }
  .doc-date { color:#6b6f5f; font-size:11px; font-family:"JetBrains Mono",monospace; margin-top:2px; }

  .body { padding:28px 40px; }

  .section-title { font-family:"JetBrains Mono",monospace; font-size:10px; font-weight:500; letter-spacing:2px; text-transform:uppercase; color:#c89b3c; margin-bottom:10px; margin-top:22px; }
  .section-title:first-child { margin-top:0; }

  .client-box { background:#efeadf; border-left:3px solid #2d5f5a; border-radius:4px; padding:16px 20px; margin-bottom:18px; }
  .client-name { font-family:"Fraunces",serif; font-style:italic; font-size:18px; font-weight:600; color:#1f4340; margin-bottom:2px; }
  .client-phone { color:#6b6f5f; font-size:12px; font-family:"JetBrains Mono",monospace; }

  table { width:100%; border-collapse:collapse; margin:8px 0; table-layout:fixed; border:1px solid #e6e0d0; }
  thead { background:#2d5f5a; }
  thead th { color:#f6f3ec; padding:12px; font-family:"JetBrains Mono",monospace; font-size:10px; font-weight:500; letter-spacing:1.5px; text-align:left; text-transform:uppercase; }
  thead th:nth-child(1){width:50%;}
  thead th:nth-child(2){width:10%;text-align:center;}
  thead th:nth-child(3){width:20%;text-align:right;}
  thead th:nth-child(4){width:20%;text-align:right;}
  tbody tr { border-bottom:1px solid #e6e0d0; }
  tbody tr.odd { background:#fff; }
  tbody tr.even { background:#f6f3ec; }
  td { padding:11px 12px; color:#1a2332; font-size:12px; word-wrap:break-word; }
  td.desc { font-weight:500; }
  td.qty { text-align:center; font-family:"JetBrains Mono",monospace; }
  td.price { text-align:right; font-family:"JetBrains Mono",monospace; }
  td.amount { text-align:right; font-family:"JetBrains Mono",monospace; font-weight:600; color:#c89b3c; }

  .totals { margin:22px 0 8px 0; display:flex; justify-content:flex-end; }
  .totals-box { min-width:300px; background:#efeadf; border-radius:4px; padding:18px 22px; }
  .row { display:flex; justify-content:space-between; padding:7px 0; font-size:12px; color:#6b6f5f; border-bottom:1px solid #e6e0d0; }
  .row:last-child { border-bottom:none; }
  .row.grand { border-top:2px solid #c89b3c; padding-top:12px; margin-top:6px; font-family:"Fraunces",serif; font-style:italic; font-size:20px; font-weight:600; color:#1f4340; }
  .row.grand .label { color:#c89b3c; font-family:"JetBrains Mono",monospace; font-style:normal; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; align-self:center; }

  .notes-box { background:rgba(200,155,60,0.10); border-left:3px solid #c89b3c; border-radius:4px; padding:12px 16px; font-size:12px; color:#1f4340; line-height:1.6; margin-top:16px; }
  .notes-label { font-family:"JetBrains Mono",monospace; font-size:10px; font-weight:500; letter-spacing:1.5px; text-transform:uppercase; color:#c89b3c; margin-bottom:6px; }

  .disclaimer { margin-top:18px; padding:12px 16px; background:rgba(45,95,90,0.08); border-left:3px solid #2d5f5a; border-radius:4px; font-size:11px; color:#1f4340; line-height:1.5; }

  .footer { margin-top:28px; padding:18px 40px; border-top:1px solid #e6e0d0; color:#6b6f5f; font-size:10px; font-family:"JetBrains Mono",monospace; text-align:center; letter-spacing:1.5px; text-transform:uppercase; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-wrap">
        <div class="logo-box">Pep</div>
        <div>
          <div class="company-name">${config.business.name}</div>
          <div class="company-tagline">Research Peptides · ${config.business.city}</div>
        </div>
      </div>
      <div class="header-right">
        <div class="doc-type">${type}</div>
        <div class="doc-number">${docNumber}</div>
        <div class="doc-date">${date}</div>
        <br>
        ${config.business.phone}<br>
        ${config.business.email}<br>
        ${config.business.website}
      </div>
    </div>

    <div class="body">
      <div class="section-title">Cliente</div>
      <div class="client-box">
        <div class="client-name">${clientName || 'Cliente'}</div>
        ${clientPhone ? `<div class="client-phone">${clientPhone}</div>` : ''}
      </div>

      <div class="section-title">Productos</div>
      <table>
        <thead><tr><th>Descripción</th><th>Cant.</th><th>Precio</th><th>Monto</th></tr></thead>
        <tbody>${itemsHTML}</tbody>
      </table>

      <div class="totals">
        <div class="totals-box">
          <div class="row"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
          ${itbis > 0 ? `<div class="row"><span>ITBIS (18%)</span><span>${fmt(itbis)}</span></div>` : ''}
          <div class="row grand"><span class="label">Total</span><span>${fmt(total)}</span></div>
        </div>
      </div>

      ${notes ? `<div class="notes-box"><div class="notes-label">Notas</div>${notes}</div>` : ''}

      <div class="disclaimer">
        <strong>⚠ Uso de investigación:</strong> Productos vendidos estrictamente para uso de investigación. No aptos para consumo humano. Consulta con un profesional de la salud antes de cualquier uso.
      </div>
    </div>

    <div class="footer">Gracias por tu preferencia · ${config.business.name}</div>
  </div>
</body></html>`;
}

async function generateInvoicePDF({ clientName, clientPhone, docNumber, date, items, notes, type = 'COTIZACIÓN' }) {
  const puppeteer = loadPuppeteer();
  if (!puppeteer) throw new Error('puppeteer no instalado. Corre: npm install puppeteer');

  const html = buildHTML({ clientName, clientPhone, docNumber, date, items, notes, type });
  const filename = `${docNumber}.pdf`;
  const outPath = path.join(OUT_DIR, filename);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: outPath,
      format: 'Letter',
      printBackground: true,
      margin: { top: '15mm', right: '12mm', bottom: '15mm', left: '12mm' },
    });
  } finally {
    await browser.close();
  }

  return outPath;
}

// Back-compat: some callers expect this name
const generateInvoiceFromTemplate = generateInvoicePDF;

module.exports = { generateInvoicePDF, generateInvoiceFromTemplate, generateDocNumber, buildHTML };
