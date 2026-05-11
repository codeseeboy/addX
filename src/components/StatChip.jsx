import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import PressableScale from './PressableScale';

/**
 * Horizontal scroll chip showing a single stat — e.g. "Ads Played: 24".
 * Tappable; opens a stat detail bottom sheet.
 */
export default function StatChip({
  label,
  value,
  unit,
  icon: Icon,
  tint = colors.primary,
  onPress,
}) {
  return (
    <PressableScale onPress={onPress} style={styles.wrap}>
      <View style={styles.chip}>
        {Icon && (
          <View style={[styles.iconWrap, { backgroundColor: tint + '20' }]}>
            <Icon color={tint} size={18} strokeWidth={2.4} />
          </View>
        )}
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.label} numberOfLines={1}>{label}</Text>
          <View style={styles.valueRow}>
            <Text style={styles.value}>{value}</Text>
            {unit ? <Text style={styles.unit}>{unit}</Text> : null}
          </View>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginRight: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.divider,
    minWidth: 150,
    minHeight: 84,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  value: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  unit: {
    ...typography.captionMedium,
    color: colors.textSecondary,
  },
});
