# ADR-0007: Role-based access control

- Status: Accepted
- Date: 2026-11-20

## Context

PRD §3 defines four actors and requires permissions enforced by the API, not merely hidden UI.
Acceptance test A-01 signs in as all four roles.

## Decision Drivers

- One source of truth shared by API guards and UI affordances.
- Coarse role gates at the route; record-level rules (own requests, assigned work) in services
  and domain functions.
- Database must reject unknown roles.

## Considered Options

1. Static role -> permission matrix in `@assetops/shared`, enforced by `requirePermission`.
2. Inline `requireRole(...)` lists per route.
3. Configurable per-organization permission tables.

## Decision Outcome

Chosen option 1.

Roles (`packages/shared/src/roles.ts`): `ORG_ADMIN`, `FACILITY_MANAGER`, `TECHNICIAN`,
`REQUESTER`; constrained by `users_role_check` (migration 0002). Routes use
`requirePermission(permission)` (`apps/api/src/middleware/authorize.ts`); navigation uses the
same role lists (`apps/web/src/routes/navigation.ts`).

### Permission matrix (`packages/shared/src/permissions.ts`)

| Permission             | Org Admin | Facility Manager | Technician | Requester |
| ---------------------- | :-------: | :--------------: | :--------: | :-------: |
| facility:read          |     ✓     |        ✓         |     ✓      |     ✓     |
| facility:create        |     ✓     |        ✓         |            |           |
| facility:update        |     ✓     |        ✓         |            |           |
| asset:read             |     ✓     |        ✓         |     ✓      |           |
| asset:write            |     ✓     |        ✓         |            |           |
| work-order:create      |     ✓     |        ✓         |     ✓      |     ✓     |
| work-order:read-all    |     ✓     |        ✓         |            |           |
| work-order:manage      |     ✓     |        ✓         |            |           |
| work-order:execute     |     ✓     |        ✓         |     ✓      |           |
| maintenance:manage     |     ✓     |        ✓         |            |           |
| maintenance:run-due    |     ✓     |                  |            |           |
| inventory:read         |     ✓     |        ✓         |     ✓      |           |
| inventory:read-pricing |     ✓     |        ✓         |            |           |
| inventory:write        |     ✓     |        ✓         |            |           |
| approval:decide        |     ✓     |        ✓         |            |           |
| report:read            |     ✓     |        ✓         |            |           |
| audit:read             |     ✓     |        ✓         |            |           |
| organization:manage    |     ✓     |                  |            |           |
| sla:manage             |     ✓     |        ✓         |            |           |

Record-level rules outside the matrix:

- Requesters see only their own work orders (AO-023).
- Work-order transitions are authorized by the domain state machine (ADR-0013): only the
  assignee starts work; nobody closes work they performed; technicians cannot resume from
  `AWAITING_APPROVAL` without a decision.
- Approvers cannot approve their own requests (ADR-0017).
- Technicians never receive unit cost fields (AO-041, AO-044).
- Non-admins are limited to granted sites (pending AO-014).

## Consequences

### Positive

- UI and API cannot drift; the matrix is unit-tested (`packages/shared/test/permissions.test.ts`).
- 403 is returned before any pending (501) handler runs.

### Negative

- Changing permissions requires a code change and release, not configuration.

## Links

- AO-004, AO-055
- [ADR-0013](0013-work-order-state-machine.md)
