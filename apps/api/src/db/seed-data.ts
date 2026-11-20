import type { Role } from '@assetops/shared';

/**
 * DEVELOPMENT-ONLY demonstration identities and facilities (PRD §8).
 * Every login is documented in README.md. Never load into production.
 */
export interface SeedOrganization {
  readonly slug: string;
  readonly name: string;
}

export interface SeedUser {
  readonly org: string;
  readonly email: string;
  readonly displayName: string;
  readonly role: Role;
}

export interface SeedFacility {
  readonly org: string;
  readonly code: string;
  readonly name: string;
  readonly address: string;
  readonly timezone: string;
}

export const DEMO_ORGS: readonly SeedOrganization[] = [
  { slug: 'riverside-hospitality', name: 'Riverside Hospitality' },
  { slug: 'northline-fitness', name: 'Northline Fitness' },
];

export const DEMO_USERS: readonly SeedUser[] = [
  {
    org: 'riverside-hospitality',
    email: 'admin@riverside.example',
    displayName: 'Rita Alvarez',
    role: 'ORG_ADMIN',
  },
  {
    org: 'riverside-hospitality',
    email: 'manager@riverside.example',
    displayName: 'Marcus Hale',
    role: 'FACILITY_MANAGER',
  },
  {
    org: 'riverside-hospitality',
    email: 'tech@riverside.example',
    displayName: 'Tomas Okafor',
    role: 'TECHNICIAN',
  },
  {
    org: 'riverside-hospitality',
    email: 'requester@riverside.example',
    displayName: 'Priya Nair',
    role: 'REQUESTER',
  },
  {
    org: 'northline-fitness',
    email: 'admin@northline.example',
    displayName: 'Nadia Brooks',
    role: 'ORG_ADMIN',
  },
];

export const DEMO_FACILITIES: readonly SeedFacility[] = [
  {
    org: 'riverside-hospitality',
    code: 'RIV-HTL',
    name: 'Riverside Grand Hotel',
    address: '100 River Walk, Riverside',
    timezone: 'America/Chicago',
  },
  {
    org: 'riverside-hospitality',
    code: 'RIV-INN',
    name: 'Riverside Harbour Inn',
    address: '8 Harbour Lane, Riverside',
    timezone: 'America/Chicago',
  },
  {
    org: 'northline-fitness',
    code: 'NLF-DTN',
    name: 'Northline Downtown Club',
    address: '55 Market Street, Northline',
    timezone: 'America/Denver',
  },
  {
    org: 'northline-fitness',
    code: 'NLF-WST',
    name: 'Northline Westside Club',
    address: '210 Westgate Avenue, Northline',
    timezone: 'America/Denver',
  },
];
