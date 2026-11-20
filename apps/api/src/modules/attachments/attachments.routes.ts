import type { Router } from 'express';
import { pendingRouter } from '../../lib/not-implemented.js';
import { requireAuth } from '../../middleware/authorize.js';

/**
 * Local-disk attachments with MIME allowlist and size limits (ADR-0011).
 * Every route answers 501 with its backlog ticket until implemented.
 */
export function createAttachmentsRouter(): Router {
  return pendingRouter(
    [
      { method: 'post', path: '/', ticket: 'AO-020' },
      { method: 'get', path: '/:id', ticket: 'AO-020' },
    ],
    [requireAuth],
  );
}
