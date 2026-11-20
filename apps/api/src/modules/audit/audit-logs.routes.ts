import type { Router } from 'express';
import { pendingRouter } from '../../lib/not-implemented.js';
import { requireAuth, requirePermission } from '../../middleware/authorize.js';

/**
 * Read-only audit log for admins and managers (FR-10, ADR-0008).
 * Every route answers 501 with its backlog ticket until implemented.
 */
export function createAuditLogsRouter(): Router {
  return pendingRouter(
    [{ method: 'get', path: '/', ticket: 'AO-054', guards: [requirePermission('audit:read')] }],
    [requireAuth],
  );
}
