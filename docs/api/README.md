# API conventions

The HTTP contract lives in [openapi.yaml](openapi.yaml) (OpenAPI 3.1). Every operation is marked
`x-status: implemented | pending` and carries an `x-ticket` from the [backlog](../planning/backlog.md).
Pending endpoints are already routed and return `501 NOT_IMPLEMENTED` with the ticket id, so the
API surface matches the contract from day one (ADR-0006).

| Status      | Endpoints                                                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Implemented | `/health/*`, `/auth/login`, `/auth/logout`, `/auth/session`, `/me`, `GET/POST /facilities`, `GET /facilities/:id`                                                   |
| Pending     | Everything else in PRD §7 (assets, work orders, maintenance, parts, approvals, reports, notifications, audit logs) plus SLA policies, organizations and attachments |

## Base URL and versioning

- All application routes are mounted under **`/api/v1`**. PRD §7 lists paths without the version
  segment; `GET /api/facilities` in the PRD is `GET /api/v1/facilities` here.
- Health probes are unversioned: `/api/health/live`, `/api/health/ready`.
- Locally the browser talks to the Vite dev server on **http://localhost:5171**, which proxies `/api`
  to the API on **http://localhost:4101**. Use the proxy so the `Origin` header matches `APP_ORIGIN`.
- Breaking changes require a new major path (`/api/v2`) and an ADR; additive changes (new optional
  fields, new endpoints) stay in `v1`.

## Response envelope

Every response, success or failure, has the same shape (`packages/shared/src/api-envelope.ts`):

```json
{ "success": true, "data": { "id": "…" }, "error": null }
{ "success": true, "data": [ … ], "error": null, "meta": { "total": 2, "page": 1, "limit": 25 } }
{ "success": false, "data": null, "error": { "code": "NOT_FOUND", "message": "Facility not found", "requestId": "…" } }
```

`error.details` is optional: validation issues (`[{ path, message }]`), transition reasons or the
pending `ticket`. `requestId` matches the `X-Request-Id` response header and the server log line.
Stack traces, SQL and internal identifiers are never returned.

## Error codes

| Code                       | HTTP | When                                                                                   |
| -------------------------- | ---: | -------------------------------------------------------------------------------------- |
| `VALIDATION_FAILED`        |  422 | Body/query fails the zod schema, or the JSON body is malformed                         |
| `UNAUTHENTICATED`          |  401 | No valid session, or wrong credentials on login (one generic message)                  |
| `FORBIDDEN`                |  403 | Role lacks the permission, or a domain actor rule rejects the action                   |
| `CSRF_FAILED`              |  403 | Cross-origin unsafe request, or missing/invalid `X-CSRF-Token`                         |
| `NOT_FOUND`                |  404 | Unknown route, unknown id, malformed id, or a record owned by another organization     |
| `CONFLICT`                 |  409 | Unique constraint (e.g. facility code), stale `version`, duplicate active approval     |
| `INVALID_STATE_TRANSITION` |  409 | Work-order lifecycle rule rejected the change (`details.reason` holds the domain code) |
| `RATE_LIMITED`             |  429 | Global or login rate limit exceeded                                                    |
| `NOT_IMPLEMENTED`          |  501 | Endpoint is in the contract but not built; `details.ticket` names the backlog item     |
| `SERVICE_UNAVAILABLE`      |  503 | Readiness check cannot reach PostgreSQL                                                |
| `INTERNAL_ERROR`           |  500 | Unexpected failure (logged server-side with the request id)                            |

Status mapping is defined once in `apps/api/src/lib/errors.ts`.

### Work-order transition errors (planned, AO-024)

The domain state machine (`packages/shared/src/domain/work-orders`, ADR-0013) returns typed codes
that the transition endpoint maps as follows:

| Domain code                                                                                                                                      | HTTP / envelope code           |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| `ROLE_NOT_PERMITTED`, `NOT_ASSIGNEE`, `SELF_APPROVAL`                                                                                            | 403 `FORBIDDEN`                |
| `INVALID_TRANSITION`, `ORDER_LOCKED`, `CHECKLIST_INCOMPLETE`, `RESOLUTION_REQUIRED`, `REASON_REQUIRED`, `ASSIGNEE_REQUIRED`, `APPROVAL_REQUIRED` | 409 `INVALID_STATE_TRANSITION` |

## Tenancy and object-level authorization

- The organization always comes from the session, never from the request (ADR-0003).
- Records from another organization are reported as `404`, never `403`, so ids cannot be probed.
- Role checks use the shared permission matrix (`packages/shared/src/permissions.ts`, ADR-0007);
  record-level rules (own requests, assigned work) live in services.

## Pagination, filtering and sorting

- Query parameters `page` (default 1) and `limit` (default 25, max 100).
- Paginated responses include `meta: { total, page, limit }`.
- Filters are server-side query parameters (e.g. `GET /facilities?q=harbour&includeArchived=true`).
  Search text is matched literally; `%` and `_` are escaped.
- Ordering is deterministic (e.g. facilities by `name, id`) so pages do not overlap.

## Concurrency and idempotency

- Mutable aggregates (facilities, assets, work orders) carry a `version`. Updates send the version
  last read; a mismatch returns `409 CONFLICT` (optimistic locking, planned with AO-012/AO-024).
- State changes and their audit events commit in one transaction (ADR-0008).
- Preventive-maintenance generation is idempotent by a unique `(schedule_id, occurrence_date)` key;
  `POST /maintenance/run-due` can be called repeatedly (AO-039, ADR-0015).
- Stock issues use a conditional balance update so concurrent requests can never drive stock
  negative (AO-042, ADR-0016). An optional `Idempotency-Key` header is reserved for movement posts.
- Notification escalations are deduplicated by a stable key per work order, clock and level (AO-034).

## Authentication and CSRF

1. `POST /api/v1/auth/login` with `{ email, password }`. The response sets an HTTP-only
   `SameSite=Lax` cookie (`sid`) and returns `data.csrfToken`.
2. Send `X-CSRF-Token: <csrfToken>` on every authenticated `POST`, `PUT`, `PATCH` and `DELETE`.
3. Unsafe requests must also carry an `Origin` (or `Referer`) equal to `APP_ORIGIN`.
4. `GET /api/v1/auth/session` returns the current user and a fresh token after a page reload.

Login is rate limited (`AUTH_RATE_LIMIT_MAX` per window) and every failure returns the same
`UNAUTHENTICATED` message.

## Examples (development only)

Demo credentials are public development fixtures documented in the root README.

```bash
BASE=http://localhost:5171/api/v1
ORIGIN=http://localhost:5171
JAR=$(mktemp)

# Sign in and capture the CSRF token
CSRF=$(curl -s -c "$JAR" -H "Origin: $ORIGIN" -H 'Content-Type: application/json' \
  -d '{"email":"manager@riverside.example","password":"DemoPassword!2026"}' \
  "$BASE/auth/login" | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.csrfToken')

# List facilities (page 1, 10 per page, search)
curl -s -b "$JAR" "$BASE/facilities?limit=10&q=riverside"

# Create a facility
curl -s -b "$JAR" -H "Origin: $ORIGIN" -H "X-CSRF-Token: $CSRF" -H 'Content-Type: application/json' \
  -d '{"code":"RIV-SPA","name":"Riverside Day Spa","timezone":"America/Chicago"}' \
  "$BASE/facilities"

# A pending endpoint answers 501 with its ticket
curl -s -b "$JAR" "$BASE/work-orders"
# {"success":false,"data":null,"error":{"code":"NOT_IMPLEMENTED","message":"Not implemented yet (tracked as AO-023)","details":{"ticket":"AO-023"},"requestId":"…"}}

# Health (direct to the API process)
curl -s http://localhost:4101/api/health/ready
```

## Changing the contract

Update `openapi.yaml` in the same pull request as the route, flip `x-status` to `implemented`, and
validate with `npx --yes @redocly/cli lint docs/api/openapi.yaml`.
