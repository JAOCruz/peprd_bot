# PepRD Bot

AI-powered WhatsApp customer service bot for **PepRD** — research peptides store in the Dominican Republic ([peprd.io](https://peprd.io)).

## Stack

- **Backend:** Node.js 20+ · Express · PostgreSQL · Baileys (WhatsApp)
- **LLM:** Gemini 2.5-flash (chain to 2.0-flash → MiniMax fallback)
- **Dashboard:** Standalone HTML (no build) + optional React/Vite
- **Invoices:** HTML + PDF via Puppeteer

## Features

- 📱 WhatsApp integration via Baileys (QR scan)
- 💬 Web chat tester (test without WhatsApp)
- 🧬 74 peptides, 9 categories pre-seeded from peprd.io
- 🤖 Natural Dominican-Spanish responses (LLM fallback with safety rails)
- 🔬 Educational peptide consultation flow with medical disclaimers
- 🧾 PDF invoice generation
- 📦 Order flow: cart → pickup/shipping → address → payment → confirmation
- 🎨 Dashboard matches peprd.io branding (teal/gold/cream, Fraunces serif)

## Quick start

```bash
# Backend
cd peprd-source
npm install
cp .env.example .env           # fill in GEMINI_API_KEY + DB password
createdb peprd_bot
npm run migrate
psql peprd_bot < src/data/seed_products.sql

# (Optional) skip WhatsApp during testing:
# set DISABLE_WA=true in .env

npm start                      # API on :8889

# Dashboard — just open in browser
open ../dashboard.html
```

## Documentation

See [`CLAUDE.md`](./CLAUDE.md) for architecture, flows, branding, endpoints, and deployment checklist.

## Safety

Products are **strictly for research use**. The bot is built to:
- Never prescribe or recommend doses for personal use
- Always include a medical disclaimer on orders and consultations
- Redirect medical questions to a qualified professional

## License

Private — PepRD.
