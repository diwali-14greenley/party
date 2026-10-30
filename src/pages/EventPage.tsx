import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { Diya, Lantern, Mandala, StringLights } from '../components/Decorations';
import { supabase } from '../lib/supabase';
import type { MyRsvp, PartyEvent, PublicGuest, RsvpStatus } from '../lib/types';
import { STATUS_EMOJI, STATUS_LABEL, dateParts, errorMessage, googleCalendarUrl, headcount } from '../lib/utils';

const tokenKey = (eventId: string) => `pp:rsvp:${eventId}`;

interface Props {
  /** Show a specific event instead of the one in the URL (used by the home page). */
  slug?: string;
  /** What to render if that event doesn't exist. */
  fallback?: ReactNode;
}

export default function EventPage({ slug: slugProp, fallback }: Props) {
  const params = useParams();
  const slug = slugProp ?? params.slug ?? '';
  const [event, setEvent] = useState<PartyEvent | null>(null);
  const [guests, setGuests] = useState<PublicGuest[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<RsvpStatus>('going');
  const [plusOnes, setPlusOnes] = useState(0);
  const [note, setNote] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [editingExisting, setEditingExisting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGuests = useCallback(async (eventId: string) => {
    const { data } = await supabase.rpc('get_guest_list', { p_event_id: eventId });
    setGuests((data as PublicGuest[] | null) ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc('get_event', { p_slug: slug }).maybeSingle();
      const ev = data as PartyEvent | null;
      setEvent(ev);
      if (ev) {
        document.title = ev.title;
        await loadGuests(ev.id);

        // Returning guest? Prefill their RSVP.
        const saved = localStorage.getItem(tokenKey(ev.id));
        if (saved) {
          const { data: mine } = await supabase.rpc('get_my_rsvp', { p_event_id: ev.id, p_edit_token: saved }).maybeSingle();
          const r = mine as MyRsvp | null;
          if (r) {
            setToken(saved);
            setName(r.name);
            setEmail(r.email);
            setStatus(r.status);
            setPlusOnes(r.plus_ones);
            setNote(r.note ?? '');
            setSubmitted(true);
          } else {
            localStorage.removeItem(tokenKey(ev.id));
          }
        }
      }
      setLoading(false);
    })();
  }, [slug, loadGuests]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!event) return;
    setBusy(true);
    setError(null);
    const { data, error } = await supabase.rpc('submit_rsvp', {
      p_event_id: event.id,
      p_name: name,
      p_email: email,
      p_status: status,
      p_plus_ones: status === 'declined' ? 0 : plusOnes,
      p_note: note,
      p_edit_token: token,
    });
    setBusy(false);
    if (error) {
      setError(errorMessage(error));
      return;
    }
    const newToken = data as string;
    localStorage.setItem(tokenKey(event.id), newToken);
    setToken(newToken);
    setSubmitted(true);
    setEditingExisting(false);
    loadGuests(event.id);
  }

  if (loading) return <p className="center-note">Loading…</p>;
  if (!event && fallback) return <>{fallback}</>;
  if (!event) {
    return (
      <main className="page narrow">
        <div className="card empty">
          <p className="big-emoji">🫥</p>
          <h1>Party not found</h1>
          <p className="muted">Double-check the link with whoever invited you.</p>
        </div>
      </main>
    );
  }

  const going = guests.filter((g) => g.status === 'going');
  const maybe = guests.filter((g) => g.status === 'maybe');
  const showForm = !submitted || editingExisting;

  const when = dateParts(event.starts_at);
  // "Diwali Party" → big "Diwali" + gold "Party" underneath
  const titleMatch = event.title.match(/^(.*\S)\s+(party)$/i);
  const titleMain = titleMatch ? titleMatch[1] : event.title;
  const titleSub = titleMatch ? titleMatch[2] : null;
  // Description: paragraphs split by blank lines; a short last paragraph (like "BYOB") becomes a glowing badge
  const paragraphs = (event.description ?? '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const badge = paragraphs.length > 1 && paragraphs[paragraphs.length - 1].length <= 24 ? paragraphs.pop() : null;

  return (
    <main className="page event-page">
      <section className="invite">
        <StringLights />
        <Lantern className="lantern-left" />
        <Lantern className="lantern-right" />

        <p className="invite-kicker">You are invited to</p>
        <h1 className="invite-title">
          <span className="invite-title-main">{titleMain}</span>
          {titleSub && <span className="invite-title-sub">{titleSub}</span>}
        </h1>

        {paragraphs.map((p, i) => (
          <p key={i} className="invite-desc">{p}</p>
        ))}

        <div className="date-block">
          <div className="date-month">{when.month}</div>
          <div className="date-row">
            <span className="date-side">{when.weekday}</span>
            <span className="date-day">{when.day}</span>
            <span className="date-side">at {when.time}</span>
          </div>
        </div>

        {event.location && (
          <a
            className="invite-address"
            href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
            target="_blank"
            rel="noreferrer"
          >
            {event.location}
          </a>
        )}

        {badge && <div className="invite-badge">{badge}</div>}

        <a
          className="btn btn-ghost btn-sm calendar-btn"
          href={googleCalendarUrl(event.title, event.starts_at, event.location, event.description)}
          target="_blank"
          rel="noreferrer"
        >
          Add to calendar
        </a>

        <div className="invite-floor">
          <Mandala />
          <Diya className="diya-main" />
        </div>
      </section>

      <section className="card rsvp-card">
        {!event.rsvp_open && !submitted ? (
          <div className="empty">
            <h2>RSVPs are closed</h2>
            <p className="muted">Reach out to the host if you still want to come.</p>
          </div>
        ) : showForm ? (
          <>
            <h2>{editingExisting ? 'Update your RSVP' : 'Are you coming?'}</h2>
            <form onSubmit={handleSubmit} className="stack">
              <div className="status-picker" role="radiogroup" aria-label="Your answer">
                {(['going', 'maybe', 'declined'] as RsvpStatus[]).map((s) => (
                  <button
                    type="button"
                    key={s}
                    role="radio"
                    aria-checked={status === s}
                    className={`status-option status-${s}${status === s ? ' selected' : ''}`}
                    onClick={() => setStatus(s)}
                  >
                    <span className="status-option-emoji">{STATUS_EMOJI[s]}</span>
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
              <div className="grid-2">
                <label className="field">
                  <span>Your name</span>
                  <input required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                </label>
                <label className="field">
                  <span>Email</span>
                  <input type="email" required maxLength={200} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                </label>
              </div>
              {status !== 'declined' && (
                <label className="field">
                  <span>Bringing anyone?</span>
                  <select value={plusOnes} onChange={(e) => setPlusOnes(Number(e.target.value))}>
                    {Array.from({ length: 6 }, (_, n) => (
                      <option key={n} value={n}>{n === 0 ? 'Just me' : `+${n}`}</option>
                    ))}
                  </select>
                </label>
              )}
              <label className="field">
                <span>Note for the host <em className="muted">(optional)</em></span>
                <textarea rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Allergies, running late, can't wait…" />
              </label>
              {error && <p className="error">{error}</p>}
              <div className="row gap">
                <button className="btn btn-primary btn-lg" disabled={busy}>
                  {busy ? 'Sending…' : editingExisting ? 'Save changes' : 'Send RSVP'}
                </button>
                {editingExisting && (
                  <button type="button" className="btn btn-ghost" onClick={() => setEditingExisting(false)}>Cancel</button>
                )}
              </div>
            </form>
          </>
        ) : (
          <div className="confirmed">
            <div className="big-emoji">{STATUS_EMOJI[status]}</div>
            <h2>
              {status === 'going' ? "You're in, " : status === 'maybe' ? 'Got it, ' : 'Thanks for letting us know, '}
              {name.split(' ')[0]}!
            </h2>
            <p className="muted">
              You answered <strong>{STATUS_LABEL[status]}</strong>
              {status !== 'declined' && plusOnes > 0 ? ` with +${plusOnes}` : ''}.
            </p>
            {event.rsvp_open && (
              <button className="btn btn-ghost" onClick={() => setEditingExisting(true)}>Change my RSVP</button>
            )}
          </div>
        )}
      </section>

      {event.show_guest_list && guests.length > 0 && (
        <section className="card guest-list">
          <h2>
            Who's coming <span className="count">{headcount(guests)}</span>
          </h2>
          <GuestChips guests={going} />
          {maybe.length > 0 && (
            <>
              <h3 className="section-label">Maybe</h3>
              <GuestChips guests={maybe} />
            </>
          )}
        </section>
      )}
    </main>
  );
}

function GuestChips({ guests }: { guests: PublicGuest[] }) {
  return (
    <ul className="chips">
      {guests.map((g, i) => (
        <li key={`${g.name}-${i}`} className="chip">
          <span className="avatar" aria-hidden>{g.name.trim().charAt(0).toUpperCase()}</span>
          {g.name}
          {g.plus_ones > 0 && <span className="plus">+{g.plus_ones}</span>}
        </li>
      ))}
    </ul>
  );
}
