# ADR-0011: Local file attachment storage

- Status: Proposed
- Date: 2026-11-20

## Context

PRD §2 requires attachments on local disk with generated filenames, MIME allowlists, size
limits and path traversal protection, storing only metadata in SQL. A-14 requires rejecting
executables and oversized files. Implementation is pending (AO-020).

## Decision Drivers

- No cloud storage at runtime; offline operation.
- Uploaded content must never be executed or served with a dangerous content type.
- Tenant isolation on download.

## Considered Options

1. Local directory `UPLOAD_DIR` with random names and an `attachments` metadata table.
2. Store file bytes in PostgreSQL (`bytea`).
3. Object storage (S3-compatible).

## Decision Outcome

Proposed option 1, behind a small storage interface so object storage can replace it later.

- Allowlist: JPEG, PNG, WebP, PDF; type verified by magic bytes, not only by the client header.
- Size limit `UPLOAD_MAX_BYTES` (default 10 MiB) enforced while streaming.
- Stored name: random UUID + allowlisted extension; the original name kept only as metadata.
- Resolved path must stay inside `UPLOAD_DIR` (reject `..`, absolute paths, symlinks).
- Downloads go through `GET /api/v1/attachments/:id`, which checks `organization_id` and sends
  `Content-Disposition: attachment` and `X-Content-Type-Options: nosniff`.

## Consequences

### Positive

- Simple, offline, testable.

### Negative

- Files are not replicated; backups must include `UPLOAD_DIR` alongside `pg_dump`.
- Horizontal scaling requires shared storage or migration to object storage.

## Links

- AO-020, AO-059
- `apps/api/src/modules/attachments/attachments.routes.ts`
