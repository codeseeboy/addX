/**
 * Calls the multi-LLM FastAPI gateway (web_llm_api_backend) — no local Ollama.
 */

const LLM_FETCH_TIMEOUT_MS = Number(process.env.LLM_GATEWAY_TIMEOUT_MS || 90000);
const LLM_RETRYABLE = new Set([502, 503, 504]);
const LLM_MAX_ATTEMPTS = Number(process.env.LLM_GATEWAY_MAX_RETRIES || 3);
const LLM_RETRY_DELAY_MS = Number(process.env.LLM_GATEWAY_RETRY_DELAY_MS || 2500);

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  const body = JSON.stringify({
    prompt,
    system,
    preferred_provider: preferredProvider,
    temperature: 0.85,
    max_tokens: 400,
  });

  let lastRes;
  let lastData = {};
  for (let attempt = 1; attempt <= LLM_MAX_ATTEMPTS; attempt++) {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), LLM_FETCH_TIMEOUT_MS);
    try {
      lastRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: ac.signal,
      });
    } catch (e) {
      clearTimeout(t);
      const isAbort = e?.name === 'AbortError';
      const transient = isAbort || /ECONNRESET|ETIMEDOUT|fetch failed/i.test(String(e?.message || e));
      if (transient && attempt < LLM_MAX_ATTEMPTS) {
        await delay(LLM_RETRY_DELAY_MS);
        continue;
      }
      throw new Error(isAbort ? `LLM gateway timed out after ${LLM_FETCH_TIMEOUT_MS}ms` : e?.message || 'LLM gateway request failed');
    }
    clearTimeout(t);

    lastData = await lastRes.json().catch(() => ({}));
    if (lastRes.ok) break;
    if (LLM_RETRYABLE.has(lastRes.status) && attempt < LLM_MAX_ATTEMPTS) {
      await delay(LLM_RETRY_DELAY_MS);
      continue;
    }
    const msg = lastData?.detail || lastData?.error || `LLM gateway HTTP ${lastRes.status}`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }

  const data = lastData;
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
