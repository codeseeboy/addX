# AddX Backend (Node + Express)

## Run

```bash
cd backend
npm install
npm run dev
```

Uses **nodemon** to restart on `src/**` file changes (see `nodemon.json`).

Server runs on `http://localhost:4000`.

Every HTTP request is logged to the terminal as:

`[AddX backend] → METHOD /path` (redacted body when JSON)  
`[AddX backend] ← METHOD /path STATUS (Nms)`

## Required env

Copy `.env.example` to `.env` and fill:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — **required** for OpenAI TTS uploads to Storage (server-only; never in the Expo app).
- `OPENAI_API_KEY` — **required** for `POST /api/ai/generate-voice` (TTS MP3).
- `LLM_GATEWAY_URL` — base URL of `web_llm_api_backend` (default `http://127.0.0.1:8000`). Run that project with `python run.py` and add provider keys in its `.env`.
- `JAMENDO_CLIENT_ID` — **required** for `GET /api/music/jamendo/playlist` (legal streaming preview URLs).
- `SUPABASE_AD_AUDIO_BUCKET` — optional; default `ad-audio` (create bucket via `supabase/storage_ad_audio.sql`).
- `AUTH_DEEP_LINK` (optional) — native redirect after `/auth/open` (default `addx://auth/callback`; Expo Go may need `exp://…`)

## API endpoints

- `GET /api/health`
- `GET /auth/open` — **magic-link browser bridge** (HTML → redirects to native app)
- `POST /api/auth/magic-link`
- `POST /api/ai/generate-script` — jingle script via **LLM gateway** (`/api/generate/json`)
- `POST /api/ai/generate-voice` — OpenAI **TTS** + upload to Supabase Storage → returns `audioUrl` + `audioPath`
- `GET /api/music/jamendo/playlist?tags=pop&limit=25` — Jamendo tracks (JSON)
- `POST /api/billing/create-checkout-session`

## Magic link email not arriving?

1. **Phone must reach your backend**  
   In the app `.env.local`, set `EXPO_PUBLIC_API_BASE_URL` to your PC’s LAN IP, e.g. `http://192.168.1.50:4000/api` (not `10.0.2.2` on a real device). Restart Expo.

2. **Supabase redirect URL**  
   The app sends `emailRedirectTo` (from `expo-linking`, often `exp://...` in Expo Go or `addx://...` in a dev build). In Supabase: **Authentication → URL Configuration → Redirect URLs** — add that exact URL (copy from Metro `console.log` in dev when you tap “Send magic link”).

3. **Spam / Promotions**  
   Supabase mail often lands in spam.

4. **Supabase logs**  
   **Authentication → Users** and project **Logs** to see if the send failed (rate limit, SMTP, etc.).

## Magic link opens `localhost:3000` then “refused to connect”?

That URL comes from **Supabase → Authentication → URL Configuration → Site URL** (default is often `http://localhost:3000`). Nothing is running there on your PC.

**Fix (recommended):**

1. App `.env.local`: set **`EXPO_PUBLIC_AUTH_BRIDGE_URL=http://YOUR_PC_LAN_IP:4000`** (same host as API, **no** `/api`). Example: `http://10.207.26.145:4000`.
2. Supabase **Redirect URLs**: add exactly:  
   `http://YOUR_PC_LAN_IP:4000/auth/open`
3. Supabase **Site URL**: change from `http://localhost:3000` to the same bridge URL, e.g. `http://10.207.26.145:4000/auth/open` (or your production `https://…` later).
4. Backend serves **`GET /auth/open`** — browser loads it, then redirects to **`AUTH_DEEP_LINK`** from backend `.env` (default `addx://auth/callback`) with the same `?code=` or `#access_token=` as Supabase appended.
5. **Expo Go:** if `addx://` does not open the app from the browser, set backend `.env` **`AUTH_DEEP_LINK`** to the Expo URL Metro shows, e.g. `exp://10.207.26.145:8081/--/auth/callback`, then restart the backend.

