import { useCallback, useState } from 'react';
import { generateAdScript, generateAdVoice } from '../lib/supabaseFunctions';
import { useStore } from './useStore';

/**
 * useAdCreation — encapsulates the 4-step ad creation flow state.
 *
 * Steps:
 *   1. raw text input
 *   2. choose voice + language
 *   3. preview generated script + audio
 *   4. saved confirmation
 *
 * The two AI hooks (`generateScript`, `generateVoice`) are clearly marked
 * for swap with real LLM/TTS endpoints.
 */
export default function useAdCreation() {
  const { store } = useStore();
  const [step, setStep] = useState(1);
  const [rawText, setRawText] = useState('');
  const [voiceStyle, setVoiceStyle] = useState('energetic');
  const [language, setLanguage] = useState('en');
  const [script, setScript] = useState('');
  const [duration, setDuration] = useState('15s');
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioPath, setAudioPath] = useState(null);
  const [durationMs, setDurationMs] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const reset = useCallback(() => {
    setStep(1);
    setRawText('');
    setVoiceStyle('energetic');
    setLanguage('en');
    setScript('');
    setDuration('15s');
    setAudioUrl(null);
    setAudioPath(null);
    setDurationMs(null);
    setGenerating(false);
    setError(null);
  }, []);

  const next = useCallback(() => setStep((s) => Math.min(4, s + 1)), []);
  const prev = useCallback(() => setStep((s) => Math.max(1, s - 1)), []);

  // ============================================
  // TODO: INTEGRATE LLM HERE
  // Function: generateAdScript(rawText, voiceStyle, language)
  // Input: { rawText: string, voiceStyle: string, language: string }
  // Expected Output: { script: string, duration: string }
  // Replace dummyGenerateAdScript() with real API call
  // ============================================
  const generateScript = useCallback(async () => {
    setGenerating(true);
    setError(null);
    try {
      const result = await generateAdScript({
        rawText,
        voiceStyle: capitalize(voiceStyle),
        language,
      });
      setScript(result.script);
      setDuration(result.duration);
      return result;
    } catch (e) {
      setError(e?.message || 'Could not generate script');
      throw e;
    } finally {
      setGenerating(false);
    }
  }, [rawText, voiceStyle, language]);

  // ============================================
  // TODO: INTEGRATE LLM HERE
  // Function: generateAdVoice(script, voiceStyle, language)
  // Input: { script: string, voiceStyle: string, language: string }
  // Expected Output: { audioUrl: string, durationMs: number }
  // Replace dummyGenerateAdVoice() with TTS API
  // ============================================
  const generateVoice = useCallback(async (opts = {}) => {
    setGenerating(true);
    try {
      const storeId = opts.storeId ?? store?.id;
      if (!storeId) {
        throw new Error(
          'Store id missing. Open Home, pull to refresh, then try again (this is app data load — not your SQL schema).',
        );
      }

      // After `generateScript()`, React may not have re-rendered yet — pass `opts.script` from that result.
      const scriptBody =
        typeof opts.script === 'string' && opts.script.trim()
          ? opts.script.trim()
          : (script || '').trim();
      if (!scriptBody) {
        throw new Error('Script is required');
      }

      const result = await generateAdVoice({
        script: scriptBody,
        voiceStyle: capitalize(voiceStyle),
        language,
        storeId,
      });
      setDurationMs(result.durationMs);
      setAudioUrl(result.audioUrl);
      setAudioPath(result.audioPath || null);
      return result;
    } finally {
      setGenerating(false);
    }
  }, [script, voiceStyle, language, store?.id]);

  return {
    step, setStep, next, prev, reset,
    rawText, setRawText,
    voiceStyle, setVoiceStyle,
    language, setLanguage,
    script, setScript,
    duration,
    audioUrl,
    audioPath,
    durationMs,
    generating, error,
    generateScript, generateVoice,
  };
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
