import type { Router } from 'express';
import { pendingRouter } from '../../lib/not-implemented.js';
import { requireAuth, requirePermission } from '../../middleware/authorize.js';

/**
 * Asset registry (FR-02). Pending: AO-015 CRUD, AO-019 CSV import.
 * Every route answers 501 with its backlog ticket until implemented.
 */
export function createAssetsRouter(): Router {
  return pendingRouter(
    [
      { method: 'get', path: '/', ticket: 'AO-015', guards: [requirePermission('asset:read')] },
      { method: 'post', path: '/', ticket: 'AO-015', guards: [requirePermission('asset:write')] },
      {
        method: 'post',
        path: '/import',
        ticket: 'AO-019',
        guards: [requirePermission('asset:write')],
      },
      { method: 'get', path: '/:id', ticket: 'AO-015', guards: [requirePermission('asset:read')] },
      {
        method: 'patch',
        path: '/:id',
        ticket: 'AO-015',
        guards: [requirePermission('asset:write')],
      },
    ],
    [requireAuth],
  );
}
