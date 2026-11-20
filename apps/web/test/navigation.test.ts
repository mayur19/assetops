import { describe, expect, it } from 'vitest';
import { NAV_ITEMS, navItemsFor } from '../src/routes/navigation';

const labels = (role: Parameters<typeof navItemsFor>[0]) => navItemsFor(role).map((i) => i.label);

describe('navigation', () => {
  it('lists every PRD §4 screen inside the shell exactly once per path', () => {
    const paths = NAV_ITEMS.map((item) => item.path);
    expect(new Set(paths).size).toBe(paths.length);
    expect(NAV_ITEMS.length).toBe(18);
  });

  it('marks only the facilities screen as implemented', () => {
    expect(NAV_ITEMS.filter((item) => !item.ticket).map((item) => item.path)).toEqual([
      '/facilities',
    ]);
    for (const item of NAV_ITEMS.filter((i) => i.ticket)) {
      expect(item.ticket).toMatch(/^AO-\d{3}$/);
    }
  });

  it('shows management screens to managers but not to technicians or requesters', () => {
    expect(labels('FACILITY_MANAGER')).toContain('Approvals');
    expect(labels('TECHNICIAN')).not.toContain('Approvals');
    expect(labels('REQUESTER')).not.toContain('Inventory');
  });

  it('gives technicians their queue and requesters their request form', () => {
    expect(labels('TECHNICIAN')).toContain('My work');
    expect(labels('REQUESTER')).toEqual(
      expect.arrayContaining(['Dashboard', 'Facilities', 'New request', 'Notifications']),
    );
  });

  it('reserves users and settings for org admins', () => {
    expect(labels('ORG_ADMIN')).toContain('Users & settings');
    expect(labels('FACILITY_MANAGER')).not.toContain('Users & settings');
  });

  it('hides detail and form routes from the sidebar', () => {
    expect(labels('ORG_ADMIN')).not.toContain('Asset detail');
    expect(labels('ORG_ADMIN')).not.toContain('Work order detail');
  });
});
