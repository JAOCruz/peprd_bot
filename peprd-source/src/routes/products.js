const express = require('express');
const Product = require('../models/Product');

const router = express.Router();

router.get('/categories', async (_req, res, next) => {
  try {
    const cats = await Product.listCategories();
    res.json(cats);
  } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try {
    if (req.query.category) {
      const items = await Product.listByCategory(req.query.category);
      return res.json(items);
    }
    const items = await Product.listAll();
    res.json(items);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(p);
  } catch (err) { next(err); }
});

module.exports = router;
