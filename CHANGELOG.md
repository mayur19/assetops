# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Monorepo foundation: API (Express + PostgreSQL), web (React + Vite), shared schemas (AO-001).
- Single launcher script `run.sh` (setup, migrate, seed, start, test, e2e, check, build).
- Session authentication with scrypt password hashing, CSRF protection and rate limiting (AO-002).
- Forward-only SQL migration runner, append-only audit trail, health endpoints (AO-003).
- AssetOps roles (Organization Admin, Facility Manager, Technician, Requester), shared permission
  matrix and `users.role` check constraint in migration `0002_roles_and_facilities` (AO-004).
- Development seed for Riverside Hospitality and Northline Fitness with one demo user per role and
  two facilities per organization (AO-005).
- Facilities API: paginated, searchable list, create (admins and managers, audited in the same
  transaction, unique code per organization) and get by id with 404 across tenants (AO-010).
- Facilities screen with server-side pagination, search and a validated create form (AO-011).
- Work-order state machine: lifecycle graph, per-role guards, assignee rules, required checklist
  and resolution gates, approval gate, no self-approval on closure, read-only closed orders (AO-021).
- SLA calculator: site-over-default policies, elapsed-clock due dates, response and resolution
  evaluation with at-risk and breach states, deduplicated escalation keys (AO-022).
- Every remaining PRD §7 endpoint registered as a pending route returning 501 with its ticket, and
  every PRD §4 screen in navigation with role visibility.
- Engineering documentation: architecture, ADR-0001 to ADR-0017, data model, OpenAPI contract,
  threat model, test strategy, runbook, deployment plan, roadmap, backlog and risk register (AO-006).
