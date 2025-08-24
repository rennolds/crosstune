-- Create table for user-created puzzles
CREATE TABLE IF NOT EXISTS custom_puzzles (
  id TEXT PRIMARY KEY,
  puzzle_json TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT,
  CHECK (json_valid(puzzle_json))
);

-- Index for efficient recents and admin views
CREATE INDEX IF NOT EXISTS idx_custom_puzzles_created_at
  ON custom_puzzles (created_at DESC);


