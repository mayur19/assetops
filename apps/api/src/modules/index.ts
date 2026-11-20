import type { Router } from 'express';
import type { Db } from '../db/pool.js';
import { createApprovalsRouter } from './approvals/approvals.routes.js';
import { createAssetsRouter } from './assets/assets.routes.js';
import { createAttachmentsRouter } from './attachments/attachments.routes.js';
import { createAuditLogsRouter } from './audit/audit-logs.routes.js';
import { createFacilityRouter } from './facilities/facility.routes.js';
import { createFacilityService } from './facilities/facility.service.js';
import { createMaintenanceRouter } from './maintenance/maintenance.routes.js';
import { createNotificationsRouter } from './notifications/notifications.routes.js';
import { createOrganizationsRouter } from './organizations/organizations.routes.js';
import { createPartsRouter } from './parts/parts.routes.js';
import { createReportsRouter } from './reports/reports.routes.js';
import { createSlaPoliciesRouter } from './sla/sla.routes.js';
import { createWorkOrdersRouter } from './work-orders/work-orders.routes.js';

export interface ModuleDeps {
  readonly db: Db;
}

export interface MountedModule {
  readonly path: string;
  readonly router: Router;
}

/**
 * Product modules mounted under /api/v1. Each module owns its routes,
 * service, repository and schemas (ADR-0002). Endpoints not yet built are
 * registered with `pendingRouter` so the API surface matches the contract
 * (docs/api/openapi.yaml) and returns 501 + ticket id until implemented.
 */
export function productModules({ db }: ModuleDeps): readonly MountedModule[] {
  return [
    { path: '/facilities', router: createFacilityRouter(createFacilityService(db)) },
    { path: '/assets', router: createAssetsRouter() },
    { path: '/work-orders', router: createWorkOrdersRouter() },
    { path: '/maintenance', router: createMaintenanceRouter() },
    { path: '/parts', router: createPartsRouter() },
    { path: '/approvals', router: createApprovalsRouter() },
    { path: '/reports', router: createReportsRouter() },
    { path: '/notifications', router: createNotificationsRouter() },
    { path: '/audit-logs', router: createAuditLogsRouter() },
    { path: '/sla-policies', router: createSlaPoliciesRouter() },
    { path: '/organizations', router: createOrganizationsRouter() },
    { path: '/attachments', router: createAttachmentsRouter() },
  ];
}
