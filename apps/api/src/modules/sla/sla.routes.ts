import type { Router } from 'express';
import { pendingRouter } from '../../lib/not-implemented.js';
import { requireAuth, requirePermission } from '../../middleware/authorize.js';

/**
 * SLA policy configuration by priority and optional site (FR-05, ADR-0014).
 * Every route answers 501 with its backlog ticket until implemented.
 */
export function createSlaPoliciesRouter(): Router {
  return pendingRouter(
    [
      { method: 'get', path: '/', ticket: 'AO-033', guards: [requirePermission('sla:manage')] },
      { method: 'put', path: '/', ticket: 'AO-033', guards: [requirePermission('sla:manage')] },
    ],
    [requireAuth],
  );
}
