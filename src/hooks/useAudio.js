import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Audio } from 'expo-av';
// Dev safety: stream remote URLs directly (no filesystem caching) to avoid load/toggle failures.
// If we re-add caching later, we can do it with the newer filesystem API safely.

/**
 * useAudio — real playback hook using expo-av.
 *
 * - Plays a remote URL or cached local file path
 * - Exposes { playing, progress, play, pause, stop, toggle, release, durationMs }
 * - `release()` fully stops + unloads (use when leaving a screen so no ghost audio).
 * - Optional onDidJustFinish when a track reaches the end
 */
export default function useAudio({
  sourceUri = null,
  durationMsFallback = 18000,
  autoPlay = false,
  cacheKey = null,
  onDidJustFinish = null,
} = {}) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [durationMs, setDurationMs] = useState(durationMsFallback);
  const soundRef = useRef(null);
  const cachedUriRef = useRef(null);
  /** Bumps when unloading / switching source so in-flight `createAsync` never keeps a stale Sound. */
  const generationRef = useRef(0);
  const onFinishRef = useRef(onDidJustFinish);
  onFinishRef.current = onDidJustFinish;

  const effectiveCacheKey = useMemo(() => cacheKey || sourceUri || 'audio', [cacheKey, sourceUri]);

  const invalidateAndUnload = useCallback(() => {
    generationRef.current += 1;
    const s = soundRef.current;
    soundRef.current = null;
    if (s) {
      s.stopAsync().catch(() => {});
      s.unloadAsync().catch(() => {});
    }
    setPlaying(false);
    setProgress(0);
  }, []);

  const release = useCallback(async () => {
    invalidateAndUnload();
  }, [invalidateAndUnload]);

  const ensureLoaded = useCallback(async () => {
    if (!sourceUri) throw new Error('No audio source');
    const startGen = generationRef.current;

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      playThroughEarpieceAndroid: false,
      shouldDuckAndroid: true,
    });

    // Stream remote URL directly for reliability.
    const cachedUri = sourceUri;
    cachedUriRef.current = sourceUri;

    if (generationRef.current !== startGen) {
      throw new Error('aborted');
    }

    if (soundRef.current) {
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }

    // `downloadFirst: true` (expo-av default) forces a full fetch before load — Jamendo HTTPS streams
    // often never finish / fail on Android; false streams like a normal media player.
    const { sound } = await Audio.Sound.createAsync(
      { uri: cachedUri },
      { shouldPlay: false, progressUpdateIntervalMillis: 250 },
      (status) => {
        if (!status?.isLoaded) return;
        const dur = status.durationMillis || durationMsFallback;
        const pos = status.positionMillis || 0;
        setDurationMs(dur);
        setProgress(dur ? Math.min(1, pos / dur) : 0);
        setPlaying(Boolean(status.isPlaying));
        if (status.didJustFinish) {
          setProgress(0);
          setPlaying(false);
          try {
            onFinishRef.current?.();
          } catch {
            // ignore consumer errors
          }
        }
      },
      false,
    );

    if (generationRef.current !== startGen) {
      await sound.unloadAsync().catch(() => {});
      throw new Error('aborted');
    }

    if (soundRef.current) {
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }

    soundRef.current = sound;
    return sound;
  }, [sourceUri, effectiveCacheKey, durationMsFallback]);

  const play = useCallback(async () => {
    try {
      const sound = soundRef.current || (await ensureLoaded());
      await sound.playAsync();
    } catch (e) {
      if (e?.message === 'aborted') return;
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn('[useAudio] play failed', e?.message || e);
      }
      throw e;
    }
  }, [ensureLoaded]);

  const pause = useCallback(async () => {
    if (!soundRef.current) return;
    await soundRef.current.pauseAsync().catch(() => {});
    setPlaying(false);
  }, []);

  const stop = useCallback(async () => {
    if (!soundRef.current) return;
    await soundRef.current.stopAsync().catch(() => {});
    setProgress(0);
    setPlaying(false);
  }, []);

  /** Use native playback state — React `playing` can lag behind the OS, causing double play(). */
  const toggle = useCallback(async () => {
    try {
      const cur = soundRef.current;
      if (cur) {
        const status = await cur.getStatusAsync();
        if (status?.isLoaded && status.isPlaying) {
          await cur.pauseAsync().catch(() => {});
          setPlaying(false);
          return;
        }
      }
      const sound = cur || (await ensureLoaded());
      await sound.playAsync();
    } catch (e) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn('[useAudio] toggle failed', e?.message || e);
      }
    }
  }, [ensureLoaded]);

  useEffect(() => {
    setDurationMs(durationMsFallback);
  }, [sourceUri, durationMsFallback]);

  useEffect(() => {
    if (!sourceUri) return;
    let cancelled = false;
    ensureLoaded()
      .then((sound) => {
        if (cancelled) return;
        return autoPlay ? sound.playAsync() : null;
      })
      .catch((e) => {
        if (e?.message === 'aborted') return;
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn('[useAudio] load failed', e?.message || e);
        }
      });

    return () => {
      cancelled = true;
      invalidateAndUnload();
    };
  }, [sourceUri, autoPlay, ensureLoaded, invalidateAndUnload]);

  return {
    playing,
    progress,
    durationMs,
    play,
    pause,
    stop,
    toggle,
    release,
    cachedUri: cachedUriRef.current,
  };
}
