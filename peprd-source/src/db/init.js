const pool = require('./pool');

const schema = `
  CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name          VARCHAR(255) NOT NULL,
    role          VARCHAR(50) DEFAULT 'lawyer',
    last_seen     TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
  );
  ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;

  CREATE TABLE IF NOT EXISTS clients (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    phone         VARCHAR(20) UNIQUE NOT NULL,
    email         VARCHAR(255),
    address       TEXT,
    notes         TEXT,
    user_id       INT REFERENCES users(id) ON DELETE SET NULL,
    assigned_to   INT REFERENCES users(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
  );
  ALTER TABLE clients ADD COLUMN IF NOT EXISTS assigned_to INT REFERENCES users(id) ON DELETE SET NULL;

  CREATE TABLE IF NOT EXISTS cases (
    id            SERIAL PRIMARY KEY,
    case_number   VARCHAR(100) UNIQUE NOT NULL,
    title         VARCHAR(255) NOT NULL,
    description   TEXT,
    status        VARCHAR(50) DEFAULT 'open',
    case_type     VARCHAR(100),
    client_id     INT REFERENCES clients(id) ON DELETE CASCADE,
    user_id       INT REFERENCES users(id) ON DELETE SET NULL,
    court         VARCHAR(255),
    next_hearing  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS messages (
    id            SERIAL PRIMARY KEY,
    wa_message_id VARCHAR(255),
    wa_jid        VARCHAR(100),
    phone         VARCHAR(20),
    client_id     INT REFERENCES clients(id) ON DELETE CASCADE,
    case_id       INT REFERENCES cases(id) ON DELETE SET NULL,
    direction     VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    content       TEXT NOT NULL,
    media_url     TEXT,
    status        VARCHAR(20) DEFAULT 'sent',
    created_at    TIMESTAMPTZ DEFAULT NOW()
  );
  ALTER TABLE messages ADD COLUMN IF NOT EXISTS wa_jid VARCHAR(100);

  CREATE TABLE IF NOT EXISTS wa_sessions (
    id            SERIAL PRIMARY KEY,
    user_id       INT REFERENCES users(id) ON DELETE CASCADE,
    session_id    VARCHAR(255) UNIQUE NOT NULL,
    active        BOOLEAN DEFAULT true,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS conversation_sessions (
    id            SERIAL PRIMARY KEY,
    phone         VARCHAR(20) NOT NULL,
    client_id     INT REFERENCES clients(id) ON DELETE SET NULL,
    flow          VARCHAR(50) NOT NULL DEFAULT 'main_menu',
    step          VARCHAR(50) NOT NULL DEFAULT 'init',
    data          JSONB DEFAULT '{}',
    active        BOOLEAN DEFAULT true,
    expires_at    TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 minutes'),
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id            SERIAL PRIMARY KEY,
    client_id     INT REFERENCES clients(id) ON DELETE CASCADE,
    case_id       INT REFERENCES cases(id) ON DELETE SET NULL,
    user_id       INT REFERENCES users(id) ON DELETE SET NULL,
    date          DATE NOT NULL,
    time          TIME NOT NULL,
    duration_min  INT DEFAULT 60,
    type          VARCHAR(50) DEFAULT 'consulta',
    status        VARCHAR(30) DEFAULT 'pendiente',
    notes         TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS document_requests (
    id            SERIAL PRIMARY KEY,
    client_id     INT REFERENCES clients(id) ON DELETE CASCADE,
    case_id       INT REFERENCES cases(id) ON DELETE SET NULL,
    doc_type      VARCHAR(100) NOT NULL,
    description   TEXT,
    wa_media_id   VARCHAR(255),
    file_name     VARCHAR(255),
    mime_type     VARCHAR(100),
    status        VARCHAR(30) DEFAULT 'recibido',
    notes         TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS client_notes (
    id          SERIAL PRIMARY KEY,
    client_id   INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    author_id   INT REFERENCES users(id) ON DELETE SET NULL,
    body        TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
  CREATE INDEX IF NOT EXISTS idx_clients_assigned_to ON clients(assigned_to);
  CREATE INDEX IF NOT EXISTS idx_messages_wa_jid ON messages(wa_jid);
  CREATE INDEX IF NOT EXISTS idx_client_notes_client ON client_notes(client_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_cases_client ON cases(client_id);
  CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
  CREATE INDEX IF NOT EXISTS idx_messages_phone ON messages(phone);
  CREATE INDEX IF NOT EXISTS idx_messages_client ON messages(client_id);
  CREATE INDEX IF NOT EXISTS idx_messages_case ON messages(case_id);
  CREATE INDEX IF NOT EXISTS idx_conv_sessions_phone ON conversation_sessions(phone);
  CREATE INDEX IF NOT EXISTS idx_conv_sessions_active ON conversation_sessions(active);
  CREATE INDEX IF NOT EXISTS idx_appointments_client ON appointments(client_id);
  CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
  CREATE INDEX IF NOT EXISTS idx_document_requests_client ON document_requests(client_id);

  CREATE TABLE IF NOT EXISTS client_media (
    id             SERIAL PRIMARY KEY,
    phone          VARCHAR(20) NOT NULL,
    client_id      INT REFERENCES clients(id) ON DELETE SET NULL,
    wa_message_id  VARCHAR(255),
    media_type     VARCHAR(20) NOT NULL,
    mime_type      VARCHAR(100),
    original_name  VARCHAR(255),
    saved_name     VARCHAR(255) NOT NULL,
    file_path      TEXT NOT NULL,
    file_size      INT,
    context        VARCHAR(50) DEFAULT 'conversation',
    doc_request_id INT REFERENCES document_requests(id) ON DELETE SET NULL,
    created_at     TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_client_media_phone ON client_media(phone);
  CREATE INDEX IF NOT EXISTS idx_client_media_client ON client_media(client_id);

  CREATE TABLE IF NOT EXISTS service_categories (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(255) NOT NULL UNIQUE,
    description   TEXT,
    abbreviation  VARCHAR(10),
    color         VARCHAR(20) DEFAULT '#3b82f6',
    icon          VARCHAR(50),
    category_type VARCHAR(20) CHECK (category_type IN ('service', 'product', 'store')) DEFAULT 'service',
    active        BOOLEAN DEFAULT true,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS services (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(255) NOT NULL UNIQUE,
    description   TEXT,
    category_id   INT REFERENCES service_categories(id) ON DELETE SET NULL,
    price         DECIMAL(10, 2),
    active        BOOLEAN DEFAULT true,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS client_services (
    id            SERIAL PRIMARY KEY,
    client_id     INT REFERENCES clients(id) ON DELETE CASCADE,
    service_id    INT REFERENCES services(id) ON DELETE CASCADE,
    status        VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    started_at    TIMESTAMPTZ DEFAULT NOW(),
    completed_at  TIMESTAMPTZ,
    notes         TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS case_tags (
    id            SERIAL PRIMARY KEY,
    case_id       INT REFERENCES cases(id) ON DELETE CASCADE,
    tag_type      VARCHAR(100) NOT NULL,
    tag_value     VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id             SERIAL PRIMARY KEY,
    doc_number     VARCHAR(50) UNIQUE NOT NULL,
    type           VARCHAR(30) NOT NULL DEFAULT 'COTIZACIÓN',
    status         VARCHAR(20) NOT NULL DEFAULT 'draft',
    client_id      INT REFERENCES clients(id) ON DELETE SET NULL,
    client_name    VARCHAR(255) NOT NULL,
    client_phone   VARCHAR(30),
    items          JSONB NOT NULL DEFAULT '[]',
    notes          TEXT,
    subtotal       DECIMAL(12, 2) NOT NULL DEFAULT 0,
    itbis          DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total          DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_by     INT REFERENCES users(id) ON DELETE SET NULL,
    approved_by    INT REFERENCES users(id) ON DELETE SET NULL,
    approved_at    TIMESTAMPTZ,
    pdf_path       TEXT,
    sent_at        TIMESTAMPTZ,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS invoice_items (
    id            SERIAL PRIMARY KEY,
    invoice_id    INT REFERENCES invoices(id) ON DELETE CASCADE,
    service_id    INT REFERENCES services(id) ON DELETE SET NULL,
    description   VARCHAR(255) NOT NULL,
    quantity      INT NOT NULL DEFAULT 1,
    unit_price    DECIMAL(10, 2) NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS broadcasts (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR(255),
    message         TEXT NOT NULL,
    media_url       TEXT,
    scheduled_at    TIMESTAMPTZ,
    sent_at         TIMESTAMPTZ,
    created_by      INT REFERENCES users(id) ON DELETE SET NULL,
    recipient_count INT NOT NULL DEFAULT 0,
    sent_count      INT NOT NULL DEFAULT 0,
    failed_count    INT NOT NULL DEFAULT 0,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS broadcast_recipients (
    id            SERIAL PRIMARY KEY,
    broadcast_id  INT REFERENCES broadcasts(id) ON DELETE CASCADE,
    client_id     INT REFERENCES clients(id) ON DELETE SET NULL,
    phone         VARCHAR(30) NOT NULL,
    name          VARCHAR(255),
    status        VARCHAR(20) NOT NULL DEFAULT 'pending',
    sent_at       TIMESTAMPTZ,
    error         TEXT
  );

  CREATE TABLE IF NOT EXISTS products (
    id             SERIAL PRIMARY KEY,
    category_slug  VARCHAR(100),
    name           VARCHAR(255) UNIQUE NOT NULL,
    price          DECIMAL(10, 2),
    unit           VARCHAR(50) DEFAULT 'vial',
    active         BOOLEAN DEFAULT true,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
  CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
  CREATE INDEX IF NOT EXISTS idx_broadcasts_status ON broadcasts(status);
  CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_broadcast ON broadcast_recipients(broadcast_id);
  CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_slug);

  CREATE INDEX IF NOT EXISTS idx_service_categories_active ON service_categories(active);
  CREATE INDEX IF NOT EXISTS idx_services_category ON services(category_id);
  CREATE INDEX IF NOT EXISTS idx_services_active ON services(active);
  CREATE INDEX IF NOT EXISTS idx_client_services_client ON client_services(client_id);
  CREATE INDEX IF NOT EXISTS idx_client_services_service ON client_services(service_id);
  CREATE INDEX IF NOT EXISTS idx_case_tags_case ON case_tags(case_id);
`;

async function initDb() {
  try {
    await pool.query(schema);
    console.log('Database schema initialized successfully');
  } catch (err) {
    console.error('Failed to initialize database schema:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDb();
