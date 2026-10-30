-- ============================================================
-- Party Pool — RSVP confirmation emails (database part)
-- Run once in Supabase → SQL Editor. Safe to re-run.
-- ============================================================

alter table public.rsvps add column if not exists confirmation_sent_at timestamptz;

-- Called by the rsvp-confirmation edge function.
-- Returns the RSVP + event details ONLY if a confirmation should go out now,
-- and marks it as sent in the same step, so one RSVP can't be used to spam an inbox:
--   • first RSVP                     → send
--   • RSVP changed later             → send again (at most once every 30 seconds)
--   • anything else / wrong token    → returns nothing
drop function if exists public.claim_rsvp_confirmation(uuid, uuid);
create function public.claim_rsvp_confirmation(p_event_id uuid, p_edit_token uuid)
returns table (
  name text, email text, status text, note text,
  title text, description text, starts_at timestamptz, location text, slug text
)
language sql volatile security definer set search_path = public as $$
  update rsvps r
     set confirmation_sent_at = now()
    from events e
   where r.event_id = p_event_id
     and r.edit_token = p_edit_token
     and e.id = r.event_id
     and (
       r.confirmation_sent_at is null
       or (r.updated_at > r.confirmation_sent_at and r.confirmation_sent_at < now() - interval '30 seconds')
     )
  returning r.name, r.email, r.status, r.note, e.title, e.description, e.starts_at, e.location, e.slug;
$$;

grant execute on function public.claim_rsvp_confirmation(uuid, uuid) to anon, authenticated;
