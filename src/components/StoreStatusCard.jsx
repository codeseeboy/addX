import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, MapPin } from 'lucide-react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, spacing, typography, shadows } from '../theme';
import PressableScale from './PressableScale';
import WaveformVisualizer from './WaveformVisualizer';

/**
 * StoreStatusCard — top of the Home screen.
 *
 * Communicates: store name, live status, what's playing, last heartbeat.
 * Tappable; opens the Now Playing screen.
 */
export default function StoreStatusCard({ store, stats, onPress }) {
  const isLive = store.status === 'live';
  const playing = stats?.currentlyPlaying;

  return (
    <PressableScale onPress={onPress} scaleTo={0.99}>
      <LinearGradient
        colors={isLive ? ['#1F2A4F', '#16213E'] : ['#1A1A2E', '#0E1424']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, isLive && shadows.glowPrimary]}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.label}>YOUR STORE</Text>
            <Text style={styles.name} numberOfLines={1}>{store.name}</Text>
            <View style={styles.locationRow}>
              <MapPin color={colors.textSecondary} size={13} strokeWidth={2.2} />
              <Text style={styles.location}>{store.location}</Text>
            </View>
          </View>
          <ChevronRight color={colors.textTertiary} size={22} />
        </View>

        <View style={styles.statusBlock}>
          <View style={styles.statusRow}>
            <PulsingDot live={isLive} />
            <Text style={[styles.statusText, { color: isLive ? colors.success : colors.danger }]}>
              {isLive ? 'LIVE' : 'OFFLINE'}
            </Text>
            <Text style={styles.heartbeat}>· {store.lastHeartbeat}</Text>
          </View>

          {isLive && playing && playing.type !== 'idle' && (
            <View style={styles.nowPlaying}>
              <WaveformVisualizer playing color={colors.primary} size="md" barCount={4} />
              <View style={{ flex: 1 }}>
                <Text style={styles.nowLabel}>
                  {playing.type === 'ad' ? 'NOW AD' : 'NOW PLAYING'}
                </Text>
                <Text style={styles.nowTitle} numberOfLines={1}>{playing.name}</Text>
              </View>
            </View>
          )}
        </View>
      </LinearGradient>
    </PressableScale>
  );
}

function PulsingDot({ live }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (live) {
      scale.value = withRepeat(
        withTiming(1.6, { duration: 1100, easing: Easing.out(Easing.ease) }),
        -1,
        false,
      );
      opacity.value = withRepeat(
        withTiming(0, { duration: 1100, easing: Easing.out(Easing.ease) }),
        -1,
        false,
      );
    } else {
      scale.value = 1;
      opacity.value = 0;
    }
  }, [live, scale, opacity]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.dotWrap}>
      <View style={[styles.dot, { backgroundColor: live ? colors.success : colors.danger }]} />
      {live && (
        <Animated.View
          style={[
            styles.dotRing,
            { backgroundColor: colors.success },
            ringStyle,
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
  },
  name: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  location: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statusBlock: {
    gap: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dotWrap: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotRing: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  statusText: {
    ...typography.label,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.6,
  },
  heartbeat: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  nowPlaying: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  nowLabel: {
    ...typography.label,
    color: colors.primary,
  },
  nowTitle: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    marginTop: 2,
  },
});
