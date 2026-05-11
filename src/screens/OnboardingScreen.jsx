import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Disc3,
  Mic,
  Radio,
} from 'lucide-react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors, radius, spacing, typography } from '../theme';
import PressableScale from '../components/PressableScale';
import WaveformVisualizer from '../components/WaveformVisualizer';
import { useStore } from '../hooks/useStore';

const { width: SCREEN_W } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Your store, your sound',
    subtitle:
      'Background music + your own voice ads — playing all day, no DJ needed.',
    Visual: SlideStoreAudio,
  },
  {
    id: '2',
    title: 'Type it. We voice it.',
    subtitle:
      "Just type your promotion. AddX writes the script and turns it into a real voice ad.",
    Visual: SlideAdCreation,
  },
  {
    id: '3',
    title: 'Music + Ads, on autopilot',
    subtitle:
      'Runs all day. Rotates promos at the right cadence. Built for busy US storefronts.',
    Visual: SlidePlayback,
  },
];

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

export default function OnboardingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(0);
  const listRef = useRef(null);
  const scrollX = useSharedValue(0);

  const { setHasOnboarded } = useStore();

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  const handleNext = () => {
    if (page < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: page + 1, animated: true });
      setPage(page + 1);
    } else {
      setHasOnboarded(true);
      navigation.replace('Login');
    }
  };

  const handleSkip = () => {
    setHasOnboarded(true);
    navigation.replace('Login');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      <View style={styles.topBar}>
        <View style={{ width: 60 }} />
        <Dots count={SLIDES.length} progress={scrollX} />
        <PressableScale onPress={handleSkip} hitSlop={8}>
          <Text style={styles.skip}>Skip</Text>
        </PressableScale>
      </View>

      <AnimatedFlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
          setPage(i);
        }}
        renderItem={({ item, index }) => (
          <Slide slide={item} index={index} scrollX={scrollX} />
        )}
      />

      <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.lg }]}>
        <PressableScale onPress={handleNext} haptic="medium" scaleTo={0.97}>
          <LinearGradient
            colors={colors.gradientHero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cta}
          >
            <Text style={styles.ctaLabel}>
              {page === SLIDES.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </LinearGradient>
        </PressableScale>
      </View>
    </View>
  );
}

function Slide({ slide, index, scrollX }) {
  const { Visual, title, subtitle } = slide;

  const parallaxStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_W,
      index * SCREEN_W,
      (index + 1) * SCREEN_W,
    ];
    const translateX = interpolate(scrollX.value, inputRange, [-90, 0, 90], Extrapolation.CLAMP);
    const scale = interpolate(scrollX.value, inputRange, [0.9, 1, 0.9], Extrapolation.CLAMP);
    const opacity = interpolate(scrollX.value, inputRange, [0.3, 1, 0.3], Extrapolation.CLAMP);
    return {
      transform: [{ translateX }, { scale }],
      opacity,
    };
  });

  return (
    <View style={[styles.slide, { width: SCREEN_W }]}>
      <Animated.View style={[styles.visualWrap, parallaxStyle]}>
        <Visual />
      </Animated.View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function Dots({ count, progress }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: count }).map((_, i) => (
        <Dot key={i} index={i} progress={progress} />
      ))}
    </View>
  );
}

function Dot({ index, progress }) {
  const style = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * SCREEN_W, index * SCREEN_W, (index + 1) * SCREEN_W];
    const w = interpolate(progress.value, inputRange, [8, 24, 8], Extrapolation.CLAMP);
    const opacity = interpolate(progress.value, inputRange, [0.4, 1, 0.4], Extrapolation.CLAMP);
    return { width: w, opacity };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

// =============================================================================
// Slide visuals — built with primitives so no asset packing is required.
// =============================================================================

function SlideStoreAudio() {
  const rot = useSharedValue(0);
  React.useEffect(() => {
    rot.value = withRepeat(
      withTiming(1, { duration: 9000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rot]);
  const discStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value * 360}deg` }],
  }));

  return (
    <View style={styles.illustration}>
      <LinearGradient
        colors={['#22305A', '#16213E']}
        style={styles.discBg}
      >
        <Animated.View style={[styles.disc, discStyle]}>
          <View style={styles.discInner}>
            <Disc3 color={colors.primary} size={60} strokeWidth={1.6} />
          </View>
        </Animated.View>
      </LinearGradient>

      <View style={styles.floatChip}>
        <Radio color={colors.accent} size={16} />
        <Text style={styles.floatChipText}>Music + Ads</Text>
      </View>
    </View>
  );
}

function SlideAdCreation() {
  return (
    <View style={styles.illustration}>
      <View style={styles.cardMock}>
        <View style={styles.cardHeader}>
          <View style={[styles.dotBig, { backgroundColor: colors.success }]} />
          <Text style={styles.cardLabel}>YOUR PROMO</Text>
        </View>
        <Text style={styles.cardBody}>
          "Buy 2 energy drinks, get 1 free."
        </Text>
        <View style={styles.cardFooter}>
          <Mic color={colors.primary} size={16} />
          <Text style={styles.cardFooterText}>Generating script…</Text>
        </View>
      </View>

      <View style={[styles.cardMock, styles.cardMockShifted]}>
        <View style={styles.cardHeader}>
          <View style={[styles.dotBig, { backgroundColor: colors.primary }]} />
          <Text style={[styles.cardLabel, { color: colors.primary }]}>VOICE AD</Text>
        </View>
        <Text style={styles.cardBody} numberOfLines={3}>
          "Hey there! Big deal today only — pick up any 2 energy drinks…"
        </Text>
        <View style={styles.cardFooter}>
          <WaveformVisualizer playing color={colors.primary} size="sm" barCount={5} />
          <Text style={[styles.cardFooterText, { color: colors.textSecondary }]}>18s</Text>
        </View>
      </View>
    </View>
  );
}

function SlidePlayback() {
  return (
    <View style={styles.illustration}>
      <LinearGradient
        colors={['#1F2A4F', '#16213E']}
        style={styles.bigPlayCard}
      >
        <Text style={styles.bigPlayLabel}>NOW PLAYING</Text>
        <Text style={styles.bigPlayTitle}>Summer Vibes — Lo-fi</Text>
        <View style={{ marginVertical: spacing.md }}>
          <WaveformVisualizer playing color={colors.primary} size="lg" barCount={9} />
        </View>
        <View style={styles.queueRow}>
          <View style={[styles.queueChip, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.queueChipText, { color: colors.primary }]}>NEXT AD</Text>
          </View>
          <Text style={styles.queueText}>in 3 songs</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.secondary },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  skip: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    width: 60,
    textAlign: 'right',
  },
  dotsRow: { flexDirection: 'row', gap: 6 },
  dot: { height: 8, borderRadius: 4, backgroundColor: colors.primary },

  slide: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  visualWrap: {
    flex: 0.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 0.4,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  title: { ...typography.h1, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, lineHeight: 24 },

  bottom: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  cta: {
    height: 58,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: { ...typography.button, color: colors.textPrimary, fontSize: 17 },

  // Slide visuals
  illustration: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  discBg: {
    width: '95%',
    aspectRatio: 1,
    borderRadius: radius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  disc: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#0E1424',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: colors.primary,
  },
  discInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primarySoft,
  },
  floatChip: {
    position: 'absolute',
    bottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  floatChipText: { ...typography.captionMedium, color: colors.textPrimary },

  cardMock: {
    width: '85%',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
    gap: spacing.sm,
  },
  cardMockShifted: {
    marginTop: -spacing.sm,
    transform: [{ rotate: '-2.5deg' }, { translateX: -10 }],
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dotBig: { width: 8, height: 8, borderRadius: 4 },
  cardLabel: { ...typography.label, color: colors.textSecondary },
  cardBody: { ...typography.bodyMedium, color: colors.textPrimary, lineHeight: 22 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4 },
  cardFooterText: { ...typography.caption, color: colors.primary },

  bigPlayCard: {
    width: '95%',
    aspectRatio: 1,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    justifyContent: 'center',
    gap: spacing.sm,
  },
  bigPlayLabel: { ...typography.label, color: colors.primary },
  bigPlayTitle: { ...typography.h2, color: colors.textPrimary },
  queueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  queueChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  queueChipText: { ...typography.label },
  queueText: { ...typography.captionMedium, color: colors.textSecondary },
});
