import { fail, ok, type Result } from '../result.js';
import { TRANSITIONS, type TransitionRule } from './transitions.js';
import type {
  TransitionContext,
  TransitionError,
  TransitionOutcome,
  TransitionRequest,
  WorkOrderState,
  WorkOrderStatus,
} from './types.js';

const TERMINAL: ReadonlySet<WorkOrderStatus> = new Set(['CLOSED', 'CANCELLED']);

export function isTerminal(status: WorkOrderStatus): boolean {
  return TERMINAL.has(status);
}

/** Statuses reachable from `from` in the lifecycle graph, ignoring guards. */
export function allowedTargets(from: WorkOrderStatus): readonly WorkOrderStatus[] {
  return Object.keys(TRANSITIONS[from]) as WorkOrderStatus[];
}

const lockedError = (order: WorkOrderState): TransitionError => ({
  code: 'ORDER_LOCKED',
  message: `Work order is ${order.status} and can no longer be changed`,
  details: { status: order.status },
});

/** Closed and cancelled orders are read-only: no field edits, labor or cost changes. */
export function ensureEditable(order: WorkOrderState): Result<void, TransitionError> {
  return isTerminal(order.status) ? fail(lockedError(order)) : ok(undefined);
}

function findRule(
  order: WorkOrderState,
  request: TransitionRequest,
  context: TransitionContext,
): Result<TransitionRule, TransitionError> {
  if (isTerminal(order.status)) return fail(lockedError(order));
  const rule = TRANSITIONS[order.status][request.to];
  if (!rule) {
    return fail({
      code: 'INVALID_TRANSITION',
      message: `Transition from ${order.status} to ${request.to} is not allowed`,
      details: { from: order.status, to: request.to },
    });
  }
  const failure = rule.guard({ order, request, context });
  return failure ? fail(failure) : ok(rule);
}

/** Check whether `request` is allowed without computing the new state. */
export function canTransition(
  order: WorkOrderState,
  request: TransitionRequest,
  context: TransitionContext,
): Result<void, TransitionError> {
  const found = findRule(order, request, context);
  return found.ok ? ok(undefined) : found;
}

/**
 * Apply a status change. Returns a new order (version + 1) and the event to
 * persist; the input is never mutated (ADR-0013).
 */
export function transition(
  order: WorkOrderState,
  request: TransitionRequest,
  context: TransitionContext,
): Result<TransitionOutcome, TransitionError> {
  const found = findRule(order, request, context);
  if (!found.ok) return found;

  const next: WorkOrderState = {
    ...order,
    ...found.value.effect(order, request),
    status: request.to,
    version: order.version + 1,
  };
  const note = request.note?.trim();
  return ok({
    order: next,
    event: {
      workOrderId: order.id,
      fromStatus: order.status,
      toStatus: request.to,
      actorId: request.actor.userId,
      at: request.at,
      note: note ? note : null,
    },
  });
}
