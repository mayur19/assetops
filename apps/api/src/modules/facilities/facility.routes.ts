import { createFacilitySchema, facilityListQuerySchema, uuidSchema } from '@assetops/shared';
import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { errors } from '../../lib/errors.js';
import { sendOk } from '../../lib/http.js';
import { notImplemented } from '../../lib/not-implemented.js';
import { scopeOf } from '../../lib/request-scope.js';
import { parseOrThrow } from '../../lib/validate.js';
import { requireAuth, requirePermission } from '../../middleware/authorize.js';
import type { FacilityService } from './facility.service.js';

/** Malformed ids get the same 404 as foreign ids, so probing reveals nothing. */
function parseId(raw: string | undefined): string {
  const parsed = uuidSchema.safeParse(raw);
  if (!parsed.success) throw errors.notFound('Facility');
  return parsed.data;
}

export function createFacilityRouter(service: FacilityService): Router {
  const router = Router();
  router.use(requireAuth);

  router.get(
    '/',
    requirePermission('facility:read'),
    asyncHandler(async (req, res) => {
      const query = parseOrThrow(facilityListQuerySchema, req.query);
      const page = await service.list(scopeOf(req), query);
      sendOk(res, page.items, 200, { total: page.total, page: query.page, limit: query.limit });
    }),
  );

  router.post(
    '/',
    requirePermission('facility:create'),
    asyncHandler(async (req, res) => {
      const input = parseOrThrow(createFacilitySchema, req.body);
      sendOk(res, await service.create(scopeOf(req), input), 201);
    }),
  );

  router.get(
    '/:id',
    requirePermission('facility:read'),
    asyncHandler(async (req, res) => {
      sendOk(res, await service.get(scopeOf(req), parseId(req.params.id)));
    }),
  );

  router.patch('/:id', requirePermission('facility:update'), notImplemented('AO-012'));
  router.get('/:id/areas', requirePermission('facility:read'), notImplemented('AO-013'));
  router.post('/:id/areas', requirePermission('facility:update'), notImplemented('AO-013'));

  return router;
}
