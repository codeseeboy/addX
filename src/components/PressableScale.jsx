import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { appLog } from '../lib/devLog';

/**
 * PressableScale
 *
 * Tappable wrapper used by every button, tile, row, and chip in the app.
 * Springs to 0.96 on press, back to 1 on release, and triggers light
 * haptic feedback. Reanimated keeps the animation on the UI thread.
 */
export default function PressableScale({
  children,
  onPress,
  onLongPress,
  disabled,
  haptic = 'light',
  scaleTo = 0.96,
  style,
  hitSlop,
  debugTapLabel,
  ...rest
}) {
  const scale = useSharedValue(disabled ? 1 : 1);
  const opacity = useSharedValue(disabled ? 0.6 : 1);

  useEffect(() => {
    opacity.value = withSpring(disabled ? 0.6 : 1, { damping: 18, stiffness: 250 });
  }, [disabled, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withSpring(scaleTo, {
      damping: 18,
      stiffness: 380,
      mass: 0.6,
    });
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withSpring(1, {
      damping: 14,
      stiffness: 320,
      mass: 0.6,
    });
  };

  const handlePress = (e) => {
    if (disabled) return;
    const label = debugTapLabel || rest.testID || rest.accessibilityLabel || 'Pressable';
    appLog('tap', String(label));
    if (haptic === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (haptic === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (haptic === 'heavy') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    if (haptic === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onPress?.(e);
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      hitSlop={hitSlop}
      {...rest}
    >
      <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>
    </Pressable>
  );
}
