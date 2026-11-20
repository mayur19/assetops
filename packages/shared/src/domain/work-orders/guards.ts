import { isManagerRole } from '../../roles.js';
import type {
  TransitionContext,
  TransitionError,
  TransitionErrorCode,
  TransitionRequest,
  WorkOrderState,
} from './types.js';

export interface GuardInput {
  readonly order: WorkOrderState;
  readonly request: TransitionRequest;
  readonly context: TransitionContext;
}

/** A guard returns null when the transition may proceed, or the reason it may not. */
export type Guard = (input: GuardInput) => TransitionError | null;

function error(code: TransitionErrorCode, message: string, details?: Record<string, unknown>) {
  return details ? { code, message, details } : { code, message };
}

function isBlank(value: string | null | undefined): boolean {
  return value === undefined || value === null || value.trim().length === 0;
}

/** Run guards in order and return the first failure. */
export function all(...guards: readonly Guard[]): Guard {
  return (input) => {
    for (const guard of guards) {
      const failure = guard(input);
      if (failure) return failure;
    }
    return null;
  };
}

export const managerOnly: Guard = ({ request }) =>
  isManagerRole(request.actor.role)
    ? null
    : error('ROLE_NOT_PERMITTED', 'Only organization admins and facility managers may do this');

export const assigneeOnly: Guard = ({ order, request }) =>
  order.assigneeId !== null && order.assigneeId === request.actor.userId
    ? null
    : error('NOT_ASSIGNEE', 'Only the assigned technician may do this');

export const assigneeOrManager: Guard = (input) =>
  isManagerRole(input.request.actor.role) ? null : assigneeOnly(input);

export const requireAssignee: Guard = ({ request }) =>
  isBlank(request.assigneeId)
    ? error('ASSIGNEE_REQUIRED', 'An assignee is required to assign a work order')
    : null;

export const requireReason: Guard = ({ request }) =>
  isBlank(request.reason) ? error('REASON_REQUIRED', 'A cancellation reason is required') : null;

export const requireResolution: Guard = ({ order, request }) =>
  isBlank(request.resolution ?? order.resolution)
    ? error('RESOLUTION_REQUIRED', 'A resolution note is required to complete a work order')
    : null;

export const requireChecklistComplete: Guard = ({ order }) => {
  const missingItemIds = order.checklist
    .filter((item) => item.required && item.completedAt === null)
    .map((item) => item.id);
  return missingItemIds.length === 0
    ? null
    : error('CHECKLIST_INCOMPLETE', 'All required checklist items must be completed', {
        missingItemIds,
      });
};

export const requireApprovalDecision: Guard = ({ context }) =>
  context.approvalDecision === null
    ? error('APPROVAL_REQUIRED', 'Work is blocked until the approval request is decided')
    : null;

/** Nobody may verify or accept work they performed themselves (FR-03, PRD §3). */
export const notAssignee: Guard = ({ order, request }) =>
  order.assigneeId === request.actor.userId
    ? error('SELF_APPROVAL', 'You cannot verify or accept work you performed')
    : null;

export const closureAuthority: Guard = ({ order, request, context }) => {
  if (context.closurePolicy === 'MANAGER_VERIFICATION') {
    return managerOnly({ order, request, context });
  }
  const { actor } = request;
  return actor.userId === order.requesterId || actor.role === 'ORG_ADMIN'
    ? null
    : error('ROLE_NOT_PERMITTED', 'Only the requester (or an org admin) may accept this work');
};

/** Managers cancel anything active; requesters may withdraw their own OPEN request. */
export const cancelAuthority: Guard = ({ order, request }) => {
  const { actor } = request;
  if (isManagerRole(actor.role)) return null;
  const ownOpenRequest = order.status === 'OPEN' && actor.userId === order.requesterId;
  return ownOpenRequest
    ? null
    : error('ROLE_NOT_PERMITTED', 'You are not allowed to cancel this work order');
};
