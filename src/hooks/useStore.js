import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as Linking from 'expo-linking';
import { mockSettings, mockSetupChecklist } from '../data/mockData';
import { hasSupabaseConfig, supabase } from '../lib/supabase';
import { handleIncomingAuthUrl } from '../lib/authSession';
import { getAdAudioPublicUrl } from '../lib/storageUrls';

const AppStateContext = createContext(null);

const idlePlaying = {
  type: 'idle',
  name: 'Nothing playing',
  artist: '',
  progress: 0,
  durationSec: 0,
};

const emptyStats = {
  adsPlayedToday: 0,
  songsPlayedToday: 0,
  uptimePercent: 0,
  hoursLive: 0,
  currentlyPlaying: idlePlaying,
  nextAdIn: 4,
  weeklyTrend: [0, 0, 0, 0, 0, 0, 0],
};

const emptyStore = {
  id: null,
  name: '',
  type: 'gas_station',
  location: '',
  status: 'paused',
  lastHeartbeat: '—',
  subscription: 'trial',
  trialDaysLeft: 0,
  trialTotalDays: 7,
  ownerName: '',
  ownerEmail: '',
  device: {
    name: 'This device',
    model: '',
    lastSeen: '—',
    connected: false,
    battery: null,
  },
};

function playbackTitle(ev, adsById) {
  if (ev.type === 'ad') {
    const raw = ev.ref_id || '';
    const id = raw.startsWith('ad:') ? raw.slice(3) : raw;
    return adsById.get(id)?.title || 'In-store ad';
  }
  const raw = ev.ref_id || '';
  if (raw.startsWith('song:')) {
    try {
      return decodeURIComponent(raw.slice(5));
    } catch {
      return 'Music';
    }
  }
  return raw || 'Playback';
}

function formatRelative(iso) {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function AppStateProvider({ children }) {
  const [store, setStore] = useState(emptyStore);
  const [ads, setAds] = useState([]);
  const [stats, setStats] = useState(emptyStats);
  const [settings, setSettings] = useState(mockSettings);
  const [checklist, setChecklist] = useState(mockSetupChecklist);
  const [activity, setActivity] = useState([]);
  const [authed, setAuthed] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [hasWelcomed, setHasWelcomed] = useState(false);
  const bootstrapDone = useRef(false);

  const updateStore = useCallback((patch) => {
    setStore((s) => ({ ...s, ...patch }));
  }, []);

  const updateSettings = useCallback((patch) => {
    setSettings((s) => ({ ...s, ...patch }));
  }, []);

  const addAd = useCallback((ad) => {
    setAds((list) => [ad, ...list]);
    setChecklist((c) => c.map((i) => (i.id === 'first_ad' ? { ...i, done: true } : i)));
  }, []);

  const updateAd = useCallback((id, patch) => {
    setAds((list) => list.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }, []);

  const removeAd = useCallback((id) => {
    setAds((list) => list.filter((a) => a.id !== id));
  }, []);

  const toggleAdStatus = useCallback((id) => {
    setAds((list) =>
      list.map((a) =>
        a.id === id
          ? { ...a, status: a.status === 'active' ? 'paused' : 'active' }
          : a,
      ),
    );
  }, []);

  const completeChecklist = useCallback((id) => {
    setChecklist((c) => c.map((i) => (i.id === id ? { ...i, done: true } : i)));
  }, []);

  const prependPlaybackActivity = useCallback((entry) => {
    setActivity((prev) =>
      [
        {
          id: entry.id || `local_${Date.now()}`,
          type: entry.type,
          title: entry.title || 'Playback',
          time: 'just now',
        },
        ...prev,
      ].slice(0, 30),
    );
  }, []);

  const loadFromSupabase = useCallback(async () => {
    if (!hasSupabaseConfig) {
      setAuthed(false);
      setStore(emptyStore);
      setAds([]);
      setActivity([]);
      setStats(emptyStats);
      return null;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;
    if (!session?.user) {
      setAuthed(false);
      setStore(emptyStore);
      setAds([]);
      setActivity([]);
      setStats(emptyStats);
      return null;
    }

    setAuthed(true);

    const ownerUserId = session.user.id;
    const { data: storeRows, error: storeErr } = await supabase
      .from('stores')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .limit(1);
    if (storeErr) throw storeErr;

    let storeRow = storeRows?.[0];
    if (!storeRow) {
      const trialEnds = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: inserted, error: insErr } = await supabase
        .from('stores')
        .insert({
          owner_user_id: ownerUserId,
          name: 'My Store',
          type: 'gas_station',
          subscription_status: 'trial',
          trial_ends_at: trialEnds,
          location: null,
        })
        .select('*')
        .single();
      if (insErr) throw insErr;
      storeRow = inserted;

      await supabase.from('store_settings').insert({ store_id: storeRow.id }).throwOnError();
    }

    const { data: settingsRow, error: settingsErr } = await supabase
      .from('store_settings')
      .select('*')
      .eq('store_id', storeRow.id)
      .single();
    if (settingsErr) throw settingsErr;

    const { data: adRows, error: adsErr } = await supabase
      .from('ads')
      .select('*')
      .eq('store_id', storeRow.id)
      .order('created_at', { ascending: false });
    if (adsErr) throw adsErr;

    const adsById = new Map((adRows || []).map((a) => [a.id, a]));

    const { data: eventRows, error: evErr } = await supabase
      .from('playback_events')
      .select('id,type,ref_id,started_at,created_at')
      .eq('store_id', storeRow.id)
      .order('started_at', { ascending: false })
      .limit(25);
    if (evErr) throw evErr;

    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const { data: todayRows } = await supabase
      .from('playback_events')
      .select('type')
      .eq('store_id', storeRow.id)
      .gte('started_at', dayStart.toISOString());

    const trialEndsAt = storeRow.trial_ends_at ? new Date(storeRow.trial_ends_at) : null;
    const now = new Date();
    const msLeft = trialEndsAt ? trialEndsAt.getTime() - now.getTime() : 0;
    const trialDaysLeft = trialEndsAt ? Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000))) : 0;

    const email = session.user.email || '';
    const ownerName = email ? email.split('@')[0] : '';

    setStore((prev) => ({
      ...prev,
      id: storeRow.id,
      name: storeRow.name,
      type: storeRow.type,
      location: storeRow.location || prev.location || '',
      subscription: storeRow.subscription_status,
      trialDaysLeft,
      trialTotalDays: 7,
      ownerEmail: email || prev.ownerEmail,
      ownerName: ownerName || prev.ownerName,
      status: 'live',
      lastHeartbeat: 'just now',
      device: {
        ...prev.device,
        connected: true,
        lastSeen: 'just now',
      },
    }));

    setSettings((prev) => ({
      ...prev,
      adFrequency: settingsRow.ad_frequency_every_x_songs,
      musicVolume: settingsRow.music_volume,
      adVolume: settingsRow.ad_volume,
      defaultVoiceStyle: settingsRow.default_voice_style,
      defaultLanguage: settingsRow.default_language,
      autoSchedule: settingsRow.auto_schedule,
    }));

    const mappedAds = (adRows || []).map((a) => ({
      id: a.id,
      title: a.title,
      rawText: a.raw_text,
      script: a.script,
      voiceStyle: a.voice_style ? a.voice_style.charAt(0).toUpperCase() + a.voice_style.slice(1) : 'Energetic',
      language: a.language === 'en' ? 'English' : a.language,
      duration: a.duration_ms ? `${Math.round(a.duration_ms / 1000)}s` : '15s',
      durationMs: a.duration_ms || null,
      status: a.status,
      playsToday: a.plays_today || 0,
      totalPlays: a.total_plays || 0,
      createdAt: a.created_at ? String(a.created_at).slice(0, 10) : prevDate(),
      createdAtMs: a.created_at ? new Date(a.created_at).getTime() : 0,
      audioPath: a.audio_path,
      audioUrl: getAdAudioPublicUrl(a.audio_path) || undefined,
    }));

    setAds(mappedAds);

    setActivity(
      (eventRows || []).map((e) => ({
        id: e.id,
        type: e.type === 'ad' ? 'ad_played' : 'song',
        title: playbackTitle(e, adsById),
        time: formatRelative(e.started_at || e.created_at),
      })),
    );

    const songsPlayedToday = (todayRows || []).filter((r) => r.type === 'song').length;
    const adsPlayedToday = (todayRows || []).filter((r) => r.type === 'ad').length;

    setStats((prev) => ({
      ...prev,
      adsPlayedToday,
      songsPlayedToday,
      nextAdIn: settingsRow.ad_frequency_every_x_songs,
      currentlyPlaying: idlePlaying,
    }));

    setChecklist((c) =>
      c.map((i) => (i.id === 'first_ad' ? { ...i, done: mappedAds.length > 0 } : i)),
    );

    return storeRow.id;
  }, []);

  useEffect(() => {
    if (!hasSupabaseConfig) return;

    if (bootstrapDone.current) return;
    bootstrapDone.current = true;

    Linking.getInitialURL()
      .then((url) => (url ? handleIncomingAuthUrl(url) : null))
      .then(() => loadFromSupabase())
      .catch(() => {});

    const sub = Linking.addEventListener('url', ({ url }) => {
      handleIncomingAuthUrl(url)
        .then(() => loadFromSupabase())
        .catch(() => {});
    });

    const { data: authSub } = supabase.auth.onAuthStateChange(() => {
      loadFromSupabase().catch(() => {});
    });

    return () => {
      sub?.remove?.();
      authSub?.subscription?.unsubscribe?.();
    };
  }, [loadFromSupabase]);

  const value = useMemo(
    () => ({
      store,
      ads,
      stats,
      settings,
      checklist,
      activity,
      authed,
      hasOnboarded,
      hasWelcomed,
      updateStore,
      updateSettings,
      addAd,
      updateAd,
      removeAd,
      toggleAdStatus,
      completeChecklist,
      setAuthed,
      setHasOnboarded,
      setHasWelcomed,
      setStats,
      prependPlaybackActivity,
      reloadFromBackend: loadFromSupabase,
    }),
    [
      store, ads, stats, settings, checklist, activity,
      authed, hasOnboarded, hasWelcomed,
      updateStore, updateSettings, addAd, updateAd,
      removeAd, toggleAdStatus, completeChecklist,
      prependPlaybackActivity, loadFromSupabase,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useStore() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useStore must be used within AppStateProvider');
  return ctx;
}

function prevDate() {
  return new Date().toISOString().slice(0, 10);
}
