import { corsHeaders } from '../_shared/cors.ts';

type Input = {
  rawText: string;
  voiceStyle?: string;
  language?: string;
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function estimateDurationSeconds(script: string) {
  const words = script.trim().split(/\s+/).filter(Boolean).length;
  // Simple speaking-rate heuristic; keep UI behavior consistent.
  return Math.max(8, Math.round(words / 2.6));
}

async function callOpenAI({ rawText, voiceStyle, language }: Required<Input>) {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY');

  const system =
    'You write short, clear in-store retail audio ads. Keep it friendly, actionable, and under ~20 seconds. Avoid exaggerated claims.';

  const user = [
    `Rewrite this promotion into a polished spoken script.`,
    `Voice style: ${voiceStyle}`,
    `Language: ${language}`,
    `Promotion: ${rawText}`,
    '',
    `Return ONLY the final script text (no quotes, no markdown).`,
  ].join('\n');

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      temperature: 0.7,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`OpenAI error ${resp.status}: ${text.slice(0, 400)}`);
  }

  const data = await resp.json();
  const script = (data?.choices?.[0]?.message?.content ?? '').trim();
  if (!script) throw new Error('OpenAI returned empty script');
  return script;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const input = (await req.json()) as Input;
    const rawText = (input.rawText ?? '').trim();
    if (!rawText) return json(400, { error: 'rawText is required' });

    const voiceStyle = (input.voiceStyle ?? 'Energetic').toString();
    const language = (input.language ?? 'English').toString();

    const script = await callOpenAI({ rawText, voiceStyle, language });
    const duration = `${estimateDurationSeconds(script)}s`;
    return json(200, { script, duration });
  } catch (e) {
    return json(500, { error: (e as Error).message || 'Unknown error' });
  }
});

