require('dotenv').config();

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
    password: process.env.DB_PASSWORD || '',
  },

  // JWT config
  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // WhatsApp config
  wa: {
    sessionDir: process.env.WA_SESSION_DIR || './wa_sessions',
    disabled: process.env.DISABLE_WA === 'true',
  },

  // Uploads config
  uploads: {
    dir: process.env.UPLOADS_DIR || './uploads',
    maxSizeMB: parseInt(process.env.MAX_UPLOAD_SIZE_MB) || 25,
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
