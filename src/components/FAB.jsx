import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import { colors, radius, shadows, spacing, typography } from '../theme';
import PressableScale from './PressableScale';

/**
 * FAB — Floating Action Button.
 * Sits bottom-right with an orange gradient and a soft glow.
 */
export default function FAB({
  onPress,
  label = 'Create Ad',
  icon: Icon = Plus,
  extended = true,
  style,
}) {
  return (
    <View style={[styles.wrap, style]} pointerEvents="box-none">
      <PressableScale onPress={onPress} haptic="medium" scaleTo={0.94}>
        <LinearGradient
          colors={colors.gradientHero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.fab,
            extended && styles.fabExtended,
            shadows.glowPrimary,
          ]}
        >
          <Icon color={colors.textPrimary} size={22} strokeWidth={2.4} />
          {extended && <Text style={styles.label}>{label}</Text>}
        </LinearGradient>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    zIndex: 50,
  },
  fab: {
    height: 58,
    minWidth: 56,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  fabExtended: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  label: {
    ...typography.button,
    color: colors.textPrimary,
  },
});
