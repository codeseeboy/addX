/**
 * Calls the multi-LLM FastAPI gateway (web_llm_api_backend) — no local Ollama.
 */

export async function generateJingleScript({
  gatewayBaseUrl,
  rawText,
  voiceStyle,
  language,
  preferredProvider = 'groq',
}) {
  const system = `You write short, catchy in-store promotional jingles meant to be read aloud (not sung to a melody).
Rules:
- 4 to 8 short lines, clear rhyme or rhythm, easy to speak.
- Match voice tone: ${voiceStyle}.
- Language of the jingle text: ${language}.
- No stage directions, no quotes around the whole thing, no JSON — only the spoken jingle lines.
- Mention the offer clearly; end with a simple call-to-action.`;

  const prompt = `Store promotion (use this meaning, rewrite creatively):\n${rawText.trim()}`;

  const url = `${gatewayBaseUrl.replace(/\/$/, '')}/api/generate/json`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      system,
      preferred_provider: preferredProvider,
      temperature: 0.85,
      max_tokens: 400,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.detail || data?.error || `LLM gateway HTTP ${res.status}`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  if (!data.success || !data.response || !String(data.response).trim()) {
    throw new Error(data.error || 'LLM gateway returned empty response');
  }

  let script = String(data.response).trim();
  // Strip accidental markdown fences
  script = script.replace(/^```[\w]*\n?/i, '').replace(/\n?```$/i, '').trim();

  const wordCount = script.split(/\s+/).filter(Boolean).length;
  const duration = `${Math.max(8, Math.round(wordCount / 2.6))}s`;

  return {
    script,
    duration,
    provider: data.provider,
    model: data.model,
  };
}
