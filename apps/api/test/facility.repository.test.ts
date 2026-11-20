import { describe, expect, it } from 'vitest';
import { toLikePattern } from '../src/modules/facilities/facility.repository.js';

describe('toLikePattern', () => {
  it('wraps the text in wildcards', () => {
    expect(toLikePattern('grand')).toBe('%grand%');
  });

  it('escapes LIKE metacharacters so they match literally', () => {
    expect(toLikePattern('50%_off\\')).toBe('%50\\%\\_off\\\\%');
  });
});
