-- 1 when this decision turned the Immich favorite flag on, so undo turns it off.
-- An asset that was already a favorite stays 0 and keeps its flag on undo.
ALTER TABLE decisions ADD COLUMN favorite INTEGER NOT NULL DEFAULT 0
	CHECK (favorite IN (0, 1) AND (favorite = 0 OR action = 'keep'));
