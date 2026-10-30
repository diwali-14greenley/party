import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EventForm, { type EventFormValues } from '../components/EventForm';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { PartyEvent } from '../lib/types';
import { errorMessage, formatShortDate, makeSlug } from '../lib/utils';

export default function HostDashboard() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<PartyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('events').select('*').order('starts_at', { ascending: true });
    if (error) setError(errorMessage(error));
    else setEvents(data as PartyEvent[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createEvent(values: EventFormValues) {
    setError(null);
    const { data, error } = await supabase
      .from('events')
      .insert({
        ...values,
        location: values.location || null,
        description: values.description || null,
        slug: makeSlug(values.title),
      })
      .select()
      .single();
    if (error) {
      setError(errorMessage(error));
      return;
    }
    navigate(`/host/${(data as PartyEvent).id}`);
  }

  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.starts_at).getTime() >= now - 12 * 3600_000);
  const past = events.filter((e) => new Date(e.starts_at).getTime() < now - 12 * 3600_000);

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1>Your events</h1>
          <p className="muted">Signed in as {session?.user.email}</p>
        </div>
        <div className="row gap">
          {!creating && (
            <button className="btn btn-primary" onClick={() => setCreating(true)}>+ New event</button>
          )}
          <button className="btn btn-ghost" onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {creating && (
        <div className="card">
          <h2>New event</h2>
          <EventForm submitLabel="Create event" onSubmit={createEvent} onCancel={() => setCreating(false)} />
        </div>
      )}

      {loading ? (
        <p className="center-note">Loading…</p>
      ) : events.length === 0 && !creating ? (
        <div className="card empty">
          <p className="big-emoji">🪩</p>
          <h2>No parties yet</h2>
          <p className="muted">Create your first event and you'll get a link to send guests.</p>
          <button className="btn btn-primary" onClick={() => setCreating(true)}>Create an event</button>
        </div>
      ) : (
        <>
          <EventList events={upcoming} />
          {past.length > 0 && (
            <>
              <h3 className="section-label">Past</h3>
              <EventList events={past} faded />
            </>
          )}
        </>
      )}
    </main>
  );
}

function EventList({ events, faded }: { events: PartyEvent[]; faded?: boolean }) {
  return (
    <ul className={`event-list${faded ? ' faded' : ''}`}>
      {events.map((ev) => (
        <li key={ev.id}>
          <Link to={`/host/${ev.id}`} className="event-row">
            <span className="event-emoji">{ev.cover_emoji ?? '🎉'}</span>
            <span className="event-row-main">
              <strong>{ev.title}</strong>
              <span className="muted">
                {formatShortDate(ev.starts_at)}
                {ev.location ? ` · ${ev.location}` : ''}
              </span>
            </span>
            {!ev.rsvp_open && <span className="pill">Closed</span>}
            <span aria-hidden className="chevron">›</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
