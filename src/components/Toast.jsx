import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows } from '../theme';

/**
 * Lightweight toast system. Wrap the app in <ToastProvider> and
 * call `useToast()` to fire messages from anywhere.
 */

const ToastContext = createContext({ show: () => {} });

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const translateY = useSharedValue(120);
  const opacity = useSharedValue(0);
  const timer = useRef(null);

  const hide = useCallback(() => {
    translateY.value = withTiming(120, { duration: 220, easing: Easing.in(Easing.cubic) });
    opacity.value = withTiming(0, { duration: 220 }, (finished) => {
      if (finished) runOnJS(setToast)(null);
    });
  }, [translateY, opacity]);

  const show = useCallback(
    (msg, opts = {}) => {
      const next = {
        message: typeof msg === 'string' ? msg : msg.message,
        variant: opts.variant || msg.variant || 'info', // success | warn | info
        duration: opts.duration || msg.duration || 2200,
      };
      setToast(next);
      translateY.value = withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) });
      opacity.value = withTiming(1, { duration: 240 });
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(hide, next.duration);
    },
    [translateY, opacity, hide],
  );

  return (
    <ToastContext.Provider value={{ show, hide }}>
      {children}
      {toast && <ToastView toast={toast} translateY={translateY} opacity={opacity} />}
    </ToastContext.Provider>
  );
}

function ToastView({ toast, translateY, opacity }) {
  const insets = useSafeAreaInsets();
  const animated = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const Icon =
    toast.variant === 'success' ? CheckCircle2 :
    toast.variant === 'warn' ? AlertTriangle : Info;
  const tint =
    toast.variant === 'success' ? colors.success :
    toast.variant === 'warn' ? colors.warning : colors.accent;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        { bottom: insets.bottom + spacing.xxl },
        animated,
      ]}
    >
      <View style={[styles.toast, shadows.lg]}>
        <View style={[styles.iconWrap, { backgroundColor: tint + '22' }]}>
          <Icon color={tint} size={18} strokeWidth={2.3} />
        </View>
        <Text style={styles.message} numberOfLines={2}>{toast.message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    zIndex: 999,
  },
  toast: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.card,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.divider,
    maxWidth: 480,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    flexShrink: 1,
  },
});
