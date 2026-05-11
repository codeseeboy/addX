import React, { useMemo, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Megaphone, Plus, Search } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { colors, radius, spacing, typography, shadows, motion } from '../theme';
import { useStore } from '../hooks/useStore';
import AdListItem from '../components/AdListItem';
import FAB from '../components/FAB';
import PressableScale from '../components/PressableScale';
import { useToast } from '../components/Toast';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'paused', label: 'Paused' },
  { id: 'draft', label: 'Draft' },
];

export default function AdsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { ads, toggleAdStatus, removeAd } = useStore();
  const [filter, setFilter] = useState('all');
  const toast = useToast();

  const filtered = useMemo(() => {
    if (filter === 'all') return ads;
    return ads.filter((a) => a.status === filter);
  }, [ads, filter]);

  const handleDelete = (ad) => {
    removeAd(ad.id);
    toast.show(`"${ad.title}" deleted`, { variant: 'warn' });
  };

  const handleTogglePause = (ad) => {
    toggleAdStatus(ad.id);
    toast.show(
      ad.status === 'active' ? `"${ad.title}" paused` : `"${ad.title}" is now live`,
      { variant: 'success' },
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.label}>CAMPAIGNS</Text>
          <Text style={styles.title}>Ad Library</Text>
        </View>
        <View style={styles.headerActions}>
          <PressableScale style={styles.iconBtn} hitSlop={8}>
            <Search color={colors.textPrimary} size={20} strokeWidth={2.2} />
          </PressableScale>
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
      >
        {FILTERS.map((f) => {
          const active = filter === f.id;
          const count = f.id === 'all' ? ads.length : ads.filter((a) => a.status === f.id).length;
          return (
            <PressableScale
              key={f.id}
              onPress={() => setFilter(f.id)}
              haptic="light"
              style={{ marginRight: spacing.xs }}
            >
              <View style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
                <View style={[styles.chipCount, active && styles.chipCountActive]}>
                  <Text style={[styles.chipCountText, active && styles.chipCountTextActive]}>
                    {count}
                  </Text>
                </View>
              </View>
            </PressableScale>
          );
        })}
      </ScrollView>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState filter={filter} onCreate={() => navigation.getParent()?.navigate('CreateAd')} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          renderItem={({ item, index }) => (
            <AdListItem
              ad={item}
              index={index}
              onPress={() => {}}
              onTogglePause={() => handleTogglePause(item)}
              onDelete={() => handleDelete(item)}
              onMore={() => {}}
            />
          )}
          ListHeaderComponent={
            <Text style={styles.totalLabel}>
              {filtered.length} {filtered.length === 1 ? 'ad' : 'ads'}
            </Text>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <FAB
        label="Create Ad"
        icon={Plus}
        onPress={() => navigation.getParent()?.navigate('CreateAd')}
      />
    </View>
  );
}

function EmptyState({ filter, onCreate }) {
  return (
    <Animated.View entering={FadeIn.duration(motion.duration.screen)} style={styles.empty}>
      <LinearGradient
        colors={[colors.primarySoft, 'transparent']}
        style={styles.emptyHalo}
      />
      <View style={styles.emptyIcon}>
        <Megaphone color={colors.primary} size={40} strokeWidth={1.6} />
      </View>
      <Text style={styles.emptyTitle}>
        {filter === 'all' ? 'No ads yet' : `No ${filter} ads`}
      </Text>
      <Text style={styles.emptySub}>
        Create your first one — type a promotion and AddX turns it into a voice ad.
      </Text>
      <PressableScale onPress={onCreate} haptic="medium" scaleTo={0.97}>
        <LinearGradient
          colors={colors.gradientHero}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.emptyCta, shadows.glowPrimary]}
        >
          <Plus color="#fff" size={18} strokeWidth={2.4} />
          <Text style={styles.emptyCtaText}>Create your first ad</Text>
        </LinearGradient>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.secondary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  label: { ...typography.label, color: colors.textSecondary },
  title: { ...typography.display, fontSize: 30, color: colors.textPrimary, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: spacing.xs },
  iconBtn: {
    width: 40, height: 40, borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },

  filtersRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: { ...typography.captionMedium, color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' },
  chipTextActive: { color: '#fff' },
  chipCount: {
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  chipCountActive: { backgroundColor: 'rgba(255,255,255,0.22)' },
  chipCountText: { ...typography.caption, color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' },
  chipCountTextActive: { color: '#fff' },

  totalLabel: {
    ...typography.label,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },

  empty: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  emptyHalo: {
    position: 'absolute',
    width: 300, height: 300, borderRadius: 150,
    top: '20%',
    opacity: 0.6,
  },
  emptyIcon: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.divider,
    marginBottom: spacing.xs,
  },
  emptyTitle: { ...typography.h2, color: colors.textPrimary, textAlign: 'center' },
  emptySub: {
    ...typography.body, color: colors.textSecondary, textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    height: 52,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  emptyCtaText: { ...typography.button, color: '#fff' },
});
