# Runbook (local development)

## Prerequisites

- Node.js 22 or newer and npm.
- PostgreSQL 15+ running locally with `psql` on the `PATH` (developed against 17). The default
  `DATABASE_URL` connects as the current OS user without a password.
- Chromium for Playwright (`./run.sh e2e` installs it when possible).

## First run

```bash
./run.sh
```

This checks prerequisites, creates `.env` from `.env.example` with a random `SESSION_SECRET`,
installs dependencies, creates the database, applies migrations, seeds development data (only when
the users table is empty) and launches API (http://127.0.0.1:4101) and web (http://localhost:5171).

## Command reference

| Command                       | What it does                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `./run.sh` / `./run.sh start` | Full setup, then start API and web in watch mode                               |
| `./run.sh setup`              | Everything `start` does, without launching                                     |
| `./run.sh migrate`            | Apply pending migrations                                                       |
| `./run.sh seed`               | Re-apply the idempotent development seed                                       |
| `./run.sh reset [--yes]`      | Drop the schema, migrate and seed (asks unless `--yes`; refuses in production) |
| `./run.sh test`               | Unit + integration tests against `<db>_test`                                   |
| `./run.sh e2e`                | Playwright tests (starts or reuses the app)                                    |
| `./run.sh check`              | Lint, format check, typecheck and tests (mirrors CI)                           |
| `./run.sh build`              | Production build of API and web                                                |
| `./run.sh help`               | List commands                                                                  |

## Configuration

All variables live in `.env` (never committed). Defaults come from `.env.example` and
`apps/api/src/config/env.ts`; the API refuses to boot on invalid values.

| Variable               | Default                                  | Purpose                                                                                       |
| ---------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------- |
| `NODE_ENV`             | `development`                            | `development`, `test` or `production`; production forbids the placeholder secret and the seed |
| `LOG_LEVEL`            | `info`                                   | pino level (`fatal` … `trace`, `silent`)                                                      |
| `API_HOST`             | `127.0.0.1`                              | API bind address                                                                              |
| `API_PORT`             | `4101`                                   | API port                                                                                      |
| `WEB_PORT`             | `5171`                                   | Vite dev server port                                                                          |
| `APP_ORIGIN`           | `http://localhost:5171`                  | Browser origin; used for CSRF origin checks                                                   |
| `DATABASE_URL`         | `postgres://localhost:5432/assetops_dev` | PostgreSQL connection string                                                                  |
| `DATABASE_POOL_MAX`    | `10`                                     | Connection pool size                                                                          |
| `SESSION_SECRET`       | placeholder, replaced by `run.sh`        | HMAC key for CSRF tokens; at least 32 characters                                              |
| `SESSION_TTL_MINUTES`  | `480`                                    | Session lifetime                                                                              |
| `SESSION_COOKIE_NAME`  | `sid`                                    | Session cookie name                                                                           |
| `UPLOAD_DIR`           | `./uploads`                              | Attachment directory (used from AO-020)                                                       |
| `UPLOAD_MAX_BYTES`     | `10485760`                               | Attachment size limit (used from AO-020)                                                      |
| `RATE_LIMIT_WINDOW_MS` | `60000`                                  | Rate-limit window                                                                             |
| `RATE_LIMIT_MAX`       | `300`                                    | Requests per window per IP for `/api`                                                         |
| `AUTH_RATE_LIMIT_MAX`  | `10`                                     | Login attempts per window per IP                                                              |
| `TEST_DATABASE_URL`    | derived `<db>_test`                      | Disposable database for integration tests (schema is dropped)                                 |

## Health checks

```bash
curl -s http://127.0.0.1:4101/api/health/live    # process is up, no dependencies touched
curl -s http://127.0.0.1:4101/api/health/ready   # 200 when PostgreSQL answers, 503 otherwise
```

## Logs

The API logs structured JSON with pino. Every request gets an `X-Request-Id` (echoed in error
bodies as `requestId`); search logs by that id to trace a failing call. Use `LOG_LEVEL=debug` for
more detail. Session tokens, passwords and CSRF tokens are never logged.

## Common failures

| Symptom                                                          | Cause                                      | Fix                                                                    |
| ---------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------- |
| `Cannot reach PostgreSQL via postgres://localhost:5432/postgres` | Server not running                         | `brew services start postgresql@17` or `sudo service postgresql start` |
| `Invalid environment configuration` at boot                      | Missing/invalid `.env` value               | Compare with `.env.example`; `SESSION_SECRET` must be ≥ 32 chars       |
| `Migration … was modified after being applied`                   | An applied migration file was edited       | Revert the edit and add a new `NNNN_*.sql` migration                   |
| `Port 5171 is already in use`                                    | Previous dev server still running          | `lsof -ti tcp:5171 -ti tcp:4101 \| xargs kill`                         |
| Login returns 429                                                | Login rate limit hit                       | Wait for the window or raise `AUTH_RATE_LIMIT_MAX` locally             |
| Unsafe request returns 403 `CSRF_FAILED`                         | Missing `X-CSRF-Token` or foreign `Origin` | Use the token returned by login/session; call through the web origin   |
| Unknown role errors after pulling                                | Database seeded before migration 0002      | `./run.sh reset --yes`                                                 |

## Backup and restore

```bash
pg_dump --format=custom --file=assetops-$(date +%F).dump "$DATABASE_URL"
pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL" assetops-2026-11-20.dump
```

Uploaded files under `apps/api/uploads/` must be backed up alongside the dump once attachments
(AO-020) are enabled.

## Resetting demo data

```bash
./run.sh reset --yes   # drop schema, migrate, seed
./run.sh seed          # re-apply the seed without dropping data
```

The seed refuses to run when `NODE_ENV=production`.
