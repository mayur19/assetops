import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import type { Role } from '@assetops/shared';
import type { Db } from '../src/db/pool.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { productModules } from '../src/modules/index.js';
import { silentLogger } from './helpers.js';

/** Mount the product modules behind a stub session for the given role. */
function appAs(role: Role) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.requestId = 'test';
    req.auth = {
      sessionToken: 'stub',
      user: {
        id: '00000000-0000-4000-8000-000000000001',
        organizationId: '00000000-0000-4000-8000-000000000002',
        organizationName: 'Test Org',
        email: 'user@test.example',
        displayName: 'Test User',
        role,
      },
    };
    next();
  });
  for (const module of productModules({ db: {} as Db })) {
    app.use(`/api/v1${module.path}`, module.router);
  }
  app.use(errorHandler(silentLogger));
  return app;
}

const SAMPLE: readonly [method: 'get' | 'post' | 'patch' | 'put', path: string, ticket: string][] =
  [
    ['patch', '/api/v1/facilities/00000000-0000-4000-8000-000000000003', 'AO-012'],
    ['get', '/api/v1/facilities/00000000-0000-4000-8000-000000000003/areas', 'AO-013'],
    ['get', '/api/v1/assets', 'AO-015'],
    ['post', '/api/v1/assets/import', 'AO-019'],
    ['post', '/api/v1/work-orders', 'AO-023'],
    ['post', '/api/v1/work-orders/abc/transition', 'AO-024'],
    ['post', '/api/v1/work-orders/abc/assign', 'AO-025'],
    ['post', '/api/v1/work-orders/abc/checklist/item-1/complete', 'AO-026'],
    ['post', '/api/v1/work-orders/abc/labor', 'AO-027'],
    ['post', '/api/v1/work-orders/abc/part-requests', 'AO-043'],
    ['get', '/api/v1/maintenance/templates', 'AO-037'],
    ['post', '/api/v1/maintenance/schedules', 'AO-038'],
    ['post', '/api/v1/maintenance/run-due', 'AO-039'],
    ['get', '/api/v1/parts', 'AO-041'],
    ['post', '/api/v1/parts/abc/movements', 'AO-042'],
    ['get', '/api/v1/approvals', 'AO-046'],
    ['post', '/api/v1/approvals/abc/decide', 'AO-046'],
    ['get', '/api/v1/reports/operations', 'AO-049'],
    ['get', '/api/v1/reports/export.csv', 'AO-049'],
    ['get', '/api/v1/notifications', 'AO-052'],
    ['post', '/api/v1/notifications/abc/read', 'AO-052'],
    ['get', '/api/v1/audit-logs', 'AO-054'],
    ['put', '/api/v1/sla-policies', 'AO-033'],
    ['get', '/api/v1/organizations/memberships', 'AO-007'],
    ['post', '/api/v1/attachments', 'AO-020'],
  ];

describe('pending API surface', () => {
  it.each(SAMPLE)('%s %s -> 501 %s for an org admin', async (method, path, ticket) => {
    const res = await request(appAs('ORG_ADMIN'))[method](path);
    expect(res.status).toBe(501);
    expect(res.body).toMatchObject({
      success: false,
      data: null,
      error: { code: 'NOT_IMPLEMENTED', details: { ticket } },
    });
  });

  it.each<[Role, 'get' | 'post', string]>([
    ['REQUESTER', 'get', '/api/v1/parts'],
    ['REQUESTER', 'get', '/api/v1/assets'],
    ['TECHNICIAN', 'get', '/api/v1/approvals'],
    ['TECHNICIAN', 'post', '/api/v1/work-orders/abc/assign'],
    ['FACILITY_MANAGER', 'post', '/api/v1/maintenance/run-due'],
    ['FACILITY_MANAGER', 'get', '/api/v1/organizations/current/settings'],
    ['TECHNICIAN', 'get', '/api/v1/audit-logs'],
  ])(
    '%s is denied %s %s with 403 before reaching the pending handler',
    async (role, method, path) => {
      const res = await request(appAs(role))[method](path);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    },
  );

  it('lets technicians reach execution endpoints (still pending)', async () => {
    const res = await request(appAs('TECHNICIAN')).post('/api/v1/work-orders/abc/labor');
    expect(res.status).toBe(501);
  });
});
