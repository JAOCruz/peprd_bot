-- Widen phone columns: web chat session IDs can exceed 20 chars.
ALTER TABLE clients  ALTER COLUMN phone TYPE VARCHAR(64);
ALTER TABLE sessions ALTER COLUMN phone TYPE VARCHAR(64);
ALTER TABLE messages ALTER COLUMN phone TYPE VARCHAR(64);
