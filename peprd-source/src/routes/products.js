const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const Product = require('../models/Product');
const { SERVICE_CATEGORIES } = require('../knowledge/services');

const router = express.Router();

// ── Public GET: categories + counts (read-only) ──
router.get('/categories', async (_req, res) => {
  try {
    const counts = await Product.countByCategory();
    const countsBySlug = Object.fromEntries(counts.map((c) => [c.category_slug, c]));
    const categories = Object.entries(SERVICE_CATEGORIES).map(([slug, c]) => ({
      slug,
      name: c.name,
      emoji: c.emoji,
      description: c.description,
      count: countsBySlug[slug]?.count || 0,
      total_stock: countsBySlug[slug]?.total_stock || 0,
      value: countsBySlug[slug]?.value || 0,
    }));
    res.json({ categories });
  } catch (err) {
    console.error('[products] categories error:', err);
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

// ── Everything else requires auth ──
router.use(authenticate);

router.get('/stats', async (_req, res) => {
  try {
    const stats = await Product.stats();
    res.json({ stats });
  } catch (err) {
    console.error('[products] stats error:', err);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { category, q, active } = req.query;
    const products = await Product.findAll({
      category: category || undefined,
      q: q || undefined,
      active: active === undefined ? undefined : active === 'true',
    });
    res.json({ products });
  } catch (err) {
    console.error('[products] list error:', err);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json({ product: p });
  } catch (err) {
    console.error('[products] get error:', err);
    res.status(500).json({ error: 'Failed to load product' });
  }
});

// Admin-only mutations
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const { categorySlug, name, description, price, unit, stock, lowStockThreshold, sku } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name is required' });
    const product = await Product.create({ categorySlug, name, description, price, unit, stock, lowStockThreshold, sku });
    res.status(201).json({ product });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Product name already exists' });
    console.error('[products] create error:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/:id', requireRole('admin'), async (req, res) => {
  try {
    const product = await Product.update(req.params.id, req.body || {});
    if (!product) return res.status(404).json({ error: 'Not found' });
    res.json({ product });
  } catch (err) {
    console.error('[products] update error:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.post('/:id/stock', requireRole('admin'), async (req, res) => {
  try {
    const delta = parseInt(req.body?.delta, 10);
    if (Number.isNaN(delta)) return res.status(400).json({ error: 'delta must be an integer' });
    const product = await Product.adjustStock(req.params.id, delta, req.body?.reason || null);
    if (!product) return res.status(404).json({ error: 'Not found' });
    res.json({ product });
  } catch (err) {
    console.error('[products] stock error:', err);
    res.status(500).json({ error: 'Failed to adjust stock' });
  }
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const ok = await Product.delete(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[products] delete error:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Seed / sync from knowledge/services.js
router.post('/sync-from-catalog', requireRole('admin'), async (_req, res) => {
  try {
    let created = 0;
    let updated = 0;
    for (const [slug, cat] of Object.entries(SERVICE_CATEGORIES)) {
      for (const item of (cat.items || [])) {
        const existing = await require('../db/pool').query('SELECT id FROM products WHERE name = $1', [item.name]);
        if (existing.rows[0]) {
          await Product.update(existing.rows[0].id, {
            category_slug: slug,
            price: item.prices?.unico ?? null,
            unit: 'vial',
          });
          updated++;
        } else {
          await Product.create({
            categorySlug: slug,
            name: item.name,
            price: item.prices?.unico ?? null,
            unit: 'vial',
            stock: 0,
          });
          created++;
        }
      }
    }
    res.json({ created, updated });
  } catch (err) {
    console.error('[products] sync error:', err);
    res.status(500).json({ error: 'Failed to sync catalog' });
  }
});

module.exports = router;
