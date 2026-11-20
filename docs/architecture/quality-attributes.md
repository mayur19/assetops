# Quality attributes (non-functional requirements)

Targets are measurable so they can be verified by tests, load runs or
monitoring. "Now" describes what the current codebase already guarantees;
"Planned" names the ticket that closes the gap.

## Security

| ID     | Requirement               | Target / verification                                                                                                                           | Now                                             | Planned                                                     |
| ------ | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------- |
| SEC-1  | Tenant isolation          | 0 cross-organization reads/writes; every tenant repository statement filters by `organization_id`; integration test asserts 404 for foreign ids | Facilities covered by `facilities.db.test.ts`   | Each new module adds the same test (AO-015, AO-023, AO-056) |
| SEC-2  | Server-side authorization | Every non-health route requires a session; role gates via permission matrix; 403 on violation                                                   | All routes, including pending ones, are guarded | Record-level rules (AO-023, AO-014)                         |
| SEC-3  | Password storage          | scrypt, 16-byte random salt, constant-time compare                                                                                              | Implemented (AO-002)                            | —                                                           |
| SEC-4  | Session handling          | 256-bit random token, only SHA-256 stored, HTTP-only, SameSite=Lax, Secure in production, TTL ≤ 8 h default                                     | Implemented                                     | Idle timeout and rotation on privilege change (AO-060)      |
| SEC-5  | CSRF                      | Origin check + HMAC token on unsafe methods                                                                                                     | Implemented                                     | —                                                           |
| SEC-6  | Brute force               | ≤ 10 login attempts / minute / IP (configurable)                                                                                                | Implemented                                     | Account-level lockout (AO-060)                              |
| SEC-7  | Input validation          | 100 % of request bodies and queries parsed by zod; JSON body ≤ 1 MB                                                                             | Implemented                                     | Upload limits (AO-020)                                      |
| SEC-8  | Secrets                   | No secrets in git; gitleaks in CI; boot fails on placeholder secret in production                                                               | Implemented                                     | —                                                           |
| SEC-9  | Dependencies              | No high/critical `npm audit` findings at release                                                                                                | Manual                                          | AO-060                                                      |
| SEC-10 | Standard                  | OWASP ASVS L2 controls mapped in threat model                                                                                                   | Partial                                         | AO-060                                                      |

## Performance

Measured on a developer laptop class machine (4 cores, local PostgreSQL) with
the full PRD §8 dataset (AO-009) and 20 concurrent users.

| ID     | Operation                                                     | p95 target | p99 target |
| ------ | ------------------------------------------------------------- | ---------: | ---------: |
| PERF-1 | Read endpoints (list/get, page size ≤ 100)                    |   ≤ 200 ms |   ≤ 500 ms |
| PERF-2 | Write endpoints (create, transition, stock movement)          |   ≤ 300 ms |   ≤ 700 ms |
| PERF-3 | Login (scrypt dominated)                                      |   ≤ 400 ms |   ≤ 800 ms |
| PERF-4 | Operations report, 12 months, one organization                |      ≤ 1 s |      ≤ 2 s |
| PERF-5 | CSV import preview, 1,000 rows                                |      ≤ 3 s |      ≤ 5 s |
| PERF-6 | Worker tick (SLA scan + PM generation) for 10,000 open orders |      ≤ 5 s |          — |
| PERF-7 | Web: first contentful paint on localhost                      |    ≤ 1.5 s |          — |

Enablers: composite indexes leading with `organization_id` (see
[data model](../design/data-model.md)), offset pagination capped at 100 items,
count queries on the same predicate, no N+1 queries in list endpoints.

## Availability and reliability

| ID   | Requirement                                                                               | Target                                                                                                            |
| ---- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| AV-1 | Production availability (planned topology, see [deployment](../operations/deployment.md)) | 99.5 % monthly                                                                                                    |
| AV-2 | Liveness/readiness                                                                        | `/api/health/live` never touches dependencies; `/api/health/ready` returns 503 within 5 s when PostgreSQL is down |
| AV-3 | Durability across restarts (A-13)                                                         | 100 % of committed data survives API restart; no in-memory state of record                                        |
| AV-4 | Atomicity                                                                                 | Status changes, stock changes and their audit rows commit in one transaction                                      |
| AV-5 | Idempotency                                                                               | Re-running the worker or `run-due` creates 0 duplicates (unique `(schedule_id, occurrence_date)`)                 |
| AV-6 | Graceful degradation                                                                      | Worker tick failures are logged and do not crash request handling                                                 |

## Scalability

| ID   | Dimension                             | MVP target | Path beyond                                               |
| ---- | ------------------------------------- | ---------- | --------------------------------------------------------- |
| SC-1 | Organizations per instance            | 500        | Shard by organization id                                  |
| SC-2 | Assets per organization               | 10,000     | Partial indexes, keyset pagination                        |
| SC-3 | Work orders per organization per year | 50,000     | Partition `work_order_events` and `audit_events` by month |
| SC-4 | Concurrent users per instance         | 200        | Horizontal API replicas (sessions already in PostgreSQL)  |
| SC-5 | Stock movements                       | 1M rows    | Ledger is append-only; balances table avoids full scans   |

## Observability

| ID    | Requirement     | Target                                                                                      | Now                                 |
| ----- | --------------- | ------------------------------------------------------------------------------------------- | ----------------------------------- |
| OBS-1 | Structured logs | JSON (pino) with `requestId`, method, path, status, duration                                | Implemented                         |
| OBS-2 | Correlation     | `X-Request-Id` on every response and in error bodies                                        | Implemented                         |
| OBS-3 | Audit           | Actor, organization, entity, action, before/after summary, timestamp for every state change | Implemented for auth and facilities |
| OBS-4 | Metrics         | RED metrics per route, worker tick duration, SLA breach count                               | Planned (deployment plan)           |
| OBS-5 | Alerting        | Readiness failure > 2 min, 5xx rate > 1 % over 5 min                                        | Planned                             |

## Accessibility and usability

| ID     | Requirement   | Target                                                                                                                           |
| ------ | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| A11Y-1 | Conformance   | WCAG 2.1 AA on all core screens; axe reports 0 serious/critical issues (AO-061)                                                  |
| A11Y-2 | Keyboard      | All actions reachable by keyboard with visible focus (`:focus-visible` outline implemented)                                      |
| A11Y-3 | Forms         | Labels bound to inputs; errors linked with `aria-describedby`; `role="alert"` for failures (implemented on login and facilities) |
| A11Y-4 | Responsive    | Technician queue usable at 360 px width (AO-031)                                                                                 |
| UX-1   | Request speed | A requester files a request in < 2 minutes (PRD outcome 1)                                                                       |

## Data retention and privacy

| Data                               | Retention                                                 | Notes                                                 |
| ---------------------------------- | --------------------------------------------------------- | ----------------------------------------------------- |
| Work orders, events, labor, ledger | Life of organization                                      | Financial and maintenance history; never hard-deleted |
| Audit events                       | ≥ 7 years                                                 | Append-only; no UI deletion path                      |
| Sessions                           | Until expiry (default 8 h); expired rows purged by worker | `deleteExpired` exists; scheduling in AO-036          |
| Notifications                      | 180 days, then purged                                     | AO-052                                                |
| Attachments                        | Life of parent record                                     | Removed only with the owning record (AO-020)          |
| Users                              | Deactivated, not deleted, to preserve audit references    |                                                       |

Personal data is limited to name and email. No payment data is stored.

## Backup and restore

| ID   | Requirement                           | Target                                                                                 |
| ---- | ------------------------------------- | -------------------------------------------------------------------------------------- |
| BR-1 | Recovery point objective (production) | RPO ≤ 15 minutes (managed PostgreSQL PITR)                                             |
| BR-2 | Recovery time objective (production)  | RTO ≤ 4 hours                                                                          |
| BR-3 | Local/demo                            | `pg_dump` and `./run.sh reset --yes` documented in [runbook](../operations/runbook.md) |
| BR-4 | Restore drill                         | Quarterly restore into a scratch database with smoke test                              |
| BR-5 | Attachments                           | Backed up with the same cadence as the database; restore validated by checksum         |
