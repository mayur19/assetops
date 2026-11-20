import type { Router } from 'express';
import { pendingRouter } from '../../lib/not-implemented.js';
import { requireAuth, requirePermission } from '../../middleware/authorize.js';

/**
 * Parts catalogue and append-only stock ledger (FR-07, ADR-0016).
 * Every route answers 501 with its backlog ticket until implemented.
 */
export function createPartsRouter(): Router {
  return pendingRouter(
    [
      { method: 'get', path: '/', ticket: 'AO-041', guards: [requirePermission('inventory:read')] },
      {
        method: 'post',
        path: '/',
        ticket: 'AO-041',
        guards: [requirePermission('inventory:write')],
      },
      {
        method: 'get',
        path: '/:id/movements',
        ticket: 'AO-042',
        guards: [requirePermission('inventory:read')],
      },
      {
        method: 'post',
        path: '/:id/movements',
        ticket: 'AO-042',
        guards: [requirePermission('inventory:write')],
      },
    ],
    [requireAuth],
  );
}
