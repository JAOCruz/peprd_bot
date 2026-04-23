const express = require('express');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth');
const Client = require('../models/Client');
const ClientMedia = require('../models/ClientMedia');
const config = require('../config');

const router = express.Router();
router.use(authenticate);

async function canAccessClient(req, clientId) {
  if (!clientId) return false;
  if (req.user.role !== 'digitador') return true;
  const c = await Client.findById(clientId);
  if (!c) return false;
  return c.assigned_to === req.user.id;
}

// List all media for a client
router.get('/client/:clientId', async (req, res) => {
  try {
    if (!(await canAccessClient(req, req.params.clientId))) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const media = await ClientMedia.findByClient(req.params.clientId);
    res.json({ media });
  } catch (err) {
    console.error('List client media error:', err);
    res.status(500).json({ error: 'Failed to list media' });
  }
});

// List all media for a phone (for unregistered contacts)
router.get('/phone/:phone', async (req, res) => {
  try {
    const media = await ClientMedia.findByPhone(req.params.phone);
    res.json({ media });
  } catch (err) {
    console.error('List phone media error:', err);
    res.status(500).json({ error: 'Failed to list media' });
  }
});

// Download a specific media file
router.get('/:id/download', async (req, res) => {
  try {
    const media = await ClientMedia.findById(req.params.id);
    if (!media) return res.status(404).json({ error: 'Media not found' });
    if (!(await canAccessClient(req, media.client_id))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Constrain reads to the configured uploads dir. Blocks path-traversal
    // even if a poisoned file_path slipped into the DB.
    const uploadsBase = path.resolve(config.uploads?.dir || './uploads');
    const absPath = path.resolve(media.file_path);
    if (!absPath.startsWith(uploadsBase + path.sep) && absPath !== uploadsBase) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (!fs.existsSync(absPath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    // Sanitize filename for header: strip CRLF, quotes, and escape control chars.
    const rawName = media.original_name || media.saved_name || 'file';
    const safeName = String(rawName).replace(/[\r\n"\\]/g, '').replace(/[\x00-\x1f\x7f]/g, '');
    res.setHeader('Content-Type', media.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
    res.sendFile(absPath);
  } catch (err) {
    console.error('Download media error:', err);
    res.status(500).json({ error: 'Failed to download media' });
  }
});

// Get media metadata
router.get('/:id', async (req, res) => {
  try {
    const media = await ClientMedia.findById(req.params.id);
    if (!media) return res.status(404).json({ error: 'Media not found' });
    if (!(await canAccessClient(req, media.client_id))) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json({ media });
  } catch (err) {
    console.error('Get media error:', err);
    res.status(500).json({ error: 'Failed to get media' });
  }
});

module.exports = router;
