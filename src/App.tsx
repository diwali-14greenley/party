import { useEffect, type ReactNode } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuth } from './lib/auth';
import { supabaseConfigured } from './lib/supabase';
import { AFTER_LOGIN_KEY, APP_NAME, FEATURED_EVENT_SLUG } from './lib/utils';
import Home from './pages/Home';
import Login from './pages/Login';
import HostDashboard from './pages/HostDashboard';
import HostEvent from './pages/HostEvent';
import EventPage from './pages/EventPage';

function RequireHost({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="center-note">Loading…</div>;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function SetupNeeded() {
  return (
    <main className="page narrow">
      <div className="card">
        <h1>Almost there 🔌</h1>
        <p>
          This site isn't connected to Supabase yet. Add <code>VITE_SUPABASE_URL</code> and{' '}
          <code>VITE_SUPABASE_KEY</code> to <code>.env.local</code> (local) or to your GitHub repo's Actions
          variables (deployed), then rebuild.
        </p>
      </div>
    </main>
  );
}

export default function App() {
  const { session } = useAuth();
  const navigate = useNavigate();

  // After clicking the magic link, send the host straight to their dashboard
  useEffect(() => {
    if (session && localStorage.getItem(AFTER_LOGIN_KEY)) {
      localStorage.removeItem(AFTER_LOGIN_KEY);
      navigate('/host', { replace: true });
    }
  }, [session, navigate]);

  if (!supabaseConfigured) return <SetupNeeded />;

  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">
          <span aria-hidden>🪔</span> {APP_NAME}
        </Link>
        <nav>
          {session ? (
            <Link to="/host" className="btn btn-ghost btn-sm">My events</Link>
          ) : (
            <Link to="/login" className="btn btn-ghost btn-sm">Host login</Link>
          )}
        </nav>
      </header>

      <Routes>
        {/* Home shows the featured party; falls back to the landing page if it doesn't exist yet */}
        <Route path="/" element={<EventPage slug={FEATURED_EVENT_SLUG} fallback={<Home />} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/e/:slug" element={<EventPage />} />
        <Route path="/host" element={<RequireHost><HostDashboard /></RequireHost>} />
        <Route path="/host/:id" element={<RequireHost><HostEvent /></RequireHost>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
