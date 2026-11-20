# ADR-0015: Preventive maintenance via idempotent worker tick

- Status: Proposed
- Date: 2026-11-20

## Context

FR-06: templates and daily/weekly/monthly schedules with a local start date and next-due date;
a worker generates a work order on the due date and advances the next due date; a unique
`(schedule_id, occurrence_date)` key prevents duplicates on restart (A-09). Template edits
affect future work only; generated orders keep checklist snapshots.

## Decision Drivers

- Exactly one order per occurrence under restarts, retries and concurrent triggers.
- Correct local-date semantics per facility time zone.
- No external scheduler.

## Considered Options

1. Worker tick (ADR-0012) + `schedule_occurrences` unique key + transactional generation.
2. Pre-generate all future orders when a schedule is created.
3. Rely solely on the advisory lock for single execution.

## Decision Outcome

Proposed option 1.

- Pure recurrence function (AO-038): `nextOccurrence(frequency, startLocalDate, after,
timezone)`; monthly schedules on day 29-31 fall back to the month's last day; dates are
  `date` values in the schedule time zone, never UTC timestamps.
- Generation (AO-039), per due schedule in one transaction:
  1. `SELECT ... FROM maintenance_schedules WHERE enabled AND next_local_date <= local_today
FOR UPDATE SKIP LOCKED`.
  2. `INSERT INTO schedule_occurrences (organization_id, schedule_id, occurrence_date)
... ON CONFLICT (schedule_id, occurrence_date) DO NOTHING RETURNING id`.
  3. Only if a row was inserted: create the work order with a checklist snapshot copied from
     the template version, link `work_order_id`, write audit.
  4. Advance `next_local_date`.
- Missed occurrences after downtime are generated one per occurrence date (catch-up), bounded
  per tick.
- `POST /api/v1/maintenance/run-due` invokes the same function (org admin only).

## Consequences

### Positive

- Idempotency is guaranteed by the database constraint, not by timing.
- Template edits never rewrite generated orders.

### Negative

- Long outages produce bursts of catch-up orders; bounded batch size mitigates.
- DST-aware local dates add test surface.

## Links

- AO-036, AO-037, AO-038, AO-039, AO-040, AO-058
- [ADR-0012](0012-in-app-notifications-and-background-worker.md)
