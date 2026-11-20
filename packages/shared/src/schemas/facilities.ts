import { z } from 'zod';
import { paginationQuerySchema } from './common.js';

/** True when the runtime recognises the IANA time zone name. */
export function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export const facilityCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9][A-Z0-9-]{1,19}$/, 'Use 2-20 letters, digits or dashes');

export const createFacilitySchema = z.object({
  code: facilityCodeSchema,
  name: z.string().trim().min(1).max(200),
  address: z.string().trim().max(500).default(''),
  timezone: z.string().trim().min(1).max(64).refine(isValidTimeZone, 'Unknown IANA time zone'),
});

export type CreateFacilityInput = z.infer<typeof createFacilitySchema>;

export const facilityListQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().max(100).optional(),
  includeArchived: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
});

export type FacilityListQuery = z.infer<typeof facilityListQuerySchema>;

export const facilitySchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  address: z.string(),
  timezone: z.string(),
  active: z.boolean(),
  archivedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number().int(),
});

export type Facility = z.infer<typeof facilitySchema>;
