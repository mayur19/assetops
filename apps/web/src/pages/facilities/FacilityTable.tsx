import type { Facility, PageMeta } from '@assetops/shared';

export interface FacilityTableProps {
  readonly items: readonly Facility[];
  readonly meta: PageMeta;
  readonly onPageChange: (page: number) => void;
}

export function FacilityTable({ items, meta, onPageChange }: FacilityTableProps) {
  if (items.length === 0) {
    return <p className="empty">No facilities match. Adjust the search or add a facility.</p>;
  }
  const lastPage = Math.max(1, Math.ceil(meta.total / meta.limit));
  return (
    <>
      <div className="table-wrap">
        <table className="table">
          <caption className="sr-only">Facilities</caption>
          <thead>
            <tr>
              <th scope="col">Code</th>
              <th scope="col">Name</th>
              <th scope="col">Address</th>
              <th scope="col">Time zone</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((facility) => (
              <tr key={facility.id}>
                <td>
                  <code>{facility.code}</code>
                </td>
                <td>{facility.name}</td>
                <td>{facility.address || <span className="muted">—</span>}</td>
                <td>{facility.timezone}</td>
                <td>{facility.active ? 'Active' : 'Archived'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <nav className="pager" aria-label="Facility pages">
        <button
          type="button"
          className="btn btn--ghost"
          disabled={meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
        >
          Previous
        </button>
        <span className="muted">
          Page {meta.page} of {lastPage} · {meta.total} total
        </span>
        <button
          type="button"
          className="btn btn--ghost"
          disabled={meta.page >= lastPage}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Next
        </button>
      </nav>
    </>
  );
}
