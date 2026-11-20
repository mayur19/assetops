# Backlog

Source of truth for planned work. The machine-readable copy is [backlog.json](backlog.json) (same tickets, used to create GitHub issues). Estimates are focused engineering hours.

Status: ✅ Done · ⏳ Pending.

## M0: Foundation

Monorepo, launcher, authentication, tenancy, audit, roles, seed and engineering documentation.

| ID     | Title                                                                     | Milestone | PRD refs        | Estimate (h) | Status     | Depends on                             |
| ------ | ------------------------------------------------------------------------- | --------- | --------------- | -----------: | ---------- | -------------------------------------- |
| AO-001 | Set up monorepo, launcher and CI                                          | M0        | PRD §2          |            3 | ✅ Done    | —                                      |
| AO-002 | Implement session authentication with CSRF and rate limiting              | M0        | PRD §2, PRD §3  |            3 | ✅ Done    | AO-001                                 |
| AO-003 | Provide migration runner, audit trail and health checks                   | M0        | FR-10, PRD §2   |            2 | ✅ Done    | AO-001                                 |
| AO-004 | Introduce AssetOps roles and permission matrix                            | M0        | PRD §3, A-01    |            2 | ✅ Done    | AO-002                                 |
| AO-005 | Seed development organizations, users and facilities                      | M0        | PRD §8          |            2 | ✅ Done    | AO-004                                 |
| AO-006 | Write engineering documentation, ADRs and API contract                    | M0        | PRD §1-§12      |            4 | ✅ Done    | —                                      |
| AO-007 | Support multi-organization memberships and active-organization resolution | M0        | PRD §3, PRD §6  |            5 | ⏳ Pending | AO-004                                 |
| AO-008 | Build organization and site switcher                                      | M0        | PRD §4 screen 2 |            3 | ⏳ Pending | AO-007, AO-014                         |
| AO-009 | Load the full PRD §8 demonstration dataset                                | M0        | PRD §8, A-13    |            5 | ⏳ Pending | AO-015, AO-023, AO-039, AO-042, AO-046 |

## M1: Facilities and assets

Facility registry and hierarchy, site access, asset registry, attachments and CSV import (FR-01, FR-02).

| ID     | Title                                              | Milestone | PRD refs                     | Estimate (h) | Status     | Depends on             |
| ------ | -------------------------------------------------- | --------- | ---------------------------- | -----------: | ---------- | ---------------------- |
| AO-010 | Build facilities list, create and get API          | M1        | FR-01, A-02                  |            4 | ✅ Done    | AO-004                 |
| AO-011 | Build facilities list and create screen            | M1        | FR-01, PRD §4 screen 4       |            3 | ✅ Done    | AO-010                 |
| AO-012 | Update and archive facilities with reference guard | M1        | FR-01                        |            3 | ⏳ Pending | AO-010, AO-015, AO-023 |
| AO-013 | Manage the site-building-area hierarchy            | M1        | FR-01, PRD §4 screen 4       |            5 | ⏳ Pending | AO-010                 |
| AO-014 | Restrict non-admin users to granted sites          | M1        | FR-01, PRD §3                |            4 | ⏳ Pending | AO-007, AO-010         |
| AO-015 | Implement asset registry API                       | M1        | FR-02, A-02                  |            5 | ⏳ Pending | AO-013                 |
| AO-016 | Build searchable assets table                      | M1        | FR-02, PRD §4 screen 5       |            4 | ⏳ Pending | AO-015                 |
| AO-017 | Build asset create and edit form                   | M1        | FR-02, PRD §4 screen 6       |            3 | ⏳ Pending | AO-015                 |
| AO-018 | Build asset detail with history and cost           | M1        | FR-02, PRD §4 screen 7, A-11 |            4 | ⏳ Pending | AO-015, AO-048         |
| AO-019 | Import assets from CSV with preview                | M1        | FR-02, A-12                  |            6 | ⏳ Pending | AO-015                 |
| AO-020 | Store attachments safely on local disk             | M1        | FR-02, FR-03, A-14           |            5 | ⏳ Pending | AO-010                 |

## M2: Work orders and SLA

Work-order lifecycle, assignment, technician execution, checklists, labor and the SLA engine (FR-03, FR-04, FR-05).

| ID     | Title                                                    | Milestone | PRD refs                       | Estimate (h) | Status     | Depends on                     |
| ------ | -------------------------------------------------------- | --------- | ------------------------------ | -----------: | ---------- | ------------------------------ |
| AO-021 | Implement work-order state machine domain                | M2        | FR-03, FR-04, A-05, A-08       |            4 | ✅ Done    | AO-004                         |
| AO-022 | Implement SLA calculator domain                          | M2        | FR-05, A-10                    |            3 | ✅ Done    | AO-021                         |
| AO-023 | Create, list and read work orders                        | M2        | FR-03, A-02, A-03              |            5 | ⏳ Pending | AO-015, AO-022                 |
| AO-024 | Expose transition endpoint with optimistic locking       | M2        | FR-03, A-05, A-08              |            4 | ⏳ Pending | AO-023, AO-021                 |
| AO-025 | Assign and reassign technicians                          | M2        | FR-03, A-04                    |            3 | ⏳ Pending | AO-024                         |
| AO-026 | Complete checklist items                                 | M2        | FR-04, A-05                    |            3 | ⏳ Pending | AO-024                         |
| AO-027 | Record immutable labor entries with corrections          | M2        | FR-04, FR-09                   |            3 | ⏳ Pending | AO-024                         |
| AO-028 | Build work orders board                                  | M2        | FR-03, PRD §4 screen 8         |            4 | ⏳ Pending | AO-023                         |
| AO-029 | Build work-order request form                            | M2        | FR-03, PRD §4 screen 9, A-03   |            3 | ⏳ Pending | AO-023, AO-020                 |
| AO-030 | Build work-order detail view                             | M2        | FR-03, FR-04, PRD §4 screen 10 |            6 | ⏳ Pending | AO-024, AO-025, AO-026, AO-027 |
| AO-031 | Build technician My Work queue                           | M2        | FR-04, PRD §4 screen 11        |            3 | ⏳ Pending | AO-023                         |
| AO-032 | Create follow-up orders and capture cancellation reasons | M2        | FR-03                          |            2 | ⏳ Pending | AO-024                         |
| AO-033 | Configure SLA policies and overdue queue                 | M2        | FR-05, PRD §4 screen 16        |            4 | ⏳ Pending | AO-023                         |
| AO-034 | Escalate SLA risk and breaches from the worker           | M2        | FR-05, FR-10, A-10             |            4 | ⏳ Pending | AO-036, AO-052, AO-022         |
| AO-035 | Configure closure verification policy                    | M2        | FR-03                          |            2 | ⏳ Pending | AO-024                         |

## M3: Preventive maintenance, inventory and approvals

Background worker, PM generation, stock ledger, part requests and repair approvals (FR-06, FR-07, FR-08).

| ID     | Title                                             | Milestone | PRD refs                    | Estimate (h) | Status     | Depends on             |
| ------ | ------------------------------------------------- | --------- | --------------------------- | -----------: | ---------- | ---------------------- |
| AO-036 | Add background worker tick infrastructure         | M3        | FR-06, PRD §2               |            3 | ⏳ Pending | AO-003                 |
| AO-037 | Manage maintenance templates                      | M3        | FR-06                       |            3 | ⏳ Pending | AO-015                 |
| AO-038 | Manage schedules and recurrence calculation       | M3        | FR-06                       |            4 | ⏳ Pending | AO-037                 |
| AO-039 | Generate due preventive work idempotently         | M3        | FR-06, A-09                 |            4 | ⏳ Pending | AO-036, AO-038, AO-023 |
| AO-040 | Build preventive maintenance and calendar screens | M3        | FR-06, PRD §4 screens 12-13 |            5 | ⏳ Pending | AO-039                 |
| AO-041 | Manage parts catalogue and balances               | M3        | FR-07                       |            3 | ⏳ Pending | AO-010                 |
| AO-042 | Record stock movements in an append-only ledger   | M3        | FR-07, A-06, A-07           |            5 | ⏳ Pending | AO-041                 |
| AO-043 | Request and issue parts for work orders           | M3        | FR-07, FR-04                |            3 | ⏳ Pending | AO-042, AO-024         |
| AO-044 | Build inventory and ledger screens                | M3        | FR-07, PRD §4 screen 14     |            4 | ⏳ Pending | AO-042                 |
| AO-045 | Implement repair approval policy domain           | M3        | FR-08, A-08                 |            3 | ⏳ Pending | AO-021                 |
| AO-046 | Build approvals API                               | M3        | FR-08, A-08                 |            4 | ⏳ Pending | AO-045, AO-024         |
| AO-047 | Build approval inbox                              | M3        | FR-08, PRD §4 screen 15     |            3 | ⏳ Pending | AO-046                 |

## M4: Insights, notifications and administration

Cost model, dashboard, reports, notifications, audit viewer and organization settings (FR-09, FR-10).

| ID     | Title                                        | Milestone | PRD refs                     | Estimate (h) | Status     | Depends on     |
| ------ | -------------------------------------------- | --------- | ---------------------------- | -----------: | ---------- | -------------- |
| AO-048 | Implement work-order cost computation        | M4        | FR-09, A-11                  |            3 | ⏳ Pending | AO-027, AO-042 |
| AO-049 | Build operations report and CSV export API   | M4        | FR-09, A-15                  |            5 | ⏳ Pending | AO-048, AO-023 |
| AO-050 | Build operations dashboard                   | M4        | FR-09, PRD §4 screen 3, A-11 |            4 | ⏳ Pending | AO-049         |
| AO-051 | Build reports screen with charts             | M4        | FR-09, PRD §4 screen 17      |            5 | ⏳ Pending | AO-049         |
| AO-052 | Build notifications API                      | M4        | FR-10, A-10                  |            3 | ⏳ Pending | AO-023         |
| AO-053 | Build notifications center                   | M4        | FR-10, PRD §4 screen 19      |            2 | ⏳ Pending | AO-052         |
| AO-054 | Build audit log API and viewer               | M4        | FR-10                        |            3 | ⏳ Pending | AO-003         |
| AO-055 | Build users, roles and organization settings | M4        | PRD §3, PRD §4 screen 18     |            5 | ⏳ Pending | AO-007         |

## M5: Acceptance and hardening

Playwright acceptance suite for PRD §9, security review, accessibility and polish.

| ID     | Title                                                     | Milestone | PRD refs                     | Estimate (h) | Status     | Depends on                     |
| ------ | --------------------------------------------------------- | --------- | ---------------------------- | -----------: | ---------- | ------------------------------ |
| AO-056 | Automate role and tenant isolation acceptance tests       | M5        | A-01, A-02, A-13             |            4 | ⏳ Pending | AO-015, AO-009                 |
| AO-057 | Automate work-order lifecycle acceptance tests            | M5        | A-03, A-04, A-05, A-11       |            5 | ⏳ Pending | AO-030, AO-050                 |
| AO-058 | Automate inventory, approval, PM and SLA acceptance tests | M5        | A-06, A-07, A-08, A-09, A-10 |            5 | ⏳ Pending | AO-043, AO-046, AO-039, AO-034 |
| AO-059 | Automate import, upload and export acceptance tests       | M5        | A-12, A-14, A-15             |            4 | ⏳ Pending | AO-019, AO-020, AO-049         |
| AO-060 | Run security hardening review                             | M5        | PRD §3, PRD §11              |            3 | ⏳ Pending | AO-046, AO-020                 |
| AO-061 | Polish accessibility, responsiveness and states           | M5        | PRD §4, PRD §11              |            4 | ⏳ Pending | AO-050, AO-030                 |
| AO-062 | Add demo-account selector to sign-in                      | M5        | PRD §4 screen 1, PRD §8      |            2 | ⏳ Pending | AO-009                         |

## Totals

| Metric                |  Value |
| --------------------- | -----: |
| Tickets               |     62 |
| Done tickets          |     10 |
| Pending tickets       |     52 |
| Done hours            |     30 |
| Pending hours         |    199 |
| Total hours           |    229 |
| % complete (by hours) | 13.1 % |

Ticket descriptions and acceptance criteria live in [backlog.json](backlog.json). Per-milestone goals and exit criteria are in [roadmap.md](roadmap.md).
