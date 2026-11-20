# Architecture Decision Records

Decisions are recorded in [MADR](https://adr.github.io/madr/) format. An accepted ADR is
changed only by a new ADR that supersedes it (see [ADR-0001](0001-record-architecture-decisions.md)).

| ADR                                                           | Title                                             | Status   |
| ------------------------------------------------------------- | ------------------------------------------------- | -------- |
| [0001](0001-record-architecture-decisions.md)                 | Record architecture decisions                     | Accepted |
| [0002](0002-modular-monolith-with-npm-workspaces.md)          | Modular monolith with npm workspaces              | Accepted |
| [0003](0003-multi-tenancy-row-level-organization-scoping.md)  | Multi-tenancy via row-level organization scoping  | Accepted |
| [0004](0004-postgresql-and-forward-only-sql-migrations.md)    | PostgreSQL and forward-only SQL migrations        | Accepted |
| [0005](0005-session-authentication-scrypt-and-csrf.md)        | Session authentication, scrypt and CSRF           | Accepted |
| [0006](0006-api-conventions.md)                               | API conventions                                   | Accepted |
| [0007](0007-role-based-access-control.md)                     | Role-based access control                         | Accepted |
| [0008](0008-append-only-audit-trail.md)                       | Append-only audit trail                           | Accepted |
| [0009](0009-configuration-and-secrets-management.md)          | Configuration and secrets management              | Accepted |
| [0010](0010-testing-strategy.md)                              | Testing strategy                                  | Accepted |
| [0011](0011-local-file-attachment-storage.md)                 | Local file attachment storage                     | Proposed |
| [0012](0012-in-app-notifications-and-background-worker.md)    | In-app notifications and background worker        | Proposed |
| [0013](0013-work-order-state-machine.md)                      | Work-order state machine                          | Accepted |
| [0014](0014-sla-clock-semantics.md)                           | SLA clock semantics                               | Accepted |
| [0015](0015-preventive-maintenance-idempotent-worker-tick.md) | Preventive maintenance via idempotent worker tick | Proposed |
| [0016](0016-inventory-append-only-stock-ledger.md)            | Inventory as an append-only stock ledger          | Proposed |
| [0017](0017-repair-approval-thresholds.md)                    | Repair approval thresholds                        | Proposed |

## Template

```markdown
# ADR-NNNN: Title

- Status: Proposed | Accepted | Superseded by ADR-XXXX
- Date: YYYY-MM-DD

## Context

## Decision Drivers

## Considered Options

## Decision Outcome

## Consequences

### Positive

### Negative

## Links
```
