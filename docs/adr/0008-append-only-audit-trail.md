# ADR-0008: Append-only audit trail

- Status: Accepted
- Date: 2026-11-20

## Context

FR-10 requires append-only audit events for create/update/delete, approvals, status changes and
inventory adjustments with actor, organization, entity, action, before/after summary and
timestamp; no editing or removal from the UI.

## Decision Drivers

- An audit row must exist if and only if the business change committed.
- Tamper resistance within the application.
- Cheap queries by organization and time.

## Considered Options

1. `audit_events` table written in the same transaction as the change.
2. Asynchronous event log written after commit.
3. Database triggers capturing row diffs.

## Decision Outcome

Chosen option 1. `recordAudit(tx, event)` (`apps/api/src/modules/audit/audit.service.ts`)
accepts a transaction client; services call it inside `withTransaction`
(e.g. `facility.created` in `facility.service.ts`). `metadata` holds `{ before?, after? }`
summaries, never secrets. Indexes: `(organization_id, occurred_at DESC)` and
`(entity_type, entity_id)`. No API route updates or deletes audit rows; the read-only viewer
is AO-054. Production hardening: revoke `UPDATE, DELETE` on `audit_events` from the
application role (AO-060).

## Consequences

### Positive

- Atomic: no orphaned or missing audit events.
- Auditable history for approvals and stock adjustments by construction.

### Negative

- Audit writes add latency to every mutating transaction.
- Table grows without bound; retention policy in
  [quality-attributes.md](../architecture/quality-attributes.md).

## Links

- AO-003, AO-054, AO-060
