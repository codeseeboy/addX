/**
 * Free TTS via Microsoft Edge online voices (no API key).
 * Import from built `out/` entry — package `main` points at `.ts` which Node cannot load.
 */
import { tts } from 'edge-tts/out/index.js';

const VOICE_BY_STYLE = {
  energetic: 'en-US-JennyNeural',
  friendly: 'en-US-AriaNeural',
  professional: 'en-US-GuyNeural',
  casual: 'en-US-AndrewNeural',
  bold: 'en-US-DavisNeural',
};

export function pickEdgeVoice(voiceStyle) {
  const key = String(voiceStyle || 'energetic').toLowerCase();
  return VOICE_BY_STYLE[key] || 'en-US-JennyNeural';
}

/**
 * @returns {Promise<{ buffer: Buffer, voice: string }>}
 */
export async function synthesizeSpeechMp3Edge({ text, voiceStyle }) {
  const voice = pickEdgeVoice(voiceStyle);
  const input = String(text || '').trim().slice(0, 4000);
  if (!input) throw new Error('Empty text for TTS');

  const audioBuffer = await tts(input, { voice });
  const buf = Buffer.isBuffer(audioBuffer) ? audioBuffer : Buffer.from(audioBuffer);
  return { buffer: buf, voice };
}
