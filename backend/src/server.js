import 'dotenv/config';
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

import { generateJingleScript } from './services/llmGateway.js';
import { fetchJamendoTracks } from './services/jamendo.js';
import { synthesizeAdSpeechMp3 } from './services/ttsPipeline.js';

const app = express();
const port = Number(process.env.PORT || 4000);

const llmGatewayBaseUrl = (process.env.LLM_GATEWAY_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const jamendoClientId = process.env.JAMENDO_CLIENT_ID || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const storageBucket = process.env.SUPABASE_AD_AUDIO_BUCKET || 'ad-audio';

function requestLogger(req, res, next) {
  const started = Date.now();
  let safeBody = req.body;
  if (req.body && typeof req.body === 'object') {
    safeBody = { ...req.body };
    if (typeof safeBody.email === 'string') {
      const e = safeBody.email;
      safeBody.email = e.length > 2 ? `${e.slice(0, 2)}***@${e.split('@')[1] || ''}` : '***';
    }
    if (typeof safeBody.script === 'string' && safeBody.script.length > 120) {
      safeBody.script = `${safeBody.script.slice(0, 120)}…`;
    }
  }
  // eslint-disable-next-line no-console
  console.log(`[AddX backend] → ${req.method} ${req.originalUrl}`, safeBody && Object.keys(safeBody).length ? safeBody : '');
  res.on('finish', () => {
    // eslint-disable-next-line no-console
    console.log(`[AddX backend] ← ${req.method} ${req.originalUrl} ${res.statusCode} (${Date.now() - started}ms)`);
  });
  next();
}

app.use(cors());
app.use(express.json({ limit: '2mb' }));

/**
 * Browser opens this URL after Supabase verifies the magic link (http, same Wi‑Fi as phone).
 * Page immediately redirects to the native app deep link with the same ?query and #hash
 * (tokens / code stay in the URL).
 */
const authDeepLink = (process.env.AUTH_DEEP_LINK || 'addx://auth/callback').replace(/\/$/, '');

app.get('/auth/open', (_req, res) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>AddX</title>
</head>
<body style="font-family:system-ui,sans-serif;padding:24px;background:#1A1A2E;color:#eee;">
  <p style="font-size:18px;">Opening AddX…</p>
  <p id="hint" style="color:#aaa;font-size:14px;">If nothing happens, open the AddX app manually.</p>
  <script>
    (function () {
      var q = window.location.search || '';
      var h = window.location.hash || '';
      var app = ${JSON.stringify(authDeepLink)} + q + h;
      try { window.location.replace(app); } catch (e) {}
      setTimeout(function () {
        var el = document.getElementById('hint');
        if (el) el.textContent = 'Deep link: ' + app;
      }, 1200);
    })();
  </script>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

app.use(requestLogger);

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const supabaseAdmin =
  supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'addx-backend',
    hasSupabase: Boolean(supabase),
    hasSupabaseAdmin: Boolean(supabaseAdmin),
    hasOpenAI: Boolean(openai),
    /** OpenAI TTS (optional); Edge TTS works without key. */
    hasTtsOpenAI: Boolean(openai),
    hasTtsEdgeFallback: true,
    /** Unofficial Google Translate TTS when OpenAI + Edge fail (set TTS_GOOGLE_FALLBACK=0 to disable). */
    hasTtsGoogleFallback: String(process.env.TTS_GOOGLE_FALLBACK || '1').toLowerCase() !== '0',
    hasStripe: Boolean(stripe),
    hasLlmGatewayUrl: Boolean(llmGatewayBaseUrl),
    hasJamendo: Boolean(jamendoClientId),
  });
});

app.post('/api/auth/magic-link', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Backend Supabase env missing' });
    }
    const { email, emailRedirectTo } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email is required' });

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo,
        shouldCreateUser: true,
      },
    });
    if (error) {
      // eslint-disable-next-line no-console
      console.warn('[auth/magic-link]', error.message, error.code, { emailRedirectTo });
      return res.status(400).json({
        error: error.message || 'Failed to send magic link',
        code: error.code,
        hint:
          'Supabase: Authentication → URL Configuration → Redirect URLs must include emailRedirectTo (exact). ' +
          'Expo Go links look like exp://IP:PORT/--/auth/callback — add that URL.',
      });
    }

    // eslint-disable-next-line no-console
    console.log('[auth/magic-link] ok', { email: String(email).replace(/(.{2}).*(@.*)/, '$1***$2'), emailRedirectTo });

    return res.json({ ok: true, emailRedirectTo: emailRedirectTo || null });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to send magic link' });
  }
});

const LANG_LABEL = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  pt: 'Portuguese',
};

function resolveLanguageLabel(language) {
  if (!language) return 'English';
  const key = String(language).toLowerCase();
  return LANG_LABEL[key] || String(language);
}

app.post('/api/ai/generate-script', async (req, res) => {
  try {
    const { rawText, voiceStyle = 'Energetic', language = 'en' } = req.body || {};
    if (!rawText || !String(rawText).trim()) {
      return res.status(400).json({ error: 'rawText is required' });
    }

    const languageLabel = resolveLanguageLabel(language);
    const result = await generateJingleScript({
      gatewayBaseUrl: llmGatewayBaseUrl,
      rawText: String(rawText).trim(),
      voiceStyle: String(voiceStyle),
      language: languageLabel,
      preferredProvider: process.env.LLM_GATEWAY_PREFERRED_PROVIDER || 'groq',
    });

    return res.json({
      script: result.script,
      duration: result.duration,
      llmProvider: result.provider,
      llmModel: result.model,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Script generation failed' });
  }
});

app.post('/api/ai/generate-voice', async (req, res) => {
  try {
    const { script = '', voiceStyle = 'energetic', storeId, language = 'en' } = req.body || {};
    if (!script.trim()) return res.status(400).json({ error: 'script is required' });
    if (!storeId) return res.status(400).json({ error: 'storeId is required' });
    if (!supabaseAdmin) {
      return res.status(500).json({
        error:
          'SUPABASE_SERVICE_ROLE_KEY is required for uploading ad audio. Add it to backend/.env (never ship to the app).',
      });
    }

    const text = String(script).trim().slice(0, 4000);

    const { buffer, voice, ttsProvider } = await synthesizeAdSpeechMp3({
      openai,
      text,
      voiceStyle,
      language,
    });

    const objectPath = `stores/${storeId}/ads/${randomUUID()}.mp3`;
    const { error: upErr } = await supabaseAdmin.storage.from(storageBucket).upload(objectPath, buffer, {
      contentType: 'audio/mpeg',
      upsert: false,
    });
    if (upErr) {
      return res.status(500).json({ error: upErr.message || 'Storage upload failed' });
    }

    const { data: pub } = supabaseAdmin.storage.from(storageBucket).getPublicUrl(objectPath);
    const audioUrl = pub?.publicUrl || null;
    if (!audioUrl) {
      return res.status(500).json({ error: 'Could not build public URL for uploaded audio' });
    }

    const wordCount = String(script).trim().split(/\s+/).filter(Boolean).length;
    const durationMs = Math.min(120000, Math.max(4000, Math.round(wordCount * 320)));

    return res.json({
      audioUrl,
      audioPath: objectPath,
      durationMs,
      ttsVoice: voice,
      ttsProvider,
    });
  } catch (error) {
    const msg = error?.message || 'Voice generation failed';
    return res.status(500).json({ error: msg });
  }
});

app.get('/api/music/jamendo/playlist', async (req, res) => {
  try {
    const tags = typeof req.query.tags === 'string' ? req.query.tags : 'pop';
    const limit = Number(req.query.limit) || 25;
    let tracks = await fetchJamendoTracks({
      clientId: jamendoClientId,
      tags,
      limit,
    });
    // Jamendo `tags` are music genres (pop, jazz). Business words like "retail" often return 0 tracks.
    if (!tracks.length && tags.trim().toLowerCase() !== 'pop') {
      tracks = await fetchJamendoTracks({
        clientId: jamendoClientId,
        tags: 'pop',
        limit,
      });
    }
    return res.json({ tracks });
  } catch (error) {
    const status = error.message?.includes('JAMENDO_CLIENT_ID') ? 503 : 500;
    return res.status(status).json({ error: error.message || 'Jamendo playlist failed' });
  }
});

app.post('/api/billing/create-checkout-session', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe key missing on backend' });
    }
    const { storeId, priceId, successUrl, cancelUrl } = req.body || {};
    if (!storeId || !priceId || !successUrl || !cancelUrl) {
      return res.status(400).json({ error: 'storeId, priceId, successUrl, cancelUrl are required' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: storeId,
      metadata: { store_id: storeId },
    });

    return res.json({ url: session.url, id: session.id });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Checkout failed' });
  }
});

const server = http.createServer(app);

let bindAttempts = 0;
const MAX_BIND_ATTEMPTS = 5;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    bindAttempts++;
    if (bindAttempts >= MAX_BIND_ATTEMPTS) {
      // eslint-disable-next-line no-console
      console.error(`[AddX backend] Port ${port} still busy after ${MAX_BIND_ATTEMPTS} attempts — exiting. Kill the other process manually.`);
      process.exit(1);
    }
    // eslint-disable-next-line no-console
    console.log(`[AddX backend] Port ${port} busy (attempt ${bindAttempts}/${MAX_BIND_ATTEMPTS}), retrying in 2s...`);
    setTimeout(() => server.listen(port, '0.0.0.0'), 2000);
  } else {
    // eslint-disable-next-line no-console
    console.error('[AddX backend] Server error:', err);
  }
});

server.on('listening', () => {
  // eslint-disable-next-line no-console
  console.log(`AddX backend listening on http://0.0.0.0:${port} (phone: http://<YOUR_PC_LAN_IP>:${port}/api/health)`);
  // eslint-disable-next-line no-console
  console.log(`Auth bridge: http://<YOUR_PC_LAN_IP>:${port}/auth/open`);
});

server.listen(port, '0.0.0.0');

function gracefulShutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`\n[AddX backend] ${signal} received, closing server...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 3000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

