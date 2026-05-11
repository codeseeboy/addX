import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  ChevronDown,
  ListMusic,
  Megaphone,
  Music2,
  Pause,
  Play,
  SkipForward,
  Volume2,
} from 'lucide-react-native';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { colors, radius, spacing, typography, shadows } from '../theme';
import { useStore } from '../hooks/useStore';
import { useMusicPlayback } from '../context/MusicPlaybackContext';
import WaveformVisualizer from '../components/WaveformVisualizer';
import PressableScale from '../components/PressableScale';

export default function NowPlayingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { stats } = useStore();
  const {
    store,
    playbackEnabled,
    loadError,
    loadingTracks,
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
  } = useMusicPlayback();

  const playing = stats?.currentlyPlaying;
  const isAd = mode === 'ad';
  const accentColor = isAd ? colors.accent : colors.primary;

  const closeNowPlaying = () => {
    navigation.goBack();
  };

  const dragY = useSharedValue(0);
  const dragGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) dragY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > 140 || e.velocityY > 800) {
        dragY.value = withTiming(800, { duration: 280 }, (finished) => {
          if (finished) runOnJS(closeNowPlaying)();
        });
      } else {
        dragY.value = withSpring(0, { damping: 20, stiffness: 220 });
      }
    });

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dragY.value }],
  }));

  const durSec = playing?.durationSec || Math.max(1, Math.round(durationFallback / 1000));

  return (
    <Animated.View style={[styles.root, containerStyle]}>
      <StatusBar barStyle="light-content" />
      <Backdrop isAd={isAd} accentColor={accentColor} />

      <GestureDetector gesture={dragGesture}>
        <View style={[styles.dragArea, { paddingTop: insets.top + spacing.sm }]}>
          <View style={styles.dragHandle} />
          <View style={styles.headerRow}>
            <PressableScale onPress={closeNowPlaying} hitSlop={12} style={styles.headerBtn}>
              <ChevronDown color="#fff" size={22} />
            </PressableScale>
            <View style={styles.headerCenter}>
              <Text style={styles.headerLabel}>STREAMING TO</Text>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {store.device?.name || 'This device'}
              </Text>
            </View>
            <View style={styles.headerBtn} />
          </View>
        </View>
      </GestureDetector>

      <View style={styles.body}>
        {loadingTracks && (
          <View style={styles.centerBlock}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.hint}>Loading licensed music…</Text>
          </View>
        )}

        {!loadingTracks && loadError && (
          <View style={styles.centerBlock}>
            <Text style={styles.errorTitle}>Music unavailable</Text>
            <Text style={styles.hint}>{loadError}</Text>
            <Text style={[styles.hint, { marginTop: spacing.sm }]}>
              Start the AddX backend, set JAMENDO_CLIENT_ID, and ensure the phone can reach your PC (same Wi‑Fi).
            </Text>
          </View>
        )}

        {!loadingTracks && !loadError && !sourceUri && (
          <View style={styles.centerBlock}>
            <Text style={styles.hint}>No tracks returned from Jamendo. Try again later.</Text>
          </View>
        )}

        {!loadingTracks && !loadError && sourceUri && (
          <>
            <View style={styles.visual}>
              <PulseRings color={accentColor} />
              <View style={styles.visualInner}>
                <View style={[styles.typeChip, { backgroundColor: accentColor + '33' }]}>
                  {isAd ? <Megaphone color="#fff" size={14} /> : <Music2 color="#fff" size={14} />}
                  <Text style={styles.typeChipText}>
                    {isAd ? 'AD PLAYING' : 'NOW PLAYING'}
                  </Text>
                </View>
                <WaveformVisualizer
                  playing={audio.playing}
                  color={accentColor}
                  size="xl"
                  barCount={11}
                  variant="wave"
                />
              </View>
            </View>

            <View style={styles.meta}>
              <Text style={styles.title} numberOfLines={2}>
                {isAd ? (currentAd?.title || 'Your ad') : (currentTrack?.name || '—')}
              </Text>
              {!isAd && currentTrack?.artist ? (
                <Text style={styles.artist}>{currentTrack.artist}</Text>
              ) : null}
              {isAd && currentAd?.rawText ? (
                <Text style={styles.artist} numberOfLines={2}>{currentAd.rawText}</Text>
              ) : null}

              <View style={styles.progressBlock}>
                <ProgressBar progress={audio.progress} color={accentColor} />
                <View style={styles.timesRow}>
                  <Text style={styles.time}>{formatTime(audio.progress * durSec)}</Text>
                  <Text style={styles.time}>{formatTime(durSec)}</Text>
                </View>
              </View>

              <View style={styles.controls}>
                <PressableScale style={styles.smallBtn} hitSlop={6}>
                  <Volume2 color={colors.textPrimary} size={20} />
                </PressableScale>
                <PressableScale onPress={togglePlayback} haptic="medium" scaleTo={0.94}>
                  <LinearGradient
                    colors={colors.gradientHero}
                    style={[styles.playBtn, shadows.glowPrimary]}
                  >
                    {audio.playing
                      ? <Pause color="#fff" size={32} strokeWidth={2.4} />
                      : <Play color="#fff" size={32} strokeWidth={2.4} fill="#fff" />}
                  </LinearGradient>
                </PressableScale>
                <PressableScale style={styles.smallBtn} hitSlop={6} haptic="light" onPress={skipForward}>
                  <SkipForward color={colors.textPrimary} size={20} />
                </PressableScale>
              </View>

              <View style={[styles.upNext, { backgroundColor: accentColor + '24' }]}>
                <ListMusic color={accentColor} size={16} />
                <Text style={[styles.upNextText, { color: accentColor }]}>
                  {isAd
                    ? 'Next: licensed music from Jamendo'
                    : (playbackEnabled
                      ? `After each song, your newest active ad plays when audio is ready (${activeAds.length} ready)`
                      : 'Tap Play to start. Ads will insert after each song once playback is started.')}
                </Text>
              </View>
            </View>
          </>
        )}
      </View>
    </Animated.View>
  );
}

function Backdrop({ isAd }) {
  return (
    <View style={StyleSheet.absoluteFillObject}>
      <LinearGradient
        colors={isAd ? ['#3a1f1c', '#1A1A2E'] : ['#1F2A4F', '#0E1424']}
        style={StyleSheet.absoluteFillObject}
      />
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
    </View>
  );
}

function PulseRings({ color }) {
  const r1 = useSharedValue(0);
  const r2 = useSharedValue(0);

  useEffect(() => {
    r1.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
    r2.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
  }, [r1, r2]);

  const ring1 = useAnimatedStyle(() => ({
    transform: [{ scale: 0.8 + r1.value * 0.7 }],
    opacity: 0.45 * (1 - r1.value),
  }));
  const ring2 = useAnimatedStyle(() => ({
    transform: [{ scale: 0.8 + r2.value * 1.0 }],
    opacity: 0.25 * (1 - r2.value),
  }));

  return (
    <>
      <Animated.View style={[styles.ring, ring2, { backgroundColor: color }]} />
      <Animated.View style={[styles.ring, ring1, { backgroundColor: color }]} />
    </>
  );
}

function ProgressBar({ progress, color }) {
  return (
    <View style={styles.progressTrack}>
      <View
        style={[
          styles.progressFill,
          { width: `${progress * 100}%`, backgroundColor: color },
        ]}
      />
    </View>
  );
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.secondary },

  dragArea: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  dragHandle: {
    width: 44, height: 5, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerLabel: { ...typography.label, color: 'rgba(255,255,255,0.6)' },
  headerTitle: { ...typography.bodyMedium, color: '#fff', marginTop: 2 },

  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    justifyContent: 'space-between',
  },
  centerBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  hint: {
    ...typography.body,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  errorTitle: {
    ...typography.h2,
    color: '#fff',
    textAlign: 'center',
  },
  visual: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 280, height: 280, borderRadius: 140,
  },
  visualInner: {
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  typeChipText: { ...typography.label, color: '#fff' },

  meta: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  title: { ...typography.h1, color: '#fff', fontSize: 24, textAlign: 'center' },
  artist: { ...typography.body, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },

  progressBlock: { gap: 6, marginTop: spacing.xs },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.primary },
  timesRow: { flexDirection: 'row', justifyContent: 'space-between' },
  time: { ...typography.caption, color: 'rgba(255,255,255,0.6)' },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
  },
  smallBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  playBtn: {
    width: 76, height: 76, borderRadius: 38,
    alignItems: 'center', justifyContent: 'center',
  },

  upNext: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    alignSelf: 'center',
    marginTop: spacing.xs,
  },
  upNextText: { ...typography.captionMedium, fontFamily: 'Inter_600SemiBold' },
});
