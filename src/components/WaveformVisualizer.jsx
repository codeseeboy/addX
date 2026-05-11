import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { colors, radius } from '../theme';

/**
 * WaveformVisualizer
 *
 * Animated vertical bars that pulse to simulate live audio playback.
 * Uses Reanimated 2 shared values per bar so the animation runs on the
 * UI thread — performant even when many lists also re-render.
 *
 * Props:
 *   playing: boolean   - bars animate when true; flatten when false
 *   color:   string    - bar color
 *   barCount: number   - number of bars (5 default)
 *   size:    'sm' | 'md' | 'lg'
 *   variant: 'pulse' | 'wave'
 */
export default function WaveformVisualizer({
  playing = true,
  color = colors.primary,
  barCount = 5,
  size = 'md',
  variant = 'pulse',
}) {
  const dims = SIZES[size] || SIZES.md;
  const bars = useMemo(
    () => Array.from({ length: barCount }, (_, i) => i),
    [barCount],
  );

  return (
    <View
      style={[
        styles.container,
        { height: dims.height, gap: dims.gap },
      ]}
      accessibilityLabel={playing ? 'Audio playing' : 'Audio paused'}
    >
      {bars.map((i) => (
        <Bar
          key={i}
          index={i}
          total={barCount}
          playing={playing}
          color={color}
          width={dims.barWidth}
          maxHeight={dims.height}
          variant={variant}
        />
      ))}
    </View>
  );
}

function Bar({ index, total, playing, color, width, maxHeight, variant }) {
  const progress = useSharedValue(0.3);

  useEffect(() => {
    if (playing) {
      const baseDuration = variant === 'wave' ? 700 : 480;
      const jitter = (index * 67) % 280;
      const duration = baseDuration + jitter;
      const delay = (index * 90) % 500;
      progress.value = withDelay(
        delay,
        withRepeat(
          withTiming(1, {
            duration,
            easing: Easing.inOut(Easing.ease),
          }),
          -1,
          true,
        ),
      );
    } else {
      cancelAnimation(progress);
      progress.value = withTiming(0.18, { duration: 220 });
    }
    return () => cancelAnimation(progress);
  }, [playing, index, progress, variant]);

  // Each bar has a slightly different baseline so the wave looks organic.
  const baseline = 0.3 + ((index * 13) % 30) / 100;
  const peak = 0.85 + ((index * 19) % 15) / 100;

  const animatedStyle = useAnimatedStyle(() => {
    const h = baseline + (peak - baseline) * progress.value;
    return {
      height: maxHeight * h,
      opacity: 0.65 + 0.35 * progress.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.bar,
        animatedStyle,
        { width, backgroundColor: color, borderRadius: width / 2 },
      ]}
    />
  );
}

const SIZES = {
  sm: { height: 14, barWidth: 2, gap: 3 },
  md: { height: 22, barWidth: 3, gap: 4 },
  lg: { height: 64, barWidth: 5, gap: 6 },
  xl: { height: 140, barWidth: 8, gap: 8 },
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bar: {
    borderRadius: radius.sm,
  },
});
