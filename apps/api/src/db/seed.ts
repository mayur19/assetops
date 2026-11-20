import type { Logger } from 'pino';
import type { PoolClient } from 'pg';
import { hashPassword } from '../security/password.js';
import { withTransaction, type Db } from './pool.js';
import { DEMO_FACILITIES, DEMO_ORGS, DEMO_USERS } from './seed-data.js';

/**
 * DEVELOPMENT-ONLY seed data. Credentials are public, documented in README,
 * and must never exist in a production database. The seed refuses to run
 * when NODE_ENV=production and is idempotent (safe to re-run).
 *
 * TODO(AO-009): load the full PRD §8 dataset (areas, 120 assets, 6 technicians,
 * 45 work orders, parts, schedules, breached SLAs and the named scenarios).
 */
export const DEMO_PASSWORD = 'DemoPassword!2026';

async function upsertOrganizations(tx: PoolClient): Promise<ReadonlyMap<string, string>> {
  const entries: [string, string][] = [];
  for (const org of DEMO_ORGS) {
    const { rows } = await tx.query<{ id: string }>(
      `INSERT INTO organizations (slug, name) VALUES ($1, $2)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [org.slug, org.name],
    );
    entries.push([org.slug, rows[0]!.id]);
  }
  return new Map(entries);
}

async function upsertUsers(
  tx: PoolClient,
  orgIds: ReadonlyMap<string, string>,
  passwordHash: string,
): Promise<void> {
  for (const user of DEMO_USERS) {
    await tx.query(
      `INSERT INTO users (organization_id, email, display_name, role, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE
         SET display_name = EXCLUDED.display_name, role = EXCLUDED.role,
             password_hash = EXCLUDED.password_hash`,
      [orgIds.get(user.org), user.email, user.displayName, user.role, passwordHash],
    );
  }
}

async function upsertFacilities(tx: PoolClient, orgIds: ReadonlyMap<string, string>) {
  for (const facility of DEMO_FACILITIES) {
    await tx.query(
      `INSERT INTO facilities (organization_id, code, name, address, timezone)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (organization_id, code) DO UPDATE
         SET name = EXCLUDED.name, address = EXCLUDED.address, timezone = EXCLUDED.timezone`,
      [orgIds.get(facility.org), facility.code, facility.name, facility.address, facility.timezone],
    );
  }
}

export async function seed(db: Db, logger: Logger): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed demo data when NODE_ENV=production');
  }
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  await withTransaction(db, async (tx) => {
    const orgIds = await upsertOrganizations(tx);
    await upsertUsers(tx, orgIds, passwordHash);
    await upsertFacilities(tx, orgIds);
  });
  logger.info(
    { users: DEMO_USERS.length, facilities: DEMO_FACILITIES.length },
    'demo seed applied',
  );
}
