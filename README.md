# PepRD Bot

WhatsApp + web AI bot for **PepRD** — research peptides store in the Dominican Republic ([peprd.io](https://peprd.io)).

Built on top of a generic service-bot template (originally Gurú Soluciones) with the legal/papelería layer fully replaced by peptide research flows.

## Features

- 📱 WhatsApp integration via Baileys (QR scan)
- 🧬 Catalog of ~70 peptides across 9 categories (GLP-1, GH, repair, skin, nootropics, longevity, hormonal, immune, support) — pricing sourced from peprd.io
- 🤖 Gemini LLM (natural Dominican-Spanish) with safety rails (no medical advice, no invented prices)
- 🧾 PDF invoice / quotation generation via Puppeteer (PepRD teal/gold/cream branding)
- 🗂 Full admin panel: clients, cases (orders), messages, invoices, appointments, documents, broadcasts, analytics, settings
- 📂 Case / ticket system with auto-detection
- 🖼 Media handling (downloads, stores, analyzes images and PDFs)
- ✉️ Broadcast scheduling
- 🔐 JWT auth with admin / digitador (data-entry) roles
- 📖 Knowledge base editable from the admin (peptide topics, institutions, service catalog)

## Stack

- **Backend:** Node.js 20+ · Express · PostgreSQL · Baileys (WhatsApp)
- **LLM:** Gemini 2.5/2.0-flash chain · MiniMax fallback
- **Frontend:** React 19 · Vite · Tailwind · Fraunces + Instrument Sans + JetBrains Mono
- **PDF:** Puppeteer (HTML-to-PDF)

## Quick start

```bash
cd peprd-source

# Backend
npm install
cp .env.example .env              # fill in GEMINI_API_KEY + DB password
npm run db:init                   # create tables
npm run db:seed                   # seed categories + products

# WhatsApp optional: set DISABLE_WA=true in .env for local testing

# Run backend (:8889) and client (:5175) together:
npm run dev:full

# Or separately:
npm run dev
npm run client:dev
```

Then open http://localhost:5175 and log in.

## Documentation

See [`CLAUDE.md`](./CLAUDE.md) for architecture, flows, branding, endpoints, and deployment notes.

## Safety

Products are **strictly for research use**. The bot is built to:
- Never prescribe or recommend doses for personal use
- Always include a medical disclaimer on orders / invoices / consultations
- Redirect medical questions to a qualified professional

## License

Private — PepRD.
