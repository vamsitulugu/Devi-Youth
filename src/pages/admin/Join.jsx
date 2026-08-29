import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { UserPlus, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { validateInviteCode } from '../../services/inviteApi';
import { Field, Input } from '../../components/admin/FormField';

const roleLabel = { admin: 'Admin', committee: 'Committee Member', villager: 'Villager' };

export default function Join() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState((searchParams.get('code') || '').toUpperCase());
  const [check, setCheck] = useState({ status: 'idle' }); // idle | checking | valid | invalid
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  useEffect(() => {
    const trimmed = code.trim();
    if (trimmed.length < 6) {
      setCheck({ status: 'idle' });
      return;
    }
    let cancelled = false;
    setCheck({ status: 'checking' });
    validateInviteCode(trimmed)
      .then((res) => {
        if (cancelled) return;
        setCheck(res.is_valid ? { status: 'valid', role: res.role } : { status: 'invalid', reason: res.reason });
      })
      .catch((err) => !cancelled && setCheck({ status: 'invalid', reason: err.message }));
    return () => {
      cancelled = true;
    };
  }, [code]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (check.status !== 'valid') {
      setError('Enter a valid invite code first.');
      return;
    }
    setSubmitting(true);
    try {
      // Re-check right before signing up — the code could have been
      // used by someone else in the meantime.
      const recheck = await validateInviteCode(code.trim());
      if (!recheck.is_valid) throw new Error(recheck.reason || 'That code is no longer valid.');

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: name.trim(), invite_code: code.trim().toUpperCase() } },
      });
      if (signUpError) throw signUpError;

      // Role is assigned server-side by a database trigger the instant
      // the account is created — it doesn't need an active session, so
      // this works whether or not "Confirm email" is on in Supabase.
      setNeedsConfirm(!data.session);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="auth-shell">
        <div className="auth-card-wrap page">
          <div className="card card-pad" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <CheckCircle2 size={40} color="var(--color-leaf)" />
            <h1 style={{ fontSize: 'var(--fs-lg)' }}>You're in!</h1>
            <p style={{ color: 'var(--color-ink-soft)', fontSize: 'var(--fs-sm)' }}>
              {needsConfirm
                ? "Your account and role are already set up. Check your email to confirm it, then log in."
                : "Your account is set up. Log in whenever you're ready."}
            </p>
            <button className="btn btn-primary btn-block" onClick={() => navigate('/admin/login')}>
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-card-wrap page">
        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <div
            style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(160deg, var(--color-vermillion) 0%, var(--color-vermillion-dark) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.4) inset, 0 0 24px rgba(246,185,59,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#fff',
            }}
          >
            <UserPlus size={30} />
          </div>
          <h1 style={{ fontSize: 'var(--fs-xl)' }}>Join the Committee App</h1>
          <p style={{ color: 'var(--color-ink-soft)', fontSize: 'var(--fs-sm)', marginTop: 4 }}>
            You'll need the invite code an admin sent you on WhatsApp.
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div className="card card-pad empty-state">Supabase isn't connected yet.</div>
        )}

        <form className="card card-pad" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field
            label="Invite Code"
            hint={
              check.status === 'valid'
                ? `Valid — you'll join as ${roleLabel[check.role] || check.role}.`
                : check.status === 'invalid'
                ? check.reason
                : 'The 6-character code from your WhatsApp message'
            }
            error={check.status === 'invalid' ? ' ' : undefined}
          >
            <Input
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="KG7X3F"
              style={{ letterSpacing: 2, fontWeight: 700, textTransform: 'uppercase' }}
              maxLength={6}
            />
          </Field>
          <Field label="Your Name">
            <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
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
          <Field label="Password" hint="At least 6 characters">
            <Input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>
          {error && <div style={{ color: 'var(--color-danger)', fontSize: 'var(--fs-sm)' }}>{error}</div>}
          <button className="btn btn-primary btn-block" disabled={submitting || !isSupabaseConfigured || check.status !== 'valid'}>
            <ShieldCheck size={16} /> {submitting ? 'Joining…' : 'Join'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 'var(--fs-xs)', color: 'var(--color-ink-soft)' }}>
          Already have an account? <Link to="/admin/login">Log in instead</Link>
        </p>
      </div>
    </div>
  );
}
