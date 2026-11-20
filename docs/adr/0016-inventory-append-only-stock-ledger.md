# ADR-0016: Inventory as an append-only stock ledger

- Status: Proposed
- Date: 2026-11-20

## Context

FR-07: every inventory change creates a ledger transaction (`RECEIPT`, `ISSUE`, `RETURN`,
`ADJUSTMENT`); no negative stock by default; issuing to a work order reduces the balance in the
same transaction; stock is consumed on issue, not on request. A-06: issuing two from a stock of
three leaves one. A-07: concurrent over-issue -> exactly one succeeds, stock never negative.
FR-09 cost uses the unit cost captured at issue.

## Decision Drivers

- Financial integrity and full history of every quantity change.
- Correctness under concurrency without application-level locks.
- Fast current-balance reads.

## Considered Options

1. Append-only `stock_movements` + materialized `part_balances` updated with a conditional
   `UPDATE` in the same transaction.
2. Balance computed by summing the ledger on every read.
3. Mutable `quantity` column only.

## Decision Outcome

Proposed option 1.

- `stock_movements(organization_id, part_id, facility_id, work_order_id NULL, movement_type,
quantity_signed, unit_cost_minor_snapshot, actor_id, created_at)` is insert-only: no update
  or delete paths; the application role is denied `UPDATE/DELETE` in production (AO-060).
- `part_balances(organization_id, facility_id, part_id, on_hand_qty)` with
  `UNIQUE (facility_id, part_id)` and `CHECK (on_hand_qty >= 0)`.
- Issue, in one transaction:
  ```sql
  UPDATE part_balances SET on_hand_qty = on_hand_qty - $qty
   WHERE organization_id = $org AND facility_id = $f AND part_id = $p AND on_hand_qty >= $qty
  RETURNING on_hand_qty;
  ```
  Zero rows -> 409 `CONFLICT` (insufficient stock), nothing inserted. Otherwise insert the
  `ISSUE` movement with `quantity_signed = -qty` and the part's current `unit_cost_minor` as
  snapshot, then audit.
- Part requests (AO-043) never touch stock; only issue consumes it.
- Corrections are `RETURN` or `ADJUSTMENT` movements, never edits. Money in integer minor units.

## Consequences

### Positive

- Row-level locking from the conditional `UPDATE` serializes concurrent issues; the `CHECK`
  constraint is a second line of defence (A-07).
- Reconciliation: `sum(quantity_signed)` per part/facility must equal `on_hand_qty`.

### Negative

- Two writes per movement; balance and ledger must always change together (enforced by the
  single repository function).

## Links

- AO-041, AO-042, AO-043, AO-044, AO-048, AO-058
