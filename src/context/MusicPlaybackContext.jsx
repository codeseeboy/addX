import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Audio } from 'expo-av';
import { useStore } from '../hooks/useStore';
import useAudio from '../hooks/useAudio';
import { apiClient } from '../lib/apiClient';
import { supabase } from '../lib/supabase';

const MusicPlaybackContext = createContext(null);

/** Jamendo expects music-genre tags, not business categories. */
function jamendoTagsForStoreType(storeType) {
  const map = {
    gas_station: 'pop',
    convenience: 'pop',
    retail: 'pop',
    cafe: 'jazz',
  };
  return map[storeType] || 'pop';
}

export function MusicPlaybackProvider({ children }) {
  const {
    store,
    ads,
    settings,
    setStats,
    prependPlaybackActivity,
  } = useStore();

  /** Playback must be user-initiated (no auto-play on app open). */
  const [playbackEnabled, setPlaybackEnabled] = useState(false);

  const [queue, setQueue] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [trackIndex, setTrackIndex] = useState(0);
  const [mode, setMode] = useState('music');
  const [currentAd, setCurrentAd] = useState(null);

  const currentAdRef = useRef(currentAd);
  currentAdRef.current = currentAd;
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const queueRef = useRef(queue);
  queueRef.current = queue;
  const trackIndexRef = useRef(trackIndex);
  trackIndexRef.current = trackIndex;
  const songsSinceLastAdRef = useRef(0);
  const skippingRef = useRef(false);

  const adFrequency = Math.max(1, Number(settings?.adFrequency) || 1);

  const activeAds = useMemo(
    () => (ads || []).filter((a) => a.status === 'active' && a.audioUrl),
    [ads],
  );
  const activeAdsRef = useRef(activeAds);
  activeAdsRef.current = activeAds;

  /** Prefer newest created ad (matches “the ad I just made”). */
  const pickNextAd = useCallback(() => {
    const list = [...activeAdsRef.current];
    if (!list.length) return null;
    list.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
    return list[0];
  }, []);

  const logPlaybackEvent = useCallback(
    async (type, refId, titleForActivity) => {
      if (!store?.id) return;
      try {
        await supabase.from('playback_events').insert({
          store_id: store.id,
          type,
          ref_id: refId,
        });
      } catch {
        // RLS / network
      }
      prependPlaybackActivity?.({
        type: type === 'ad' ? 'ad_played' : 'song',
        title: titleForActivity || (type === 'ad' ? 'In-store ad' : 'Music'),
      });
    },
    [store?.id, prependPlaybackActivity],
  );

  const finishSong = useCallback(async () => {
    const q = queueRef.current;
    const idx = trackIndexRef.current;
    const track = q[idx];
    if (!track) return;

    await logPlaybackEvent('song', `song:${encodeURIComponent(track.name)}`, track.name);

    setStats((prev) => ({
      ...prev,
      songsPlayedToday: (prev.songsPlayedToday || 0) + 1,
    }));

    songsSinceLastAdRef.current += 1;
    const shouldPlayAd =
      activeAdsRef.current.length > 0 && songsSinceLastAdRef.current >= adFrequency;

    if (shouldPlayAd) {
      songsSinceLastAdRef.current = 0;
      const ad = pickNextAd();
      if (ad) {
        setCurrentAd(ad);
        setMode('ad');
        return;
      }
    }

    setTrackIndex((i) => (q.length ? (i + 1) % q.length : 0));
    setMode('music');
  }, [adFrequency, logPlaybackEvent, pickNextAd, setStats]);

  const finishAd = useCallback(async () => {
    const ad = currentAdRef.current;
    if (!ad) return;

    await logPlaybackEvent('ad', `ad:${ad.id}`, ad.title || 'In-store ad');

    setStats((prev) => ({
      ...prev,
      adsPlayedToday: (prev.adsPlayedToday || 0) + 1,
    }));

    setCurrentAd(null);
    const q = queueRef.current;
    const idx = trackIndexRef.current;
    setTrackIndex(q.length ? (idx + 1) % q.length : 0);
    setMode('music');
  }, [logPlaybackEvent, setStats]);

  const handleDidJustFinish = useCallback(() => {
    if (skippingRef.current) return;
    if (modeRef.current === 'ad') {
      void finishAd();
    } else {
      void finishSong();
    }
  }, [finishAd, finishSong]);

  const jamendoTags = useMemo(
    () => jamendoTagsForStoreType(store?.type),
    [store?.type],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingTracks(true);
      setLoadError(null);
      try {
        const data = await apiClient.get('/music/jamendo/playlist', {
          tags: jamendoTags,
          limit: '28',
        });
        if (cancelled) return;
        setQueue(Array.isArray(data?.tracks) ? data.tracks : []);
      } catch (e) {
        if (!cancelled) setLoadError(e?.message || 'Could not load music');
      } finally {
        if (!cancelled) setLoadingTracks(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [jamendoTags]);

  const currentTrack = queue[trackIndex] || null;

  const sourceUri = useMemo(() => {
    if (mode === 'ad' && currentAd?.audioUrl) return currentAd.audioUrl;
    if (mode === 'music' && currentTrack?.streamUrl) return currentTrack.streamUrl;
    return null;
  }, [mode, currentAd, currentTrack]);

  const durationFallback = useMemo(() => {
    if (mode === 'ad' && currentAd?.durationMs) return currentAd.durationMs;
    if (mode === 'ad' && currentAd?.duration) {
      const sec = parseInt(String(currentAd.duration).replace(/s$/i, ''), 10);
      if (Number.isFinite(sec)) return sec * 1000;
    }
    if (currentTrack?.durationSec) return Math.round(currentTrack.durationSec * 1000);
    return 180000;
  }, [mode, currentAd, currentTrack]);

  const cacheKey = useMemo(() => {
    if (mode === 'ad' && currentAd?.id) return `ad_${currentAd.id}`;
    if (currentTrack?.id) return `jamendo_${currentTrack.id}`;
    return sourceUri;
  }, [mode, currentAd, currentTrack, sourceUri]);

  const audio = useAudio({
    sourceUri,
    durationMsFallback: durationFallback,
    // Only auto-play after the user explicitly starts playback once.
    autoPlay: playbackEnabled && Boolean(sourceUri),
    cacheKey,
    onDidJustFinish: handleDidJustFinish,
  });

  // ------------------------------
  // AD "jingle" feel: music bed
  // ------------------------------
  // Music bed volume under the TTS so the ad feels like a jingle (not a voice memo).
  const AD_BED_VOLUME = 0.32;
  const bedUri = useMemo(() => {
    if (mode !== 'ad') return null;
    if (!queue?.length) return null;
    // queue[trackIndex] has just finished; pick next track as a bed.
    const idx = queue.length ? (trackIndex + 1) % queue.length : 0;
    return queue[idx]?.streamUrl || null;
  }, [mode, queue, trackIndex]);

  const bedSoundRef = useRef(null);

  const releaseBed = useCallback(async () => {
    const s = bedSoundRef.current;
    bedSoundRef.current = null;
    if (!s) return;
    await s.stopAsync().catch(() => {});
    await s.unloadAsync().catch(() => {});
  }, []);

  const playBed = useCallback(async () => {
    if (!bedUri) return;
    if (bedSoundRef.current) {
      const st = await bedSoundRef.current.getStatusAsync();
      if (st?.isLoaded && !st.isPlaying) {
        await bedSoundRef.current.setVolumeAsync(AD_BED_VOLUME).catch(() => {});
        await bedSoundRef.current.playAsync().catch(() => {});
      }
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      playThroughEarpieceAndroid: false,
      shouldDuckAndroid: true,
    });

    const { sound } = await Audio.Sound.createAsync(
      { uri: bedUri },
      { shouldPlay: true, isLooping: true, volume: AD_BED_VOLUME },
    );
    bedSoundRef.current = sound;
  }, [bedUri]);

  const pauseBed = useCallback(async () => {
    const s = bedSoundRef.current;
    if (!s) return;
    await s.pauseAsync().catch(() => {});
  }, []);

  // Start/stop bed automatically based on mode + playbackEnabled.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!playbackEnabled || mode !== 'ad' || !bedUri) {
        await releaseBed();
        return;
      }
      if (cancelled) return;
      await playBed();
    })();
    return () => {
      cancelled = true;
    };
  }, [playbackEnabled, mode, bedUri, playBed, releaseBed]);

  const togglePlayback = useCallback(async () => {
    if (!sourceUri) return;
    if (!playbackEnabled) {
      setPlaybackEnabled(true);
      await audio.play().catch(() => {});
      return;
    }

    // When in AD mode, toggle TTS + music bed together.
    if (mode === 'ad') {
      if (audio.playing) {
        await audio.pause();
        await pauseBed();
      } else {
        await audio.play();
        await playBed();
      }
      return;
    }

    await audio.toggle();
  }, [audio, playbackEnabled, sourceUri, mode, pauseBed, playBed]);

  const skipForward = useCallback(async () => {
    if (skippingRef.current) return;
    skippingRef.current = true;
    try {
      await audio.release();
      if (mode === 'ad') {
        await releaseBed();
      }
      if (mode === 'ad') {
        await finishAd();
      } else {
        await finishSong();
      }
    } catch {
      // ignore
    } finally {
      setTimeout(() => {
        skippingRef.current = false;
      }, 480);
    }
  }, [audio.release, mode, finishAd, finishSong, releaseBed]);

  useEffect(() => {
    const nextIn = Math.max(0, adFrequency - songsSinceLastAdRef.current);
    if (mode === 'ad' && currentAd) {
      setStats((prev) => ({
        ...prev,
        currentlyPlaying: {
          type: 'ad',
          name: currentAd.title || 'Your ad',
          artist: 'AddX',
          progress: 0,
          durationSec: Math.round(durationFallback / 1000),
        },
        nextAdIn: nextIn,
      }));
      return;
    }
    if (currentTrack) {
      setStats((prev) => ({
        ...prev,
        currentlyPlaying: {
          type: 'song',
          name: currentTrack.name,
          artist: currentTrack.artist,
          progress: 0,
          durationSec: Math.round(currentTrack.durationSec || 180),
        },
        nextAdIn: nextIn,
      }));
    }
  }, [mode, currentAd, currentTrack, adFrequency, setStats, durationFallback]);

  const value = useMemo(
    () => ({
      store,
      playbackEnabled,
      loadError,
      loadingTracks,
      trackIndex,
      mode,
      currentAd,
      currentTrack,
      sourceUri,
      durationFallback,
      audio,
      activeAds,
      adFrequency,
      skipForward,
      togglePlayback,
    }),
    [
      store,
      playbackEnabled,
      loadError,
      loadingTracks,
      trackIndex,
      mode,
      currentAd,
      currentTrack,
      sourceUri,
      durationFallback,
      audio,
      activeAds,
      adFrequency,
      skipForward,
      togglePlayback,
    ],
  );

  return (
    <MusicPlaybackContext.Provider value={value}>
      {children}
    </MusicPlaybackContext.Provider>
  );
}

export function useMusicPlayback() {
  const ctx = useContext(MusicPlaybackContext);
  if (!ctx) {
    throw new Error('useMusicPlayback must be used within MusicPlaybackProvider');
  }
  return ctx;
}
