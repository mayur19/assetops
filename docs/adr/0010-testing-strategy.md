# ADR-0010: Testing strategy

- Status: Accepted
- Date: 2026-11-20

## Context

PRD §9 lists 15 acceptance tests that must run against the real application and local database,
and requires unit tests for state transitions, SLA arithmetic, recurrence, inventory and cost.

## Decision Drivers

- Domain rules are the highest-risk code and must be exhaustively tested.
- Tenant isolation and concurrency need a real PostgreSQL, not mocks.
- Same commands locally and in CI.

## Considered Options

1. Vitest unit + supertest integration on real PostgreSQL + Playwright end-to-end.
2. Mock the database everywhere.
3. End-to-end tests only.

## Decision Outcome

Chosen option 1.

- Unit: Vitest. Pure domain modules in `packages/shared/src/domain/**` are held to 100%
  line/branch/function coverage by thresholds in `packages/shared/vitest.config.ts`; the
  global gate is 80%.
- Integration: supertest against `createApp` with a disposable `<db>_test` database
  (`TEST_DATABASE_URL`), schema dropped and re-migrated per suite; files run serially
  (`fileParallelism: false`).
- HTTP without a database: `app.http.test.ts`, `pending-routes.test.ts` (501 + ticket, 403 by role).
- End-to-end: Playwright (`e2e/tests/`) against the running app and seeded database;
  PRD §9 scenarios are AO-056 to AO-059.
- Write tests first (red, green, refactor). `./run.sh check` mirrors CI.

## Consequences

### Positive

- Business rules are verified without I/O; isolation verified against real SQL.

### Negative

- Integration tests require a local PostgreSQL and run serially.

## Links

- [docs/testing/test-strategy.md](../testing/test-strategy.md)
