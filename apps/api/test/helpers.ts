import pino from 'pino';
import type { Env } from '../src/config/env.js';
import { loadEnv } from '../src/config/env.js';

export const silentLogger = pino({ level: 'silent' });

export const TEST_ORIGIN = 'http://localhost:5171';

export function testEnv(overrides: Partial<Record<keyof Env, string>> = {}): Env {
  return loadEnv({
    NODE_ENV: 'test',
    APP_ORIGIN: TEST_ORIGIN,
    DATABASE_URL: process.env.TEST_DATABASE_URL ?? 'postgres://localhost:5432/unused',
    SESSION_SECRET: 'test-secret-test-secret-test-secret-0123',
    LOG_LEVEL: 'silent',
    RATE_LIMIT_MAX: '10000',
    AUTH_RATE_LIMIT_MAX: '10000',
    ...overrides,
  });
}

/** Log a supertest agent in and return the CSRF token for unsafe requests. */
export async function loginAs(
  agent: { post: (url: string) => import('supertest').Test },
  email: string,
  password: string,
): Promise<string> {
  const res = await agent
    .post('/api/v1/auth/login')
    .set('Origin', TEST_ORIGIN)
    .send({ email, password });
  if (res.status !== 200) throw new Error(`login failed for ${email}: ${res.status}`);
  return res.body.data.csrfToken as string;
}
