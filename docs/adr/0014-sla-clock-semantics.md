# ADR-0014: SLA clock semantics

- Status: Accepted
- Date: 2026-11-20

## Context

FR-05: configurable response and resolution targets by priority and optionally site; capture
`reported_at`, `first_responded_at`, `resolved_at` and due times in UTC; response is the first
accepted technician action, not assignment; resolution stops at `COMPLETED`; show pending, met
and breached; escalate at 80% of budget and on breach with deduplication; elapsed clock time, no
business hours.

## Decision Drivers

- Deterministic, server-side computation that the UI only displays.
- Precise boundary behaviour (exactly at due time, cancelled orders, late responses).
- Integer arithmetic; no floating-point drift in percentages.

## Considered Options

1. Pure functions over stored timestamps, evaluated at a supplied `now`.
2. Stored status columns updated by the worker.
3. Business-hours calendars.

## Decision Outcome

Chosen option 1, implemented in `packages/shared/src/domain/sla/`:

- `resolveSlaTarget(policies, priority, facilityId)`: a site-specific policy wins; otherwise
  the organization default (`facilityId = null`). Another site's policy is never used as a
  default. Missing -> `POLICY_NOT_FOUND`.
- `computeSlaDueDates(reportedAt, target)`: `responseDueAt = reportedAt + responseMinutes`,
  `resolveDueAt = reportedAt + resolutionMinutes`, elapsed clock minutes (crossing midnight or
  weekends changes nothing). Targets must be positive whole minutes with
  resolution >= response (`INVALID_TARGET`); invalid dates -> `INVALID_TIMESTAMP`.
- `evaluateSla(timestamps, due, now, { atRiskBp = 8000 })` evaluates two clocks:

| Clock      | Stops at           | Source                                                        |
| ---------- | ------------------ | ------------------------------------------------------------- |
| Response   | `firstRespondedAt` | set on `ASSIGNED -> IN_PROGRESS` by the assignee (ADR-0013)   |
| Resolution | `completedAt`      | set on `IN_PROGRESS -> COMPLETED`; closure does not affect it |

Per clock: `consumedBp = floor(elapsed * 10000 / budget)` with elapsed clamped at 0;
`remainingMs = dueAt - endAt`.

| Condition (evaluated in order)   | State          |
| -------------------------------- | -------------- |
| stopped and `stoppedAt <= dueAt` | MET            |
| stopped and `stoppedAt > dueAt`  | BREACHED       |
| cancelled before stopping        | NOT_APPLICABLE |
| `now > dueAt` (strictly after)   | BREACHED       |
| `consumedBp >= atRiskBp`         | AT_RISK        |
| otherwise                        | PENDING        |

- `pendingEscalations(workOrderId, evaluation, alreadySent)` (`escalation.ts`) returns at most
  one `AT_RISK` and one `BREACHED` escalation per clock with dedupe key
  `<workOrderId>:<RESPONSE|RESOLUTION>:<LEVEL>`, skipping keys already sent and clocks that
  already stopped late. The worker persists keys with a unique constraint (AO-034, ADR-0012).

Storage (AO-023): `reported_at`, `first_responded_at`, `completed_at`, `response_due_at`,
`resolve_due_at` as `timestamptz` (UTC). Due dates are computed once at creation from the
policy in force; later policy edits do not rewrite existing orders.

## Consequences

### Positive

- Badges, queues and alerts all derive from one function; 100% branch coverage in
  `packages/shared/test/domain/sla.test.ts`.
- UI documents the elapsed-clock policy explicitly (AO-033).

### Negative

- No business-hours or pause semantics (time in `AWAITING_PARTS` counts); this is a post-MVP item.
- Evaluating at read time costs CPU per row; acceptable for MVP list sizes, indexable on due dates.

## Links

- AO-022, AO-023, AO-033, AO-034
- [ADR-0013](0013-work-order-state-machine.md)
