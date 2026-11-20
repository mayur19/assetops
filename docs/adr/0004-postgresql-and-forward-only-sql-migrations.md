# ADR-0004: PostgreSQL and forward-only SQL migrations

- Status: Accepted
- Date: 2026-11-20

## Context

The PRD (§2, §6) names PostgreSQL + `pg` as default persistence and requires transactions for
status and inventory changes, unique constraints such as `(schedule_id, occurrence_date)`, and
integer money.

## Decision Drivers

- Strong transactional guarantees for ledger and state changes (A-06, A-07, A-09).
- Plain SQL that reviewers can read; no ORM-specific migration DSL.
- Safe, repeatable migrations across developer machines and CI.

## Considered Options

1. PostgreSQL with hand-written forward-only SQL files and a small runner.
2. An ORM with generated migrations.
3. SQLite as default.

## Decision Outcome

Chosen option 1. Files live in `apps/api/migrations/NNNN_description.sql`, applied in lexical
order, each in its own transaction, recorded in `schema_migrations` with a SHA-256 checksum
(`apps/api/src/db/migrate.ts`). Modifying an applied migration aborts startup. There are no
down migrations; corrections are new migrations. Existing: `0001_foundation.sql`,
`0002_roles_and_facilities.sql`. Repositories use parameterized queries only.

## Consequences

### Positive

- Database constraints (CHECK, UNIQUE, partial indexes) carry real business rules.
- Migrations are auditable and deterministic.

### Negative

- Rollback requires a compensating migration.
- No SQLite fallback is maintained; PostgreSQL is required locally.

## Links

- [docs/design/data-model.md](../design/data-model.md)
- AO-003
