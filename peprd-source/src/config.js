require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT || '8889', 10),
  env: process.env.NODE_ENV || 'development',

  business: {
    name: process.env.BUSINESS_NAME || 'PepRD',
    botName: process.env.BOT_NAME || 'Peppi',
    tagline: process.env.BUSINESS_TAGLINE || 'Péptidos de investigación de alta pureza — envíos discretos a toda RD',
    address: process.env.BUSINESS_ADDRESS || 'Santo Domingo',
    city: process.env.BUSINESS_CITY || 'Santo Domingo',
    phone: process.env.BUSINESS_PHONE || '+1 809 870 8700',
    email: process.env.BUSINESS_EMAIL || 'ventas@peprd.io',
    instagram: process.env.BUSINESS_INSTAGRAM || '@peprd',
    hours: process.env.BUSINESS_HOURS || 'Lun-Vie 9:00am - 6:00pm | Sáb 10:00am - 2:00pm',
    timezone: process.env.TIMEZONE || 'America/Santo_Domingo',
    currency: process.env.CURRENCY || 'DOP',
    currencySymbol: process.env.CURRENCY_SYMBOL || 'RD$',
    language: process.env.LANGUAGE || 'es',
  },

  delivery: {
    enabled: process.env.DELIVERY_ENABLED === 'true',
    minOrder: parseFloat(process.env.DELIVERY_MIN_ORDER || '1000'),
    feeBase: parseFloat(process.env.DELIVERY_FEE_BASE || '250'),
    zones: (process.env.DELIVERY_ZONES || 'Santo Domingo,Santiago,Puerto Plata,La Romana,Punta Cana').split(',').filter(Boolean),
  },

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'peprd_bot',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  llm: {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    minimaxApiKey: process.env.MINIMAX_API_KEY || '',
    primary: process.env.LLM_PRIMARY || 'gemini',
  },

  whatsapp: {
    sessionDir: process.env.WA_SESSION_DIR || './wa_sessions',
    uploadsDir: process.env.UPLOADS_DIR || './public/uploads',
  },

  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:8889',
};

module.exports = config;
