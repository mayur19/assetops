import type { Role } from '../../roles.js';
import type { DomainError } from '../result.js';

/** Work-order lifecycle statuses (PRD FR-03, ADR-0013). */
export const WORK_ORDER_STATUSES = [
  'OPEN',
  'TRIAGED',
  'ASSIGNED',
  'IN_PROGRESS',
  'AWAITING_PARTS',
  'AWAITING_APPROVAL',
  'COMPLETED',
  'CLOSED',
  'CANCELLED',
] as const;

export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number];

export const WORK_ORDER_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export type WorkOrderPriority = (typeof WORK_ORDER_PRIORITIES)[number];

/** Who may close a COMPLETED order; configured per organization (FR-03). */
export const CLOSURE_POLICIES = ['MANAGER_VERIFICATION', 'REQUESTER_ACCEPTANCE'] as const;

export type ClosurePolicy = (typeof CLOSURE_POLICIES)[number];

export type ApprovalDecision = 'APPROVED' | 'REJECTED';

export interface ChecklistItemState {
  readonly id: string;
  readonly label: string;
  readonly required: boolean;
  readonly completedAt: Date | null;
}

/** The subset of a work order the state machine reasons about. */
export interface WorkOrderState {
  readonly id: string;
  readonly status: WorkOrderStatus;
  readonly requesterId: string;
  readonly assigneeId: string | null;
  readonly resolution: string | null;
  readonly checklist: readonly ChecklistItemState[];
  readonly assignedAt: Date | null;
  readonly firstRespondedAt: Date | null;
  readonly completedAt: Date | null;
  readonly closedAt: Date | null;
  readonly cancelledAt: Date | null;
  readonly cancelReason: string | null;
  readonly version: number;
}

export interface Actor {
  readonly userId: string;
  readonly role: Role;
}

export interface TransitionRequest {
  readonly to: WorkOrderStatus;
  readonly actor: Actor;
  readonly at: Date;
  readonly note?: string;
  /** Required when cancelling. */
  readonly reason?: string;
  /** Required when completing unless already stored on the order. */
  readonly resolution?: string;
  /** Required when assigning. */
  readonly assigneeId?: string;
}

export interface TransitionContext {
  readonly closurePolicy: ClosurePolicy;
  /** Decision on the active approval request, if any (FR-08). */
  readonly approvalDecision: ApprovalDecision | null;
}

export interface WorkOrderEvent {
  readonly workOrderId: string;
  readonly fromStatus: WorkOrderStatus;
  readonly toStatus: WorkOrderStatus;
  readonly actorId: string;
  readonly at: Date;
  readonly note: string | null;
}

export interface TransitionOutcome {
  readonly order: WorkOrderState;
  readonly event: WorkOrderEvent;
}

export type TransitionErrorCode =
  | 'ORDER_LOCKED'
  | 'INVALID_TRANSITION'
  | 'ROLE_NOT_PERMITTED'
  | 'NOT_ASSIGNEE'
  | 'SELF_APPROVAL'
  | 'ASSIGNEE_REQUIRED'
  | 'RESOLUTION_REQUIRED'
  | 'CHECKLIST_INCOMPLETE'
  | 'REASON_REQUIRED'
  | 'APPROVAL_REQUIRED';

export type TransitionError = DomainError<TransitionErrorCode>;
