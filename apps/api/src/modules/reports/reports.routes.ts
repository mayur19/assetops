import type { Router } from 'express';
import { pendingRouter } from '../../lib/not-implemented.js';
import { requireAuth, requirePermission } from '../../middleware/authorize.js';

/**
 * Operational reporting and CSV export (FR-09).
 * Every route answers 501 with its backlog ticket until implemented.
 */
export function createReportsRouter(): Router {
  return pendingRouter(
    [
      {
        method: 'get',
        path: '/operations',
        ticket: 'AO-049',
        guards: [requirePermission('report:read')],
      },
      {
        method: 'get',
        path: '/export.csv',
        ticket: 'AO-049',
        guards: [requirePermission('report:read')],
      },
    ],
    [requireAuth],
  );
}
