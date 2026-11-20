import type { Router } from 'express';
import { pendingRouter } from '../../lib/not-implemented.js';
import { requireAuth, requirePermission } from '../../middleware/authorize.js';

/**
 * Memberships, organization switching, users and settings (PRD §3, FR-01).
 * Every route answers 501 with its backlog ticket until implemented.
 */
export function createOrganizationsRouter(): Router {
  return pendingRouter(
    [
      { method: 'get', path: '/memberships', ticket: 'AO-007' },
      { method: 'post', path: '/switch', ticket: 'AO-007' },
      {
        method: 'get',
        path: '/current/settings',
        ticket: 'AO-055',
        guards: [requirePermission('organization:manage')],
      },
      {
        method: 'patch',
        path: '/current/settings',
        ticket: 'AO-055',
        guards: [requirePermission('organization:manage')],
      },
      {
        method: 'get',
        path: '/current/users',
        ticket: 'AO-055',
        guards: [requirePermission('organization:manage')],
      },
      {
        method: 'post',
        path: '/current/users',
        ticket: 'AO-055',
        guards: [requirePermission('organization:manage')],
      },
    ],
    [requireAuth],
  );
}
