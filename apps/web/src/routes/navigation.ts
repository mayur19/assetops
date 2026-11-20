import { ROLES, type Role } from '@assetops/shared';

export interface NavItem {
  readonly path: string;
  readonly label: string;
  /** Backlog ticket that delivers this screen; omitted once implemented. */
  readonly ticket?: string;
  /** Roles that see the screen. The API enforces access independently. */
  readonly roles: readonly Role[];
  /** Detail and form screens are routable but not listed in the sidebar. */
  readonly inNav?: boolean;
}

const ALL: readonly Role[] = ROLES;
const MANAGERS: readonly Role[] = ['ORG_ADMIN', 'FACILITY_MANAGER'];

/**
 * Every screen from PRD §4 (sign-in lives outside the shell). Screens with a
 * ticket render a PendingPage naming the backlog item that delivers them.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { path: '/', label: 'Dashboard', ticket: 'AO-050', roles: ALL },
  { path: '/facilities', label: 'Facilities', roles: ALL },
  { path: '/assets', label: 'Assets', ticket: 'AO-016', roles: [...MANAGERS, 'TECHNICIAN'] },
  { path: '/assets/new', label: 'New asset', ticket: 'AO-017', roles: MANAGERS, inNav: false },
  {
    path: '/assets/:id',
    label: 'Asset detail',
    ticket: 'AO-018',
    roles: [...MANAGERS, 'TECHNICIAN'],
    inNav: false,
  },
  {
    path: '/work-orders',
    label: 'Work orders',
    ticket: 'AO-028',
    roles: [...MANAGERS, 'REQUESTER'],
  },
  { path: '/work-orders/new', label: 'New request', ticket: 'AO-029', roles: ALL },
  {
    path: '/work-orders/:id',
    label: 'Work order detail',
    ticket: 'AO-030',
    roles: ALL,
    inNav: false,
  },
  { path: '/my-work', label: 'My work', ticket: 'AO-031', roles: ['TECHNICIAN'] },
  { path: '/maintenance', label: 'Preventive maintenance', ticket: 'AO-040', roles: MANAGERS },
  {
    path: '/maintenance/calendar',
    label: 'Maintenance calendar',
    ticket: 'AO-040',
    roles: MANAGERS,
  },
  { path: '/inventory', label: 'Inventory', ticket: 'AO-044', roles: [...MANAGERS, 'TECHNICIAN'] },
  { path: '/approvals', label: 'Approvals', ticket: 'AO-047', roles: MANAGERS },
  { path: '/sla', label: 'SLA & overdue', ticket: 'AO-033', roles: MANAGERS },
  { path: '/reports', label: 'Reports', ticket: 'AO-051', roles: MANAGERS },
  { path: '/notifications', label: 'Notifications', ticket: 'AO-053', roles: ALL },
  { path: '/settings', label: 'Users & settings', ticket: 'AO-055', roles: ['ORG_ADMIN'] },
  { path: '/audit-log', label: 'Audit log', ticket: 'AO-054', roles: MANAGERS },
];

export function navItemsFor(role: Role): readonly NavItem[] {
  return NAV_ITEMS.filter((item) => item.inNav !== false && item.roles.includes(role));
}
