import { describe, expect, it } from 'vitest';
import {
  allowedTargets,
  canTransition,
  ensureEditable,
  isTerminal,
  transition,
} from '../../src/domain/work-orders/state-machine.js';
import { WORK_ORDER_STATUSES } from '../../src/domain/work-orders/types.js';
import type { WorkOrderState, WorkOrderStatus } from '../../src/domain/work-orders/types.js';
import {
  ADMIN,
  errorCode,
  IN_PROGRESS_ORDER,
  MANAGER,
  MANAGER_POLICY,
  OTHER_TECH,
  REQUESTER,
  req,
  T0,
  T1,
  TECH,
  order,
} from './fixtures.js';

describe('allowedTargets', () => {
  it.each<[WorkOrderStatus, WorkOrderStatus[]]>([
    ['OPEN', ['TRIAGED', 'CANCELLED']],
    ['TRIAGED', ['ASSIGNED', 'CANCELLED']],
    ['ASSIGNED', ['IN_PROGRESS', 'CANCELLED']],
    ['IN_PROGRESS', ['AWAITING_PARTS', 'AWAITING_APPROVAL', 'COMPLETED', 'CANCELLED']],
    ['AWAITING_PARTS', ['IN_PROGRESS', 'CANCELLED']],
    ['AWAITING_APPROVAL', ['IN_PROGRESS', 'CANCELLED']],
    ['COMPLETED', ['CLOSED']],
    ['CLOSED', []],
    ['CANCELLED', []],
  ])('%s -> %j', (from, expected) => {
    expect([...allowedTargets(from)].sort()).toEqual([...expected].sort());
  });

  it('covers every status', () => {
    for (const status of WORK_ORDER_STATUSES) {
      expect(Array.isArray(allowedTargets(status))).toBe(true);
    }
  });
});

describe('isTerminal / ensureEditable', () => {
  it.each(WORK_ORDER_STATUSES)('%s', (status) => {
    const terminal = status === 'CLOSED' || status === 'CANCELLED';
    expect(isTerminal(status)).toBe(terminal);
    const result = ensureEditable(order({ status }));
    expect(result.ok).toBe(!terminal);
    if (!result.ok) expect(result.error.code).toBe('ORDER_LOCKED');
  });
});

describe('graph enforcement', () => {
  it('rejects edges not in the lifecycle', () => {
    expect(errorCode(order(), req({ to: 'IN_PROGRESS' }))).toBe('INVALID_TRANSITION');
    expect(errorCode(order(), req({ to: 'COMPLETED' }))).toBe('INVALID_TRANSITION');
    expect(errorCode(order({ status: 'COMPLETED' }), req({ to: 'CANCELLED', reason: 'x' }))).toBe(
      'INVALID_TRANSITION',
    );
  });

  it('rejects same-status transitions', () => {
    expect(errorCode(order(), req({ to: 'OPEN' }))).toBe('INVALID_TRANSITION');
  });

  it.each<WorkOrderStatus>(['CLOSED', 'CANCELLED'])(
    'locks %s orders against any change',
    (status) => {
      const result = transition(order({ status }), req({ to: 'IN_PROGRESS' }), MANAGER_POLICY);
      expect(result).toMatchObject({ ok: false, error: { code: 'ORDER_LOCKED' } });
    },
  );

  it('includes from/to in the error details', () => {
    const result = transition(order(), req({ to: 'CLOSED' }), MANAGER_POLICY);
    expect(result).toMatchObject({
      ok: false,
      error: { details: { from: 'OPEN', to: 'CLOSED' } },
    });
  });
});

describe('triage and assignment (manager-only)', () => {
  it.each([MANAGER, ADMIN])('%o can triage', (actor) => {
    const result = transition(order(), req({ to: 'TRIAGED', actor }), MANAGER_POLICY);
    expect(result.ok && result.value.order.status).toBe('TRIAGED');
  });

  it.each([TECH, REQUESTER])('%o cannot triage', (actor) => {
    expect(errorCode(order(), req({ to: 'TRIAGED', actor }))).toBe('ROLE_NOT_PERMITTED');
  });

  it('requires an assignee', () => {
    expect(errorCode(order({ status: 'TRIAGED' }), req({ to: 'ASSIGNED' }))).toBe(
      'ASSIGNEE_REQUIRED',
    );
    expect(errorCode(order({ status: 'TRIAGED' }), req({ to: 'ASSIGNED', assigneeId: '  ' }))).toBe(
      'ASSIGNEE_REQUIRED',
    );
  });

  it('records assignee and assignment time without starting the response clock', () => {
    const result = transition(
      order({ status: 'TRIAGED' }),
      req({ to: 'ASSIGNED', assigneeId: TECH.userId }),
      MANAGER_POLICY,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.order).toMatchObject({
      status: 'ASSIGNED',
      assigneeId: TECH.userId,
      assignedAt: T1,
      firstRespondedAt: null,
    });
  });

  it('technicians cannot assign', () => {
    expect(
      errorCode(
        order({ status: 'TRIAGED' }),
        req({ to: 'ASSIGNED', actor: TECH, assigneeId: 'x' }),
      ),
    ).toBe('ROLE_NOT_PERMITTED');
  });
});

describe('starting work (first accepted technician action)', () => {
  const assigned = order({ status: 'ASSIGNED', assigneeId: TECH.userId, assignedAt: T0 });

  it('only the assignee can start and that sets firstRespondedAt', () => {
    const result = transition(assigned, req({ to: 'IN_PROGRESS', actor: TECH }), MANAGER_POLICY);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.order.firstRespondedAt).toEqual(T1);
  });

  it.each([OTHER_TECH, MANAGER, REQUESTER])('%o cannot start someone else’s job', (actor) => {
    expect(errorCode(assigned, req({ to: 'IN_PROGRESS', actor }))).toBe('NOT_ASSIGNEE');
  });

  it('keeps the original firstRespondedAt when resuming', () => {
    const paused = { ...IN_PROGRESS_ORDER, status: 'AWAITING_PARTS' as const };
    const result = transition(paused, req({ to: 'IN_PROGRESS', actor: TECH }), MANAGER_POLICY);
    expect(result.ok && result.value.order.firstRespondedAt).toEqual(T0);
  });
});

describe('waiting states', () => {
  it.each<WorkOrderStatus>(['AWAITING_PARTS', 'AWAITING_APPROVAL'])(
    'assignee or manager can move IN_PROGRESS -> %s',
    (to) => {
      expect(errorCode(IN_PROGRESS_ORDER, req({ to, actor: TECH }))).toBeNull();
      expect(errorCode(IN_PROGRESS_ORDER, req({ to, actor: MANAGER }))).toBeNull();
      expect(errorCode(IN_PROGRESS_ORDER, req({ to, actor: OTHER_TECH }))).toBe('NOT_ASSIGNEE');
      expect(errorCode(IN_PROGRESS_ORDER, req({ to, actor: REQUESTER }))).toBe('NOT_ASSIGNEE');
    },
  );

  it('manager can resume from AWAITING_PARTS', () => {
    const paused = { ...IN_PROGRESS_ORDER, status: 'AWAITING_PARTS' as const };
    expect(errorCode(paused, req({ to: 'IN_PROGRESS', actor: ADMIN }))).toBeNull();
  });

  describe('approval gate (A-08)', () => {
    const awaiting = { ...IN_PROGRESS_ORDER, status: 'AWAITING_APPROVAL' as const };

    it('blocks resuming until an approval decision exists', () => {
      expect(errorCode(awaiting, req({ to: 'IN_PROGRESS', actor: TECH }))).toBe(
        'APPROVAL_REQUIRED',
      );
    });

    it.each(['APPROVED', 'REJECTED'] as const)(
      'allows resuming after a %s decision',
      (decision) => {
        const ctx = { ...MANAGER_POLICY, approvalDecision: decision };
        expect(errorCode(awaiting, req({ to: 'IN_PROGRESS', actor: TECH }), ctx)).toBeNull();
      },
    );

    it('still enforces assignee-or-manager after a decision', () => {
      const ctx = { ...MANAGER_POLICY, approvalDecision: 'APPROVED' as const };
      expect(errorCode(awaiting, req({ to: 'IN_PROGRESS', actor: OTHER_TECH }), ctx)).toBe(
        'NOT_ASSIGNEE',
      );
    });
  });
});

describe('completion (A-05)', () => {
  const withChecklist = (completed: boolean[]): WorkOrderState => ({
    ...IN_PROGRESS_ORDER,
    checklist: completed.map((done, i) => ({
      id: `c${i}`,
      label: `Step ${i}`,
      required: i !== 2,
      completedAt: done ? T0 : null,
    })),
  });

  it('rejects completion while a required checklist item is open', () => {
    const result = transition(
      withChecklist([true, false, false]),
      req({ to: 'COMPLETED', actor: TECH, resolution: 'Replaced compressor' }),
      MANAGER_POLICY,
    );
    expect(result).toMatchObject({
      ok: false,
      error: { code: 'CHECKLIST_INCOMPLETE', details: { missingItemIds: ['c1'] } },
    });
  });

  it('ignores optional items that are still open', () => {
    const result = transition(
      withChecklist([true, true, false]),
      req({ to: 'COMPLETED', actor: TECH, resolution: 'Replaced compressor' }),
      MANAGER_POLICY,
    );
    expect(result.ok).toBe(true);
  });

  it.each([undefined, '', '   '])('requires a resolution note (%j)', (resolution) => {
    expect(
      errorCode(
        IN_PROGRESS_ORDER,
        req({ to: 'COMPLETED', actor: TECH, ...(resolution === undefined ? {} : { resolution }) }),
      ),
    ).toBe('RESOLUTION_REQUIRED');
  });

  it('accepts a resolution already stored on the order', () => {
    const o = { ...IN_PROGRESS_ORDER, resolution: 'Reset breaker' };
    const result = transition(o, req({ to: 'COMPLETED', actor: TECH }), MANAGER_POLICY);
    expect(result.ok && result.value.order.resolution).toBe('Reset breaker');
  });

  it('stamps completedAt and trims the resolution', () => {
    const result = transition(
      IN_PROGRESS_ORDER,
      req({ to: 'COMPLETED', actor: TECH, resolution: '  Fixed  ' }),
      MANAGER_POLICY,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.order).toMatchObject({ completedAt: T1, resolution: 'Fixed' });
  });

  it('other technicians cannot complete', () => {
    expect(
      errorCode(IN_PROGRESS_ORDER, req({ to: 'COMPLETED', actor: OTHER_TECH, resolution: 'x' })),
    ).toBe('NOT_ASSIGNEE');
  });
});

describe('immutability and events', () => {
  it('returns a new object, bumps version and leaves the input untouched', () => {
    const original = order();
    const snapshot = structuredClone(original);
    const result = transition(
      original,
      req({ to: 'TRIAGED', note: '  checked  ' }),
      MANAGER_POLICY,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.order).not.toBe(original);
    expect(result.value.order.version).toBe(2);
    expect(original).toEqual(snapshot);
    expect(result.value.event).toEqual({
      workOrderId: 'wo-1',
      fromStatus: 'OPEN',
      toStatus: 'TRIAGED',
      actorId: MANAGER.userId,
      at: T1,
      note: 'checked',
    });
  });

  it('records a null note when none is given', () => {
    const result = transition(order(), req({ to: 'TRIAGED' }), MANAGER_POLICY);
    expect(result.ok && result.value.event.note).toBeNull();
  });

  it('canTransition mirrors transition without producing a new state', () => {
    expect(canTransition(order(), req({ to: 'TRIAGED' }), MANAGER_POLICY)).toEqual({
      ok: true,
      value: undefined,
    });
    expect(
      canTransition(order(), req({ to: 'TRIAGED', actor: TECH }), MANAGER_POLICY),
    ).toMatchObject({
      ok: false,
      error: { code: 'ROLE_NOT_PERMITTED' },
    });
  });
});
