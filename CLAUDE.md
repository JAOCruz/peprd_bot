# PepRD — AI Bot (WhatsApp)

## 🧬 Negocio

**PepRD** — tienda online de péptidos de investigación en República Dominicana (peprd.io).
- Idioma: Español (RD), nombres de productos en inglés (nomenclatura estándar)
- Bot: **Peppi** (asistente virtual)
- Canal: WhatsApp + web chat tester
- Stack: Node.js + Baileys + PostgreSQL + Gemini + HTML/JS standalone dashboard
- Disclaimer: productos estrictamente para uso de investigación, no consumo humano

---

## 📁 Estructura

```
PepRD/
├── CLAUDE.md                   # este archivo
├── dashboard.html              # panel standalone (abrir en navegador)
├── peprd-source/               # Backend (Node.js + Express)
│   ├── src/
│   │   ├── server.js
│   │   ├── config.js
│   │   ├── db/                 # PG pool + migraciones
│   │   ├── models/             # Client, Order, Product, Message
│   │   ├── routes/             # /api/*
│   │   ├── middleware/
│   │   ├── whatsapp/           # Baileys + handler
│   │   ├── conversation/       # flows + stateManager + NLP + llmFallback
│   │   │   └── flows/
│   │   │       ├── main_menu.js
│   │   │       ├── menu.js
│   │   │       ├── order.js
│   │   │       ├── peptide_consult.js   # usa LLM con disclaimers médicos
│   │   │       ├── info.js
│   │   │       └── handoff.js
│   │   ├── llm/                # Gemini 2.5/2.0-flash chain + MiniMax
│   │   ├── documents/          # Factura HTML
│   │   ├── utils/
│   │   └── data/
│   │       ├── businessProps.js
│   │       └── seed_products.sql  # 74 péptidos, 9 categorías
│   ├── public/
│   └── .env.example
│
└── peprd-dashboard/            # Dashboard React/Vite (alternativa al HTML standalone)
```

---

## 🧠 Flujos de conversación

| Flow | Descripción |
|------|-------------|
| `main_menu` | Saludo + opciones 1-5 + LLM para charla casual |
| `menu` | Navegar categorías y ver péptidos con precios |
| `order` | Carrito → recoger/envío → dirección → fecha → pago → confirmar |
| `peptide_consult` | Pregunta libre sobre un péptido → LLM responde con info educativa + disclaimer |
| `info` | Envíos, pagos, contacto, pureza |
| `handoff` | Pasar a ventas humanas |

Estado en tabla `sessions` (flow/step/data JSONB). LLM fallback activo en main_menu, menu y order.

---

## 🎨 Identidad visual (peprd.io)

- Cream: `#f6f3ec`, cream-2 `#efeadf`
- Teal: `#2d5f5a` (primary), `#1f4340` (deep)
- Gold: `#c89b3c` (accent)
- Navy: `#1a2332` (text)
- Danger: `#b44545`
- Fuentes: **Fraunces** (serif italic — display), **Instrument Sans** (body), **JetBrains Mono** (métricas/datos)

---

## 🚀 Puesta en marcha

```bash
# Backend (puerto 8889 por default para no chocar con Tasty Temptations en 8888)
cd peprd-source
npm install
cp .env.example .env           # editar placeholders
createdb peprd_bot
npm run migrate
psql peprd_bot < src/data/seed_products.sql

# Migración adicional si reutilizas DB (para sesiones largas como web-xxx)
# Las columnas phone ya son VARCHAR(64) en 002_widen_phone.sql

# Opcional: deshabilita WA para testing web
# En .env: DISABLE_WA=true

npm start

# Dashboard
open ../dashboard.html         # standalone, no requiere build
# O dashboard React:
cd ../peprd-dashboard && npm install && npm run dev
```

---

## 🔗 Endpoints

```
POST   /api/auth/login
GET    /api/clients
GET    /api/clients/:phone
PATCH  /api/clients/:phone
GET    /api/orders
GET    /api/orders/:id
POST   /api/orders
PATCH  /api/orders/:id/status
GET    /api/products
GET    /api/products?category=glp1
GET    /api/products/categories
GET    /api/messages
GET    /api/whatsapp/status
POST   /api/whatsapp/send
POST   /api/chat/message       # web tester
POST   /api/chat/reset
GET    /api/chat/state?sessionId=
```

---

## ⚠️ Reglas de negocio críticas

1. **Uso de investigación solamente** — el bot nunca debe sugerir consumo humano, dosificación personal, o actuar como médico
2. **Disclaimer automático** en respuestas de consulta y confirmación de pedido
3. **Pureza y procedencia** — el bot puede decir "≥99% HPLC"; no inventa resultados de lotes
4. **Precios nunca se inventan** — solo se leen de la tabla `products`
5. **Consejos médicos prohibidos** — siempre redirigir a un profesional de la salud

---

## 📝 Checklist antes de producción

- [ ] Confirmar pricing real contra peprd.io (sincronizar seed_products.sql)
- [ ] Agregar API keys reales (Gemini + MiniMax fallback)
- [ ] Configurar usuario admin en DB:
  ```sql
  INSERT INTO users (email, password_hash, name, role)
  VALUES ('admin@peprd.io', '<bcrypt-hash>', 'Admin', 'admin');
  ```
- [ ] Revisar todos los disclaimers legales (legal DR + disclaimers médicos)
- [ ] Conectar pasarela de pago (transferencia manual, USDT, efectivo)
- [ ] Configurar plantilla de factura en `public/templates/invoice.html`
- [ ] Verificar que el `.env` de producción no se sube al repo
- [ ] Montar el backend en VPS con PM2 para persistencia WhatsApp

---

**Última actualización:** 2026-04
