# ADR-0002: Modular monolith with npm workspaces

- Status: Accepted
- Date: 2026-11-20

## Context

The PRD (§2) requires a local, offline-capable application on Node.js 22 with React + Vite
and Express, started with straightforward commands and no Docker. The team is small and the
domain (facilities, assets, work orders, inventory, approvals) is tightly related through
transactions such as "issue stock to a work order".

## Decision Drivers

- One command to start (`./run.sh`); minimal operational surface.
- Shared validation and domain rules between API and web without publishing packages.
- Clear module boundaries so features can be built in parallel (AO-015, AO-023, AO-042...).
- Cross-module transactions (work order + stock ledger + audit) must be ACID.

## Considered Options

1. Modular monolith: npm workspaces `apps/api`, `apps/web`, `packages/shared`.
2. Microservices per domain.
3. Single package with no internal boundaries.

## Decision Outcome

Chosen option 1.

- `packages/shared` (`@assetops/shared`): zod schemas, roles, permission matrix and pure
  domain modules (`src/domain/work-orders`, `src/domain/sla`) used by both API and web.
- `apps/api` (`@assetops/api`): Express app; each module under `src/modules/<name>/`
  owns `*.routes.ts` -> `*.service.ts` -> `*.repository.ts`.
- `apps/web` (`@assetops/web`): React SPA, Vite dev proxy for `/api` and `/uploads`.

Modules communicate through service functions, never through another module's tables
directly. Pending modules are mounted as `pendingRouter` instances
(`apps/api/src/modules/index.ts`).

## Consequences

### Positive

- Single deploy unit, single database transaction across modules.
- Domain rules (e.g. allowed work-order transitions) are written once and reused by the UI.

### Negative

- Boundaries are enforced by convention and review rather than by process isolation.
- A single process means the background worker (ADR-0012) shares resources with the API.

## Links

- [docs/architecture/overview.md](../architecture/overview.md)
- `apps/api/src/modules/index.ts`
