import type { DomainError } from '../result.js';
import type { WorkOrderPriority } from '../work-orders/types.js';

/** Response/resolution budget in elapsed clock minutes (no business hours in MVP). */
export interface SlaTarget {
  readonly responseMinutes: number;
  readonly resolutionMinutes: number;
}

/** A policy row; `facilityId: null` is the organization-wide default. */
export interface SlaPolicy extends SlaTarget {
  readonly priority: WorkOrderPriority;
  readonly facilityId: string | null;
}

export interface SlaDueDates {
  readonly responseDueAt: Date;
  readonly resolveDueAt: Date;
}

/** Authoritative timestamps (UTC) captured on the work order. */
export interface SlaTimestamps {
  readonly reportedAt: Date;
  readonly firstRespondedAt: Date | null;
  readonly completedAt: Date | null;
  readonly cancelledAt: Date | null;
}

export type SlaClockState = 'PENDING' | 'AT_RISK' | 'MET' | 'BREACHED' | 'NOT_APPLICABLE';

export interface SlaClockEvaluation {
  readonly state: SlaClockState;
  readonly dueAt: Date;
  readonly stoppedAt: Date | null;
  /** Elapsed share of the budget in basis points (10000 = 100%). */
  readonly consumedBp: number;
  /** Milliseconds left before the due time; negative once overdue. */
  readonly remainingMs: number;
}

export interface SlaEvaluation {
  readonly response: SlaClockEvaluation;
  readonly resolution: SlaClockEvaluation;
}

export interface SlaEvaluationOptions {
  /** Share of budget at which a clock becomes AT_RISK; default 8000 (80%). */
  readonly atRiskBp?: number;
}

export type SlaErrorCode = 'POLICY_NOT_FOUND' | 'INVALID_TARGET' | 'INVALID_TIMESTAMP';

export type SlaError = DomainError<SlaErrorCode>;
