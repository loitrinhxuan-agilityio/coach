-- 0001_init: the first schema. Forward-only: nothing here drops, truncates, deletes or renames.
--
-- Applied by the migration runner, which owes this file three things that SQL cannot say for itself.
-- The Aurora DSQL documentation (read 2026-11-27) states each of them:
--   1. Run every statement below in its own transaction. A transaction may hold only one DDL
--      statement, and DDL and DML may not share a transaction.
--   2. CREATE INDEX ASYNC returns a job id at once and builds in the background. Wait for that job
--      with sys.wait_for_job(<job id>), then confirm pg_index.indisvalid is true, before marking
--      this migration as applied. A failed build leaves its index behind as INVALID, and IF NOT EXISTS
--      would skip over it, so a failed job must stop the migration rather than be retried past.
--   3. Add this file to the migrations table once all of it has run. It does not add itself.
-- Every statement is safe to run again after a partial run.

-- A Key is stored only as the sha256 of its value, never as the value (R9). There is no last_used_at
-- and no revoked_at: both belong to Phase 2.
CREATE TABLE IF NOT EXISTS keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_sha256 text NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Authentication is one read of this index (R10). Aurora DSQL builds every index asynchronously, so
-- ASYNC is required. While a unique index is still building, its uniqueness is already enforced.
CREATE UNIQUE INDEX ASYNC IF NOT EXISTS keys_key_sha256_key ON keys (key_sha256);

-- A Key's name is unique in the database, not only in mint-key.ts. Two concurrent mints of one name
-- write different new rows, so snapshot isolation sees no write conflict and both would commit.
CREATE UNIQUE INDEX ASYNC IF NOT EXISTS keys_name_key ON keys (name);

-- The one settings row (R11). It has no primary key because there is exactly one row.
CREATE TABLE IF NOT EXISTS settings (
  cognito_sub text,
  time_zone text NOT NULL,
  display_unit text NOT NULL CHECK (display_unit = 'kg')
);

-- A NULL cognito_sub closes the Lifter sign-in path until change 0202 opens it. The guard makes a
-- second run leave the one row alone. A missing row is never defaulted: the operation raises internal.
INSERT INTO settings (cognito_sub, time_zone, display_unit)
SELECT NULL, 'Asia/Ho_Chi_Minh', 'kg'
WHERE NOT EXISTS (SELECT 1 FROM settings);

-- What has run. The runner writes one row per file after the file has run in full.
CREATE TABLE IF NOT EXISTS migrations (
  name text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
