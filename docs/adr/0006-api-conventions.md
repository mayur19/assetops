# ADR-0006: API conventions

- Status: Accepted
- Date: 2026-11-20

## Context

PRD §7 requires typed request validation, predictable JSON errors, pagination and non-200
responses for invalid transitions. Most endpoints are pending and must still be discoverable.

## Decision Drivers

- One response shape the web client can unwrap generically.
- Stable machine-readable error codes.
- Explicit placeholder behaviour for pending endpoints.

## Considered Options

1. Versioned REST under `/api/v1` with a success/error envelope.
2. Bare resources with HTTP status only.
3. GraphQL.

## Decision Outcome

Chosen option 1.

- Base path `/api/v1`; health at `/api/health/live|ready`.
- Envelope: `{ success, data, error, meta? }` (`packages/shared/src/api-envelope.ts`);
  `meta = { total, page, limit }` for lists.
- Errors: `{ code, message, details?, requestId? }` with codes `VALIDATION_FAILED` (422),
  `UNAUTHENTICATED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409),
  `INVALID_STATE_TRANSITION` (409), `RATE_LIMITED` (429), `CSRF_FAILED` (403),
  `NOT_IMPLEMENTED` (501), `SERVICE_UNAVAILABLE` (503), `INTERNAL_ERROR` (500).
- Validation with zod schemas from `@assetops/shared` at the route boundary (`parseOrThrow`).
- Pagination: `page` (>=1), `limit` (1-100, default 25); filters server-side.
- Pending endpoints use `pendingRouter`/`notImplemented(ticket)` and return 501 with
  `details.ticket` (e.g. `AO-023`), after auth and permission guards.
- Optimistic locking with a `version` field on mutable aggregates (409 on mismatch).
- Contract: [docs/api/openapi.yaml](../api/openapi.yaml) with `x-status` and `x-ticket`.

## Consequences

### Positive

- The UI handles every error uniformly; pending gaps are visible and traceable.

### Negative

- The envelope adds a small payload overhead and differs from bare REST tooling defaults.

## Links

- [docs/api/README.md](../api/README.md)
- `apps/api/src/lib/errors.ts`, `apps/api/src/lib/not-implemented.ts`
