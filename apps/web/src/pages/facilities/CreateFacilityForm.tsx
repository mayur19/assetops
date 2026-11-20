import { createFacilitySchema, type Facility } from '@assetops/shared';
import { useState, type FormEvent } from 'react';
import { ApiError } from '../../api/client';
import { createFacility } from './facilities.api';

const EMPTY = { code: '', name: '', address: '', timezone: 'America/Chicago' };
type FormValues = typeof EMPTY;
type FieldErrors = Partial<Record<keyof FormValues, string>>;

function fieldErrorsFrom(issues: readonly { path: string; message: string }[]): FieldErrors {
  return Object.fromEntries(issues.map((issue) => [issue.path, issue.message]));
}

export function CreateFacilityForm({ onCreated }: { readonly onCreated: (f: Facility) => void }) {
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (key: keyof FormValues) => (value: string) =>
    setValues((current) => ({ ...current, [key]: value }));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const parsed = createFacilitySchema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(
        fieldErrorsFrom(
          parsed.error.issues.map((i) => ({ path: String(i.path[0]), message: i.message })),
        ),
      );
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      onCreated(await createFacility(parsed.data));
      setValues(EMPTY);
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : 'The facility could not be created. Try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const field = (key: keyof FormValues, label: string, hint?: string) => (
    <label className="field">
      <span>{label}</span>
      <input
        value={values[key]}
        onChange={(e) => update(key)(e.target.value)}
        aria-invalid={fieldErrors[key] ? true : undefined}
        aria-describedby={fieldErrors[key] ? `facility-${key}-error` : undefined}
        placeholder={hint}
      />
      {fieldErrors[key] ? (
        <small id={`facility-${key}-error`} className="field__error">
          {fieldErrors[key]}
        </small>
      ) : null}
    </label>
  );

  return (
    <form className="card form-grid" onSubmit={onSubmit} noValidate aria-label="Add facility">
      <h2>Add facility</h2>
      {field('code', 'Code', 'e.g. RIV-SPA')}
      {field('name', 'Name')}
      {field('address', 'Address')}
      {field('timezone', 'Time zone', 'IANA name, e.g. America/Chicago')}
      {formError ? (
        <p className="alert alert--error" role="alert">
          {formError}
        </p>
      ) : null}
      <button type="submit" className="btn btn--primary" disabled={submitting}>
        {submitting ? 'Saving…' : 'Create facility'}
      </button>
    </form>
  );
}
