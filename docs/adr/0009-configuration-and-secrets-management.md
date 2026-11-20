# ADR-0009: Configuration and secrets management

- Status: Accepted
- Date: 2026-11-20

## Context

The repository is public. Developers need a working local setup from one command; production
needs real secrets that never touch git. Demo credentials must be clearly development-only (PRD §8).

## Decision Drivers

- No secrets in the repository; CI secret scanning.
- Fail fast on missing or unsafe configuration.
- Zero manual steps for local setup.

## Considered Options

1. Environment variables validated by zod at boot; `.env.example` with placeholders; `run.sh`
   generates a random local `SESSION_SECRET`.
2. Committed config files per environment.
3. Mandatory secrets manager even for local development.

## Decision Outcome

Chosen option 1. `apps/api/src/config/env.ts` validates all variables and refuses to boot in
production with the placeholder secret. `run.sh` copies `.env.example` to an untracked `.env`
(mode 600) and replaces the secret placeholder. The seed (`apps/api/src/db/seed.ts`) refuses to
run when `NODE_ENV=production`; demo logins use the documented password `DemoPassword!2026` and
exist only in development databases. CI runs gitleaks. Production uses a secrets manager that
injects environment variables ([deployment.md](../operations/deployment.md)).

## Consequences

### Positive

- Fresh clone works with `./run.sh`; misconfiguration fails at startup with a clear message.

### Negative

- Environment variables are visible to the process and its children; acceptable for this tier.

## Links

- [docs/operations/runbook.md](../operations/runbook.md)
- AO-005, AO-062
