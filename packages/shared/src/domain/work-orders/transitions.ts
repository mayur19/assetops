import {
  all,
  assigneeOnly,
  assigneeOrManager,
  cancelAuthority,
  closureAuthority,
  managerOnly,
  notAssignee,
  requireApprovalDecision,
  requireAssignee,
  requireChecklistComplete,
  requireReason,
  requireResolution,
  type Guard,
} from './guards.js';
import type { TransitionRequest, WorkOrderState, WorkOrderStatus } from './types.js';

/** Field changes applied when a transition succeeds (status/version handled centrally). */
export type Effect = (order: WorkOrderState, request: TransitionRequest) => Partial<WorkOrderState>;

export interface TransitionRule {
  readonly guard: Guard;
  readonly effect: Effect;
}

// Effects run only after their guard passed, so required fields are present.
const noEffect: Effect = () => ({});

const cancel: TransitionRule = {
  guard: all(cancelAuthority, requireReason),
  effect: (_order, request) => ({
    cancelledAt: request.at,
    cancelReason: String(request.reason).trim(),
  }),
};

const pause: TransitionRule = { guard: assigneeOrManager, effect: noEffect };

/**
 * The lifecycle graph (ADR-0013). Any edge not listed here is rejected.
 * CLOSED and CANCELLED have no outgoing edges: a reopened order is a new,
 * linked follow-up order (FR-03).
 */
export const TRANSITIONS: Readonly<
  Record<WorkOrderStatus, Partial<Record<WorkOrderStatus, TransitionRule>>>
> = {
  OPEN: {
    TRIAGED: { guard: managerOnly, effect: noEffect },
    CANCELLED: cancel,
  },
  TRIAGED: {
    ASSIGNED: {
      guard: all(managerOnly, requireAssignee),
      effect: (_order, request) => ({
        assigneeId: String(request.assigneeId).trim(),
        assignedAt: request.at,
      }),
    },
    CANCELLED: cancel,
  },
  ASSIGNED: {
    // Response clock stops at the first accepted technician action, not at assignment (FR-05).
    IN_PROGRESS: {
      guard: assigneeOnly,
      effect: (order, request) => ({ firstRespondedAt: order.firstRespondedAt ?? request.at }),
    },
    CANCELLED: cancel,
  },
  IN_PROGRESS: {
    AWAITING_PARTS: pause,
    AWAITING_APPROVAL: pause,
    COMPLETED: {
      guard: all(assigneeOrManager, requireResolution, requireChecklistComplete),
      effect: (order, request) => ({
        completedAt: request.at,
        resolution: String(request.resolution ?? order.resolution).trim(),
      }),
    },
    CANCELLED: cancel,
  },
  AWAITING_PARTS: {
    IN_PROGRESS: { guard: assigneeOrManager, effect: noEffect },
    CANCELLED: cancel,
  },
  AWAITING_APPROVAL: {
    IN_PROGRESS: { guard: all(requireApprovalDecision, assigneeOrManager), effect: noEffect },
    CANCELLED: cancel,
  },
  COMPLETED: {
    CLOSED: {
      guard: all(closureAuthority, notAssignee),
      effect: (_order, request) => ({ closedAt: request.at }),
    },
  },
  CLOSED: {},
  CANCELLED: {},
};
