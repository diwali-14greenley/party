import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import EventForm, { type EventFormValues } from '../components/EventForm';
import { supabase } from '../lib/supabase';
import type { PartyEvent, Rsvp, RsvpStatus } from '../lib/types';
import {
  STATUS_EMOJI,
  STATUS_LABEL,
  downloadText,
  errorMessage,
  formatEventDate,
  formatShortDate,
  headcount,
  rsvpsToCsv,
  shareUrl,
} from '../lib/utils';

type Filter = 'all' | RsvpStatus;

export default function HostEvent() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<PartyEvent | null>(null);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [copied, setCopied] = useState(false);
  const [live, setLive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRsvps = useCallback(async () => {
    const { data, error } = await supabase
      .from('rsvps')
      .select('id, event_id, name, email, status, plus_ones, note, created_at, updated_at')
      .eq('event_id', id)
      .order('created_at', { ascending: false });
    if (error) setError(errorMessage(error));
    else setRsvps(data as Rsvp[]);
  }, [id]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('events').select('*').eq('id', id).maybeSingle();
      if (error) setError(errorMessage(error));
      setEvent(data as PartyEvent | null);
      await loadRsvps();
      setLoading(false);
    })();
  }, [id, loadRsvps]);

  // Live updates: refetch whenever an RSVP for this event changes
  useEffect(() => {
    const channel = supabase
      .channel(`rsvps-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rsvps', filter: `event_id=eq.${id}` }, () => {
        loadRsvps();
      })
      .subscribe((status) => setLive(status === 'SUBSCRIBED'));
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, loadRsvps]);

  const counts = useMemo(
    () => ({
      going: rsvps.filter((r) => r.status === 'going').length,
      maybe: rsvps.filter((r) => r.status === 'maybe').length,
      declined: rsvps.filter((r) => r.status === 'declined').length,
      headcount: headcount(rsvps),
    }),
    [rsvps],
  );

  const visible = filter === 'all' ? rsvps : rsvps.filter((r) => r.status === filter);

  async function updateEvent(patch: Partial<PartyEvent>) {
    if (!event) return;
    const { data, error } = await supabase.from('events').update(patch).eq('id', event.id).select().single();
    if (error) setError(errorMessage(error));
    else setEvent(data as PartyEvent);
  }

  async function saveEdits(values: EventFormValues) {
    await updateEvent({
      ...values,
      location: values.location || null,
      description: values.description || null,
    });
    setEditing(false);
  }

  async function deleteRsvp(r: Rsvp) {
    if (!confirm(`Remove ${r.name}'s RSVP?`)) return;
    const { error } = await supabase.from('rsvps').delete().eq('id', r.id);
    if (error) setError(errorMessage(error));
    else setRsvps((rows) => rows.filter((x) => x.id !== r.id));
  }

  async function deleteEvent() {
    if (!event) return;
    if (!confirm(`Delete "${event.title}" and all ${rsvps.length} RSVPs? This can't be undone.`)) return;
    const { error } = await supabase.from('events').delete().eq('id', event.id);
    if (error) setError(errorMessage(error));
    else navigate('/host', { replace: true });
  }

  async function copyLink() {
    if (!event) return;
    await navigator.clipboard.writeText(shareUrl(event.slug));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  if (loading) return <p className="center-note">Loading…</p>;
  if (!event) {
    return (
      <main className="page narrow">
        <div className="card">
          <h1>Event not found</h1>
          <Link to="/host" className="btn btn-ghost">Back to my events</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <Link to="/host" className="back-link">‹ All events</Link>

      {error && <p className="error">{error}</p>}

      {editing ? (
        <div className="card">
          <h2>Edit event</h2>
          <EventForm initial={event} submitLabel="Save changes" onSubmit={saveEdits} onCancel={() => setEditing(false)} />
        </div>
      ) : (
        <div className="card host-head">
          <span className="event-emoji lg">{event.cover_emoji ?? '🎉'}</span>
          <div className="host-head-main">
            <h1>{event.title}</h1>
            <p className="muted">
              {formatEventDate(event.starts_at)}
              {event.location ? ` · ${event.location}` : ''}
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>Edit</button>
        </div>
      )}

      <div className="card share">
        <div className="share-label">Guest link</div>
        <div className="share-row">
          <input readOnly value={shareUrl(event.slug)} onFocus={(e) => e.target.select()} aria-label="Guest link" />
          <button className="btn btn-primary" onClick={copyLink}>{copied ? 'Copied!' : 'Copy'}</button>
          <a className="btn btn-ghost" href={shareUrl(event.slug)} target="_blank" rel="noreferrer">Open</a>
        </div>
        <div className="toggles">
          <label className="toggle">
            <input type="checkbox" checked={event.rsvp_open} onChange={(e) => updateEvent({ rsvp_open: e.target.checked })} />
            <span>Accepting RSVPs</span>
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={event.show_guest_list}
              onChange={(e) => updateEvent({ show_guest_list: e.target.checked })}
            />
            <span>Show guest list on the event page</span>
          </label>
        </div>
      </div>

      <div className="stats">
        <Stat value={counts.headcount} label="Headcount" highlight />
        <Stat value={counts.going} label="Going" />
        <Stat value={counts.maybe} label="Maybe" />
        <Stat value={counts.declined} label="Can't go" />
      </div>

      <div className="card">
        <div className="table-head">
          <div className="row gap-sm">
            <h2>Guests</h2>
            <span className={`live-dot${live ? ' on' : ''}`} title={live ? 'Live updates on' : 'Connecting…'}>
              {live ? 'Live' : '…'}
            </span>
          </div>
          <div className="row gap-sm wrap">
            <div className="segmented" role="tablist">
              {(['all', 'going', 'maybe', 'declined'] as Filter[]).map((f) => (
                <button key={f} role="tab" aria-selected={filter === f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>
                  {f === 'all' ? 'All' : STATUS_LABEL[f]}
                </button>
              ))}
            </div>
            <button
              className="btn btn-ghost btn-sm"
              disabled={rsvps.length === 0}
              onClick={() => downloadText(`${event.slug}-guests.csv`, rsvpsToCsv(rsvps))}
            >
              Export CSV
            </button>
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="muted empty-inline">
            {rsvps.length === 0 ? 'No RSVPs yet. Send the link around!' : 'Nobody in this group.'}
          </p>
        ) : (
          <div className="table-wrap">
            <table className="guest-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>+1s</th>
                  <th>Note</th>
                  <th>When</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.name}</strong>
                      <div className="muted small">{r.email}</div>
                    </td>
                    <td>
                      <span className={`status status-${r.status}`}>
                        {STATUS_EMOJI[r.status]} {STATUS_LABEL[r.status]}
                      </span>
                    </td>
                    <td>{r.plus_ones || '—'}</td>
                    <td className="note-cell">{r.note || <span className="muted">—</span>}</td>
                    <td className="muted small nowrap">{formatShortDate(r.updated_at)}</td>
                    <td>
                      <button className="icon-btn" onClick={() => deleteRsvp(r)} aria-label={`Remove ${r.name}`}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="danger-zone">
        <button className="btn btn-danger-ghost btn-sm" onClick={deleteEvent}>Delete event</button>
      </div>
    </main>
  );
}

function Stat({ value, label, highlight }: { value: number; label: string; highlight?: boolean }) {
  return (
    <div className={`stat${highlight ? ' highlight' : ''}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
