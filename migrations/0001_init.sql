-- running total for quick reads
CREATE TABLE IF NOT EXISTS solves (
  puzzle_id TEXT PRIMARY KEY,
  solve_count INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- one row per solve (timestamps)
CREATE TABLE IF NOT EXISTS solve_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  puzzle_id TEXT NOT NULL,
  ts INTEGER NOT NULL DEFAULT (unixepoch()),
  ip_hash BLOB,
  ua_hash BLOB,
  session_id TEXT
);

-- indexes we'll use
CREATE INDEX IF NOT EXISTS idx_solve_events_puzzle_ts
  ON solve_events (puzzle_id, ts DESC);

CREATE INDEX IF NOT EXISTS idx_solve_events_ts
  ON solve_events (ts DESC);
