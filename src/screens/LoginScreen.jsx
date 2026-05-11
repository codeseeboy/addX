import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lock, Mail, Sparkles } from 'lucide-react-native';

import { colors, radius, spacing, typography } from '../theme';
import PressableScale from '../components/PressableScale';
import { useStore } from '../hooks/useStore';
import { useToast } from '../components/Toast';
import { LogoMark } from './SplashScreen';
import { hasSupabaseConfig, supabase } from '../lib/supabase';
import { getAuthRedirectUrl } from '../lib/deeplink';
import { sendMagicLink } from '../lib/supabaseFunctions';

const STATE = { IDLE: 'idle', SENDING: 'sending', SENT: 'sent' };

/** If user types `emp` without @, Supabase email becomes `emp@addx.dev` (create that user in Supabase Auth → Users). */
function loginEmailFromInput(raw) {
  const t = String(raw || '').trim().toLowerCase();
  if (!t) return '';
  if (t.includes('@')) return t;
  return `${t}@addx.dev`;
}

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef(null);
  const [email, setEmail] = useState(__DEV__ ? 'emp' : '');
  const [password, setPassword] = useState(__DEV__ ? 'emp' : '');
  const [state, setState] = useState(STATE.IDLE);
  const [passwordLoggingIn, setPasswordLoggingIn] = useState(false);

  const { authed, setHasWelcomed } = useStore();
  const toast = useToast();

  const resolvedEmail = useMemo(() => loginEmailFromInput(email), [email]);
  const validMagicEmail = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
    [email],
  );
  const canSendMagic = validMagicEmail && state === STATE.IDLE && !passwordLoggingIn;
  const canPasswordLogin =
    Boolean(resolvedEmail) &&
    Boolean(password) &&
    state === STATE.IDLE &&
    !passwordLoggingIn;

  useEffect(() => {
    if (!authed) return;
    setHasWelcomed(false);
    navigation.replace('WelcomeSetup');
  }, [authed, navigation, setHasWelcomed]);

  const handlePasswordLogin = async () => {
    if (!hasSupabaseConfig) {
      toast.show('Supabase env missing in .env.local.', { variant: 'warn' });
      return;
    }
    if (!resolvedEmail) {
      toast.show('Type email or username first', { variant: 'warn' });
      inputRef.current?.focus();
      return;
    }
    if (!password) {
      toast.show('Type your password', { variant: 'warn' });
      return;
    }

    setPasswordLoggingIn(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password,
      });
      if (error) throw error;
      setHasWelcomed(false);
      toast.show('Signed in. Session is saved on this device.', { variant: 'success' });
    } catch (e) {
      const msg = e?.message || 'Login failed';
      toast.show(
        `${msg} For dev: create user ${resolvedEmail} in Supabase (Auth → Users) with Email provider + password.`,
        { variant: 'warn' },
      );
    } finally {
      setPasswordLoggingIn(false);
    }
  };

  const proceedToApp = async () => {
    if (!hasSupabaseConfig) {
      toast.show('Backend env missing. Add .env.local to enable magic-link login.', { variant: 'warn' });
      return;
    }

    setState(STATE.SENDING);
    try {
      const emailRedirectTo = getAuthRedirectUrl();
      await sendMagicLink({
        email: email.trim(),
        emailRedirectTo,
      });
      setState(STATE.SENT);
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[Login] magic link redirect URL (add in Supabase Auth → Redirect URLs):', emailRedirectTo);
      }
      toast.show('Magic link sent. Check inbox and spam. If nothing arrives, add the redirect URL in Supabase (see Metro console in dev).', {
        variant: 'success',
      });
      setHasWelcomed(false);
      setTimeout(() => setState(STATE.IDLE), 1500);
    } catch (e) {
      setState(STATE.IDLE);
      toast.show(e?.message || 'Could not send magic link', { variant: 'warn' });
    }
  };

  const handleSend = () => {
    if (!canSendMagic) {
      if (!email.trim()) {
        toast.show('Type your email first', { variant: 'warn' });
        inputRef.current?.focus();
      } else {
        toast.show("Magic link needs a full email (with @). Use Log in for emp / emp.", { variant: 'warn' });
      }
      return;
    }
    proceedToApp();
  };

  const handleStartTrial = () => {
    if (state === STATE.SENDING || passwordLoggingIn) return;
    proceedToApp();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : insets.top}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={{ alignItems: 'flex-start', marginBottom: spacing.lg }}>
            <LogoMark size="md" />
          </View>

          <Text style={styles.headline}>Sign in to your store</Text>
          <Text style={styles.subhead}>
            Password login keeps you signed in on this device (Supabase session). Magic link still available below.
          </Text>

          <View style={styles.inputWrap}>
            <Mail color={colors.textSecondary} size={20} strokeWidth={2.2} />
            <TextInput
              ref={inputRef}
              value={email}
              onChangeText={setEmail}
              onSubmitEditing={handlePasswordLogin}
              placeholder="emp or you@store.com"
              placeholderTextColor={colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              selectionColor={colors.primary}
              style={styles.input}
              editable={state !== STATE.SENDING && !passwordLoggingIn}
              underlineColorAndroid="transparent"
              blurOnSubmit={false}
            />
          </View>

          <View style={styles.inputWrap}>
            <Lock color={colors.textSecondary} size={20} strokeWidth={2.2} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={handlePasswordLogin}
              placeholder="Password"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              selectionColor={colors.primary}
              style={styles.input}
              editable={state !== STATE.SENDING && !passwordLoggingIn}
              underlineColorAndroid="transparent"
            />
          </View>

          <PressableScale
            onPress={handlePasswordLogin}
            disabled={!canPasswordLogin}
            haptic="medium"
            scaleTo={0.98}
          >
            <View style={[styles.cta, !canPasswordLogin && styles.ctaDisabled]}>
              <Text style={styles.ctaLabel}>
                {passwordLoggingIn ? 'Signing in…' : 'Log in'}
              </Text>
            </View>
          </PressableScale>

          {__DEV__ ? (
            <Text style={styles.devHint}>
              Dev default: user <Text style={styles.devMono}>emp</Text> → email{' '}
              <Text style={styles.devMono}>emp@addx.dev</Text>, password <Text style={styles.devMono}>emp</Text>. Add
              this user in Supabase Auth once; then no magic link needed.
            </Text>
          ) : null}

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <PressableScale onPress={handleSend} disabled={!canSendMagic} haptic="medium" scaleTo={0.98}>
            <View style={[styles.secondaryCta, !canSendMagic && styles.ctaDisabled]}>
              <Text style={styles.secondaryCtaLabel}>
                {state === STATE.SENDING ? 'Sending…' : state === STATE.SENT ? 'Sent' : 'Send magic link'}
              </Text>
            </View>
          </PressableScale>

          <PressableScale
            onPress={handleStartTrial}
            disabled={state === STATE.SENDING || passwordLoggingIn}
            haptic="light"
            scaleTo={0.98}
          >
            <View style={styles.trialBtn}>
              <Sparkles color={colors.accent} size={18} strokeWidth={2.4} />
              <Text style={styles.trialBtnText}>Start 7-day free trial</Text>
            </View>
          </PressableScale>

          <Text style={styles.legal}>No credit card required. Cancel anytime.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.secondary },
  body: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  headline: {
    ...typography.display,
    fontSize: 32,
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  subhead: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: Platform.OS === 'ios' ? 14 : 8,
    borderWidth: 1,
    borderColor: colors.divider,
    minHeight: 56,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    paddingVertical: Platform.OS === 'android' ? 8 : 0,
    margin: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  cta: {
    height: 58,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  ctaDisabled: { opacity: 0.45 },
  ctaLabel: { ...typography.button, color: '#fff', fontSize: 17 },
  secondaryCta: {
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  secondaryCtaLabel: {
    ...typography.button,
    color: colors.textPrimary,
    fontSize: 16,
  },
  devHint: {
    ...typography.caption,
    color: colors.textTertiary,
    lineHeight: 18,
  },
  devMono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: colors.accent,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.divider },
  dividerText: {
    ...typography.label,
    color: colors.textTertiary,
    fontSize: 11,
  },
  trialBtn: {
    height: 56,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: `${colors.accent}55`,
  },
  trialBtnText: {
    ...typography.button,
    color: colors.accent,
    fontSize: 16,
  },
  legal: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});

