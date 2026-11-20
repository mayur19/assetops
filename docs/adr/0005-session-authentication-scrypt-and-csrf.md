# ADR-0005: Session authentication, scrypt and CSRF

- Status: Accepted
- Date: 2026-11-20

## Context

PRD §2 requires local password authentication with scrypt or a vetted library, server-managed
sessions, HTTP-only SameSite cookies and CSRF protection. No third-party SSO (non-goal).

## Decision Drivers

- No external identity provider; must work offline.
- Immediate revocation (logout, disabled user).
- Defence against CSRF, credential stuffing and account enumeration.

## Considered Options

1. Opaque server-side sessions in PostgreSQL + cookie + CSRF token.
2. Stateless JWT in cookie.
3. JWT in local storage with bearer header.

## Decision Outcome

Chosen option 1.

- Passwords: Node `crypto.scrypt` with a unique random salt, constant-time comparison, and a
  dummy hash comparison for unknown emails (`apps/api/src/security/password.ts`).
- Sessions: 256-bit random token in an `HttpOnly; SameSite=Lax` cookie (`Secure` in
  production); only its SHA-256 hash is stored in `sessions`.
- CSRF: origin/referer must equal `APP_ORIGIN` for unsafe methods, and authenticated unsafe
  requests carry `X-CSRF-Token = HMAC(session token, SESSION_SECRET)`
  (`apps/api/src/middleware/csrf.ts`).
- Rate limiting: global API limiter plus a stricter login limiter.
- Pending: storing the active organization on the session for multi-membership users (AO-007).

## Consequences

### Positive

- Logout and user deactivation take effect immediately.
- A database leak does not expose usable session tokens.

### Negative

- Every authenticated request performs a session lookup.
- SPA must fetch and hold the CSRF token in memory.

## Links

- [docs/security/threat-model.md](../security/threat-model.md)
- AO-002, AO-007
