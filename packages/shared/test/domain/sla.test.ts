import { describe, expect, it } from 'vitest';
import {
  computeSlaDueDates,
  evaluateSla,
  resolveSlaTarget,
} from '../../src/domain/sla/sla-calculator.js';
import { pendingEscalations } from '../../src/domain/sla/escalation.js';
import type { SlaPolicy, SlaTimestamps } from '../../src/domain/sla/types.js';

const REPORTED = new Date('2026-11-20T08:00:00.000Z');
const at = (minutes: number) => new Date(REPORTED.getTime() + minutes * 60_000);

const POLICIES: readonly SlaPolicy[] = [
  { priority: 'CRITICAL', facilityId: null, responseMinutes: 30, resolutionMinutes: 240 },
  { priority: 'HIGH', facilityId: null, responseMinutes: 60, resolutionMinutes: 480 },
  { priority: 'HIGH', facilityId: 'site-a', responseMinutes: 15, resolutionMinutes: 120 },
  { priority: 'LOW', facilityId: 'site-a', responseMinutes: 240, resolutionMinutes: 4320 },
];

const DUE = { responseDueAt: at(60), resolveDueAt: at(480) };

function timestamps(overrides: Partial<SlaTimestamps> = {}): SlaTimestamps {
  return {
    reportedAt: REPORTED,
    firstRespondedAt: null,
    completedAt: null,
    cancelledAt: null,
    ...overrides,
  };
}

describe('resolveSlaTarget', () => {
  it('prefers a site-specific policy over the organization default', () => {
    expect(resolveSlaTarget(POLICIES, 'HIGH', 'site-a')).toEqual({
      ok: true,
      value: { responseMinutes: 15, resolutionMinutes: 120 },
    });
  });

  it('falls back to the organization default for other sites', () => {
    expect(resolveSlaTarget(POLICIES, 'HIGH', 'site-b')).toEqual({
      ok: true,
      value: { responseMinutes: 60, resolutionMinutes: 480 },
    });
    expect(resolveSlaTarget(POLICIES, 'CRITICAL', null)).toMatchObject({ ok: true });
  });

  it('does not apply another site’s policy as a default', () => {
    expect(resolveSlaTarget(POLICIES, 'LOW', 'site-b')).toMatchObject({
      ok: false,
      error: { code: 'POLICY_NOT_FOUND', details: { priority: 'LOW', facilityId: 'site-b' } },
    });
  });

  it('reports a missing policy', () => {
    expect(resolveSlaTarget(POLICIES, 'MEDIUM', null)).toMatchObject({
      ok: false,
      error: { code: 'POLICY_NOT_FOUND' },
    });
  });
});

describe('computeSlaDueDates', () => {
  it('adds elapsed clock minutes to reported_at (no business hours)', () => {
    const result = computeSlaDueDates(new Date('2026-11-21T23:30:00.000Z'), {
      responseMinutes: 60,
      resolutionMinutes: 24 * 60,
    });
    expect(result).toEqual({
      ok: true,
      value: {
        responseDueAt: new Date('2026-11-22T00:30:00.000Z'),
        resolveDueAt: new Date('2026-11-22T23:30:00.000Z'),
      },
    });
  });

  it.each([
    [{ responseMinutes: 0, resolutionMinutes: 10 }],
    [{ responseMinutes: 10, resolutionMinutes: -1 }],
    [{ responseMinutes: 1.5, resolutionMinutes: 10 }],
    [{ responseMinutes: 30, resolutionMinutes: 20 }],
  ])('rejects invalid targets %j', (target) => {
    expect(computeSlaDueDates(REPORTED, target)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_TARGET' },
    });
  });

  it('rejects an invalid reported_at', () => {
    expect(
      computeSlaDueDates(new Date('nope'), { responseMinutes: 1, resolutionMinutes: 2 }),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_TIMESTAMP' } });
  });
});

describe('evaluateSla: response clock', () => {
  it('is PENDING early in the budget', () => {
    const result = evaluateSla(timestamps(), DUE, at(10));
    expect(result.response).toEqual({
      state: 'PENDING',
      dueAt: at(60),
      stoppedAt: null,
      consumedBp: 1666,
      remainingMs: 50 * 60_000,
    });
  });

  it('is AT_RISK once 80% of the budget is consumed', () => {
    expect(evaluateSla(timestamps(), DUE, at(47)).response.state).toBe('PENDING');
    expect(evaluateSla(timestamps(), DUE, at(48)).response.state).toBe('AT_RISK');
  });

  it('is not breached exactly at the due time, only after it', () => {
    expect(evaluateSla(timestamps(), DUE, at(60)).response.state).toBe('AT_RISK');
    const late = evaluateSla(timestamps(), DUE, new Date(at(60).getTime() + 1));
    expect(late.response.state).toBe('BREACHED');
    expect(late.response.remainingMs).toBe(-1);
  });

  it('stops at the first accepted technician action', () => {
    const met = evaluateSla(timestamps({ firstRespondedAt: at(60) }), DUE, at(500));
    expect(met.response).toMatchObject({
      state: 'MET',
      stoppedAt: at(60),
      consumedBp: 10000,
      remainingMs: 0,
    });
    const breached = evaluateSla(timestamps({ firstRespondedAt: at(61) }), DUE, at(62));
    expect(breached.response.state).toBe('BREACHED');
  });

  it('clamps elapsed time to zero when now precedes reported_at', () => {
    expect(evaluateSla(timestamps(), DUE, at(-5)).response).toMatchObject({
      state: 'PENDING',
      consumedBp: 0,
    });
  });

  it('honours a custom at-risk threshold', () => {
    expect(evaluateSla(timestamps(), DUE, at(30), { atRiskBp: 5000 }).response.state).toBe(
      'AT_RISK',
    );
  });

  it.each([0, 10000, 1.5])('rejects an out-of-range at-risk threshold (%d)', (atRiskBp) => {
    expect(() => evaluateSla(timestamps(), DUE, at(1), { atRiskBp })).toThrow(RangeError);
  });
});

describe('evaluateSla: resolution clock', () => {
  it('stops at COMPLETED, not at closure', () => {
    const result = evaluateSla(
      timestamps({ firstRespondedAt: at(5), completedAt: at(300) }),
      DUE,
      at(10_000),
    );
    expect(result.resolution).toMatchObject({ state: 'MET', stoppedAt: at(300), consumedBp: 6250 });
  });

  it('breaches when completed after the due time', () => {
    const result = evaluateSla(timestamps({ completedAt: at(481) }), DUE, at(481));
    expect(result.resolution.state).toBe('BREACHED');
  });

  it('is BREACHED while still open after the due time', () => {
    expect(
      evaluateSla(timestamps({ firstRespondedAt: at(1) }), DUE, at(600)).resolution.state,
    ).toBe('BREACHED');
  });

  it('is NOT_APPLICABLE once cancelled before stopping', () => {
    const result = evaluateSla(timestamps({ cancelledAt: at(30) }), DUE, at(900));
    expect(result.response).toMatchObject({ state: 'NOT_APPLICABLE', remainingMs: 30 * 60_000 });
    expect(result.resolution.state).toBe('NOT_APPLICABLE');
  });

  it('keeps a response result that was reached before cancellation', () => {
    const result = evaluateSla(
      timestamps({ firstRespondedAt: at(5), cancelledAt: at(30) }),
      DUE,
      at(900),
    );
    expect(result.response.state).toBe('MET');
    expect(result.resolution.state).toBe('NOT_APPLICABLE');
  });

  it('rejects due dates that are not after reported_at', () => {
    expect(() =>
      evaluateSla(timestamps(), { responseDueAt: REPORTED, resolveDueAt: at(1) }, at(1)),
    ).toThrow(RangeError);
  });
});

describe('pendingEscalations', () => {
  const evaluate = (minutes: number, firstRespondedAt: Date | null = null) =>
    evaluateSla(timestamps({ firstRespondedAt }), DUE, at(minutes));

  it('emits nothing while both clocks are healthy', () => {
    expect(pendingEscalations('wo-1', evaluate(10), new Set())).toEqual([]);
  });

  it('emits an at-risk alert at 80% of the response budget', () => {
    expect(pendingEscalations('wo-1', evaluate(50), new Set())).toEqual([
      {
        workOrderId: 'wo-1',
        clock: 'RESPONSE',
        level: 'AT_RISK',
        dedupeKey: 'wo-1:RESPONSE:AT_RISK',
      },
    ]);
  });

  it('emits breach alerts per clock', () => {
    const keys = pendingEscalations('wo-1', evaluate(481), new Set()).map((e) => e.dedupeKey);
    expect(keys).toEqual(['wo-1:RESPONSE:BREACHED', 'wo-1:RESOLUTION:BREACHED']);
  });

  it('deduplicates alerts that were already sent (A-10)', () => {
    const sent = new Set(['wo-1:RESPONSE:BREACHED']);
    expect(pendingEscalations('wo-1', evaluate(481), sent).map((e) => e.dedupeKey)).toEqual([
      'wo-1:RESOLUTION:BREACHED',
    ]);
  });

  it('does not escalate a clock that already stopped late', () => {
    const lateResponse = evaluateSla(timestamps({ firstRespondedAt: at(70) }), DUE, at(80));
    expect(lateResponse.response.state).toBe('BREACHED');
    expect(pendingEscalations('wo-1', lateResponse, new Set())).toEqual([]);
  });

  it('emits nothing for met or cancelled clocks', () => {
    expect(pendingEscalations('wo-1', evaluate(100, at(5)), new Set())).toEqual([]);
    const cancelled = evaluateSla(timestamps({ cancelledAt: at(1) }), DUE, at(900));
    expect(pendingEscalations('wo-1', cancelled, new Set())).toEqual([]);
  });
});
