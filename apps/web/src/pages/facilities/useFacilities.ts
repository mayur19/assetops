import type { Facility, PageMeta } from '@assetops/shared';
import { useCallback, useEffect, useState } from 'react';
import { fetchFacilities } from './facilities.api';

type LoadState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'ready'; readonly items: readonly Facility[]; readonly meta: PageMeta };

/** Server-side paginated, searchable facility list. */
export function useFacilities(page: number, q: string) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    fetchFacilities(page, q)
      .then((result) => {
        if (!cancelled) setState({ status: 'ready', items: result.items, meta: result.meta });
      })
      .catch((error: unknown) => {
        console.error('Failed to load facilities', error);
        if (!cancelled) setState({ status: 'error', message: 'Facilities could not be loaded.' });
      });
    return () => {
      cancelled = true;
    };
  }, [page, q, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);
  return { state, reload };
}
