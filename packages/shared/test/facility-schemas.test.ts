import { describe, expect, it } from 'vitest';
import { createFacilitySchema, facilityListQuerySchema, isValidTimeZone } from '../src/index.js';

const valid = { code: ' riv-htl ', name: 'Riverside Grand Hotel', timezone: 'America/Chicago' };

describe('createFacilitySchema', () => {
  it('normalises the code to upper case and defaults the address', () => {
    expect(createFacilitySchema.parse(valid)).toEqual({
      code: 'RIV-HTL',
      name: 'Riverside Grand Hotel',
      address: '',
      timezone: 'America/Chicago',
    });
  });

  it.each([
    ['too short code', { code: 'A' }],
    ['code with spaces', { code: 'RIV HTL' }],
    ['leading dash', { code: '-RIV' }],
    ['empty name', { name: '   ' }],
    ['unknown timezone', { timezone: 'Mars/Olympus' }],
    ['overlong address', { address: 'x'.repeat(501) }],
  ])('rejects %s', (_label, override) => {
    expect(createFacilitySchema.safeParse({ ...valid, ...override }).success).toBe(false);
  });
});

describe('facilityListQuerySchema', () => {
  it('applies defaults', () => {
    expect(facilityListQuerySchema.parse({})).toEqual({
      page: 1,
      limit: 25,
      includeArchived: false,
    });
  });

  it('parses includeArchived and search', () => {
    expect(facilityListQuerySchema.parse({ includeArchived: 'true', q: ' grand ' })).toMatchObject({
      includeArchived: true,
      q: 'grand',
    });
  });
});

describe('isValidTimeZone', () => {
  it('accepts IANA names and rejects garbage', () => {
    expect(isValidTimeZone('Europe/London')).toBe(true);
    expect(isValidTimeZone('Not/AZone')).toBe(false);
  });
});
