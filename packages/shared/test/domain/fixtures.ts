import { transition } from '../../src/domain/work-orders/state-machine.js';
import type {
  Actor,
  TransitionContext,
  TransitionRequest,
  WorkOrderState,
} from '../../src/domain/work-orders/types.js';

export const REQUESTER: Actor = { userId: 'u-requester', role: 'REQUESTER' };
export const MANAGER: Actor = { userId: 'u-manager', role: 'FACILITY_MANAGER' };
export const ADMIN: Actor = { userId: 'u-admin', role: 'ORG_ADMIN' };
export const TECH: Actor = { userId: 'u-tech', role: 'TECHNICIAN' };
export const OTHER_TECH: Actor = { userId: 'u-tech-2', role: 'TECHNICIAN' };

export const T0 = new Date('2026-11-20T08:00:00.000Z');
export const T1 = new Date('2026-11-20T09:00:00.000Z');

export function order(overrides: Partial<WorkOrderState> = {}): WorkOrderState {
  return {
    id: 'wo-1',
    status: 'OPEN',
    requesterId: REQUESTER.userId,
    assigneeId: null,
    resolution: null,
    checklist: [],
    assignedAt: null,
    firstRespondedAt: null,
    completedAt: null,
    closedAt: null,
    cancelledAt: null,
    cancelReason: null,
    version: 1,
    ...overrides,
  };
}

export const IN_PROGRESS_ORDER = order({
  status: 'IN_PROGRESS',
  assigneeId: TECH.userId,
  assignedAt: T0,
  firstRespondedAt: T0,
});

export const MANAGER_POLICY: TransitionContext = {
  closurePolicy: 'MANAGER_VERIFICATION',
  approvalDecision: null,
};

export const REQUESTER_POLICY: TransitionContext = {
  ...MANAGER_POLICY,
  closurePolicy: 'REQUESTER_ACCEPTANCE',
};

export function req(
  overrides: Partial<TransitionRequest> & Pick<TransitionRequest, 'to'>,
): TransitionRequest {
  return { actor: MANAGER, at: T1, ...overrides };
}

/** Error code of a transition attempt, or null when it succeeds. */
export function errorCode(
  o: WorkOrderState,
  r: TransitionRequest,
  ctx: TransitionContext = MANAGER_POLICY,
): string | null {
  const result = transition(o, r, ctx);
  return result.ok ? null : result.error.code;
}
