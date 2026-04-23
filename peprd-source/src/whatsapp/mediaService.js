const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const config = require('../config');

// Allow-list: mime type → canonical extension. Anything not here gets rejected.
const MIME_EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'audio/ogg; codecs=opus': '.ogg',
  'audio/ogg': '.ogg',
  'audio/mpeg': '.mp3',
  'video/mp4': '.mp4',
};

// Magic bytes for content-type validation. Prevents a .pdf-labelled PE/ELF/etc.
const MAGIC_BYTES = {
  '.jpg':  [[0xFF, 0xD8, 0xFF]],
  '.png':  [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  '.gif':  [[0x47, 0x49, 0x46, 0x38]],
  '.webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF; followed by WEBP at offset 8
  '.pdf':  [[0x25, 0x50, 0x44, 0x46]],
  '.ogg':  [[0x4F, 0x67, 0x67, 0x53]],
  '.mp3':  [[0x49, 0x44, 0x33], [0xFF, 0xFB], [0xFF, 0xF3], [0xFF, 0xF2]],
  '.mp4':  [], // mp4 has variable boxes; skip strict check
  '.doc':  [[0xD0, 0xCF, 0x11, 0xE0]],
  '.docx': [[0x50, 0x4B, 0x03, 0x04]],
  '.xls':  [[0xD0, 0xCF, 0x11, 0xE0]],
  '.xlsx': [[0x50, 0x4B, 0x03, 0x04]],
};

function matchesMagic(buf, ext) {
  const patterns = MAGIC_BYTES[ext];
  if (!patterns || patterns.length === 0) return true; // no check defined
  return patterns.some(p => p.every((b, i) => buf[i] === b));
}

// Strict: normalize mime (strip params), look up in allow-list. Ignore filename ext.
function getExtension(mimeType) {
  if (!mimeType) return null;
  const normalized = String(mimeType).toLowerCase().split(';')[0].trim();
  // Try normalized first, then fall back to full string for keys like "audio/ogg; codecs=opus"
  return MIME_EXTENSIONS[normalized] || MIME_EXTENSIONS[String(mimeType).toLowerCase().trim()] || null;
}

// Sanitize user-supplied filename for safe display / Content-Disposition
function sanitizeFilename(name) {
  if (!name) return null;
  return String(name)
    .replace(/[\x00-\x1f\x7f]/g, '')   // control chars
    .replace(/[\/\\]/g, '_')             // path separators
    .replace(/\.\.+/g, '.')              // traversal dots
    .replace(/["\r\n]/g, '')             // header-injection
    .slice(0, 100) || null;
}

/**
 * Download and save media from a WhatsApp message.
 * Returns { filePath, fileName, savedName, mimeType, mediaType, fileSize } or null.
 */
async function saveMediaFromMessage(msg, phone) {
  const mediaMessage = msg.message?.imageMessage
    || msg.message?.documentMessage
    || msg.message?.audioMessage
    || msg.message?.videoMessage;

  if (!mediaMessage) return null;

  const mimeType = mediaMessage.mimetype || '';
  const originalName = sanitizeFilename(mediaMessage.fileName || null);
  const ext = getExtension(mimeType);

  if (!ext) {
    console.warn(`[Media] Rejected unsupported mime "${mimeType}" from ${phone}`);
    return null;
  }

  // Sanitize phone (used as a directory) — digits + '+' only
  const safePhone = String(phone).replace(/[^0-9+]/g, '').slice(0, 20) || 'unknown';

  // Generate filename ourselves; never use client-supplied name on disk.
  const savedName = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`;

  const mediaType = msg.message.imageMessage ? 'image'
    : msg.message.documentMessage ? 'document'
    : msg.message.audioMessage ? 'audio'
    : 'video';

  // Ensure directory exists: uploads/<phone>/
  const uploadsDir = config.uploads?.dir || './uploads';
  const uploadsBase = path.resolve(uploadsDir);
  const phoneDir = path.resolve(uploadsBase, safePhone);
  // Belt-and-suspenders: never write outside uploadsBase
  if (!phoneDir.startsWith(uploadsBase + path.sep) && phoneDir !== uploadsBase) {
    console.warn(`[Media] Refused path escape for phone "${phone}"`);
    return null;
  }
  fs.mkdirSync(phoneDir, { recursive: true });

  const filePath = path.join(phoneDir, savedName);

  // Download the media buffer from WhatsApp servers
  const buffer = await downloadMediaMessage(msg, 'buffer', {});

  // Check file size
  const maxSizeMB = config.uploads?.maxSizeMB || 25;
  const fileSizeMB = buffer.length / (1024 * 1024);
  if (fileSizeMB > maxSizeMB) {
    console.warn(`[Media] File too large (${fileSizeMB.toFixed(1)}MB) from ${phone}, skipping`);
    return null;
  }

  // Validate magic bytes match the declared mime. Rejects, e.g., .pdf holding a binary.
  if (!matchesMagic(buffer, ext)) {
    console.warn(`[Media] Magic-byte mismatch for ${ext} from ${phone}, rejecting`);
    return null;
  }

  fs.writeFileSync(filePath, buffer);

  console.log(`[Media] Saved ${mediaType} from ${phone}: ${savedName} (${(buffer.length / 1024).toFixed(1)}KB)`);

  return {
    filePath,
    fileName: originalName || savedName,
    savedName,
    mimeType,
    mediaType,
    fileSize: buffer.length,
  };
}

module.exports = { saveMediaFromMessage };
