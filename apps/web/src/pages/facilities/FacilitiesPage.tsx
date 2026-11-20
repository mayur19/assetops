import { can } from '@assetops/shared';
import { useState, type FormEvent } from 'react';
import { useAuth } from '../../auth/useAuth';
import { CreateFacilityForm } from './CreateFacilityForm';
import { FacilityTable } from './FacilityTable';
import { useFacilities } from './useFacilities';

/** PRD §4 screen 4 (list + create). Hierarchy manager is tracked as AO-013. */
export function FacilitiesPage() {
  const { state: auth } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const { state, reload } = useFacilities(page, query);
  const canCreate = auth.status === 'authenticated' && can(auth.user.role, 'facility:create');

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setQuery(search);
  };

  return (
    <section className="stack">
      <header className="page-header">
        <h1>Facilities</h1>
        <form className="search" role="search" onSubmit={onSearch}>
          <label className="sr-only" htmlFor="facility-search">
            Search facilities
          </label>
          <input
            id="facility-search"
            type="search"
            placeholder="Search code or name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn--ghost">
            Search
          </button>
        </form>
      </header>
      {notice ? (
        <p className="alert alert--success" role="status">
          {notice}
        </p>
      ) : null}
      {state.status === 'loading' ? (
        <p className="skeleton" role="status">
          Loading facilities…
        </p>
      ) : null}
      {state.status === 'error' ? (
        <p className="alert alert--error" role="alert">
          {state.message}{' '}
          <button type="button" className="btn btn--ghost" onClick={reload}>
            Retry
          </button>
        </p>
      ) : null}
      {state.status === 'ready' ? (
        <FacilityTable items={state.items} meta={state.meta} onPageChange={setPage} />
      ) : null}
      {canCreate ? (
        <CreateFacilityForm
          onCreated={(facility) => {
            setNotice(`Facility ${facility.code} created.`);
            reload();
          }}
        />
      ) : null}
    </section>
  );
}
