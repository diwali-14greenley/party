// Supabase Edge Function: rsvp-confirmation
// Emails a guest a confirmation (with a calendar invite) from your Gmail after they RSVP.
//
// Secrets to set in Supabase → Edge Functions → Secrets:
//   GMAIL_USER          nirmitshah231999@gmail.com
//   GMAIL_APP_PASSWORD  16-character Google app password (no spaces)
// Optional:
//   FROM_NAME           name guests see as the sender (default "Nirmit")
//   SITE_URL            your site (default https://nirmit23.github.io/party/)
//   EVENT_TZ            time zone for the email (default America/New_York)
//
// Turn OFF "Enforce JWT verification" for this function (Details/Settings tab):
// the site calls it with the public key, and the function checks the guest's private RSVP token itself.

import { createClient } from 'npm:@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer@6.9.16';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

interface Claimed {
  name: string;
  email: string;
  status: 'going' | 'maybe' | 'declined';
  note: string | null;
  title: string;
  description: string | null;
  starts_at: string;
  location: string | null;
  slug: string;
}

// --- template start
function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function whenText(iso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

function icsStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function icsEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, (c) => `\\${c}`);
}

function buildIcs(r: Claimed, url: string, uid: string): string {
  const start = new Date(r.starts_at);
  const end = new Date(start.getTime() + 4 * 3600_000);
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Party Pool//RSVP//EN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(start)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:${icsEscape(r.title)}`,
    r.location ? `LOCATION:${icsEscape(r.location)}` : '',
    `DESCRIPTION:${icsEscape((r.description ?? '') + '\n\n' + url)}`,
    `URL:${url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}

function buildEmail(r: Claimed, opts: { url: string; tz: string; fromName: string }) {
  const first = r.name.trim().split(/\s+/)[0];
  const when = whenText(r.starts_at, opts.tz);
  const headline =
    r.status === 'going' ? `You're in, ${first}!` : r.status === 'maybe' ? `Thanks, ${first}. You're a maybe.` : `Sorry you'll miss it, ${first}`;
  const lead =
    r.status === 'going'
      ? `We can't wait to celebrate with you.`
      : r.status === 'maybe'
        ? `We've saved you a spot. Update your RSVP whenever you know for sure.`
        : `Thanks for letting us know. If plans change, you can update your RSVP anytime.`;
  const answer = r.status === 'going' ? 'Going 🙌' : r.status === 'maybe' ? 'Maybe 🤔' : "Can't go 😢";
  const subject =
    r.status === 'declined' ? `RSVP received: ${r.title}` : `${r.status === 'going' ? "You're in" : 'RSVP received'}: ${r.title}, ${when}`;
  const maps = r.location ? `https://maps.google.com/?q=${encodeURIComponent(r.location)}` : null;

  const gold = '#e8b75a';
  const cream = '#fbefdc';
  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:10px 0;border-top:1px solid rgba(232,183,90,.25);font:600 11px/1.4 Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:${gold};width:110px;vertical-align:top">${label}</td>
      <td style="padding:10px 0;border-top:1px solid rgba(232,183,90,.25);font:15px/1.5 Arial,sans-serif;color:${cream}">${value}</td>
    </tr>`;

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#24040a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#24040a;padding:24px 12px">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#3a0a10;border:1px solid rgba(232,183,90,.35);border-radius:18px;overflow:hidden">
    <tr><td style="padding:32px 28px 8px;text-align:center">
      <div style="font-size:40px;line-height:1">🪔</div>
      <div style="font:600 12px/1.4 Georgia,serif;letter-spacing:.3em;text-transform:uppercase;color:${gold};margin-top:14px">${esc(r.title)}</div>
      <h1 style="margin:10px 0 6px;font:600 28px/1.25 Georgia,'Times New Roman',serif;color:#fff6dc">${esc(headline)}</h1>
      <p style="margin:0;font:italic 17px/1.5 Georgia,serif;color:${cream}">${esc(lead)}</p>
    </td></tr>
    <tr><td style="padding:20px 28px 4px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${row('Your answer', esc(answer))}
        ${row('When', esc(when))}
        ${r.location ? row('Where', `<a href="${maps}" style="color:${cream};text-decoration:underline">${esc(r.location)}</a>`) : ''}
        ${r.note ? row('Your note', esc(r.note)) : ''}
      </table>
    </td></tr>
    ${
      r.description
        ? `<tr><td style="padding:8px 28px 0;text-align:center;font:italic 16px/1.6 Georgia,serif;color:${cream};white-space:pre-line">${esc(r.description)}</td></tr>`
        : ''
    }
    <tr><td style="padding:24px 28px 32px;text-align:center">
      <a href="${opts.url}" style="display:inline-block;background:${gold};color:#2e0509;font:700 13px/1 Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;padding:14px 24px;border-radius:999px">View invitation</a>
      <p style="margin:16px 0 0;font:12px/1.5 Arial,sans-serif;color:#d8b9b4">Need to change your answer? Open the invitation in the same browser you RSVPed from,<br>or just reply to this email.</p>
    </td></tr>
  </table>
  <p style="margin:14px 0 0;font:12px/1.5 Arial,sans-serif;color:#a88">Sent by ${esc(opts.fromName)}</p>
</td></tr>
</table>
</body></html>`;

  const text = [
    headline,
    lead,
    '',
    `Your answer: ${answer}`,
    `When: ${when}`,
    r.location ? `Where: ${r.location}` : '',
    r.note ? `Your note: ${r.note}` : '',
    '',
    r.description ?? '',
    '',
    `Invitation: ${opts.url}`,
  ]
    .filter((l, i, a) => l !== '' || a[i - 1] !== '')
    .join('\n');

  return { subject, html, text };
}
// --- template end

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  try {
    const { event_id, edit_token } = await req.json();
    if (typeof event_id !== 'string' || typeof edit_token !== 'string') {
      return json({ error: 'event_id and edit_token are required' }, 400);
    }

    // Use the same public key the site used; the database function does the checking.
    const apiKey = req.headers.get('apikey') ?? req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
    const db = createClient(Deno.env.get('SUPABASE_URL')!, apiKey, { auth: { persistSession: false } });

    const { data, error } = await db.rpc('claim_rsvp_confirmation', { p_event_id: event_id, p_edit_token: edit_token });
    if (error) return json({ error: error.message }, 500);
    const r = (data as Claimed[] | null)?.[0];
    if (!r) return json({ sent: false, reason: 'already sent or not found' });

    const user = Deno.env.get('GMAIL_USER');
    const pass = Deno.env.get('GMAIL_APP_PASSWORD')?.replace(/\s+/g, '');
    if (!user || !pass) return json({ error: 'GMAIL_USER / GMAIL_APP_PASSWORD secrets are not set' }, 500);

    const fromName = Deno.env.get('FROM_NAME') || 'Nirmit';
    const tz = Deno.env.get('EVENT_TZ') || 'America/New_York';
    const site = (Deno.env.get('SITE_URL') || 'https://nirmit23.github.io/party/').replace(/\/?$/, '/');
    const url = `${site}#/e/${r.slug}`;

    const { subject, html, text } = buildEmail(r, { url, tz, fromName });

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465, // Edge Functions block 25 and 587
      secure: true,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: { name: fromName, address: user },
      replyTo: user,
      to: { name: r.name, address: r.email },
      subject,
      html,
      text,
      ...(r.status !== 'declined'
        ? { icalEvent: { method: 'PUBLISH', filename: 'invite.ics', content: buildIcs(r, url, `${r.slug}@party-pool`) } }
        : {}),
    });

    return json({ sent: true });
  } catch (err) {
    console.error(err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
