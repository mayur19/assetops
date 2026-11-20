import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { runMigrations } from '../src/db/migrate.js';
import { createPool, type Db } from '../src/db/pool.js';
import { DEMO_PASSWORD, seed } from '../src/db/seed.js';
import { loginAs, silentLogger, testEnv, TEST_ORIGIN } from './helpers.js';

/** Facilities vertical slice against real PostgreSQL (FR-01, A-02). */
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('integration: facilities', () => {
  let db: Db;
  const agentFor = async (email: string) => {
    const agent = request.agent(
      createApp({ env: testEnv(), logger: silentLogger, db, version: 'test' }),
    );
    const csrf = await loginAs(agent, email, DEMO_PASSWORD);
    return { agent, csrf };
  };

  beforeAll(async () => {
    db = createPool({ DATABASE_URL: url!, DATABASE_POOL_MAX: 4 });
    await db.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    await runMigrations(db, silentLogger);
    await seed(db, silentLogger);
  });

  afterAll(async () => {
    await db?.end();
  });

  it('lists only the caller organization’s facilities with page metadata', async () => {
    const { agent } = await agentFor('requester@riverside.example');
    const res = await agent.get('/api/v1/facilities?limit=1');
    expect(res.status).toBe(200);
    expect(res.body.meta).toEqual({ total: 2, page: 1, limit: 1 });
    expect(res.body.data).toHaveLength(1);
    const all = await agent.get('/api/v1/facilities');
    expect(all.body.data.map((f: { code: string }) => f.code).sort()).toEqual([
      'RIV-HTL',
      'RIV-INN',
    ]);
  });

  it('searches by code or name, treating wildcards literally', async () => {
    const { agent } = await agentFor('tech@riverside.example');
    const byName = await agent.get('/api/v1/facilities').query({ q: 'harbour' });
    expect(byName.body.data.map((f: { code: string }) => f.code)).toEqual(['RIV-INN']);
    const wildcard = await agent.get('/api/v1/facilities').query({ q: '%' });
    expect(wildcard.body.meta.total).toBe(0);
  });

  it('creates a facility as a manager, audits it in the same transaction, and reads it back', async () => {
    const { agent, csrf } = await agentFor('manager@riverside.example');
    const created = await agent
      .post('/api/v1/facilities')
      .set('Origin', TEST_ORIGIN)
      .set('X-CSRF-Token', csrf)
      .send({ code: 'riv-spa', name: 'Riverside Day Spa', timezone: 'America/Chicago' });
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({ code: 'RIV-SPA', active: true, version: 1 });

    const id: string = created.body.data.id;
    const fetched = await agent.get(`/api/v1/facilities/${id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.data.name).toBe('Riverside Day Spa');

    const audit = await db.query(
      "SELECT action, metadata FROM audit_events WHERE entity_type = 'facility' AND entity_id = $1",
      [id],
    );
    expect(audit.rows).toEqual([
      {
        action: 'facility.created',
        metadata: { after: { code: 'RIV-SPA', name: 'Riverside Day Spa' } },
      },
    ]);
  });

  it('rejects duplicate codes within an organization with 409', async () => {
    const { agent, csrf } = await agentFor('admin@riverside.example');
    const res = await agent
      .post('/api/v1/facilities')
      .set('Origin', TEST_ORIGIN)
      .set('X-CSRF-Token', csrf)
      .send({ code: 'RIV-HTL', name: 'Duplicate', timezone: 'America/Chicago' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('allows the same code in a different organization', async () => {
    const { agent, csrf } = await agentFor('admin@northline.example');
    const res = await agent
      .post('/api/v1/facilities')
      .set('Origin', TEST_ORIGIN)
      .set('X-CSRF-Token', csrf)
      .send({ code: 'RIV-HTL', name: 'Northline Riverside Annex', timezone: 'America/Denver' });
    expect(res.status).toBe(201);
  });

  it('validates the payload with field-level details', async () => {
    const { agent, csrf } = await agentFor('manager@riverside.example');
    const res = await agent
      .post('/api/v1/facilities')
      .set('Origin', TEST_ORIGIN)
      .set('X-CSRF-Token', csrf)
      .send({ code: 'x', name: '', timezone: 'Mars/Base' });
    expect(res.status).toBe(422);
    const paths = res.body.error.details.map((d: { path: string }) => d.path).sort();
    expect(paths).toEqual(['code', 'name', 'timezone']);
  });

  it.each(['tech@riverside.example', 'requester@riverside.example'])(
    'forbids %s from creating facilities (403)',
    async (email) => {
      const { agent, csrf } = await agentFor(email);
      const res = await agent
        .post('/api/v1/facilities')
        .set('Origin', TEST_ORIGIN)
        .set('X-CSRF-Token', csrf)
        .send({ code: 'RIV-NEW', name: 'Nope', timezone: 'America/Chicago' });
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    },
  );

  it('isolates tenants: Northline cannot read a Riverside facility (404)', async () => {
    const { rows } = await db.query<{ id: string }>(
      "SELECT id FROM facilities WHERE code = 'RIV-HTL' AND organization_id = (SELECT id FROM organizations WHERE slug = 'riverside-hospitality')",
    );
    const riversideId = rows[0]!.id;
    const { agent } = await agentFor('admin@northline.example');
    const res = await agent.get(`/api/v1/facilities/${riversideId}`);
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false, data: null, error: { code: 'NOT_FOUND' } });
    const list = await agent.get('/api/v1/facilities');
    expect(list.body.data.some((f: { id: string }) => f.id === riversideId)).toBe(false);
  });

  it('answers 404 for malformed ids instead of leaking validation detail', async () => {
    const { agent } = await agentFor('manager@riverside.example');
    expect((await agent.get('/api/v1/facilities/not-a-uuid')).status).toBe(404);
  });

  it('requires authentication', async () => {
    const res = await request(
      createApp({ env: testEnv(), logger: silentLogger, db, version: 'test' }),
    ).get('/api/v1/facilities');
    expect(res.status).toBe(401);
  });

  it('returns 501 with the ticket for a pending route behind a real session', async () => {
    const { agent } = await agentFor('manager@riverside.example');
    const res = await agent.get('/api/v1/work-orders');
    expect(res.status).toBe(501);
    expect(res.body.error.details).toEqual({ ticket: 'AO-023' });
  });

  it('enforces the users.role CHECK constraint', async () => {
    await expect(
      db.query("UPDATE users SET role = 'SUPERUSER' WHERE email = 'tech@riverside.example'"),
    ).rejects.toThrow(/users_role_check/);
  });
});
