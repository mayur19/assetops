import { describe, expect, it } from 'vitest';
import { transition } from '../../src/domain/work-orders/state-machine.js';
import type { WorkOrderState } from '../../src/domain/work-orders/types.js';
import {
  ADMIN,
  errorCode,
  IN_PROGRESS_ORDER,
  MANAGER,
  MANAGER_POLICY,
  REQUESTER,
  REQUESTER_POLICY,
  req,
  T0,
  T1,
  TECH,
  order,
} from './fixtures.js';

/** Closure (no self-approval, per-organization policy) and cancellation rules (FR-03). */
describe('closure', () => {
  const completed: WorkOrderState = {
    ...IN_PROGRESS_ORDER,
    status: 'COMPLETED',
    resolution: 'Fixed',
    completedAt: T0,
  };

  describe('MANAGER_VERIFICATION policy', () => {
    it.each([MANAGER, ADMIN])('%o can close', (actor) => {
      const result = transition(completed, req({ to: 'CLOSED', actor }), MANAGER_POLICY);
      expect(result.ok && result.value.order.closedAt).toEqual(T1);
    });

    it.each([TECH, REQUESTER])('%o cannot close', (actor) => {
      expect(errorCode(completed, req({ to: 'CLOSED', actor }))).toBe('ROLE_NOT_PERMITTED');
    });

    it('a manager who did the work cannot verify it (no self-approval)', () => {
      const selfDone = { ...completed, assigneeId: MANAGER.userId };
      expect(errorCode(selfDone, req({ to: 'CLOSED', actor: MANAGER }))).toBe('SELF_APPROVAL');
    });
  });

  describe('REQUESTER_ACCEPTANCE policy', () => {
    it('the original requester can accept', () => {
      expect(
        errorCode(completed, req({ to: 'CLOSED', actor: REQUESTER }), REQUESTER_POLICY),
      ).toBeNull();
    });

    it('an org admin can accept on the requester’s behalf', () => {
      expect(
        errorCode(completed, req({ to: 'CLOSED', actor: ADMIN }), REQUESTER_POLICY),
      ).toBeNull();
    });

    it.each([MANAGER, TECH, { userId: 'u-other', role: 'REQUESTER' as const }])(
      '%o cannot accept',
      (actor) => {
        expect(errorCode(completed, req({ to: 'CLOSED', actor }), REQUESTER_POLICY)).toBe(
          'ROLE_NOT_PERMITTED',
        );
      },
    );

    it('a technician who requested and performed the job cannot accept it', () => {
      const own = { ...completed, requesterId: TECH.userId };
      expect(errorCode(own, req({ to: 'CLOSED', actor: TECH }), REQUESTER_POLICY)).toBe(
        'SELF_APPROVAL',
      );
    });
  });
});

describe('cancellation', () => {
  it('requires a reason', () => {
    expect(errorCode(order(), req({ to: 'CANCELLED' }))).toBe('REASON_REQUIRED');
    expect(errorCode(order(), req({ to: 'CANCELLED', reason: ' ' }))).toBe('REASON_REQUIRED');
  });

  it('managers can cancel from any active status', () => {
    for (const status of ['OPEN', 'TRIAGED', 'ASSIGNED', 'AWAITING_PARTS'] as const) {
      const result = transition(
        order({ status }),
        req({ to: 'CANCELLED', reason: 'Duplicate' }),
        MANAGER_POLICY,
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.order).toMatchObject({ cancelledAt: T1, cancelReason: 'Duplicate' });
      }
    }
  });

  it('a requester can withdraw their own OPEN request', () => {
    expect(
      errorCode(order(), req({ to: 'CANCELLED', actor: REQUESTER, reason: 'Fixed itself' })),
    ).toBeNull();
  });

  it('a requester cannot cancel once triaged, nor cancel others’ requests', () => {
    expect(
      errorCode(
        order({ status: 'TRIAGED' }),
        req({ to: 'CANCELLED', actor: REQUESTER, reason: 'x' }),
      ),
    ).toBe('ROLE_NOT_PERMITTED');
    expect(
      errorCode(
        order({ requesterId: 'someone' }),
        req({ to: 'CANCELLED', actor: REQUESTER, reason: 'x' }),
      ),
    ).toBe('ROLE_NOT_PERMITTED');
  });

  it('technicians cannot cancel', () => {
    expect(errorCode(IN_PROGRESS_ORDER, req({ to: 'CANCELLED', actor: TECH, reason: 'x' }))).toBe(
      'ROLE_NOT_PERMITTED',
    );
  });
});
