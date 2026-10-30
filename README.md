# 🎈 Party Pool

A Partiful-style RSVP site. Hosts log in with a magic link, create events, and share one link. Guests RSVP with no account, and the host's guest list updates live.

- **Frontend:** React + TypeScript + Vite, hosted free on GitHub Pages
- **Backend:** Supabase (Postgres + Auth + Realtime), free plan

```
Guest's phone ──▶ GitHub Pages (static React app) ──▶ Supabase
                                                     ├─ Auth (host magic-link login)
                                                     ├─ Postgres (events, rsvps)
                                                     └─ Realtime (live dashboard)
```

## What's in it

| Page | URL | Who |
|---|---|---|
| Landing | `#/` | Everyone |
| Host login | `#/login` | Host (email magic link, no password) |
| My events | `#/host` | Host: list + create events |
| Event dashboard | `#/host/<id>` | Host: share link, live guest table, headcount, CSV export, open/close RSVPs |
| Event page | `#/e/<slug>` | Guests: event details, RSVP form, public guest list |

Guests can come back and change their RSVP from the same browser. A private edit token is saved in their browser's localStorage.

## Setup (about 15 minutes)

### 1. Create the Supabase project

1. Sign up at [supabase.com](https://supabase.com) and create a new project (free plan).
2. Open **SQL Editor → New query**, paste all of [`supabase/schema.sql`](supabase/schema.sql), and click **Run**.
3. Go to **Project Settings → API** and copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Publishable key** (or the legacy **anon** key) → `VITE_SUPABASE_KEY`

   Both are safe to put in browser code. Security comes from the row-level security rules in `schema.sql`. Never use the `service_role` / secret key in this app.

### 2. Run it locally

```bash
npm install
cp .env.example .env.local   # then paste your two values in
npm run dev
```

In Supabase, go to **Authentication → URL Configuration** and add `http://localhost:5173/` to **Redirect URLs**.

### 3. Deploy to GitHub Pages

1. Create a GitHub repo (e.g. `party`) and push this folder to `main`.
2. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Repo **Settings → Secrets and variables → Actions → Variables tab**, then add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_KEY`
4. Push again (or run the workflow from the **Actions** tab). Your site goes live at
   `https://<your-username>.github.io/<repo>/`.
5. Back in Supabase, open **Authentication → URL Configuration**:
   - **Site URL:** `https://<your-username>.github.io/<repo>/`
   - **Redirect URLs:** add the same URL

### 4. Throw a party

Open your site, then **Host login → New event → Copy** the guest link and send it out.

## Good to know

- **Free plan pause.** Supabase pauses free projects after about a week with no activity. If your site suddenly can't load events, open the Supabase dashboard and click **Restore project**. Guest traffic counts as activity.
- **Who can be a host?** Anyone who logs in can create their own events, but they can only see their own. To lock hosting to just you, go to **Authentication → Sign In / Providers** and turn off **Allow new users to sign up** after you've logged in once.
- **Login emails.** Supabase's built-in email sender is rate-limited and meant for testing. For a real event, add your own SMTP (e.g. Resend) under **Authentication → Emails → SMTP Settings**.
- **Spam.** Anyone with the link can RSVP, the same as Partiful. If an event goes public, you can close RSVPs from the dashboard, or add a captcha (Supabase supports Cloudflare Turnstile and hCaptcha).
- **Duplicate emails.** Each email can RSVP once per event. To change an RSVP, a guest must use the same browser, or you can delete their row from the dashboard so they can RSVP again.

## Project layout

```
supabase/schema.sql          tables, row-level security, RPC functions, realtime
src/lib/supabase.ts          client (PKCE auth so it works with the hash router)
src/lib/auth.tsx             session context
src/pages/Home.tsx           landing
src/pages/Login.tsx          magic-link login
src/pages/HostDashboard.tsx  list + create events
src/pages/HostEvent.tsx      live guest table, stats, share link, CSV
src/pages/EventPage.tsx      public invite + RSVP form
.github/workflows/deploy.yml build and publish to GitHub Pages
```
