-- PCI KPI Management — Phase 1 bootstrap schema
-- Phase 2 will extend with performance cycles, worksheets, approvals, etc.

CREATE TABLE IF NOT EXISTS "AppMeta" (
  "Key"   VARCHAR(100) PRIMARY KEY,
  "Value" TEXT NOT NULL,
  "UpdatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO "AppMeta" ("Key", "Value")
VALUES ('schema_version', '1')
ON CONFLICT ("Key") DO NOTHING;
