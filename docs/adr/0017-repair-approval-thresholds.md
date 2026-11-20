# ADR-0017: Repair approval thresholds

- Status: Proposed
- Date: 2026-11-20

## Context

FR-08: a per-organization threshold (e.g. estimates above 10,000 currency units need manager
approval); approval requests record work order, estimate, justification, requester, decision,
approver, timestamp and comments; work cannot proceed to the spend-dependent action before
approval; rejected requests stay visible; no requester self-approval and no duplicate active
approvals for one decision context. A-08: expensive repair is blocked until an authorized decision.

## Decision Drivers

- Money as integers; unambiguous threshold comparison.
- Separation of duties enforced server-side.
- Concurrency-safe uniqueness of active requests.

## Considered Options

1. Threshold on `organizations.approval_threshold_minor`; pure policy functions; partial unique
   index for active requests; work-order gate via `AWAITING_APPROVAL`.
2. Per-role spending limits.
3. Approval as a free-form comment on the work order.

## Decision Outcome

Proposed option 1.

- `requiresApproval(amountMinor, thresholdMinor) = amountMinor > thresholdMinor` (strictly
  greater; equal does not require approval). Both integers in the organization currency's minor
  unit (AO-045).
- `approval_requests(organization_id, work_order_id, requester_id, approver_id NULL,
amount_minor, status, rationale, decided_at NULL, comment)` with
  `CREATE UNIQUE INDEX approval_requests_one_active ON approval_requests (work_order_id)
WHERE status = 'PENDING'` so a second active request for the same work order fails with 409.
- Decide (AO-046): approver needs `approval:decide`, must differ from `requester_id`
  (otherwise 403 `SELF_APPROVAL`), and the request must still be `PENDING`
  (`UPDATE ... WHERE status = 'PENDING'`; zero rows -> 409). Decision, notification and audit
  commit together. Rejected requests remain queryable.
- Gate: the order sits in `AWAITING_APPROVAL`; the state machine (ADR-0013) refuses
  `AWAITING_APPROVAL -> IN_PROGRESS` until `approvalDecision` is `APPROVED` or `REJECTED`
  (`APPROVAL_REQUIRED`). A rejection lets work resume without the spend.
- Threshold changes are org-admin only (`organization:manage`, AO-055) and audited.

## Consequences

### Positive

- Integrity under repeated submissions via database constraints (PRD §11).
- Clear audit of who approved what amount and when.

### Negative

- Single threshold per organization; tiered or per-site limits are future work.

## Links

- AO-045, AO-046, AO-047, AO-055, AO-058
- [ADR-0013](0013-work-order-state-machine.md)
