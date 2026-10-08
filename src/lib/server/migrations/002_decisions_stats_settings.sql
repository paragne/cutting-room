-- One row per asset: a new decision replaces the old one, undo deletes it.
-- bytes is the trashed file size for stats; Immich may not report it.
CREATE TABLE decisions (
	asset_id TEXT PRIMARY KEY,
	action TEXT NOT NULL CHECK (action IN ('keep', 'trash')),
	bytes INTEGER CHECK (bytes IS NULL OR (bytes >= 0 AND action = 'trash')),
	decided_at INTEGER NOT NULL,
	day TEXT NOT NULL
) STRICT, WITHOUT ROWID;

-- Counters kept in step with decisions, so stats never scan the decisions table.
CREATE TABLE daily_stats (
	day TEXT PRIMARY KEY,
	kept INTEGER NOT NULL DEFAULT 0 CHECK (kept >= 0),
	trashed INTEGER NOT NULL DEFAULT 0 CHECK (trashed >= 0),
	bytes_trashed INTEGER NOT NULL DEFAULT 0 CHECK (bytes_trashed >= 0)
) STRICT, WITHOUT ROWID;

CREATE TABLE settings (
	key TEXT PRIMARY KEY,
	value TEXT NOT NULL
) STRICT, WITHOUT ROWID;
