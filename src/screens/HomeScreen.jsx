import React, { useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowRight,
  Bell,
  Clock,
  Headphones,
  Megaphone,
  Music2,
  Plus,
  Settings2,
  TrendingUp,
} from 'lucide-react-native';
import Animated, {
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';

import { colors, radius, spacing, typography, shadows, motion } from '../theme';
import { useStore } from '../hooks/useStore';
import StoreStatusCard from '../components/StoreStatusCard';
import StatChip from '../components/StatChip';
import PressableScale from '../components/PressableScale';
import SkeletonLoader from '../components/SkeletonLoader';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { store, stats, activity, reloadFromBackend } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await reloadFromBackend?.();
    } finally {
      setRefreshing(false);
    }
  };

  const firstName = store.ownerName?.split(' ')[0] || 'there';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.greet}>{greeting()}</Text>
          <Text style={styles.greetName} numberOfLines={1}>
            {firstName}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {store.subscription === 'trial' && (
            <PressableScale
              onPress={() => navigation.getParent()?.navigate('Subscription')}
              style={styles.trialPill}
              haptic="light"
            >
              <Clock color={colors.accent} size={14} strokeWidth={2.4} />
              <Text style={styles.trialPillText}>{store.trialDaysLeft}d left</Text>
            </PressableScale>
          )}
          <PressableScale style={styles.iconBtn} hitSlop={8}>
            <Bell color={colors.textPrimary} size={20} strokeWidth={2.2} />
            <View style={styles.iconBtnDot} />
          </PressableScale>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.section}>
          {loading ? (
            <SkeletonLoader height={180} borderRadius={radius.card} />
          ) : (
            <Animated.View entering={FadeInDown.duration(motion.duration.screen)}>
              <StoreStatusCard
                store={store}
                stats={stats}
                onPress={() => navigation.getParent()?.navigate('NowPlaying')}
              />
            </Animated.View>
          )}
        </View>

        <View style={[styles.section, { paddingHorizontal: 0 }]}>
          <Text style={[styles.sectionLabel, { paddingHorizontal: spacing.lg }]}>
            TODAY AT A GLANCE
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsRow}
            snapToInterval={170}
            decelerationRate="fast"
          >
            <StatChip
              label="Ads played"
              value={stats.adsPlayedToday}
              icon={Megaphone}
              tint={colors.primary}
              onPress={() => {}}
            />
            <StatChip
              label="Songs played"
              value={stats.songsPlayedToday}
              icon={Music2}
              tint={colors.accent}
              onPress={() => {}}
            />
            <StatChip
              label="Uptime"
              value={stats.uptimePercent}
              unit="%"
              icon={TrendingUp}
              tint={colors.success}
              onPress={() => {}}
            />
            <StatChip
              label="Hours live"
              value={stats.hoursLive}
              unit="h"
              icon={Clock}
              tint={colors.textSecondary}
              onPress={() => {}}
            />
            <View style={{ width: spacing.lg }} />
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>

          <PressableScale
            onPress={() => navigation.getParent()?.navigate('CreateAd')}
            haptic="medium"
            scaleTo={0.985}
          >
            <LinearGradient
              colors={colors.gradientHero}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.heroAction, shadows.glowPrimary]}
            >
              <View style={styles.heroIcon}>
                <Plus color="#fff" size={22} strokeWidth={2.6} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Create new ad</Text>
                <Text style={styles.heroHint} numberOfLines={1}>
                  Type a promo. AI handles the rest.
                </Text>
              </View>
              <View style={styles.heroArrow}>
                <ArrowRight color="#fff" size={18} strokeWidth={2.6} />
              </View>
            </LinearGradient>
          </PressableScale>

          <View style={styles.actionList}>
            <ActionRow
              icon={Megaphone}
              label="Ad library"
              hint={`${stats.adsPlayedToday} played today`}
              tint={colors.primary}
              onPress={() => navigation.navigate('Ads')}
            />
            <ActionRow
              icon={Settings2}
              label="Store settings"
              hint="Voice, frequency, language"
              tint={colors.accent}
              onPress={() => navigation.navigate('Store')}
            />
            <ActionRow
              icon={Headphones}
              label="Preview store audio"
              hint="Hear what customers hear"
              tint={colors.success}
              onPress={() => navigation.getParent()?.navigate('NowPlaying')}
              isLast
            />
          </View>
        </View>

        <View style={styles.section}>
          {/* ============================================
              TODO: INTEGRATE LLM HERE
              Function: smartScheduleSuggestion(adLibrary, currentHour)
              Render an AI-recommended ad to push next.
              ============================================ */}
          <Animated.View entering={FadeIn.duration(motion.duration.slow)}>
            <View style={styles.aiCard}>
              <View style={styles.aiHead}>
                <View style={styles.aiBadge}>
                  <Text style={styles.aiBadgeText}>AI SUGGESTS</Text>
                </View>
                <Text style={styles.aiTime}>Updated just now</Text>
              </View>
              <Text style={styles.aiTitle}>Push the Energy Drink ad next</Text>
              <Text style={styles.aiBody}>
                Energy drinks sell best between 2-6 PM. Bump frequency to one
                spot every 3 songs for the next two hours.
              </Text>
              <PressableScale onPress={() => {}} style={styles.aiCta} haptic="light">
                <Text style={styles.aiCtaText}>Apply suggestion</Text>
                <ArrowRight color={colors.primary} size={16} />
              </PressableScale>
            </View>
          </Animated.View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LIVE ACTIVITY</Text>
          <View style={styles.activityCard}>
            {activity.slice(0, 4).map((item, idx) => (
              <View
                key={item.id}
                style={[
                  styles.activityRow,
                  idx === Math.min(activity.length, 4) - 1 && styles.activityRowLast,
                ]}
              >
                <View
                  style={[
                    styles.activityDot,
                    {
                      backgroundColor:
                        item.type === 'song' ? colors.accent : colors.primary,
                    },
                  ]}
                />
                <Text style={styles.activityTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.activityTime}>{item.time}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function ActionRow({ icon: Icon, label, hint, tint, onPress, isLast }) {
  return (
    <PressableScale onPress={onPress} haptic="light" scaleTo={0.985}>
      <View style={[styles.actionRow, isLast && styles.actionRowLast]}>
        <View style={[styles.actionIcon, { backgroundColor: tint + '22' }]}>
          <Icon color={tint} size={20} strokeWidth={2.4} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.actionLabel}>{label}</Text>
          <Text style={styles.actionHint} numberOfLines={1}>
            {hint}
          </Text>
        </View>
        <ArrowRight color={colors.textTertiary} size={18} strokeWidth={2.2} />
      </View>
    </PressableScale>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Late night,';
  if (h < 12) return 'Good morning,';
  if (h < 17) return 'Good afternoon,';
  return 'Good evening,';
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.secondary },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  greet: { ...typography.caption, color: colors.textSecondary },
  greetName: { ...typography.h2, color: colors.textPrimary },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  trialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.accent + '33',
  },
  trialPillText: { ...typography.captionMedium, color: colors.accent },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  iconBtnDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
  },

  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary,
  },
  statsRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },

  heroAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.card,
    minHeight: 78,
  },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    ...typography.h3,
    color: '#fff',
    fontFamily: 'Inter_700Bold',
  },
  heroHint: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.86)',
    marginTop: 2,
  },
  heroArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionList: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.divider,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  actionRowLast: { borderBottomWidth: 0 },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  actionHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },

  aiCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
    gap: spacing.xs,
  },
  aiHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  aiBadgeText: { ...typography.label, color: colors.primary, fontSize: 10 },
  aiTime: { ...typography.caption, color: colors.textTertiary },
  aiTitle: { ...typography.h3, color: colors.textPrimary, marginTop: 2 },
  aiBody: { ...typography.caption, color: colors.textSecondary, lineHeight: 19 },
  aiCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingVertical: 4,
  },
  aiCtaText: {
    ...typography.captionMedium,
    color: colors.primary,
    fontFamily: 'Inter_600SemiBold',
  },

  activityCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: spacing.md,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  activityRowLast: { borderBottomWidth: 0 },
  activityDot: { width: 8, height: 8, borderRadius: 4 },
  activityTitle: {
    ...typography.captionMedium,
    color: colors.textPrimary,
    flex: 1,
  },
  activityTime: { ...typography.caption, color: colors.textTertiary },
});
