import type { Role } from './roles.js';

/**
 * Permission matrix (ADR-0007). Route guards and UI affordances both read
 * from this single table so they cannot drift apart. Record-level rules
 * (own requests, assigned work, same organization) live in services.
 */
export const PERMISSIONS = [
  'facility:read',
  'facility:create',
  'facility:update',
  'asset:read',
  'asset:write',
  'work-order:create',
  'work-order:read-all',
  'work-order:manage',
  'work-order:execute',
  'maintenance:manage',
  'maintenance:run-due',
  'inventory:read',
  'inventory:read-pricing',
  'inventory:write',
  'approval:decide',
  'report:read',
  'audit:read',
  'organization:manage',
  'sla:manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const MANAGER_PERMISSIONS: readonly Permission[] = [
  'facility:read',
  'facility:create',
  'facility:update',
  'asset:read',
  'asset:write',
  'work-order:create',
  'work-order:read-all',
  'work-order:manage',
  'work-order:execute',
  'maintenance:manage',
  'inventory:read',
  'inventory:read-pricing',
  'inventory:write',
  'approval:decide',
  'report:read',
  'audit:read',
  'sla:manage',
];

export const ROLE_PERMISSIONS: Readonly<Record<Role, readonly Permission[]>> = {
  ORG_ADMIN: [...MANAGER_PERMISSIONS, 'organization:manage', 'maintenance:run-due'],
  FACILITY_MANAGER: MANAGER_PERMISSIONS,
  TECHNICIAN: [
    'facility:read',
    'asset:read',
    'work-order:create',
    'work-order:execute',
    'inventory:read',
  ],
  REQUESTER: ['facility:read', 'work-order:create'],
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function rolesWith(permission: Permission): readonly Role[] {
  return (Object.keys(ROLE_PERMISSIONS) as Role[]).filter((role) => can(role, permission));
}
