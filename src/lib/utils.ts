import type { Rsvp, RsvpStatus } from './types';

export const APP_NAME = 'Party Pool';
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
