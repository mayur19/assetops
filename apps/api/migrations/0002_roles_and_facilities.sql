-- 0002 AssetOps roles and facilities (FR-01, ADR-0003, ADR-0007).
-- Forward-only: never edit 0001; later changes get a new migration.

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('ORG_ADMIN', 'FACILITY_MANAGER', 'TECHNICIAN', 'REQUESTER'));

-- Composite key so tenant-owned children can reference (organization_id, id)
-- and the database itself rejects cross-organization foreign keys.
ALTER TABLE users ADD CONSTRAINT users_org_id_key UNIQUE (organization_id, id);

CREATE TABLE facilities (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  code             text NOT NULL CHECK (code ~ '^[A-Z0-9][A-Z0-9-]{1,19}$'),
  name             text NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
  address          text NOT NULL DEFAULT '' CHECK (length(address) <= 500),
  timezone         text NOT NULL CHECK (length(timezone) BETWEEN 1 AND 64),
  archived_at      timestamptz,
  version          integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by       uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT facilities_org_code_key UNIQUE (organization_id, code),
  CONSTRAINT facilities_org_id_key UNIQUE (organization_id, id)
);

CREATE INDEX facilities_org_name_idx ON facilities (organization_id, name, id);
CREATE INDEX facilities_org_active_idx ON facilities (organization_id) WHERE archived_at IS NULL;
