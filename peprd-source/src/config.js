require('dotenv').config();

function requireEnv(name) {
  const v = process.env[name];
  if (!v || v === 'change-me-in-production' || v === '__FILL_JWT_SECRET__' || v === '__FILL_DB_PASSWORD__') {
    throw new Error(`${name} must be set to a strong value in .env`);
  }
  return v;
}

module.exports = {
  // Server config
  port: process.env.PORT || 8889,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:8889',

  // Business info
  business: {
    name: process.env.BUSINESS_NAME || 'PepRD',
    botName: process.env.BOT_NAME || 'Peppi',
    tagline: process.env.BUSINESS_TAGLINE || 'Péptidos de investigación de alta pureza — envíos discretos a toda RD',
    city: process.env.BUSINESS_CITY || 'Santo Domingo',
    phone: process.env.BUSINESS_PHONE || '+1 809 870 8700',
    email: process.env.BUSINESS_EMAIL || 'ventas@peprd.io',
    website: process.env.BUSINESS_WEBSITE || 'https://peprd.io',
    instagram: process.env.BUSINESS_INSTAGRAM || '@peprd',
    hours: process.env.BUSINESS_HOURS || 'Lun-Vie 9:00am - 6:00pm | Sáb 10:00am - 2:00pm',
    timezone: process.env.TIMEZONE || 'America/Santo_Domingo',
    currency: process.env.CURRENCY || 'DOP',
    currencySymbol: process.env.CURRENCY_SYMBOL || 'RD$',
  },

  // Database config
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'peprd_bot',
    user: process.env.DB_USER || 'postgres',
    password: requireEnv('DB_PASSWORD'),
  },

  // JWT config
  jwt: {
    secret: requireEnv('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    algorithm: 'HS256',
  },

  // WhatsApp config
  wa: {
    sessionDir: process.env.WA_SESSION_DIR || './wa_sessions',
    disabled: process.env.DISABLE_WA === 'true',
    // Capture-only mode: receive + log messages, never send replies.
    // Useful while testing the AI without blasting users. Overrides every
    // other "bot active" setting — replies are suppressed even if the UI
    // toggle says active.
    captureOnly: process.env.CAPTURE_ONLY === 'true',
  },

  // Uploads config
  uploads: {
    dir: process.env.UPLOADS_DIR || './uploads',
    maxSizeMB: parseInt(process.env.MAX_UPLOAD_SIZE_MB) || 25,
  },

  // Legal docs template index (optional, legacy template feature)
  documents: {
    baseDir: process.env.DOCUMENTS_BASE_DIR || '',
    indexPath: process.env.DOCUMENT_INDEX_PATH || '',
  },

  // Gemini AI config
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    enabled: process.env.GEMINI_ENABLED !== 'false' && !!process.env.GEMINI_API_KEY,
  },

  // MiniMax AI config (alternative to Gemini)
  minimax: {
    apiKey: process.env.MINIMAX_API_KEY || '',
    enabled: process.env.MINIMAX_ENABLED !== 'false' && !!process.env.MINIMAX_API_KEY,
  },
};
