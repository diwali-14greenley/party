import type { Rsvp, RsvpStatus } from './types';

export const APP_NAME = 'Party Pool';

/** The party shown on the home page. Create it with supabase/diwali-2026.sql. */
export const FEATURED_EVENT_SLUG = 'diwali-2026';

/** 1 → "st", 2 → "nd", 3 → "rd", 4 → "th", 11 → "th", 22 → "nd" … */
export function ordinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return 'th';
  return ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
}

export function dateParts(iso: string) {
  const d = new Date(iso);
  return {
    weekday: d.toLocaleDateString(undefined, { weekday: 'long' }),
    day: String(d.getDate()).padStart(2, '0'),
    month: d.toLocaleDateString(undefined, { month: 'long' }),
    year: d.getFullYear(),
    time: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
  };
}

/** Google Calendar "add event" link (assumes a 4-hour party). */
export function googleCalendarUrl(title: string, iso: string, location?: string | null, details?: string | null) {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const start = new Date(iso);
  const end = new Date(start.getTime() + 4 * 3600_000);
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${fmt(start)}/${fmt(end)}`,
    location: location ?? '',
    details: details ?? '',
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}
export const AFTER_LOGIN_KEY = 'pp:after-login';

export const STATUS_LABEL: Record<RsvpStatus, string> = {
  going: 'Going',
  maybe: 'Maybe',
  declined: "Can't go",
};

export const STATUS_EMOJI: Record<RsvpStatus, string> = {
  going: '🙌',
  maybe: '🤔',
  declined: '😢',
};

export function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function makeSlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'party';
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

export function shareUrl(slug: string): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}#/e/${slug}`;
}

/** Value for <input type="datetime-local"> from an ISO string, in local time. */
export function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function headcount(rows: { status: RsvpStatus; plus_ones: number }[], status: RsvpStatus = 'going'): number {
  return rows.filter((r) => r.status === status).reduce((sum, r) => sum + 1 + r.plus_ones, 0);
}

export function rsvpsToCsv(rows: Rsvp[]): string {
  const header = ['Name', 'Email', 'Status', 'Plus-ones', 'Note', 'RSVPed at', 'Updated at'];
  const escape = (v: string | number | null) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((r) =>
    [r.name, r.email, STATUS_LABEL[r.status], r.plus_ones, r.note, r.created_at, r.updated_at].map(escape).join(','),
  );
  return [header.join(','), ...lines].join('\n');
}

export function downloadText(filename: string, text: string, type = 'text/csv') {
  const blob = new Blob([text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function errorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) return String((err as { message: unknown }).message);
  return 'Something went wrong. Please try again.';
}
