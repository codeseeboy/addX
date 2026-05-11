/**
 * One-shot: health → generate-script → generate-voice → save MP3 next to CWD.
 * Run from backend folder: node scripts/smoke-tts.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const base = process.env.SMOKE_API_BASE || 'http://127.0.0.1:5050';
const outPath = path.join(process.cwd(), 'test-addx-voice-output.mp3');

async function main() {
  const h = await fetch(`${base}/api/health`);
  console.log('GET /api/health', h.status, await h.text());

  const scrRes = await fetch(`${base}/api/ai/generate-script`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rawText: 'Coffee buy one get one free until noon.',
      voiceStyle: 'Energetic',
      language: 'en',
    }),
  });
  const scr = await scrRes.json();
  console.log(
    'POST generate-script',
    scrRes.status,
    scr.script ? `script_len=${scr.script.length}` : JSON.stringify(scr),
  );

  if (!scrRes.ok || !scr.script) {
    throw new Error('generate-script failed');
  }

  const storeId = process.env.SMOKE_STORE_ID || '00000000-0000-4000-8000-00000000addx';
  const vRes = await fetch(`${base}/api/ai/generate-voice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      script: scr.script,
      voiceStyle: 'Energetic',
      language: 'en',
      storeId,
    }),
  });
  const voice = await vRes.json();
  console.log(
    'POST generate-voice',
    vRes.status,
    voice.audioUrl ? `audioUrl=yes durationMs=${voice.durationMs} ttsProvider=${voice.ttsProvider || '?'}` : JSON.stringify(voice),
  );

  if (!vRes.ok || !voice.audioUrl) {
    console.error('Script preview:\n', String(scr.script).slice(0, 500));
    throw new Error(voice.error || 'generate-voice failed');
  }

  const audio = await fetch(voice.audioUrl);
  if (!audio.ok) {
    throw new Error(`download audio ${audio.status}`);
  }
  const buf = Buffer.from(await audio.arrayBuffer());
  fs.writeFileSync(outPath, buf);
  console.log('OK wrote', outPath, 'bytes=', buf.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
