import type { Router } from 'express';
import { pendingRouter } from '../../lib/not-implemented.js';
import { requireAuth, requirePermission } from '../../middleware/authorize.js';

/**
 * Corrective work orders and technician execution (FR-03, FR-04, FR-07, FR-08).
 * Transition rules live in @assetops/shared domain/work-orders (ADR-0013); record-level
 * checks (own requests, assigned work) belong in the service once built.
 * Every route answers 501 with its backlog ticket until implemented.
 */
export function createWorkOrdersRouter(): Router {
  return pendingRouter(
    [
      // Requesters see only their own orders; scoping is a service concern (AO-023).
      { method: 'get', path: '/', ticket: 'AO-023' },
      {
        method: 'post',
        path: '/',
        ticket: 'AO-023',
        guards: [requirePermission('work-order:create')],
      },
      { method: 'get', path: '/:id', ticket: 'AO-023' },
      // Actor rules are enforced by the domain state machine, not a role gate.
      { method: 'post', path: '/:id/transition', ticket: 'AO-024' },
      {
        method: 'post',
        path: '/:id/assign',
        ticket: 'AO-025',
        guards: [requirePermission('work-order:manage')],
      },
      {
        method: 'post',
        path: '/:id/checklist/:itemId/complete',
        ticket: 'AO-026',
        guards: [requirePermission('work-order:execute')],
      },
      {
        method: 'post',
        path: '/:id/labor',
        ticket: 'AO-027',
        guards: [requirePermission('work-order:execute')],
      },
      {
        method: 'post',
        path: '/:id/follow-up',
        ticket: 'AO-032',
        guards: [requirePermission('work-order:manage')],
      },
      {
        method: 'post',
        path: '/:id/part-requests',
        ticket: 'AO-043',
        guards: [requirePermission('work-order:execute')],
      },
      {
        method: 'post',
        path: '/:id/approval-requests',
        ticket: 'AO-046',
        guards: [requirePermission('work-order:execute')],
      },
    ],
    [requireAuth],
  );
}
