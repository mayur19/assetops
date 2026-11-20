import type { CreateFacilityInput, Facility, FacilityListQuery } from '@assetops/shared';
import { withTransaction, type Db } from '../../db/pool.js';
import { errors } from '../../lib/errors.js';
import type { RequestScope } from '../../lib/request-scope.js';
import { recordAudit } from '../audit/audit.service.js';
import { createFacilityRepository, type FacilityPage } from './facility.repository.js';

const UNIQUE_VIOLATION = '23505';

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === UNIQUE_VIOLATION
  );
}

/**
 * Facilities use cases (FR-01). Role checks happen at the route boundary;
 * tenant scoping is applied here on every call via `scope.organizationId`.
 */
export function createFacilityService(db: Db) {
  const reader = createFacilityRepository(db);

  return {
    list(scope: RequestScope, query: FacilityListQuery): Promise<FacilityPage> {
      // TODO(AO-014): restrict non-admins to explicitly granted sites.
      return reader.list(scope.organizationId, query);
    },

    /** Unknown ids and ids owned by other organizations are indistinguishable: 404. */
    async get(scope: RequestScope, id: string): Promise<Facility> {
      const facility = await reader.findById(scope.organizationId, id);
      if (!facility) throw errors.notFound('Facility');
      return facility;
    },

    async create(scope: RequestScope, input: CreateFacilityInput): Promise<Facility> {
      try {
        return await withTransaction(db, async (tx) => {
          const facility = await createFacilityRepository(tx).insert(
            scope.organizationId,
            input,
            scope.actorUserId,
          );
          await recordAudit(tx, {
            organizationId: scope.organizationId,
            actorUserId: scope.actorUserId,
            action: 'facility.created',
            entityType: 'facility',
            entityId: facility.id,
            metadata: { after: { code: facility.code, name: facility.name } },
            requestId: scope.requestId,
          });
          return facility;
        });
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw errors.conflict(`Facility code ${input.code} is already in use`);
        }
        throw error;
      }
    },
  };
}

export type FacilityService = ReturnType<typeof createFacilityService>;
