# AssetOps

**Facility and maintenance management for multi-site operators.** Know what is broken, who is
fixing it, which parts were used, what it cost, and which assets are repeatedly failing.

AssetOps is a multi-tenant computerized maintenance management system (CMMS) for small hotels,
clinics, gyms, schools and multi-location businesses. It replaces spreadsheets and scattered
messages with an asset registry, corrective and preventive maintenance, technician workflows, parts
inventory, repair approvals, SLA tracking and operational reports. It runs fully offline on a local
machine: Node.js, PostgreSQL and a browser, no external services.

> **Project status:** foundation and first vertical slice. About **13 %** of the estimated MVP
> effort is complete (30 of 229 hours). Unbuilt API endpoints answer `501` with their ticket id and
> unbuilt screens name the ticket that delivers them. See the [roadmap](docs/planning/roadmap.md).

## Project status

| Area                                                                             | Status         | Tickets         |
| -------------------------------------------------------------------------------- | -------------- | --------------- |
| Monorepo, `run.sh`, CI, secret scanning                                          | ✅ Implemented | AO-001          |
| Session auth (scrypt), CSRF, rate limiting                                       | ✅ Implemented | AO-002          |
| Migrations, append-only audit trail, health checks                               | ✅ Implemented | AO-003          |
| Roles (Org Admin, Facility Manager, Technician, Requester) and permission matrix | ✅ Implemented | AO-004          |
| Development seed (Riverside Hospitality, Northline Fitness)                      | ✅ Implemented | AO-005          |
| Engineering docs, ADRs, OpenAPI contract                                         | ✅ Implemented | AO-006          |
| Facilities list, create, get (API + screen, tenant-isolated, audited)            | ✅ Implemented | AO-010, AO-011  |
| Work-order state machine (pure domain, 100 % branch coverage)                    | ✅ Implemented | AO-021          |
| SLA calculator and escalation dedupe (pure domain, 100 % branch coverage)        | ✅ Implemented | AO-022          |
| Memberships, organization/site switcher, full demo dataset                       | ⏳ Pending     | AO-007 – AO-009 |
| Facility update/archive, areas, site access                                      | ⏳ Pending     | AO-012 – AO-014 |
| Assets, CSV import, attachments                                                  | ⏳ Pending     | AO-015 – AO-020 |
| Work-order persistence, endpoints and screens, SLA config and escalation         | ⏳ Pending     | AO-023 – AO-035 |
| Worker, preventive maintenance                                                   | ⏳ Pending     | AO-036 – AO-040 |
| Parts and stock ledger                                                           | ⏳ Pending     | AO-041 – AO-044 |
| Repair approvals                                                                 | ⏳ Pending     | AO-045 – AO-047 |
| Cost model, reports, dashboard                                                   | ⏳ Pending     | AO-048 – AO-051 |
| Notifications, audit viewer, users and settings                                  | ⏳ Pending     | AO-052 – AO-055 |
| PRD §9 acceptance suite, hardening, accessibility                                | ⏳ Pending     | AO-056 – AO-062 |

## Quick start

Requirements: Node.js 22+, npm and a running local PostgreSQL server (with `psql` on the `PATH`).

```bash
./run.sh
```

That single command creates `.env` with a random session secret, installs dependencies, creates the
database, applies migrations, seeds development data and starts:

- Web UI: http://localhost:5171
- API: http://127.0.0.1:4101 (proxied by the web server under `/api`)

## Demo logins (development only)

These accounts are created by the development seed, are publicly documented, and must never exist
in a production database. The seed refuses to run when `NODE_ENV=production`.

Password for every account: `DemoPassword!2026`

| Organization          | Role               | Email                         |
| --------------------- | ------------------ | ----------------------------- |
| Riverside Hospitality | Organization Admin | `admin@riverside.example`     |
| Riverside Hospitality | Facility Manager   | `manager@riverside.example`   |
| Riverside Hospitality | Technician         | `tech@riverside.example`      |
| Riverside Hospitality | Requester          | `requester@riverside.example` |
| Northline Fitness     | Organization Admin | `admin@northline.example`     |

Each organization has two seeded facilities, which makes tenant isolation easy to see.

## `run.sh` commands

| Command                  | Description                                                             |
| ------------------------ | ----------------------------------------------------------------------- |
| `./run.sh` (`start`)     | Install, prepare `.env` and database, migrate, seed, launch API and web |
| `./run.sh setup`         | Everything `start` does, without launching                              |
| `./run.sh migrate`       | Apply pending migrations                                                |
| `./run.sh seed`          | Load development demo data (idempotent)                                 |
| `./run.sh reset [--yes]` | Drop and recreate the schema, then migrate and seed                     |
| `./run.sh test`          | Unit and integration tests against a disposable `<db>_test` database    |
| `./run.sh e2e`           | Playwright end-to-end tests                                             |
| `./run.sh check`         | Lint, format check, typecheck and tests (what CI runs)                  |
| `./run.sh build`         | Production build of API and web                                         |
| `./run.sh help`          | Show all commands                                                       |

## Tech stack

| Layer    | Choice                                                                    |
| -------- | ------------------------------------------------------------------------- |
| Language | TypeScript (strict) on Node.js 22                                         |
| API      | Express 4, `pg`, zod validation, pino logging, helmet, express-rate-limit |
| Database | PostgreSQL with forward-only SQL migrations                               |
| Auth     | Server-side sessions, scrypt password hashing, HMAC CSRF tokens           |
| Web      | React 18, React Router, Vite, plain CSS                                   |
| Shared   | `@assetops/shared`: zod schemas, roles, permissions, pure domain logic    |
| Tests    | Vitest, Testing Library, supertest, Playwright                            |
| CI       | GitHub Actions (lint, format, typecheck, coverage, build, gitleaks)       |

## Repository layout

```text
.
├── apps/
│   ├── api/                    Express API
│   │   ├── migrations/         Forward-only SQL migrations (0001, 0002)
│   │   ├── src/
│   │   │   ├── config/         Environment validation
│   │   │   ├── db/             Pool, migration runner, development seed
│   │   │   ├── lib/            Errors, envelope, validation, pending-route helper
│   │   │   ├── middleware/     Session, CSRF, RBAC, rate limit, error handler
│   │   │   ├── modules/        facilities (implemented) and pending module routers
│   │   │   └── security/       Password hashing, tokens
│   │   └── test/               Unit, HTTP and PostgreSQL integration tests
│   └── web/                    React + Vite client
│       ├── src/pages/          Facilities screen, pending placeholders, login, dashboard
│       └── src/routes/         Navigation for every PRD §4 screen
├── packages/shared/            Schemas, roles, permissions, domain (work orders, SLA)
├── e2e/                        Playwright smoke tests
├── docs/                       Product, architecture, ADRs, design, API, security, testing, ops, planning
└── run.sh                      Single local entry point
```

## Documentation

Start at the [documentation index](docs/README.md). Highlights:

- [PRD](docs/product/PRD.md) · [User stories](docs/product/user-stories.md) · [Traceability](docs/product/requirements-traceability.md)
- [Architecture overview](docs/architecture/overview.md) · [System design](docs/design/system-design.md) · [Data model](docs/design/data-model.md)
- [ADRs](docs/adr/README.md) · [API contract](docs/api/openapi.yaml) · [API conventions](docs/api/README.md)
- [Threat model](docs/security/threat-model.md) · [Test strategy](docs/testing/test-strategy.md)
- [Runbook](docs/operations/runbook.md) · [Deployment plan](docs/operations/deployment.md)
- [Roadmap](docs/planning/roadmap.md) · [Backlog](docs/planning/backlog.md) · [Risks](docs/planning/risks.md) · [Glossary](docs/glossary.md)

## Known omissions

Everything marked ⏳ above is not built yet. In particular there are no work-order, asset,
inventory or approval workflows in the UI, users belong to a single organization until AO-007, and
the dashboard is a placeholder until AO-050. Estimates versus actuals are tracked per ticket in the
[backlog](docs/planning/backlog.md).

## Contributing, security and license

- [CONTRIBUTING.md](CONTRIBUTING.md): workflow, commit conventions, engineering rules.
- [SECURITY.md](SECURITY.md): how to report a vulnerability; secrets policy.
- [LICENSE](LICENSE): MIT.
