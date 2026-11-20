import type { CreateFacilityInput, Facility, FacilityListQuery } from '@assetops/shared';
import type { Queryable } from '../../db/pool.js';

interface FacilityRow {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  address: string;
  timezone: string;
  archived_at: Date | null;
  created_at: Date;
  updated_at: Date;
  version: number;
}

const COLUMNS = `id, organization_id, code, name, address, timezone, archived_at,
                 created_at, updated_at, version`;

function toFacility(row: FacilityRow): Facility {
  return {
    id: row.id,
    organizationId: row.organization_id,
    code: row.code,
    name: row.name,
    address: row.address,
    timezone: row.timezone,
    active: row.archived_at === null,
    archivedAt: row.archived_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    version: row.version,
  };
}

/** Escape LIKE wildcards so user search text is matched literally. */
export function toLikePattern(text: string): string {
  return `%${text.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

export interface FacilityPage {
  readonly items: readonly Facility[];
  readonly total: number;
}

/** Every statement filters by organization_id (ADR-0003). */
export function createFacilityRepository(db: Queryable) {
  return {
    async list(organizationId: string, query: FacilityListQuery): Promise<FacilityPage> {
      const pattern = query.q ? toLikePattern(query.q) : null;
      const where = `organization_id = $1
        AND ($2::boolean OR archived_at IS NULL)
        AND ($3::text IS NULL OR code ILIKE $3 OR name ILIKE $3)`;
      const params = [organizationId, query.includeArchived, pattern];
      const [rows, count] = await Promise.all([
        db.query<FacilityRow>(
          `SELECT ${COLUMNS} FROM facilities WHERE ${where}
            ORDER BY name, id LIMIT $4 OFFSET $5`,
          [...params, query.limit, (query.page - 1) * query.limit],
        ),
        db.query<{ total: number }>(
          `SELECT count(*)::int AS total FROM facilities WHERE ${where}`,
          params,
        ),
      ]);
      return { items: rows.rows.map(toFacility), total: count.rows[0]?.total ?? 0 };
    },

    async findById(organizationId: string, id: string): Promise<Facility | null> {
      const { rows } = await db.query<FacilityRow>(
        `SELECT ${COLUMNS} FROM facilities WHERE organization_id = $1 AND id = $2`,
        [organizationId, id],
      );
      return rows[0] ? toFacility(rows[0]) : null;
    },

    async insert(
      organizationId: string,
      input: CreateFacilityInput,
      createdBy: string,
    ): Promise<Facility> {
      const { rows } = await db.query<FacilityRow>(
        `INSERT INTO facilities (organization_id, code, name, address, timezone, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING ${COLUMNS}`,
        [organizationId, input.code, input.name, input.address, input.timezone, createdBy],
      );
      return toFacility(rows[0]!);
    },
  };
}

export type FacilityRepository = ReturnType<typeof createFacilityRepository>;
