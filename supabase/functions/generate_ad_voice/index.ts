import { corsHeaders } from '../_shared/cors.ts';

type Input = {
  script: string;
  voiceStyle?: string;
  language?: string;
  storeId: string;
  adId?: string;
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function requireEnv(name: string) {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

function inferElevenVoiceId(voiceStyle?: string) {
  // Map styles to a default voice ID if you want deterministic voices.
  // If unset, ElevenLabs default voice model may be used in your account.
  // You can override this function per your ElevenLabs voices.
  const _ = voiceStyle?.toLowerCase?.() ?? '';
  return Deno.env.get('ELEVENLABS_VOICE_ID') || '';
}

async function generateElevenLabsMp3(script: string, voiceId: string) {
  const apiKey = requireEnv('ELEVENLABS_API_KEY');
  const modelId = Deno.env.get('ELEVENLABS_MODEL_ID') || 'eleven_multilingual_v2';

  const url = voiceId
    ? `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`
    : `https://api.elevenlabs.io/v1/text-to-speech`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text: script,
      model_id: modelId,
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`ElevenLabs error ${resp.status}: ${text.slice(0, 400)}`);
  }

  const buf = new Uint8Array(await resp.arrayBuffer());
  return buf;
}

async function uploadToStorage({
  storeId,
  adId,
  bytes,
}: {
  storeId: string;
  adId: string;
  bytes: Uint8Array;
}) {
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

  const path = `store/${storeId}/ads/${adId}.mp3`;
  const uploadUrl = `${supabaseUrl}/storage/v1/object/ad-audio/${path}`;

  const up = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      'Content-Type': 'audio/mpeg',
      'x-upsert': 'true',
    },
    body: bytes,
  });

  if (!up.ok) {
    const text = await up.text().catch(() => '');
    throw new Error(`Storage upload failed ${up.status}: ${text.slice(0, 400)}`);
  }

  // Create a signed URL (private bucket)
  const signUrl = `${supabaseUrl}/storage/v1/object/sign/ad-audio/${path}`;
  const sign = await fetch(signUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ expiresIn: 60 * 60 }), // 1h
  });
  if (!sign.ok) {
    const text = await sign.text().catch(() => '');
    throw new Error(`Storage sign failed ${sign.status}: ${text.slice(0, 400)}`);
  }
  const signed = await sign.json();
  const signedUrl = `${supabaseUrl}${signed?.signedURL ?? ''}`;
  return { audioPath: path, audioUrl: signedUrl };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const input = (await req.json()) as Input;
    const script = (input.script ?? '').trim();
    const storeId = (input.storeId ?? '').trim();
    if (!script) return json(400, { error: 'script is required' });
    if (!storeId) return json(400, { error: 'storeId is required' });

    const adId = (input.adId ?? crypto.randomUUID()).trim();
    const voiceStyle = input.voiceStyle ?? 'Energetic';

    const voiceId = inferElevenVoiceId(voiceStyle);
    const mp3 = await generateElevenLabsMp3(script, voiceId);
    const { audioPath, audioUrl } = await uploadToStorage({ storeId, adId, bytes: mp3 });

    // Rough duration estimate in ms if provider doesn't return it.
    const durationMs = Math.max(8000, script.length * 60);

    return json(200, { adId, audioPath, audioUrl, durationMs });
  } catch (e) {
    return json(500, { error: (e as Error).message || 'Unknown error' });
  }
});

