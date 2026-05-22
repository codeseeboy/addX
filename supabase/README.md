# Supabase (AddX backend)

This app is designed to run with a Supabase backend:

## 1) Create project
- Create a Supabase project.
- In **SQL Editor**, run:
  - `schema.sql`
  - `rls.sql`

## 2) Storage buckets
Create buckets:
- `ad-audio` (private): generated ad voice files

Suggested path convention:
- `store/<storeId>/ads/<adId>.mp3`

## 3) Edge Functions
Edge functions referenced by the mobile app:
- `generate_ad_script`
- `generate_ad_voice`
- `create_checkout_session`
- `stripe_webhook`

## 4) Password users (one-time login, session saved on device)

In Supabase Dashboard → **Authentication → Providers**, ensure **Email** is enabled and **Confirm email** is off for dev (or confirm users manually).

From the `addx` folder (needs `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`):

```bash
npm run seed:users
```

This creates/updates:

| Username | Email | Password |
|----------|-------|----------|
| emp | emp@addx.dev | emp123 |
| azim | azim@addx.dev | azim123 |

(Supabase requires passwords at least 6 characters.)

Users sign in with **Log in** (not magic link). The app stores the Supabase session in **AsyncStorage** (phone) or **localStorage** (web) until **Log out**.

Manual alternative: Auth → Users → Add user → set email + password for each row above.

## 5) Mobile env
Create `.env.local` from `.env.example` and set:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## 6) Secrets (Edge Functions)
Configure secrets in Supabase for the functions (do not expose to client):
- `OPENAI_API_KEY` or `AZURE_*`
- `ELEVENLABS_API_KEY` (if using ElevenLabs)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY` (only if needed server-side)

