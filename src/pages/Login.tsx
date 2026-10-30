import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { AFTER_LOGIN_KEY, errorMessage } from '../lib/utils';

export default function Login() {
  const { session } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (session) return <Navigate to="/host" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    localStorage.setItem(AFTER_LOGIN_KEY, '1');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + import.meta.env.BASE_URL },
    });
    setBusy(false);
    if (error) setError(errorMessage(error));
    else setSent(true);
  }

  return (
    <main className="page narrow">
      <div className="card">
        {sent ? (
          <>
            <h1>Check your inbox 📬</h1>
            <p>
              We sent a login link to <strong>{email}</strong>. Open it in this browser and you'll land on your
              dashboard.
            </p>
            <button className="btn btn-ghost" onClick={() => setSent(false)}>Use a different email</button>
          </>
        ) : (
          <>
            <h1>Host login</h1>
            <p className="muted">No password. We'll email you a one-time link.</p>
            <form onSubmit={handleSubmit} className="stack">
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </label>
              {error && <p className="error">{error}</p>}
              <button className="btn btn-primary" disabled={busy}>
                {busy ? 'Sending…' : 'Send me a login link'}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
