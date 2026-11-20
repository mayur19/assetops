import type { Request } from 'express';
import type { Role } from '@assetops/shared';
import { errors } from './errors.js';

/**
 * Tenant + actor context for service calls. The organization always comes
 * from the authenticated session, never from the request body (ADR-0003).
 */
export interface RequestScope {
  readonly organizationId: string;
  readonly actorUserId: string;
  readonly role: Role;
  readonly requestId: string;
}

export function scopeOf(req: Request): RequestScope {
  if (!req.auth) throw errors.unauthenticated();
  return {
    organizationId: req.auth.user.organizationId,
    actorUserId: req.auth.user.id,
    role: req.auth.user.role,
    requestId: req.requestId,
  };
}
