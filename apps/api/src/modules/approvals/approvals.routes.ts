import type { Router } from 'express';
import { pendingRouter } from '../../lib/not-implemented.js';
import { requireAuth, requirePermission } from '../../middleware/authorize.js';

/**
 * Repair approval inbox and decisions (FR-08, ADR-0017).
 * Every route answers 501 with its backlog ticket until implemented.
 */
export function createApprovalsRouter(): Router {
  return pendingRouter(
    [
      {
        method: 'get',
        path: '/',
        ticket: 'AO-046',
        guards: [requirePermission('approval:decide')],
      },
      {
        method: 'post',
        path: '/:id/decide',
        ticket: 'AO-046',
        guards: [requirePermission('approval:decide')],
      },
    ],
    [requireAuth],
  );
}
