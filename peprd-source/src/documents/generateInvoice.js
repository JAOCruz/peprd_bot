const fs = require('fs');
const path = require('path');
const config = require('../config');
const { formatCurrency } = require('../utils/formatting');

const TEMPLATE_PATH = path.join(__dirname, '..', '..', 'public', 'templates', 'invoice.html');
const OUT_DIR = path.join(__dirname, '..', '..', 'public', 'invoices');

function renderTemplate(template, vars) {
  return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_m, key) => (vars[key.trim()] != null ? vars[key.trim()] : ''));
}

function buildVars(order, client) {
  const itemsHtml = (order.items || [])
    .map(
      (it) => `<tr>
        <td>${it.quantity}</td>
        <td>${it.product_name}</td>
        <td style="text-align:right">${formatCurrency(it.unit_price)}</td>
        <td style="text-align:right">${formatCurrency(it.unit_price * it.quantity)}</td>
      </tr>`
    )
    .join('');

  return {
    businessName: config.business.name,
    businessAddress: config.business.address,
    businessPhone: config.business.phone,
    businessEmail: config.business.email,
    orderNumber: order.order_number,
    clientName: client?.name || 'Cliente',
    clientPhone: client?.phone || '',
    date: new Date(order.created_at || Date.now()).toLocaleString('es-DO', { timeZone: config.business.timezone }),
    itemsHtml,
    subtotal: formatCurrency(order.subtotal),
    deliveryFee: formatCurrency(order.delivery_fee || 0),
    total: formatCurrency(order.total),
    fulfillment: order.fulfillment === 'delivery' ? 'Envío discreto' : 'Recoger en tienda',
    deliveryAddress: order.delivery_address || '',
    notes: order.notes || '',
  };
}

function renderHTML(order, client) {
  const template = fs.existsSync(TEMPLATE_PATH)
    ? fs.readFileSync(TEMPLATE_PATH, 'utf8')
    : defaultTemplate();
  return renderTemplate(template, buildVars(order, client));
}

async function generateInvoiceHTML(order, client) {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const html = renderHTML(order, client);
  const filename = `${order.order_number}.html`;
  const outPath = path.join(OUT_DIR, filename);
  fs.writeFileSync(outPath, html, 'utf8');
  return { path: outPath, filename, url: `${config.apiBaseUrl}/public/invoices/${filename}` };
}

// Lazy-require puppeteer so the server starts even if it isn't installed.
let _puppeteer = null;
function loadPuppeteer() {
  if (_puppeteer) return _puppeteer;
  try {
    _puppeteer = require('puppeteer');
    return _puppeteer;
  } catch (err) {
    return null;
  }
}

async function generateInvoicePDF(order, client) {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const puppeteer = loadPuppeteer();
  if (!puppeteer) {
    throw new Error('puppeteer no instalado. Corre: npm install puppeteer');
  }

  const html = renderHTML(order, client);
  const filename = `${order.order_number}.pdf`;
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
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    });
  } finally {
    await browser.close();
  }

  return { path: outPath, filename, url: `${config.apiBaseUrl}/public/invoices/${filename}` };
}

function defaultTemplate() {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Factura {{orderNumber}}</title>
<style>
@page { size: Letter; margin: 0; }
body{font-family:Helvetica,Arial,sans-serif;color:#1a2332;padding:40px;max-width:720px;margin:auto;background:#f6f3ec}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px;border-bottom:2px solid #2d5f5a;padding-bottom:20px}
.logo{font-family:Georgia,serif;font-style:italic;color:#1f4340;font-size:36px;letter-spacing:-1px}
.meta{color:#6b6f5f;font-size:12px;text-align:right;line-height:1.6}
h2{color:#1f4340;font-family:Georgia,serif;font-style:italic;font-size:22px;margin-bottom:12px}
.info-box{background:#efeadf;padding:16px;border-radius:4px;margin-bottom:16px;font-size:13px;line-height:1.7}
.info-box strong{color:#1f4340}
table{width:100%;border-collapse:collapse;margin-top:10px}
th,td{padding:10px;border-bottom:1px solid rgba(26,35,50,0.1);font-size:13px;text-align:left}
th{background:#2d5f5a;color:#f6f3ec;font-size:11px;text-transform:uppercase;letter-spacing:1.5px}
.totals{margin-top:20px;text-align:right;font-size:14px;line-height:1.8}
.total{font-size:22px;font-weight:700;color:#c89b3c;font-family:Georgia,serif}
.disclaimer{margin-top:30px;padding:12px 16px;background:rgba(200,155,60,0.12);border-left:3px solid #c89b3c;font-size:11px;color:#1f4340;line-height:1.6}
.footer{margin-top:30px;color:#6b6f5f;font-size:11px;text-align:center;border-top:1px solid rgba(26,35,50,0.1);padding-top:16px}
</style></head>
<body>
<div class="hdr">
  <div>
    <div class="logo">{{businessName}}</div>
    <div style="font-size:11px;color:#6b6f5f;letter-spacing:1.5px;text-transform:uppercase;margin-top:4px">Research Peptides · Dominican Republic</div>
  </div>
  <div class="meta">{{businessAddress}}<br>{{businessPhone}}<br>{{businessEmail}}<br>peprd.io</div>
</div>

<h2>Factura {{orderNumber}}</h2>

<div class="info-box">
<strong>Cliente:</strong> {{clientName}} ({{clientPhone}})<br>
<strong>Fecha:</strong> {{date}}<br>
<strong>Modo:</strong> {{fulfillment}}<br>
{{deliveryAddress}}
</div>

<table>
<thead><tr><th>Cant.</th><th>Producto</th><th style="text-align:right">Precio</th><th style="text-align:right">Total</th></tr></thead>
<tbody>{{itemsHtml}}</tbody>
</table>

<div class="totals">
Subtotal: {{subtotal}}<br>
Envío: {{deliveryFee}}<br>
<span class="total">Total: {{total}}</span>
</div>

<div class="disclaimer">
<strong>⚠ Uso de investigación</strong><br>
Productos estrictamente para uso de investigación. No apto para consumo humano. Consulta con un profesional de la salud antes de cualquier uso.
</div>

<div class="footer">Gracias por tu preferencia · PepRD</div>
</body></html>`;
}

module.exports = { generateInvoiceHTML, generateInvoicePDF, renderHTML };
