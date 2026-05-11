/**
 * Unofficial Google Translate TTS (no API key). Used only when OpenAI + Edge TTS fail.
 * Subject to Google's availability / terms — fine for dev demos; consider disabling in prod.
 */
import { getAllAudioBase64 } from '@sefinek/google-tts-api';

const LANG_MAP = {
  en: 'en',
  es: 'es',
  fr: 'fr',
  pt: 'pt',
};

/**
 * @param {{ text: string, language?: string }} opts
 * @returns {Promise<{ buffer: Buffer, voice: string }>}
 */
export async function synthesizeSpeechMp3Google({ text, language = 'en' }) {
  const lang = LANG_MAP[String(language || 'en').toLowerCase()] || 'en';
  const input = String(text || '').trim().slice(0, 4000);
  if (!input) throw new Error('Empty text for TTS');

  const host = process.env.GOOGLE_TTS_HOST || 'https://translate.google.com';
  const parts = await getAllAudioBase64(input, {
    lang,
    slow: false,
    host,
    timeout: Number(process.env.GOOGLE_TTS_TIMEOUT_MS || 20000),
    splitPunct: ',.!?\n;',
  });
  const bufs = parts.map((p) => Buffer.from(p.base64, 'base64'));
  return { buffer: Buffer.concat(bufs), voice: `google-translate:${lang}` };
}
