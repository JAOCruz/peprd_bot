# PepRD — Template Integration Notes

This folder started as the generic `ai-service-bot-template` (the Gurú Soluciones framework with legal content stripped out). It has been customized for **PepRD**:

## What changed

- **Port:** backend on `8889`, client on `5175` (so it doesn't collide with other local bots)
- **Branding:** Peppi (bot) + PepRD (business). Palette cream/teal/gold/navy matching peprd.io
- **Personality:** `src/llm/systemPrompt.js` — casual Dominican Spanish, research-use rules, no medical advice
- **Knowledge:** `src/knowledge/peptideTopics.js` + `services.js` + `institutions.js` (PubMed/ClinicalTrials/FDA/WHO)
- **Services:** 9 categories, ~70 peptides — see `src/knowledge/services.js`
- **Messages:** `src/conversation/messages.js` rewritten; main menu uses peptide-appropriate options
- **Seed:** `src/db/seed.js` seeds 9 product categories + 2 service categories into `service_categories` (and populates `products` if table exists)
- **Invoice PDF:** `src/documents/generateInvoice.js` with PepRD palette and research-use disclaimer
- **Admin panel:** `client/` — rebranded (logo, nav labels, colors), points to :8889
- **Flows:** `legal_info` flow removed; `legalTopics` intent renamed → `peptide_info`
- **Knowledge base page:** now edits peptide topics instead of legal topics (`refs` instead of `law_refs`)

## Files removed

- `src/knowledge/GURU_AI_IDENTITY.pdf`, `src/knowledge/GURU_PRECIOS_OFICIALES.pdf`
- `src/knowledge/legalTopics.js`
- `src/conversation/flows/legalInfo.js`
- Old `dashboard.html` (the client panel at `/client` replaces it)

## Still legal/Gurú references you might want to revisit

- `src/documents/templateFields.js` has legal document templates (contratos, actos) that a peptide store won't use. They're harmless since the `docGen` flow is optional — ignore or delete if you don't want doc generation.

## Next customizations (optional)

- Swap `src/llm/generate.js` prompts for fully peptide-specific LLM flows
- Sync `src/knowledge/services.js` pricing with live peprd.io prices (they're currently the best-effort set I pulled)
- Add a peptide-specific admin dashboard tile (e.g., "inventario por categoría")
