import { describe, expect, it } from 'vitest';
import {
  can,
  isManagerRole,
  isRole,
  PERMISSIONS,
  ROLE_LABELS,
  ROLES,
  rolesWith,
} from '../src/index.js';

describe('roles', () => {
  it('matches the PRD actor model', () => {
    expect(ROLES).toEqual(['ORG_ADMIN', 'FACILITY_MANAGER', 'TECHNICIAN', 'REQUESTER']);
    expect(Object.keys(ROLE_LABELS)).toEqual([...ROLES]);
  });

  it('identifies manager roles', () => {
    expect(ROLES.filter(isManagerRole)).toEqual(['ORG_ADMIN', 'FACILITY_MANAGER']);
  });

  it('isRole accepts known roles only', () => {
    expect(isRole('TECHNICIAN')).toBe(true);
    expect(isRole('MEMBER')).toBe(false);
    expect(isRole(null)).toBe(false);
  });
});

describe('permission matrix', () => {
  it('lets everyone read facilities but only admins and managers create them', () => {
    expect(rolesWith('facility:read')).toEqual([...ROLES]);
    expect(rolesWith('facility:create')).toEqual(['ORG_ADMIN', 'FACILITY_MANAGER']);
  });

  it('hides inventory pricing from technicians and requesters', () => {
    expect(can('TECHNICIAN', 'inventory:read')).toBe(true);
    expect(can('TECHNICIAN', 'inventory:read-pricing')).toBe(false);
    expect(can('REQUESTER', 'inventory:read')).toBe(false);
  });

  it('reserves organization security settings and run-due for org admins', () => {
    expect(rolesWith('organization:manage')).toEqual(['ORG_ADMIN']);
    expect(rolesWith('maintenance:run-due')).toEqual(['ORG_ADMIN']);
  });

  it('restricts audit and approvals to admins and managers', () => {
    expect(rolesWith('audit:read')).toEqual(['ORG_ADMIN', 'FACILITY_MANAGER']);
    expect(rolesWith('approval:decide')).toEqual(['ORG_ADMIN', 'FACILITY_MANAGER']);
  });

  it('grants every permission to at least one role', () => {
    for (const permission of PERMISSIONS) {
      expect(rolesWith(permission).length).toBeGreaterThan(0);
    }
  });
});
