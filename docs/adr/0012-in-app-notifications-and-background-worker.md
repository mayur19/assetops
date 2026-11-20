# ADR-0012: In-app notifications and background worker

- Status: Proposed
- Date: 2026-11-20

## Context

FR-10 requires persistent in-app notifications (no email/SMS). FR-05 needs SLA escalations and
FR-06 needs scheduled work generation without an external cron service (PRD §2).

## Decision Drivers

- No external services; survive restarts (A-13).
- At-most-once alerts per condition (A-10) and exactly-once generation (A-09).
- Safe when more than one API process runs.

## Considered Options

1. In-process interval worker with a PostgreSQL advisory lock; notifications table with dedupe keys.
2. Separate worker process with a job queue library.
3. External cron calling an HTTP endpoint.

## Decision Outcome

Proposed option 1.

- Worker (AO-036): `setInterval` tick (default 60 s) acquires `pg_try_advisory_lock`; only the
  holder runs jobs. Jobs: SLA escalation (AO-034), preventive generation (AO-039), low-stock alerts.
- Each job is idempotent; correctness relies on database constraints, not on the lock.
- Notifications (AO-052): `notifications(organization_id, user_id, type, title, body,
dedupe_key, read_at, created_at)` with `UNIQUE (user_id, dedupe_key)` and
  `INSERT ... ON CONFLICT DO NOTHING`. SLA dedupe keys come from `pendingEscalations`
  (`packages/shared/src/domain/sla/escalation.ts`), e.g. `wo-1:RESPONSE:BREACHED`.
- `POST /api/v1/maintenance/run-due` triggers the generation job manually (org admin only).

## Consequences

### Positive

- No extra process to operate locally; restarts are harmless.

### Negative

- Worker load shares the API event loop; move to a separate process if ticks grow heavy.
- Up to one tick interval of latency for alerts.

## Links

- [ADR-0014](0014-sla-clock-semantics.md), [ADR-0015](0015-preventive-maintenance-idempotent-worker-tick.md)
- AO-034, AO-036, AO-052, AO-053
