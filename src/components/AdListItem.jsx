import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ChevronRight, MoreVertical, Pause, Play, Trash2 } from 'lucide-react-native';
import Animated, {
  Easing,
  FadeInRight,
} from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import { colors, radius, spacing, typography, shadows } from '../theme';
import PressableScale from './PressableScale';
import WaveformVisualizer from './WaveformVisualizer';

/**
 * AdListItem — full-width row used in the Ads tab.
 * Swipe left reveals Pause/Delete actions.
 */
export default function AdListItem({
  ad,
  index = 0,
  onPress,
  onTogglePause,
  onDelete,
  onMore,
}) {
  const isActive = ad.status === 'active';
  const isDraft = ad.status === 'draft';
  const dotColor = isActive
    ? colors.success
    : isDraft
    ? colors.accent
    : colors.textTertiary;

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 60).duration(380).easing(Easing.out(Easing.cubic))}
    >
      <Swipeable
        renderRightActions={() => (
          <View style={styles.swipeActions}>
            <PressableScale
              onPress={onTogglePause}
              style={[styles.swipeAction, { backgroundColor: colors.warning + '22' }]}
              haptic="medium"
            >
              {isActive
                ? <Pause color={colors.warning} size={20} strokeWidth={2.2} />
                : <Play color={colors.success} size={20} strokeWidth={2.2} />}
              <Text style={[styles.swipeLabel, { color: colors.warning }]}>
                {isActive ? 'Pause' : 'Activate'}
              </Text>
            </PressableScale>
            <PressableScale
              onPress={onDelete}
              style={[styles.swipeAction, { backgroundColor: colors.danger + '22' }]}
              haptic="heavy"
            >
              <Trash2 color={colors.danger} size={20} strokeWidth={2.2} />
              <Text style={[styles.swipeLabel, { color: colors.danger }]}>Delete</Text>
            </PressableScale>
          </View>
        )}
        overshootRight={false}
        friction={2}
      >
        <PressableScale onPress={onPress} scaleTo={0.985}>
          <View style={[styles.row, isActive && shadows.glowPrimary]}>
            <View style={[styles.dotCol]}>
              <View style={[styles.dot, { backgroundColor: dotColor }]} />
            </View>
            <View style={styles.body}>
              <Text style={styles.title} numberOfLines={1}>{ad.title}</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {ad.voiceStyle} · {ad.language} · {ad.duration}
              </Text>
            </View>
            <View style={styles.right}>
              {isActive ? (
                <WaveformVisualizer
                  playing
                  color={colors.primary}
                  size="sm"
                  barCount={4}
                />
              ) : (
                <Text style={styles.statusText}>
                  {isDraft ? 'Draft' : 'Paused'}
                </Text>
              )}
              <PressableScale onPress={onMore} hitSlop={12} haptic="light">
                <MoreVertical color={colors.textSecondary} size={18} />
              </PressableScale>
            </View>
          </View>
        </PressableScale>
      </Swipeable>
      <View style={styles.divider} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.mdLg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.divider,
    gap: spacing.md,
  },
  dotCol: {
    width: 14,
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusText: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  divider: {
    height: 0,
  },
  swipeActions: {
    flexDirection: 'row',
    height: '100%',
    paddingRight: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.secondary,
  },
  swipeAction: {
    width: 78,
    height: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  swipeLabel: {
    ...typography.caption,
    fontFamily: 'Inter_600SemiBold',
  },
});
