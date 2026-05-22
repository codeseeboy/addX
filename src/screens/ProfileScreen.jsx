import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  CreditCard,
  HelpCircle,
  LogOut,
  ShieldCheck,
  UserPlus,
} from 'lucide-react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

import { colors, radius, spacing, typography, shadows } from '../theme';
import { useStore } from '../hooks/useStore';
import { supabase } from '../lib/supabase';
import PressableScale from '../components/PressableScale';

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { store, setAuthed } = useStore();
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  const initials = (store.ownerName || 'A')
    .split(' ')
    .map((s) => s.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isPro = store.subscription === 'pro';

  const items = [
    { id: 'notif', label: 'Notifications', icon: Bell, onPress: () => {} },
    { id: 'billing', label: 'Billing & plans', icon: CreditCard, onPress: () => navigation.getParent()?.navigate('Subscription') },
    { id: 'team', label: 'Team access', icon: UserPlus, onPress: () => {} },
    { id: 'help', label: 'Help center', icon: HelpCircle, onPress: () => {} },
    { id: 'privacy', label: 'Privacy', icon: ShieldCheck, onPress: () => {} },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar block */}
        <View style={styles.avatarBlock}>
          <View style={styles.avatarRing}>
            <LinearGradient
              colors={colors.gradientHero}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.avatarRingGrad}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            </LinearGradient>
          </View>
          <Text style={styles.name} numberOfLines={1}>{store.name}</Text>
          <Text style={styles.email} numberOfLines={1}>{store.ownerEmail}</Text>

          <View style={[styles.badge, isPro ? styles.badgePro : styles.badgeTrial]}>
            <Text style={[styles.badgeText, { color: isPro ? colors.accent : colors.primary }]}>
              {isPro ? '★ PRO' : `Trial · ${store.trialDaysLeft}d left`}
            </Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          {items.map((item, i) => (
            <MenuRow key={item.id} item={item} isLast={i === items.length - 1} />
          ))}
        </View>

        {/* Logout */}
        <PressableScale
          onPress={() => setConfirmingLogout(true)}
          haptic="medium"
          style={styles.logoutBtn}
        >
          <LogOut color={colors.danger} size={18} strokeWidth={2.4} />
          <Text style={styles.logoutText}>Log out</Text>
        </PressableScale>

        <Text style={styles.versionText}>AddX v1.0.0 · Built for US storefronts</Text>
      </ScrollView>

      {confirmingLogout && (
        <ConfirmSheet
          onCancel={() => setConfirmingLogout(false)}
          onConfirm={async () => {
            setConfirmingLogout(false);
            try {
              await supabase.auth.signOut();
            } catch {
              /* still leave app login screen */
            }
            setAuthed(false);
            navigation.getParent()?.replace('Login');
          }}
        />
      )}
    </View>
  );
}

function MenuRow({ item, isLast }) {
  const { label, icon: Icon, onPress } = item;
  return (
    <PressableScale onPress={onPress} haptic="light" scaleTo={0.985}>
      <View style={[styles.row, !isLast && styles.rowDivider]}>
        <View style={styles.rowIcon}>
          <Icon color={colors.textPrimary} size={18} strokeWidth={2.2} />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.chev}>›</Text>
      </View>
    </PressableScale>
  );
}

function ConfirmSheet({ onCancel, onConfirm }) {
  const insets = useSafeAreaInsets();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(200);

  React.useEffect(() => {
    opacity.value = withTiming(1, { duration: 240 });
    translateY.value = withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) });
  }, [opacity, translateY]);

  const close = (cb) => {
    opacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(220, { duration: 240 }, (finished) => {
      if (finished) runOnJS(cb)();
    });
  };

  const backdrop = useAnimatedStyle(() => ({ opacity: opacity.value * 0.7 }));
  const sheet = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000' }, backdrop]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={() => close(onCancel)} />
      </Animated.View>
      <Animated.View
        style={[
          styles.confirmSheet,
          { paddingBottom: insets.bottom + spacing.lg },
          sheet,
        ]}
      >
        <View style={styles.confirmHandle} />
        <View style={[styles.confirmIcon, { backgroundColor: colors.dangerSoft }]}>
          <LogOut color={colors.danger} size={26} />
        </View>
        <Text style={styles.confirmTitle}>Log out of AddX?</Text>
        <Text style={styles.confirmSub}>
          Your store will keep playing — you'll just need to log in again to make changes.
        </Text>

        <View style={styles.confirmActions}>
          <PressableScale onPress={() => close(onCancel)} style={{ flex: 1 }} scaleTo={0.97}>
            <View style={styles.confirmCancel}>
              <Text style={styles.confirmCancelText}>Cancel</Text>
            </View>
          </PressableScale>
          <PressableScale onPress={() => close(onConfirm)} haptic="heavy" style={{ flex: 1 }} scaleTo={0.97}>
            <View style={styles.confirmDanger}>
              <Text style={styles.confirmDangerText}>Log out</Text>
            </View>
          </PressableScale>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.secondary },

  avatarBlock: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
  avatarRing: {
    width: 92, height: 92, borderRadius: 46,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarRingGrad: {
    width: 92, height: 92, borderRadius: 46,
    alignItems: 'center', justifyContent: 'center',
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 30,
    color: colors.textPrimary,
  },
  name: { ...typography.h2, color: colors.textPrimary, marginTop: spacing.sm },
  email: { ...typography.caption, color: colors.textSecondary },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginTop: spacing.xs,
  },
  badgePro: { backgroundColor: colors.accentSoft },
  badgeTrial: { backgroundColor: colors.primarySoft },
  badgeText: { ...typography.label, fontFamily: 'Inter_700Bold' },

  menu: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1, borderColor: colors.divider,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { ...typography.bodyMedium, color: colors.textPrimary, flex: 1, fontFamily: 'Inter_600SemiBold' },
  chev: { color: colors.textSecondary, fontSize: 22, lineHeight: 22, fontFamily: 'Inter_500Medium' },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.lg,
  },
  logoutText: { ...typography.button, color: colors.danger },

  versionText: {
    textAlign: 'center',
    color: colors.textTertiary,
    ...typography.caption,
    marginTop: spacing.lg,
  },

  confirmSheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    alignItems: 'center',
    gap: spacing.sm,
  },
  confirmHandle: {
    width: 44, height: 5, borderRadius: 3,
    backgroundColor: colors.dividerStrong,
    marginBottom: spacing.md,
  },
  confirmIcon: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  confirmTitle: { ...typography.h2, color: colors.textPrimary, textAlign: 'center' },
  confirmSub: {
    ...typography.body, color: colors.textSecondary, textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
    marginTop: spacing.md,
  },
  confirmCancel: {
    height: 52, borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.divider,
  },
  confirmCancelText: { ...typography.button, color: colors.textPrimary },
  confirmDanger: {
    height: 52, borderRadius: radius.pill,
    backgroundColor: colors.danger,
    alignItems: 'center', justifyContent: 'center',
  },
  confirmDangerText: { ...typography.button, color: '#fff' },
});
