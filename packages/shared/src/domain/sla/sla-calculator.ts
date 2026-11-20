import { fail, ok, type Result } from '../result.js';
import type { WorkOrderPriority } from '../work-orders/types.js';
import type {
  SlaClockEvaluation,
  SlaDueDates,
  SlaError,
  SlaEvaluation,
  SlaEvaluationOptions,
  SlaPolicy,
  SlaTarget,
  SlaTimestamps,
} from './types.js';

const MINUTE_MS = 60_000;
const FULL_BP = 10_000;
export const DEFAULT_AT_RISK_BP = 8_000;

/** Pick the site-specific policy for a priority, falling back to the org default (FR-05). */
export function resolveSlaTarget(
  policies: readonly SlaPolicy[],
  priority: WorkOrderPriority,
  facilityId: string | null,
): Result<SlaTarget, SlaError> {
  const candidates = policies.filter((policy) => policy.priority === priority);
  const match =
    candidates.find((policy) => facilityId !== null && policy.facilityId === facilityId) ??
    candidates.find((policy) => policy.facilityId === null);
  if (!match) {
    return fail({
      code: 'POLICY_NOT_FOUND',
      message: `No SLA policy configured for ${priority} priority`,
      details: { priority, facilityId },
    });
  }
  return ok({ responseMinutes: match.responseMinutes, resolutionMinutes: match.resolutionMinutes });
}

function isPositiveInt(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

function isValidDate(value: Date): boolean {
  return !Number.isNaN(value.getTime());
}

/** Due times = reported_at + budget, in elapsed clock time (ADR-0014). */
export function computeSlaDueDates(
  reportedAt: Date,
  target: SlaTarget,
): Result<SlaDueDates, SlaError> {
  if (!isValidDate(reportedAt)) {
    return fail({ code: 'INVALID_TIMESTAMP', message: 'reported_at is not a valid date' });
  }
  const { responseMinutes, resolutionMinutes } = target;
  if (
    !isPositiveInt(responseMinutes) ||
    !isPositiveInt(resolutionMinutes) ||
    resolutionMinutes < responseMinutes
  ) {
    return fail({
      code: 'INVALID_TARGET',
      message: 'SLA targets must be positive whole minutes with resolution >= response',
      details: { responseMinutes, resolutionMinutes },
    });
  }
  const base = reportedAt.getTime();
  return ok({
    responseDueAt: new Date(base + responseMinutes * MINUTE_MS),
    resolveDueAt: new Date(base + resolutionMinutes * MINUTE_MS),
  });
}

interface ClockInput {
  readonly reportedAt: Date;
  readonly dueAt: Date;
  readonly stoppedAt: Date | null;
  readonly cancelledAt: Date | null;
  readonly now: Date;
  readonly atRiskBp: number;
}

function evaluateClock(input: ClockInput): SlaClockEvaluation {
  const { reportedAt, dueAt, stoppedAt, cancelledAt, now, atRiskBp } = input;
  const budgetMs = dueAt.getTime() - reportedAt.getTime();
  if (budgetMs <= 0) throw new RangeError('SLA due time must be after reported_at');

  const endAt = stoppedAt ?? cancelledAt ?? now;
  const elapsedMs = Math.max(0, endAt.getTime() - reportedAt.getTime());
  const consumedBp = Math.floor((elapsedMs * FULL_BP) / budgetMs);
  const remainingMs = dueAt.getTime() - endAt.getTime();
  const base = { dueAt, stoppedAt, consumedBp, remainingMs };

  if (stoppedAt) return { ...base, state: remainingMs >= 0 ? 'MET' : 'BREACHED' };
  if (cancelledAt) return { ...base, state: 'NOT_APPLICABLE' };
  if (remainingMs < 0) return { ...base, state: 'BREACHED' };
  return { ...base, state: consumedBp >= atRiskBp ? 'AT_RISK' : 'PENDING' };
}

/**
 * Evaluate both SLA clocks at `now`. Response stops at the first accepted
 * technician action; resolution stops at COMPLETED (closure happens later).
 */
export function evaluateSla(
  timestamps: SlaTimestamps,
  due: SlaDueDates,
  now: Date,
  options: SlaEvaluationOptions = {},
): SlaEvaluation {
  const atRiskBp = options.atRiskBp ?? DEFAULT_AT_RISK_BP;
  if (!Number.isInteger(atRiskBp) || atRiskBp <= 0 || atRiskBp >= FULL_BP) {
    throw new RangeError('atRiskBp must be an integer between 1 and 9999');
  }
  const shared = {
    reportedAt: timestamps.reportedAt,
    cancelledAt: timestamps.cancelledAt,
    now,
    atRiskBp,
  };
  return {
    response: evaluateClock({
      ...shared,
      dueAt: due.responseDueAt,
      stoppedAt: timestamps.firstRespondedAt,
    }),
    resolution: evaluateClock({
      ...shared,
      dueAt: due.resolveDueAt,
      stoppedAt: timestamps.completedAt,
    }),
  };
}
