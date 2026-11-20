/**
 * AssetOps actor model (PRD §3). Authorization is always enforced by the API;
 * the web client only uses these values to decide what to render.
 * See docs/adr/0007-role-based-access-control.md.
 */
export const ROLES = ['ORG_ADMIN', 'FACILITY_MANAGER', 'TECHNICIAN', 'REQUESTER'] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Readonly<Record<Role, string>> = {
  ORG_ADMIN: 'Organization Admin',
  FACILITY_MANAGER: 'Facility Manager',
  TECHNICIAN: 'Technician',
  REQUESTER: 'Requester',
};

/** Roles that may manage operational data (assets, work orders, approvals). */
export const MANAGER_ROLES: readonly Role[] = ['ORG_ADMIN', 'FACILITY_MANAGER'];

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

export function isManagerRole(role: Role): boolean {
  return MANAGER_ROLES.includes(role);
}
