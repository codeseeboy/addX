import OpenAI from 'openai';

const VOICE_BY_STYLE = {
  energetic: 'nova',
  friendly: 'nova',
  professional: 'onyx',
  casual: 'alloy',
  bold: 'echo',
};

export function pickOpenAiVoice(voiceStyle) {
  const key = String(voiceStyle || 'energetic').toLowerCase();
  return VOICE_BY_STYLE[key] || 'fable';
}

/**
 * @param {OpenAI} openai
 * @returns {Promise<{ buffer: Buffer, mime: string }>}
 */
export async function synthesizeSpeechMp3(openai, { text, voiceStyle }) {
  const voice = pickOpenAiVoice(voiceStyle);
  const response = await openai.audio.speech.create({
    model: 'tts-1',
    voice,
    input: text,
    response_format: 'mp3',
  });

  const arrayBuffer = await response.arrayBuffer();
  return { buffer: Buffer.from(arrayBuffer), mime: 'audio/mpeg', voice };
}
