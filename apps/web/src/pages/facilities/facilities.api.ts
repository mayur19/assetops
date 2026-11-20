import type { CreateFacilityInput, Facility } from '@assetops/shared';
import { api, getPage, type Page } from '../../api/client';

export const FACILITY_PAGE_SIZE = 10;

export function fetchFacilities(page: number, q: string): Promise<Page<Facility>> {
  const params = new URLSearchParams({ page: String(page), limit: String(FACILITY_PAGE_SIZE) });
  if (q.trim()) params.set('q', q.trim());
  return getPage<Facility>(`/facilities?${params.toString()}`);
}

export function createFacility(input: CreateFacilityInput): Promise<Facility> {
  return api.post<Facility>('/facilities', input);
}
