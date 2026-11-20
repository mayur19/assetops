import type { SlaClockEvaluation, SlaEvaluation } from './types.js';

export type SlaClock = 'RESPONSE' | 'RESOLUTION';
export type EscalationLevel = 'AT_RISK' | 'BREACHED';

export interface Escalation {
  readonly workOrderId: string;
  readonly clock: SlaClock;
  readonly level: EscalationLevel;
  /** Stable key persisted with the notification to guarantee one alert per level. */
  readonly dedupeKey: string;
}

function levelFor(clock: SlaClockEvaluation): EscalationLevel | null {
  if (clock.state === 'BREACHED' && clock.stoppedAt === null) return 'BREACHED';
  if (clock.state === 'AT_RISK') return 'AT_RISK';
  return null;
}

/**
 * In-app escalations still owed for a work order (FR-05): one at 80% of the
 * budget and one on breach, per clock, excluding keys already sent.
 */
export function pendingEscalations(
  workOrderId: string,
  evaluation: SlaEvaluation,
  alreadySent: ReadonlySet<string>,
): readonly Escalation[] {
  const clocks: readonly [SlaClock, SlaClockEvaluation][] = [
    ['RESPONSE', evaluation.response],
    ['RESOLUTION', evaluation.resolution],
  ];
  return clocks.flatMap(([clock, result]) => {
    const level = levelFor(result);
    if (!level) return [];
    const dedupeKey = `${workOrderId}:${clock}:${level}`;
    return alreadySent.has(dedupeKey) ? [] : [{ workOrderId, clock, level, dedupeKey }];
  });
}
