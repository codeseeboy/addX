import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  Check,
  Lock,
  Sparkles,
} from 'lucide-react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors, radius, spacing, typography, shadows, motion } from '../theme';
import { useStore } from '../hooks/useStore';
import PressableScale from '../components/PressableScale';
import { useToast } from '../components/Toast';
import { createCheckoutSession } from '../lib/supabaseFunctions';

const FEATURES = [
  'Unlimited AI-generated ads',
  'Royalty-free background music',
  'Offline playback when Wi-Fi drops',
  'Real-time dashboard analytics',
  'Priority email + chat support',
  'Multi-device sync',
];

const PLANS = {
  monthly: { symbol: '$', price: 19, unit: '/month', tag: 'Pay monthly' },
  yearly: { symbol: '$', price: 15, unit: '/month', tag: 'Save 20% — billed yearly' },
};

export default function SubscriptionScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { store, reloadFromBackend } = useStore();
  const toast = useToast();
  const [plan, setPlan] = useState('monthly');
  const current = PLANS[plan];

  const inTrial = store.subscription === 'trial';

  const handleSubscribe = async () => {
    try {
      const storeId = store?.id;
      if (!storeId) throw new Error('Store not ready yet');

      const priceId =
        plan === 'yearly'
          ? process.env.EXPO_PUBLIC_STRIPE_PRICE_YEARLY
          : process.env.EXPO_PUBLIC_STRIPE_PRICE_MONTHLY;

      if (!priceId) {
        throw new Error(
          'Missing Stripe price id env. Set EXPO_PUBLIC_STRIPE_PRICE_MONTHLY / EXPO_PUBLIC_STRIPE_PRICE_YEARLY in .env.local',
        );
      }

      const returnUrl = Linking.createURL('billing/return');
      const { url } = await createCheckoutSession({
        storeId,
        priceId,
        successUrl: returnUrl,
        cancelUrl: returnUrl,
      });

      if (!url) throw new Error('Checkout session missing url');

      toast.show('Opening secure checkout…', { variant: 'info' });
      const result = await WebBrowser.openAuthSessionAsync(url, returnUrl);

      if (result.type === 'success') {
        await reloadFromBackend?.();
        toast.show('Thanks! Syncing your subscription…', { variant: 'success' });
      }
    } catch (e) {
      toast.show(e?.message || 'Could not start checkout', { variant: 'warn' });
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <PressableScale
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={styles.headerBtn}
        >
          <ArrowLeft color={colors.textPrimary} size={20} />
        </PressableScale>
        <Text style={styles.headerTitle}>Billing & plans</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + spacing.xxxl,
          paddingTop: spacing.xs,
        }}
        showsVerticalScrollIndicator={false}
      >
        {inTrial && (
          <Animated.View entering={FadeIn.duration(motion.duration.slow)} style={styles.trialBlock}>
            <TrialArc daysLeft={store.trialDaysLeft} total={store.trialTotalDays} />
            <View style={{ flex: 1 }}>
              <Text style={styles.trialLabel}>FREE TRIAL</Text>
              <Text style={styles.trialTitle}>
                {store.trialDaysLeft} day{store.trialDaysLeft === 1 ? '' : 's'} left
              </Text>
              <Text style={styles.trialSub}>
                Subscribe before {store.trialTotalDays - store.trialDaysLeft === 0 ? 'your trial ends' : 'day ' + store.trialTotalDays} to keep ads playing in-store.
              </Text>
            </View>
          </Animated.View>
        )}

        <View style={styles.toggleWrap}>
          <PlanToggle plan={plan} setPlan={setPlan} />
        </View>

        {/* Plan Card */}
        <Animated.View entering={FadeInUp.duration(motion.duration.screen)}>
          <LinearGradient
            colors={['#1F2A4F', '#16213E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.planCard, shadows.glowPrimary]}
          >
            <View style={styles.planHead}>
              <View style={styles.planBadge}>
                <BadgeCheck color={colors.accent} size={14} />
                <Text style={styles.planBadgeText}>MOST POPULAR</Text>
              </View>
              <Text style={styles.planTag}>{current.tag}</Text>
            </View>

            <Text style={styles.planName}>AddX Pro</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceSymbol}>{current.symbol}</Text>
              <Text style={styles.priceAmount}>{current.price}</Text>
              <Text style={styles.priceUnit}>{current.unit}</Text>
            </View>
            <Text style={styles.planNote}>
              Cancel anytime. Includes everything below.
            </Text>

            <View style={styles.featuresList}>
              {FEATURES.map((f, i) => (
                <Animated.View
                  key={f}
                  entering={FadeInUp.delay(180 + i * 70).duration(motion.duration.normal)}
                  style={styles.featureRow}
                >
                  <View style={styles.featureCheck}>
                    <Check color="#fff" size={12} strokeWidth={3} />
                  </View>
                  <Text style={styles.featureText}>{f}</Text>
                </Animated.View>
              ))}
            </View>

            <PressableScale onPress={handleSubscribe} haptic="success" scaleTo={0.97}>
              <LinearGradient
                colors={colors.gradientHero}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.cta, shadows.glowPrimary]}
              >
                <Sparkles color="#fff" size={18} />
                <Text style={styles.ctaLabel}>Start subscription</Text>
              </LinearGradient>
            </PressableScale>

            <View style={styles.stripeFoot}>
              <Lock color={colors.textSecondary} size={12} />
              <Text style={styles.stripeFootText}>Secured by Stripe · 256-bit SSL</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.faq}>
          <Text style={styles.faqTitle}>Frequently asked</Text>
          <FaqRow
            q="What happens after my trial?"
            a="Your store goes silent until you subscribe. No surprise charges, ever."
          />
          <FaqRow
            q="Can I cancel anytime?"
            a="Yes — cancel from this screen and keep access until the period ends."
          />
          <FaqRow
            q="Is there a contract?"
            a="No contracts. It's month-to-month, or save 20% with yearly billing."
          />
          <FaqRow
            q="Do you offer team or chain pricing?"
            a="Yes — contact sales@addx.com for multi-store rates."
          />
        </View>
      </ScrollView>
    </View>
  );
}

function TrialArc({ daysLeft, total }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming((total - daysLeft) / total, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, daysLeft, total]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.trialIcon}>
      <CalendarClock color={colors.accent} size={26} />
      <Animated.View style={[styles.trialIconRing, fillStyle]} />
    </View>
  );
}

function PlanToggle({ plan, setPlan }) {
  return (
    <View style={styles.toggle}>
      {Object.entries(PLANS).map(([key, val]) => {
        const sel = key === plan;
        return (
          <PressableScale
            key={key}
            onPress={() => setPlan(key)}
            haptic="light"
            style={{ flex: 1 }}
          >
            <View style={[styles.toggleOpt, sel && styles.toggleOptActive]}>
              <Text style={[styles.toggleText, sel && styles.toggleTextActive]}>
                {key === 'monthly' ? 'Monthly' : 'Yearly'}
              </Text>
              {key === 'yearly' && (
                <View style={styles.savePill}>
                  <Text style={styles.savePillText}>−20%</Text>
                </View>
              )}
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}

function FaqRow({ q, a }) {
  return (
    <View style={styles.faqRow}>
      <Text style={styles.faqQ}>{q}</Text>
      <Text style={styles.faqA}>{a}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.secondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...typography.h3, color: colors.textPrimary },

  trialBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent + '44',
  },
  trialIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  trialIconRing: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  trialLabel: { ...typography.label, color: colors.accent },
  trialTitle: { ...typography.h2, color: colors.textPrimary, marginTop: 2 },
  trialSub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },

  toggleWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  toggleOpt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  toggleOptActive: {
    backgroundColor: colors.surfaceHover,
  },
  toggleText: {
    ...typography.captionMedium,
    color: colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
  },
  toggleTextActive: {
    color: colors.textPrimary,
  },
  savePill: {
    backgroundColor: colors.success + '22',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  savePillText: {
    ...typography.label,
    color: colors.success,
    fontSize: 10,
  },

  planCard: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    gap: spacing.sm,
  },
  planHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  planBadgeText: { ...typography.label, color: colors.accent, fontSize: 10 },
  planTag: { ...typography.caption, color: colors.textSecondary },

  planName: { ...typography.h2, color: colors.textPrimary, marginTop: spacing.xs },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  priceSymbol: { ...typography.h2, color: colors.textPrimary, fontSize: 22, marginRight: 2 },
  priceAmount: { ...typography.display, fontSize: 48, color: colors.textPrimary, lineHeight: 50 },
  priceUnit: { ...typography.body, color: colors.textSecondary, marginLeft: 4 },
  planNote: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },

  featuresList: { marginTop: spacing.md, gap: spacing.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  featureCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { ...typography.bodyMedium, color: colors.textPrimary, flex: 1 },

  cta: {
    height: 56,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.lg,
  },
  ctaLabel: { ...typography.button, color: '#fff', fontSize: 16 },

  stripeFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  stripeFootText: { ...typography.caption, color: colors.textSecondary },

  faq: { marginHorizontal: spacing.lg, marginTop: spacing.xl, gap: spacing.sm },
  faqTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  faqRow: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
    gap: 4,
  },
  faqQ: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  faqA: { ...typography.caption, color: colors.textSecondary, lineHeight: 19 },
});
