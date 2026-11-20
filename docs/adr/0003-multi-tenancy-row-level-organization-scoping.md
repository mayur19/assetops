# ADR-0003: Multi-tenancy via row-level organization scoping

- Status: Accepted
- Date: 2026-11-20

## Context

PRD outcome 6 and acceptance test A-02: one organization's users must never access another
organization's records. Riverside Hospitality and Northline Fitness share one database.

## Decision Drivers

- Zero cross-tenant leakage, including via foreign keys supplied by clients.
- Simple local setup (one PostgreSQL database, no per-tenant schemas).
- Probing another tenant's ids must not reveal that they exist.

## Considered Options

1. Shared tables with `organization_id` on every tenant-owned row, enforced in repositories.
2. Schema per tenant.
3. Database per tenant.
4. Option 1 plus PostgreSQL row-level security (RLS) policies.

## Decision Outcome

Chosen option 1, with composite keys as a database backstop; RLS is deferred.

- Every tenant-owned table has `organization_id uuid NOT NULL`.
- The organization is taken from the authenticated session (`scopeOf(req)` in
  `apps/api/src/lib/request-scope.ts`), never from the request body or query.
- Every repository statement filters by `organization_id`
  (`apps/api/src/modules/facilities/facility.repository.ts`).
- Tables expose `UNIQUE (organization_id, id)` (`facilities_org_id_key`, `users_org_id_key`
  in migration 0002) so child tables can declare composite foreign keys
  `(organization_id, facility_id) REFERENCES facilities (organization_id, id)`, making
  cross-tenant references impossible at the database level.
- Records of another organization return **404**, identical to unknown ids; malformed ids also
  return 404.
- Multi-organization membership and active-organization switching are pending (AO-007);
  per-site grants for non-admins are pending (AO-014).

## Consequences

### Positive

- Isolation is verified by integration tests against real PostgreSQL
  (`apps/api/test/facilities.db.test.ts`).
- Composite FKs catch application bugs that pass a foreign id.

### Negative

- A missing filter in a new query is a leak; mitigated by review checklist, tests per module
  and the option to add RLS later.
- Composite FKs make some joins and indexes wider.

## Links

- [docs/security/threat-model.md](../security/threat-model.md)
- AO-007, AO-014, AO-056
