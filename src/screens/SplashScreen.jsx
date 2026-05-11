import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { colors, radius, spacing, typography } from '../theme';
import { useStore } from '../hooks/useStore';

/**
 * SplashScreen — animated brand reveal.
 * After ~1.6s, routes to Onboarding (or MainTabs if already authed).
 */
export default function SplashScreen({ navigation }) {
  const { authed, hasOnboarded } = useStore();

  const logoScale = useSharedValue(0.6);
  const logoOpacity = useSharedValue(0);
  const labelOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0.4);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 480, easing: Easing.out(Easing.cubic) });
    logoScale.value = withSpring(1, { damping: 14, stiffness: 200, mass: 0.8 });

    ringOpacity.value = withSequence(
      withTiming(0.5, { duration: 200 }),
      withDelay(80, withTiming(0, { duration: 900 })),
    );
    ringScale.value = withTiming(2.4, { duration: 1100, easing: Easing.out(Easing.cubic) });

    labelOpacity.value = withDelay(420, withTiming(1, { duration: 500 }));

    const t = setTimeout(() => {
      const next = !authed
        ? hasOnboarded
          ? 'Login'
          : 'Onboarding'
        : 'MainTabs';
      navigation.replace(next);
    }, 1700);
    return () => clearTimeout(t);
  }, [authed, hasOnboarded, navigation, logoOpacity, logoScale, ringOpacity, ringScale, labelOpacity]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({ opacity: labelOpacity.value }));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <Animated.View style={[styles.ring, ringStyle]} />
      <Animated.View style={[styles.logoBlock, logoStyle]}>
        <LogoMark />
      </Animated.View>
      <Animated.View style={[styles.labelBlock, labelStyle]}>
        <Text style={styles.tagline}>Retail Audio OS</Text>
      </Animated.View>
    </View>
  );
}

export function LogoMark({ size = 'lg' }) {
  const dims = size === 'sm' ? 28 : size === 'md' ? 44 : 72;
  const fontSize = dims;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
      <Text
        style={{
          fontFamily: 'Inter_800ExtraBold',
          fontSize,
          color: colors.textPrimary,
          letterSpacing: -2,
        }}
      >
        Add
      </Text>
      <View style={{ width: fontSize, height: fontSize, marginLeft: 2 }}>
        <LinearGradient
          colors={colors.gradientHero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text
            style={{
              fontFamily: 'Inter_800ExtraBold',
              fontSize: fontSize * 0.78,
              color: '#fff',
              letterSpacing: -2,
            }}
          >
            X
          </Text>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.primary,
    opacity: 0,
  },
  logoBlock: {
    alignItems: 'center',
  },
  labelBlock: {
    position: 'absolute',
    bottom: spacing.xxxl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  tagline: {
    ...typography.label,
    color: colors.textSecondary,
    letterSpacing: 4,
  },
});
