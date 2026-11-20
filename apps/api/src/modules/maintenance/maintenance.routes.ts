import type { Router } from 'express';
import { pendingRouter } from '../../lib/not-implemented.js';
import { requireAuth, requirePermission } from '../../middleware/authorize.js';

/**
 * Preventive maintenance templates, schedules and generation (FR-06, ADR-0015).
 * Every route answers 501 with its backlog ticket until implemented.
 */
export function createMaintenanceRouter(): Router {
  return pendingRouter(
    [
      {
        method: 'get',
        path: '/templates',
        ticket: 'AO-037',
        guards: [requirePermission('maintenance:manage')],
      },
      {
        method: 'post',
        path: '/templates',
        ticket: 'AO-037',
        guards: [requirePermission('maintenance:manage')],
      },
      {
        method: 'get',
        path: '/schedules',
        ticket: 'AO-038',
        guards: [requirePermission('maintenance:manage')],
      },
      {
        method: 'post',
        path: '/schedules',
        ticket: 'AO-038',
        guards: [requirePermission('maintenance:manage')],
      },
      // Admin/dev only; idempotent on (schedule_id, occurrence_date).
      {
        method: 'post',
        path: '/run-due',
        ticket: 'AO-039',
        guards: [requirePermission('maintenance:run-due')],
      },
    ],
    [requireAuth],
  );
}
