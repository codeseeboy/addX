import React, { useEffect } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Sparkles } from 'lucide-react-native';
import Animated, {
  Easing,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { colors, radius, spacing, typography, shadows, motion } from '../theme';
import PressableScale from '../components/PressableScale';
import { useStore } from '../hooks/useStore';

export default function WelcomeSetupScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { store, checklist, setHasWelcomed } = useStore();

  const completed = checklist.filter((c) => c.done).length;
  const total = checklist.length;

  const handleStart = () => {
    setHasWelcomed(true);
    navigation.replace('MainTabs');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      <SparkleField />

      <View style={styles.body}>
        <Animated.View entering={FadeInUp.duration(motion.duration.screen)}>
          <View style={styles.iconWrap}>
            <LinearGradient
              colors={colors.gradientHero}
              style={[styles.iconGrad, shadows.glowPrimary]}
            >
              <Sparkles color="#fff" size={36} strokeWidth={2.2} />
            </LinearGradient>
          </View>
        </Animated.View>

        <Animated.Text
          entering={FadeInUp.delay(120).duration(motion.duration.screen)}
          style={styles.headline}
        >
          Welcome to AddX
        </Animated.Text>
        <Animated.Text
          entering={FadeInUp.delay(240).duration(motion.duration.screen)}
          style={styles.subhead}
        >
          {store.ownerName?.split(' ')[0]}, let's get your storefront sounding
          alive in under a minute.
        </Animated.Text>

        <Animated.View
          entering={FadeInUp.delay(360).duration(motion.duration.screen)}
          style={styles.progressBlock}
        >
          <View style={styles.progressHead}>
            <Text style={styles.progressLabel}>SETUP PROGRESS</Text>
            <Text style={styles.progressCount}>
              {completed} of {total}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${(completed / total) * 100}%` },
              ]}
            />
          </View>
        </Animated.View>

        <View style={styles.list}>
          {checklist.map((item, i) => (
            <ChecklistRow key={item.id} item={item} index={i} />
          ))}
        </View>

        <PressableScale onPress={handleStart} haptic="medium" scaleTo={0.97}>
          <LinearGradient
            colors={colors.gradientHero}
            style={[styles.cta, shadows.glowPrimary]}
          >
            <Text style={styles.ctaLabel}>Set up my store</Text>
          </LinearGradient>
        </PressableScale>

        <Text style={styles.legal}>
          You can change any of this later in Store settings.
        </Text>
      </View>
    </View>
  );
}

function ChecklistRow({ item, index }) {
  const done = item.done;
  const tickScale = useSharedValue(done ? 1 : 0);

  useEffect(() => {
    tickScale.value = withDelay(
      300 + index * 200,
      withSpring(done ? 1 : 0, { damping: 12, stiffness: 240, mass: 0.5 }),
    );
  }, [done, tickScale, index]);

  const tickStyle = useAnimatedStyle(() => ({
    transform: [{ scale: tickScale.value }],
    opacity: tickScale.value,
  }));

  return (
    <Animated.View
      entering={FadeInUp.delay(560 + index * 80).duration(420)}
      style={styles.row}
    >
      <View style={[styles.check, done && styles.checkDone]}>
        <Animated.View style={tickStyle}>
          <Check color="#fff" size={16} strokeWidth={3} />
        </Animated.View>
      </View>
      <Text style={[styles.rowLabel, done && styles.rowLabelDone]}>{item.label}</Text>
    </Animated.View>
  );
}

function SparkleField() {
  // 6 floating particles for ambient feel.
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {Array.from({ length: 6 }).map((_, i) => (
        <Sparkle key={i} index={i} />
      ))}
    </View>
  );
}

function Sparkle({ index }) {
  const x = (index * 37 + 12) % 100;
  const y = (index * 53 + 18) % 80;
  const size = 4 + (index % 3) * 2;
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.4);

  useEffect(() => {
    const seq = () =>
      withSequence(
        withTiming(0.9, { duration: 900 + index * 100, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 900 + index * 80, easing: Easing.in(Easing.cubic) }),
      );
    opacity.value = withDelay(index * 320, withRepeat(seq(), -1, false));
    scale.value = withDelay(
      index * 320,
      withRepeat(
        withSequence(
          withTiming(1.4, { duration: 900 + index * 100 }),
          withTiming(0.4, { duration: 900 + index * 80 }),
        ),
        -1,
        false,
      ),
    );
  }, [opacity, scale, index]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: index % 2 ? colors.accent : colors.primary,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.secondary },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  iconWrap: { alignItems: 'flex-start', marginBottom: spacing.xs },
  iconGrad: {
    width: 72, height: 72,
    borderRadius: radius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  headline: { ...typography.display, fontSize: 32, color: colors.textPrimary, marginTop: spacing.md },
  subhead: { ...typography.body, color: colors.textSecondary, fontSize: 16, lineHeight: 24 },

  progressBlock: { marginTop: spacing.lg, gap: spacing.xs },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { ...typography.label, color: colors.textSecondary },
  progressCount: { ...typography.captionMedium, color: colors.primary },
  progressTrack: {
    height: 6, backgroundColor: colors.surface, borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },

  list: { gap: spacing.sm, marginTop: spacing.xs, flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  check: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.dividerStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  checkDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  rowLabel: { ...typography.bodyMedium, color: colors.textPrimary },
  rowLabelDone: { color: colors.textSecondary, textDecorationLine: 'line-through' },

  cta: {
    height: 58,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: { ...typography.button, color: '#fff', fontSize: 17 },
  legal: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
