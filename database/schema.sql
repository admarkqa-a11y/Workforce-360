-- Run once in a NEW Neon database. Creates empty tables; does not seed accounts or employees.
-- Running again is safe and does not clear data entered after deployment.
CREATE TABLE IF NOT EXISTS workforce360 (
 id INTEGER PRIMARY KEY CHECK (id = 1),
 owner TEXT NOT NULL,
 body TEXT NOT NULL,
 revision INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS workforce360_attempts (
 key TEXT PRIMARY KEY,
 "window" BIGINT NOT NULL,
 count INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS workforce360_assets (
 key TEXT PRIMARY KEY,
 body TEXT NOT NULL,
 content_type TEXT NOT NULL
);
