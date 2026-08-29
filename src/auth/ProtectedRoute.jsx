import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { isSupabaseConfigured } from '../lib/supabaseClient';

// requireAdmin: true  -> admin only (Committee management, Users/settings, deletes)
// requireAdmin: false -> committee or admin
export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading, verifyingRole, isAdmin, isCommitteeOrAdmin, sessionExpired, clearSessionExpired, signOut } = useAuth();
  const location = useLocation();

  if (!isSupabaseConfigured) {
    return (
      <div className="page">
        <div className="card card-pad empty-state">
          Connect Supabase (see .env.example) to use the admin area.
        </div>
      </div>
    );
  }

  if (loading || verifyingRole) {
    return (
      <div className="page">
        <div className="card card-pad" style={{ height: 76, background: 'var(--color-surface-alt)', opacity: 0.6 }} />
      </div>
    );
  }

  if (!user) {
    if (sessionExpired) {
      clearSessionExpired();
      return (
        <Navigate
          to="/admin/login"
          replace
          state={{ from: location, sessionExpiredMessage: "You were signed out — please log in again." }}
        />
      );
    }
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  const allowed = requireAdmin ? isAdmin : isCommitteeOrAdmin;
  if (!allowed) {
    return (
      <div className="page">
        <div className="card card-pad empty-state" style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
          <span>You don't have permission to view this page.</span>
          <button className="btn btn-outline btn-sm" onClick={signOut}>Log out</button>
        </div>
      </div>
    );
  }

  return children;
}
