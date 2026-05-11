import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Briefcase,
  Coffee,
  Flame,
  Smile,
  Zap,
} from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows } from '../theme';
import PressableScale from './PressableScale';

const ICON_MAP = {
  Smile, Zap, Briefcase, Coffee, Flame,
};

/**
 * VoiceStylePicker — horizontal scroll of voice tone cards.
 * Tapping selects + (optionally) plays a 3s preview clip.
 */
export default function VoiceStylePicker({
  styles: stylesData,
  selectedId,
  onSelect,
  onPreview,
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.scroll}
    >
      {stylesData.map((style) => {
        const Icon = ICON_MAP[style.icon] || Smile;
        const selected = selectedId === style.id;
        return (
          <PressableScale
            key={style.id}
            onPress={() => onSelect?.(style.id)}
            haptic="light"
            scaleTo={0.95}
            style={s.cardWrap}
          >
            {selected ? (
              <LinearGradient
                colors={colors.gradientHero}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[s.card, s.cardSelected, shadows.glowPrimary]}
              >
                <Icon color={colors.textPrimary} size={26} strokeWidth={2.2} />
                <Text style={[s.label, { color: colors.textPrimary }]}>{style.label}</Text>
                <Text style={[s.desc, { color: 'rgba(255,255,255,0.85)' }]} numberOfLines={2}>
                  {style.description}
                </Text>
                <PressableScale
                  onPress={() => onPreview?.(style.id)}
                  hitSlop={8}
                  haptic="light"
                  style={s.previewPill}
                >
                  <Text style={s.previewText}>Tap to preview</Text>
                </PressableScale>
              </LinearGradient>
            ) : (
              <View style={s.card}>
                <Icon color={colors.primary} size={26} strokeWidth={2.2} />
                <Text style={s.label}>{style.label}</Text>
                <Text style={s.desc} numberOfLines={2}>{style.description}</Text>
                <PressableScale
                  onPress={() => onPreview?.(style.id)}
                  hitSlop={8}
                  haptic="light"
                  style={s.previewPillIdle}
                >
                  <Text style={s.previewTextIdle}>Tap to preview</Text>
                </PressableScale>
              </View>
            )}
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  cardWrap: {
    marginRight: spacing.sm,
  },
  card: {
    width: 168,
    height: 168,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
    justifyContent: 'space-between',
  },
  cardSelected: {
    borderColor: 'transparent',
  },
  label: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  desc: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  previewPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.18)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  previewText: {
    ...typography.caption,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
  },
  previewPillIdle: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  previewTextIdle: {
    ...typography.caption,
    fontFamily: 'Inter_600SemiBold',
    color: colors.primary,
  },
});
