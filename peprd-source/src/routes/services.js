const express = require('express');
const Service = require('../models/Service');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Get all services (public)
router.get('/', async (req, res) => {
  try {
    const services = await Service.findAll();
    res.json({ services });
  } catch (err) {
    console.error('List services error:', err);
    res.status(500).json({ error: 'Failed to list services' });
  }
});

// Get services by category
router.get('/category/:category', async (req, res) => {
  try {
    const services = await Service.findByCategory(req.params.category);
    res.json({ services });
  } catch (err) {
    console.error('List services by category error:', err);
    res.status(500).json({ error: 'Failed to list services' });
  }
});

// Get all categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Service.getCategories();
    res.json({ categories });
  } catch (err) {
    console.error('List categories error:', err);
    res.status(500).json({ error: 'Failed to list categories' });
  }
});

// Search service by name
router.get('/search/:name', async (req, res) => {
  try {
    const service = await Service.findByName(req.params.name);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    res.json({ service });
  } catch (err) {
    console.error('Search service error:', err);
    res.status(500).json({ error: 'Failed to search service' });
  }
});

// Create service (admin only)
router.post('/', async (req, res) => {
  try {
    const { name, description, category, price } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'name and price are required' });
    }
    const service = await Service.create({ name, description, category, price });
    res.status(201).json({ service });
  } catch (err) {
    console.error('Create service error:', err);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// Update service
router.put('/:id', async (req, res) => {
  try {
    const { name, description, category, price, active } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (price !== undefined) updates.price = price;
    if (active !== undefined) updates.active = active;

    const service = await Service.update(req.params.id, updates);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    res.json({ service });
  } catch (err) {
    console.error('Update service error:', err);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// Delete service (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    await Service.delete(req.params.id);
    res.json({ message: 'Service deleted' });
  } catch (err) {
    console.error('Delete service error:', err);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

module.exports = router;
