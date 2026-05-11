import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius } from '../theme';

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

/**
 * SkeletonLoader
 * Shimmer-bar placeholder for lists/cards. Uses a moving LinearGradient.
 */
export default function SkeletonLoader({
  width = '100%',
  height = 16,
  borderRadius = radius.sm,
  style,
}) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(shimmer.value, [0, 1], [-200, 200]);
    return { transform: [{ translateX }] };
  });

  return (
    <View
      style={[
        styles.base,
        { width, height, borderRadius },
        style,
      ]}
    >
      <AnimatedGradient
        colors={[
          'transparent',
          'rgba(255,255,255,0.08)',
          'transparent',
        ]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[StyleSheet.absoluteFillObject, animatedStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surfaceHover,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.divider,
  },
});
