import { useState, type FormEvent } from 'react';
import type { PartyEvent } from '../lib/types';
import { toLocalInputValue } from '../lib/utils';

export interface EventFormValues {
  title: string;
  starts_at: string;
  location: string;
  description: string;
  cover_emoji: string;
}

const EMOJIS = ['🎉', '🎂', '🥂', '🪩', '🍕', '🎃', '🎄', '🏖️', '🎮', '💍'];

interface Props {
  initial?: PartyEvent;
  submitLabel: string;
  onSubmit: (values: EventFormValues) => Promise<void>;
  onCancel?: () => void;
}

export default function EventForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [startsAt, setStartsAt] = useState(initial ? toLocalInputValue(initial.starts_at) : '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [emoji, setEmoji] = useState(initial?.cover_emoji ?? '🎉');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await onSubmit({
        title: title.trim(),
        starts_at: new Date(startsAt).toISOString(),
        location: location.trim(),
        description: description.trim(),
        cover_emoji: emoji,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="stack">
      <div className="field">
        <span>Vibe</span>
        <div className="emoji-picker" role="radiogroup" aria-label="Event emoji">
          {EMOJIS.map((em) => (
            <button
              key={em}
              type="button"
              role="radio"
              aria-checked={emoji === em}
              className={`emoji-option${emoji === em ? ' selected' : ''}`}
              onClick={() => setEmoji(em)}
            >
              {em}
            </button>
          ))}
        </div>
      </div>
      <label className="field">
        <span>Event name</span>
        <input required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Maya's 30th" />
      </label>
      <div className="grid-2">
        <label className="field">
          <span>Date & time</span>
          <input type="datetime-local" required value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        </label>
        <label className="field">
          <span>Location</span>
          <input maxLength={200} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="The rooftop, 12 Elm St" />
        </label>
      </div>
      <label className="field">
        <span>Details</span>
        <textarea
          rows={4}
          maxLength={2000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Dress code, what to bring, parking…"
        />
      </label>
      <div className="row gap">
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : submitLabel}</button>
        {onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}
