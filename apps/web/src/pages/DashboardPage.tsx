import { useAuth } from '../auth/useAuth';

/** TODO(AO-050): operations dashboard (open, overdue, cost, recent activity). */
export function DashboardPage() {
  const { state } = useAuth();
  const name = state.status === 'authenticated' ? state.user.displayName : '';
  return (
    <section>
      <h1>Welcome, {name}</h1>
      <p className="muted">
        The operations dashboard is planned and tracked as <code>AO-050</code>. Facilities are
        available now from the navigation.
      </p>
    </section>
  );
}
