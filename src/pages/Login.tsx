import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { errorMessage } from '../lib/utils';

// Hosts sign in with an email + password that the organizer creates in
// Supabase → Authentication → Users. No emails are sent.
export default function Login() {
  const { session } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (session) return <Navigate to="/host" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'Wrong email or password.'
          : errorMessage(error),
      );
    }
    // On success the session updates and <Navigate> above sends you to /host.
  }

  return (
    <main className="page narrow">
      <div className="card">
        <h1>Host login</h1>
        <p className="muted">For hosts and co-hosts only.</p>
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
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
}
