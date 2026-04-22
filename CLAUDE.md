# PepRD — AI Bot (WhatsApp + Admin Panel)

## 🧬 Negocio

**PepRD** — tienda online de péptidos de investigación en República Dominicana (peprd.io).
- Idioma: Español (RD)
- Bot: **Peppi**
- Stack: Node.js + Baileys + PostgreSQL + Gemini + React 19/Vite
- Disclaimer: productos estrictamente para uso de investigación

Originado de un template genérico (antes Gurú Soluciones, un bot legal). Se mantuvo toda la infraestructura (clientes, casos, mensajes, citas, broadcast, documentos, PDF, admin panel, multi-rol) y se rehízo la capa de dominio (prompt, mensajes, knowledge base, catálogo, nav del admin).

---

## 📁 Estructura

```
PepRD/
├── CLAUDE.md                    # este archivo
├── README.md                    # visión general
├── ai-bot-template/             # (la copia original limpia que el user dejó, ahora integrada en peprd-source/)
└── peprd-source/
    ├── package.json             # name: peprd-bot · scripts: start/dev/client:dev/dev:full/db:init/db:seed
    ├── .env.example             # port 8889, GEMINI/MINIMAX keys, DB, WA
    ├── src/
    │   ├── server.js
    │   ├── config.js            # business block + db + jwt + llm + wa
    │   ├── db/                  # init.js, seed.js, migrate-phone.js, migrate-media.js, pool.js
    │   ├── models/              # Appointment, Broadcast, Case, Client, ClientDetail, ClientMedia,
    │   │                        # ConversationSession, DocumentRequest, Invoice, Message, Service, User
    │   ├── routes/              # auth, admin, clients, cases, cases-api, messages, whatsapp,
    │   │                        # dashboard, media, invoices, broadcasts, services, documents
    │   ├── middleware/auth.js   # JWT + requireRole
    │   ├── whatsapp/            # connection (Baileys), handler, sender, interactive, mediaService, botSettings
    │   ├── conversation/
    │   │   ├── nlp.js           # PEPTIDE_TOPICS_PATTERNS + detectPeptideTopic (detectLegalTopic alias)
    │   │   ├── messages.js      # MSG + LIST (Peppi branding, peptide menu)
    │   │   ├── router.js        # main menu + flow routing
    │   │   ├── stateManager.js
    │   │   └── flows/           # intake, appointment, document, caseStatus, services, docGen, billing
    │   ├── llm/
    │   │   ├── systemPrompt.js  # Peppi personality, research-use rules, no medical advice
    │   │   ├── generate.js      # Gemini wrappers (welcome, register, smart fallback)
    │   │   ├── mediaAnalysis.js # classify + extract from images/PDFs
    │   │   ├── quoteGenerator.js
    │   │   └── client.js        # LLM client + fallback chain
    │   ├── knowledge/
    │   │   ├── peptideTopics.js # 10 péptidos clave con contenido educativo
    │   │   ├── institutions.js  # PubMed, ClinicalTrials, FDA, WHO, PepRD
    │   │   ├── services.js      # SERVICE_CATEGORIES (9 categorías, ~70 productos)
    │   │   └── search.js        # searchKnowledge + formatSearchResults
    │   └── documents/
    │       ├── generateInvoice.js  # Puppeteer HTML-to-PDF, paleta teal/gold/cream
    │       ├── generator.js / extractor.js / templateFields.js
    │       └── makeTemplates.py
    ├── public/                  # invoices/ uploads/ templates/
    └── client/                  # React + Vite admin panel
        ├── vite.config.js       # proxy /api → :8889, dev port 5175
        ├── tailwind.config.js   # PepRD palette (cream/teal/gold/navy)
        ├── index.html           # Fraunces + Instrument Sans + JetBrains Mono
        └── src/
            ├── main.jsx / App.jsx
            ├── contexts/ · hooks/ · utils/ · components/Layout.jsx
            └── pages/           # Login, Dashboard, Clients, Cases, Messages, WhatsApp,
                                 # Invoices, Broadcast, Appointments, Documents,
                                 # KnowledgeBase, Analytics, Settings
```

---

## 🧠 Flujos de conversación

| Flow | Descripción |
|------|-------------|
| `main_menu` | Saludo + 8 opciones (pedido, cita, docs, estado, info péptido, catálogo, ventas, factura) |
| `intake` | Registro de cliente + categoría de péptidos de interés |
| `appointment` | Agendar recogida en SD o coordinar envío |
| `document` | Subir comprobante / identificación / receta |
| `caseStatus` | Consulta estado de pedido por número o teléfono |
| `services` | Ver catálogo de péptidos por categoría |
| `docGen` | Generación de documentos (plantillas) |
| `billing` | Cotizaciones / facturas (LLM-assisted) |

Smart fallback: cualquier texto libre fuera de los steps numéricos lo responde el LLM con contexto de negocio.

---

## 🎨 Identidad visual (peprd.io)

- Cream: `#f6f3ec` / cream-soft `#efeadf`
- Teal: `#2d5f5a` (primary) → `#1f4340` (deep)
- Gold: `#c89b3c` (accent) → `#e3bf65`
- Navy: `#1a2332` (text)
- Danger: `#b44545`
- Fuentes: **Fraunces** (serif italic — display), **Instrument Sans** (body), **JetBrains Mono** (métricas y datos)

---

## 🚀 Puesta en marcha

```bash
cd peprd-source
npm install
cp .env.example .env                  # fill keys + DB password
createdb peprd_bot
npm run db:init
npm run db:seed
# (opcional) DISABLE_WA=true en .env para testing sin WA

npm run dev:full                      # backend :8889 + client :5175
# o separado:
npm run dev
npm run client:dev
```

---

## 🔗 Endpoints principales

```
POST   /api/auth/login
GET    /api/clients            /api/clients/:id
GET    /api/cases              /api/cases/:id
POST   /api/cases/detect-and-create
GET    /api/messages
GET    /api/whatsapp/...       # QR, state, pause/resume, send
GET    /api/dashboard/stats    /api/dashboard/knowledge    /api/dashboard/analytics
GET    /api/media/...
GET    /api/invoices           POST /api/invoices   /api/invoices/:id/approve  /:id/send
GET    /api/broadcasts         POST /api/broadcasts/send
GET    /api/services
GET    /api/documents
GET    /api/invoices/pdf/:filename   # PDF download (public)
```

---

## ⚠️ Reglas de negocio críticas

1. **Uso de investigación solamente** — el bot NUNCA debe sugerir consumo humano, dosificación personal, ni actuar como médico
2. **Disclaimer automático** en respuestas de consulta y en el PDF de factura
3. **Pureza** — el bot puede decir "≥99% HPLC" (confirmado por la tienda); no inventa resultados de lotes
4. **Precios NUNCA se inventan** — solo se leen de la tabla `products` / `knowledge/services.js`
5. **Consejo médico prohibido** — redirigir a profesional de la salud siempre

---

## 📝 Checklist antes de producción

- [ ] Confirmar pricing en `src/knowledge/services.js` contra peprd.io/catalogo/
- [ ] Sync precios desde tabla `products` con el sitio web principal
- [ ] Agregar API keys reales (Gemini + MiniMax fallback)
- [ ] Crear usuario admin:
  ```sql
  INSERT INTO users (email, password_hash, name, role)
  VALUES ('admin@peprd.io', '<bcrypt-hash>', 'Admin', 'admin');
  ```
- [ ] Revisar disclaimers legales (legal DR + médicos)
- [ ] Conectar pasarela de pago (transferencia manual, USDT, efectivo)
- [ ] Verificar que `.env` no se sube al repo
- [ ] Montar backend en VPS con PM2 para persistencia de sesión WhatsApp

---

**Última actualización:** 2026-04
