import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Role } from '@assetops/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../src/auth/AuthProvider';
import { FacilitiesPage } from '../src/pages/facilities/FacilitiesPage';

const FACILITY = {
  id: '00000000-0000-4000-8000-000000000010',
  organizationId: '00000000-0000-4000-8000-000000000002',
  code: 'RIV-HTL',
  name: 'Riverside Grand Hotel',
  address: '100 River Walk',
  timezone: 'America/Chicago',
  active: true,
  archivedAt: null,
  createdAt: '2026-11-20T00:00:00.000Z',
  updatedAt: '2026-11-20T00:00:00.000Z',
  version: 1,
};

function renderAs(role: Role) {
  const value = {
    state: {
      status: 'authenticated' as const,
      user: {
        id: '00000000-0000-4000-8000-000000000001',
        organizationId: FACILITY.organizationId,
        organizationName: 'Riverside Hospitality',
        email: 'x@riverside.example',
        displayName: 'X',
        role,
      },
    },
    login: vi.fn(),
    logout: vi.fn(),
  };
  return render(
    <AuthContext.Provider value={value}>
      <FacilitiesPage />
    </AuthContext.Provider>,
  );
}

function mockFetch(handler: (url: string, init?: RequestInit) => unknown, status = 200) {
  const fn = vi.fn(
    async (url: string, init?: RequestInit) =>
      new Response(JSON.stringify(handler(url, init)), { status }),
  );
  vi.stubGlobal('fetch', fn);
  return fn;
}

const listBody = {
  success: true,
  data: [FACILITY],
  error: null,
  meta: { total: 1, page: 1, limit: 10 },
};

afterEach(() => vi.unstubAllGlobals());

describe('FacilitiesPage', () => {
  it('renders the server-side page of facilities', async () => {
    const fetchMock = mockFetch(() => listBody);
    renderAs('TECHNICIAN');
    expect(await screen.findByText('Riverside Grand Hotel')).toBeInTheDocument();
    expect(screen.getByText(/Page 1 of 1/)).toBeInTheDocument();
    expect(fetchMock.mock.calls[0]![0]).toBe('/api/v1/facilities?page=1&limit=10');
  });

  it('hides the create form from roles without facility:create', async () => {
    mockFetch(() => listBody);
    renderAs('REQUESTER');
    await screen.findByText('Riverside Grand Hotel');
    expect(screen.queryByRole('form', { name: 'Add facility' })).toBeNull();
  });

  it('validates client-side before calling the API', async () => {
    const fetchMock = mockFetch(() => listBody);
    renderAs('FACILITY_MANAGER');
    await screen.findByText('Riverside Grand Hotel');
    fireEvent.click(screen.getByRole('button', { name: 'Create facility' }));
    expect(await screen.findByText('Use 2-20 letters, digits or dashes')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('creates a facility and reloads the list', async () => {
    const fetchMock = mockFetch((_url, init) =>
      init?.method === 'POST'
        ? { success: true, data: { ...FACILITY, code: 'RIV-SPA' }, error: null }
        : listBody,
    );
    renderAs('ORG_ADMIN');
    await screen.findByText('Riverside Grand Hotel');
    fireEvent.change(screen.getByLabelText('Code'), { target: { value: 'riv-spa' } });
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Riverside Day Spa' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create facility' }));
    expect(await screen.findByText('Facility RIV-SPA created.')).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    const post = fetchMock.mock.calls[1]!;
    expect(JSON.parse(String(post[1]?.body))).toMatchObject({
      code: 'RIV-SPA',
      name: 'Riverside Day Spa',
    });
  });

  it('shows an error state with retry when loading fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mockFetch(
      () => ({ success: false, data: null, error: { code: 'INTERNAL_ERROR', message: 'x' } }),
      500,
    );
    renderAs('FACILITY_MANAGER');
    expect(await screen.findByRole('alert')).toHaveTextContent('Facilities could not be loaded.');
  });
});
