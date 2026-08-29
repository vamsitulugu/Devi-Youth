import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { isSupabaseConfigured } from '../lib/supabaseClient';

// requireAdmin: true  -> admin only (Committee management, Users/settings, deletes)
// requireAdmin: false -> committee or admin
export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading, verifyingRole, isAdmin, isCommitteeOrAdmin } = useAuth();
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
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  const allowed = requireAdmin ? isAdmin : isCommitteeOrAdmin;
  if (!allowed) {
    return (
      <div className="page">
        <div className="card card-pad empty-state">
          You don't have permission to view this page.
        </div>
      </div>
    );
  }

  return children;
}
