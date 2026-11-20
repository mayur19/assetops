/** Explicit success/failure value used by pure domain functions instead of throwing. */
export type Result<T, E> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };

export interface DomainError<C extends string> {
  readonly code: C;
  readonly message: string;
  readonly details?: Readonly<Record<string, unknown>>;
}

export function ok<T>(value: T): { readonly ok: true; readonly value: T } {
  return { ok: true, value };
}

export function fail<E>(error: E): { readonly ok: false; readonly error: E } {
  return { ok: false, error };
}
