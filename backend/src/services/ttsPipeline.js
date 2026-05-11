import { synthesizeSpeechMp3 } from './openaiTts.js';
import { synthesizeSpeechMp3Edge } from './edgeTts.js';
import { synthesizeSpeechMp3Google } from './googleTranslateTts.js';

/**
 * OpenAI (if allowed) → Edge → Google Translate TTS.
 * @returns {Promise<{ buffer: Buffer, voice: string, ttsProvider: string }>}
 */
export async function synthesizeAdSpeechMp3({ openai, text, voiceStyle, language = 'en' }) {
  const engine = String(process.env.TTS_ENGINE || '').toLowerCase();
  if (engine === 'google-only') {
    const r = await synthesizeSpeechMp3Google({ text, language });
    return { buffer: r.buffer, voice: r.voice, ttsProvider: 'google-translate' };
  }

  const preferOpenAI =
    Boolean(openai) && String(process.env.TTS_ENGINE || '').toLowerCase() !== 'edge';
  const allowGoogle =
    String(process.env.TTS_GOOGLE_FALLBACK || '1').toLowerCase() !== '0' &&
    String(process.env.TTS_ENGINE || '').toLowerCase() !== 'google-only';

  const errors = [];

  if (preferOpenAI) {
    try {
      const r = await synthesizeSpeechMp3(openai, { text, voiceStyle });
      return { buffer: r.buffer, voice: r.voice, ttsProvider: 'openai' };
    } catch (e) {
      const m = e?.message || String(e);
      errors.push(`openai: ${m}`);
      // eslint-disable-next-line no-console
      console.warn('[AddX backend] OpenAI TTS failed:', m);
    }
  }

  try {
    const r = await synthesizeSpeechMp3Edge({ text, voiceStyle });
    return { buffer: r.buffer, voice: r.voice, ttsProvider: 'edge' };
  } catch (e) {
    const m = e?.message || String(e);
    errors.push(`edge: ${m}`);
    // eslint-disable-next-line no-console
    console.warn('[AddX backend] Edge TTS failed:', m);
  }

  if (!allowGoogle) {
    throw new Error(`All configured TTS backends failed. ${errors.join(' | ')}`);
  }

  try {
    const r = await synthesizeSpeechMp3Google({ text, language });
    // eslint-disable-next-line no-console
    console.log('[AddX backend] Using Google Translate TTS fallback (unofficial, dev/demo).');
    return { buffer: r.buffer, voice: r.voice, ttsProvider: 'google-translate' };
  } catch (e) {
    const m = e?.message || String(e);
    errors.push(`google: ${m}`);
    throw new Error(`All TTS backends failed. ${errors.join(' | ')}`);
  }
}
