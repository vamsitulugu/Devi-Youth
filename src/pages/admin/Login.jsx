import { useState } from 'react';
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { LogIn, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { Field, Input, Select } from '../../components/admin/FormField';

export default function Login() {
  const { user, signIn, loading, verifyingRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('committee');
  const [error, setError] = useState(location.state?.sessionExpiredMessage || '');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && !verifyingRole && user) {
    return <Navigate to={location.state?.from?.pathname || '/admin'} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error } = await signIn(email.trim(), password, role);
    setSubmitting(false);
    if (error) {
      setError(error.message);
    } else {
      navigate(location.state?.from?.pathname || '/admin', { replace: true });
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card-wrap page">
        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--grad-kumkum, linear-gradient(160deg, var(--color-vermillion) 0%, var(--color-vermillion-dark) 100%))',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.4) inset, 0 0 24px rgba(246,185,59,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              color: '#fff',
              animation: 'emblemIn 640ms cubic-bezier(0.34,1.56,0.64,1) both',
            }}
          >
            <ShieldCheck size={30} />
          </div>
          <h1 style={{ fontSize: 'var(--fs-xl)' }}>Committee Login</h1>
          <p style={{ color: 'var(--color-ink-soft)', fontSize: 'var(--fs-sm)', marginTop: 4 }}>
            For admins &amp; committee members only
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div className="card card-pad empty-state">
            Supabase isn't connected yet. Add your keys to .env to enable login.
          </div>
        )}

        <form className="card card-pad" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, boxShadow: 'var(--shadow-lift, var(--shadow-card))' }}>
          <Field label="Role">
            <Select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="admin">Admin</option>
              <option value="committee">Committee Member</option>
              <option value="villager">Villager</option>
            </Select>
          </Field>
          <Field label="Email">
            <Input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </Field>
          <Field label="Password">
            <div style={{ position: 'relative' }}>
              <Input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--color-ink-soft)', display: 'flex', padding: 4,
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>
          {error && <div style={{ color: 'var(--color-danger)', fontSize: 'var(--fs-sm)' }}>{error}</div>}
          <button className="btn btn-primary btn-block" disabled={submitting || !isSupabaseConfigured}>
            <LogIn size={16} /> {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 'var(--fs-xs)', color: 'var(--color-ink-soft)' }}>
          New here? <Link to="/admin/join">Join with an invite code</Link>
        </p>
      </div>
    </div>
  );
}
