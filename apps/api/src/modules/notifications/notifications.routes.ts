import type { Router } from 'express';
import { pendingRouter } from '../../lib/not-implemented.js';
import { requireAuth } from '../../middleware/authorize.js';

/**
 * In-app notifications for the signed-in user (FR-10, ADR-0012).
 * Every route answers 501 with its backlog ticket until implemented.
 */
export function createNotificationsRouter(): Router {
  return pendingRouter(
    [
      { method: 'get', path: '/', ticket: 'AO-052' },
      { method: 'get', path: '/unread-count', ticket: 'AO-052' },
      { method: 'post', path: '/:id/read', ticket: 'AO-052' },
    ],
    [requireAuth],
  );
}
