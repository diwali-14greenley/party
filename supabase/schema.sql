-- ============================================================
-- Party Pool — Supabase schema
-- Paste this whole file into Supabase → SQL Editor → Run.
-- ============================================================

-- ---------- Tables ----------

create table if not exists public.events (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  slug            text not null unique check (slug ~ '^[a-z0-9-]{3,80}$'),
  title           text not null check (char_length(title) between 1 and 120),
  description     text check (char_length(description) <= 2000),
  starts_at       timestamptz not null,
  location        text check (char_length(location) <= 200),
  cover_emoji     text default '🎉',
  rsvp_open       boolean not null default true,
  show_guest_list boolean not null default true,
  created_at      timestamptz not null default now()
);

create table if not exists public.rsvps (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 80),
  email       text not null check (char_length(email) between 3 and 200),
  status      text not null check (status in ('going', 'maybe', 'declined')),
  plus_ones   int  not null default 0 check (plus_ones between 0 and 10),
  note        text check (char_length(note) <= 500),
  edit_token  uuid not null default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- One RSVP per email per event
create unique index if not exists rsvps_event_email_idx on public.rsvps (event_id, lower(email));
create index if not exists rsvps_event_idx on public.rsvps (event_id);

-- ---------- Row-level security ----------
-- Hosts (logged-in users) can only see and manage their own events and the RSVPs to them.
-- Guests never touch the tables directly; they go through the functions below.

alter table public.events enable row level security;
alter table public.rsvps  enable row level security;

drop policy if exists "hosts read own events"   on public.events;
drop policy if exists "hosts create events"     on public.events;
drop policy if exists "hosts update own events" on public.events;
drop policy if exists "hosts delete own events" on public.events;

create policy "hosts read own events"   on public.events for select to authenticated using (owner_id = auth.uid());
create policy "hosts create events"     on public.events for insert to authenticated with check (owner_id = auth.uid());
create policy "hosts update own events" on public.events for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "hosts delete own events" on public.events for delete to authenticated using (owner_id = auth.uid());

drop policy if exists "hosts read rsvps"   on public.rsvps;
drop policy if exists "hosts delete rsvps" on public.rsvps;

create policy "hosts read rsvps" on public.rsvps for select to authenticated
  using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = auth.uid()));
create policy "hosts delete rsvps" on public.rsvps for delete to authenticated
  using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = auth.uid()));

-- ---------- Public functions (what guests can call) ----------

-- Event details by its share-link slug (never exposes owner_id)
create or replace function public.get_event(p_slug text)
returns table (
  id uuid, slug text, title text, description text, starts_at timestamptz,
  location text, cover_emoji text, rsvp_open boolean, show_guest_list boolean
)
language sql stable security definer set search_path = public as $$
  select e.id, e.slug, e.title, e.description, e.starts_at, e.location,
         e.cover_emoji, e.rsvp_open, e.show_guest_list
  from events e
  where e.slug = p_slug;
$$;

-- Public guest list: names + status only, no emails or notes
create or replace function public.get_guest_list(p_event_id uuid)
returns table (name text, status text, plus_ones int)
language sql stable security definer set search_path = public as $$
  select r.name, r.status, r.plus_ones
  from rsvps r
  join events e on e.id = r.event_id
  where r.event_id = p_event_id
    and e.show_guest_list
    and r.status in ('going', 'maybe')
  order by r.created_at;
$$;

-- Lets a guest reload their own RSVP using the private token saved in their browser
create or replace function public.get_my_rsvp(p_event_id uuid, p_edit_token uuid)
returns table (name text, email text, status text, plus_ones int, note text)
language sql stable security definer set search_path = public as $$
  select r.name, r.email, r.status, r.plus_ones, r.note
  from rsvps r
  where r.event_id = p_event_id and r.edit_token = p_edit_token;
$$;

-- Create or update an RSVP. Returns the edit token the guest's browser keeps.
create or replace function public.submit_rsvp(
  p_event_id   uuid,
  p_name       text,
  p_email      text,
  p_status     text,
  p_plus_ones  int  default 0,
  p_note       text default null,
  p_edit_token uuid default null
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_open  boolean;
  v_token uuid;
  v_plus  int := case when p_status = 'declined' then 0 else coalesce(p_plus_ones, 0) end;
begin
  select rsvp_open into v_open from events where id = p_event_id;
  if v_open is null then
    raise exception 'Event not found';
  end if;
  if not v_open then
    raise exception 'RSVPs are closed for this event';
  end if;

  -- Update an existing RSVP if the browser has its token
  if p_edit_token is not null then
    update rsvps
       set name = trim(p_name),
           email = lower(trim(p_email)),
           status = p_status,
           plus_ones = v_plus,
           note = nullif(trim(p_note), ''),
           updated_at = now()
     where event_id = p_event_id and edit_token = p_edit_token
     returning edit_token into v_token;
    if v_token is not null then
      return v_token;
    end if;
  end if;

  insert into rsvps (event_id, name, email, status, plus_ones, note)
  values (p_event_id, trim(p_name), lower(trim(p_email)), p_status, v_plus, nullif(trim(p_note), ''))
  returning edit_token into v_token;
  return v_token;

exception
  when unique_violation then
    raise exception 'This email has already RSVPed. Update it from the browser you used, or ask the host.';
end;
$$;

grant execute on function public.get_event(text)                                        to anon, authenticated;
grant execute on function public.get_guest_list(uuid)                                   to anon, authenticated;
grant execute on function public.get_my_rsvp(uuid, uuid)                                to anon, authenticated;
grant execute on function public.submit_rsvp(uuid, text, text, text, int, text, uuid)   to anon, authenticated;

-- ---------- Realtime (live guest list on the host dashboard) ----------
do $$
begin
  alter publication supabase_realtime add table public.rsvps;
exception
  when duplicate_object then null;
end $$;
