const pool = require('./pool');

// PepRD service categories — peptide research products
const serviceCategories = [
  { name: 'GLP-1 / Metabólicos',     abbreviation: 'GLP', color: '#c89b3c', category_type: 'product', description: 'Retatrutide, Tirzepatide, Semaglutide, blends' },
  { name: 'Hormona de crecimiento',  abbreviation: 'GH',  color: '#2d5f5a', category_type: 'product', description: 'CJC-1295, Ipamorelin, Sermorelin, IGF' },
  { name: 'Reparación tisular',      abbreviation: 'REP', color: '#b44545', category_type: 'product', description: 'BPC-157, TB-500 y blends de reparación' },
  { name: 'Piel y cabello',          abbreviation: 'PIE', color: '#c89b3c', category_type: 'product', description: 'GHK-Cu, Melanotan, glutathione, HA' },
  { name: 'Nootrópicos',             abbreviation: 'NOO', color: '#3e5a2e', category_type: 'product', description: 'Semax, Selank, Cerebrolysin, DSIP' },
  { name: 'Longevidad',              abbreviation: 'LON', color: '#1f4340', category_type: 'product', description: 'Epitalon, NAD+, MOTS-c, SS-31' },
  { name: 'Sexual / Hormonal',       abbreviation: 'HOR', color: '#b44545', category_type: 'product', description: 'PT-141, Oxytocin, Kisspeptin, HCG' },
  { name: 'Sistema inmune',          abbreviation: 'INM', color: '#2d5f5a', category_type: 'product', description: 'Thymosin Alpha-1, LL-37, KPV, VIP' },
  { name: 'Soporte / Reconstitución',abbreviation: 'SUP', color: '#6b6f5f', category_type: 'product', description: 'BAC Water, B12, solventes y consumibles' },

  // Generic services
  { name: 'Envío / Logística',       abbreviation: 'ENV', color: '#2d5f5a', category_type: 'service', description: 'Envío discreto a toda la República Dominicana' },
  { name: 'Consulta',                abbreviation: 'CON', color: '#c89b3c', category_type: 'service', description: 'Consulta previa por videollamada' },
];

async function seed() {
  console.log('Seeding PepRD categories...');
  for (const c of serviceCategories) {
    try {
      await pool.query(
        `INSERT INTO service_categories (name, description, abbreviation, color, category_type)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (name) DO UPDATE SET
           description = EXCLUDED.description,
           abbreviation = EXCLUDED.abbreviation,
           color = EXCLUDED.color,
           category_type = EXCLUDED.category_type`,
        [c.name, c.description || null, c.abbreviation, c.color, c.category_type]
      );
    } catch (err) {
      console.warn(`  skip "${c.name}": ${err.message}`);
    }
  }
  console.log(`  ✓ ${serviceCategories.length} categorías`);

  // Seed peptide products from knowledge/services.js into a simple products table if available
  try {
    const { SERVICE_CATEGORIES } = require('../knowledge/services');
    let total = 0;
    for (const [slug, cat] of Object.entries(SERVICE_CATEGORIES)) {
      for (const item of (cat.items || [])) {
        try {
          await pool.query(
            `INSERT INTO products (category_slug, name, price, unit)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (name) DO UPDATE SET price = EXCLUDED.price, unit = EXCLUDED.unit`,
            [slug, item.name, item.prices.unico, 'vial']
          );
          total++;
        } catch (err) {
          // products table may not exist in guru schema — ok to skip
          if (err.code !== '42P01') console.warn(`  skip "${item.name}": ${err.message}`);
          break;
        }
      }
    }
    if (total) console.log(`  ✓ ${total} productos`);
  } catch (err) {
    console.warn('  (skipped products seeding):', err.message);
  }

  console.log('Seed complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
