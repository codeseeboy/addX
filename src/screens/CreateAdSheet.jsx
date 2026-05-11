import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Globe2,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react-native';
import {
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  FadeInRight,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { colors, radius, spacing, typography, shadows } from '../theme';
import {
  mockLanguages,
  mockVoiceStyles,
} from '../data/mockData';
import VoiceStylePicker from '../components/VoiceStylePicker';
import WaveformVisualizer from '../components/WaveformVisualizer';
import PressableScale from '../components/PressableScale';
import { useStore } from '../hooks/useStore';
import useAdCreation from '../hooks/useAdCreation';
import useAudio from '../hooks/useAudio';
import { useToast } from '../components/Toast';
import { supabase } from '../lib/supabase';
import { getAdAudioPublicUrl } from '../lib/storageUrls';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_H = SCREEN_H * 0.92;

const STEPS = [
  { id: 1, title: "What's your promotion?" },
  { id: 2, title: 'Choose your voice' },
  { id: 3, title: 'Preview your ad' },
  { id: 4, title: 'All set' },
];

/** Built-in phone TTS — no cloud TTS key needed to hear the script. */
function speakScriptOnDevice(script, languageId) {
  const t = String(script || '').trim();
  if (!t) return;
  Speech.stop();
  const locale = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', pt: 'pt-BR' }[languageId] || 'en-US';
  Speech.speak(t, { language: locale, rate: 0.96, pitch: 1.0 });
}

export default function CreateAdSheet({ navigation }) {
  const insets = useSafeAreaInsets();
  const { addAd, store, reloadFromBackend } = useStore();
  const toast = useToast();
  const ad = useAdCreation();
  /** True from tap "Generate ad" until script+voice pipeline finishes (covers reload gap before `ad.generating`). */
  const [step2PipelineBusy, setStep2PipelineBusy] = useState(false);
  const step2PipelineRef = useRef(false);
  const audio = useAudio({
    sourceUri: ad.audioUrl || null,
    durationMsFallback: ad.durationMs || 16000,
    autoPlay: false,
    cacheKey: ad.audioPath || ad.audioUrl || 'ad-preview',
  });

  useEffect(() => {
    void reloadFromBackend?.();
  }, [reloadFromBackend]);

  const leaveSheet = useCallback(() => {
    Speech.stop();
    void audio.stop();
    navigation.goBack();
  }, [audio.stop, navigation]);

  // Sheet animation in/out
  const translateY = useSharedValue(SHEET_H);
  const backdrop = useSharedValue(0);
  const dragY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 24, stiffness: 240, mass: 0.8 });
    backdrop.value = withTiming(1, { duration: 280 });
  }, [translateY, backdrop]);

  const dismiss = () => {
    Speech.stop();
    void audio.stop();
    backdrop.value = withTiming(0, { duration: 220 });
    translateY.value = withTiming(SHEET_H, { duration: 280, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(leaveSheet)();
    });
  };

  // Swipe-down to dismiss
  const dragGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) dragY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > 140 || e.velocityY > 900) {
        translateY.value = withTiming(SHEET_H, { duration: 240 }, (finished) => {
          if (finished) runOnJS(leaveSheet)();
        });
        backdrop.value = withTiming(0, { duration: 200 });
      } else {
        dragY.value = withSpring(0, { damping: 20, stiffness: 220 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value + dragY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value * 0.7 }));

  // ============================================
  // TODO: INTEGRATE LLM HERE
  // Step 2 → Step 3 transition triggers script generation.
  // Replace ad.generateScript() with real LLM endpoint.
  // ============================================
  const handleNext = async () => {
    if (store?.subscription === 'expired' && !__DEV__) {
      toast.show('Your trial ended. Subscribe to create new ads.', { variant: 'warn' });
      dismiss();
      navigation.navigate('Subscription');
      return;
    }

    if (ad.step === 1) {
      if (!ad.rawText.trim()) {
        toast.show('Type your promotion to continue', { variant: 'warn' });
        return;
      }
      ad.next();
    } else if (ad.step === 2) {
      if (step2PipelineRef.current || ad.generating) return;
      step2PipelineRef.current = true;
      setStep2PipelineBusy(true);
      void (async () => {
        try {
          const storeId = await reloadFromBackend?.();
          if (!storeId) {
            toast.show('Could not load your store. Pull to refresh on Home, then try again.', { variant: 'warn' });
            return;
          }
          const scriptResult = await ad.generateScript();
          // Stay on step 2 until script exists — avoids Step 3 "script not ready" / play race.
          ad.next();
          await ad.generateVoice({ storeId, script: scriptResult.script });
        } catch (e) {
          toast.show(e?.message || 'Could not generate ad. Try again.', { variant: 'warn' });
        } finally {
          step2PipelineRef.current = false;
          setStep2PipelineBusy(false);
        }
      })();
    } else if (ad.step === 3) {
      try {
        const storeId = (await reloadFromBackend?.()) || store?.id;
        if (!storeId) throw new Error('Store not ready yet');

        const payload = {
          store_id: storeId,
          title: deriveTitle(ad.rawText),
          raw_text: ad.rawText,
          script: ad.script,
          voice_style: ad.voiceStyle,
          language: ad.language,
          duration_ms: ad.durationMs || null,
          audio_path: ad.audioPath || null,
          status: 'active',
        };

        const { data: inserted, error } = await supabase
          .from('ads')
          .insert(payload)
          .select('*')
          .single();
        if (error) throw error;

        const audioUrl = inserted.audio_path ? getAdAudioPublicUrl(inserted.audio_path) : null;

        addAd({
          id: inserted.id,
          title: inserted.title,
          rawText: inserted.raw_text,
          script: inserted.script,
          voiceStyle: capitalize(inserted.voice_style),
          language: mockLanguages.find((l) => l.id === inserted.language)?.label || 'English',
          duration: inserted.duration_ms ? `${Math.round(inserted.duration_ms / 1000)}s` : ad.duration,
          status: inserted.status,
          playsToday: inserted.plays_today || 0,
          totalPlays: inserted.total_plays || 0,
          createdAt: inserted.created_at ? String(inserted.created_at).slice(0, 10) : new Date().toISOString().slice(0, 10),
          audioPath: inserted.audio_path,
          audioUrl: audioUrl || undefined,
        });

        reloadFromBackend?.();
        ad.setStep(4);
      } catch (e) {
        toast.show(e?.message || 'Could not save ad', { variant: 'warn' });
      }
    } else if (ad.step === 4) {
      dismiss();
    }
  };

  const handleBack = () => {
    if (ad.step === 1) dismiss();
    else if (ad.step === 4) dismiss();
    else {
      Speech.stop();
      void audio.stop();
      ad.prev();
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" animated />
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={dismiss} />
      </Animated.View>

      <Animated.View style={[styles.sheet, sheetStyle]}>
        <LinearGradient
          colors={['#1F2A4F', '#16213E']}
          style={[StyleSheet.absoluteFillObject, { borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl }]}
        />

        {/* Drag handle */}
        <GestureDetector gesture={dragGesture}>
          <View style={styles.handleArea}>
            <View style={styles.handle} />
          </View>
        </GestureDetector>

        {/* Header */}
        <View style={styles.header}>
          <PressableScale onPress={handleBack} hitSlop={12} style={styles.headerBtn}>
            {ad.step === 1 || ad.step === 4 ? (
              <X color={colors.textPrimary} size={20} />
            ) : (
              <ArrowLeft color={colors.textPrimary} size={20} />
            )}
          </PressableScale>
          <View style={styles.stepIndicator}>
            {STEPS.slice(0, 3).map((s, i) => {
              const filled = ad.step > i || ad.step === 4;
              return (
                <View
                  key={s.id}
                  style={[styles.stepDot, filled && styles.stepDotFilled]}
                />
              );
            })}
          </View>
          <View style={styles.headerBtn} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={spacing.md}
        >
          <ScrollView
            contentContainerStyle={{ paddingBottom: insets.bottom + 120, flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {ad.step === 1 && <Step1 ad={ad} />}
            {ad.step === 2 && <Step2 ad={ad} />}
            {ad.step === 3 && (
              <Step3
                ad={ad}
                audio={audio}
                reloadFromBackend={reloadFromBackend}
                regenerate={async () => {
                  Speech.stop();
                  await audio.stop().catch(() => {});
                  try {
                    const storeId = await reloadFromBackend?.();
                    if (!storeId) {
                      toast.show('Store not ready. Open Home and pull to refresh, then try again.', { variant: 'warn' });
                      return;
                    }
                    const scriptResult = await ad.generateScript();
                    await ad.generateVoice({ storeId, script: scriptResult.script });
                  } catch (e) {
                    toast.show(e?.message || 'Could not re-generate', { variant: 'warn' });
                  }
                }}
              />
            )}
            {ad.step === 4 && <Step4 onAnother={() => ad.reset()} onView={dismiss} />}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Footer */}
        <View
          style={[
            styles.footer,
            { paddingBottom: insets.bottom + spacing.md },
          ]}
        >
          <PressableScale
            onPress={handleNext}
            haptic={ad.step === 3 ? 'success' : 'medium'}
            scaleTo={0.97}
            disabled={
              (ad.step === 2 && (step2PipelineBusy || ad.generating))
              || (ad.step === 3 && ad.generating)
            }
          >
            <LinearGradient
              colors={
                ad.step === 4 ? ['#3b3f57', '#2c3046'] : colors.gradientHero
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.cta, shadows.glowPrimary]}
            >
              <Text style={styles.ctaLabel}>
                {ad.step === 1 && 'Continue'}
                {ad.step === 2 && (step2PipelineBusy || ad.generating ? 'Generating…' : 'Generate ad')}
                {ad.step === 3 && (ad.generating ? 'Generating…' : 'Save & activate')}
                {ad.step === 4 && 'Done'}
              </Text>
              {ad.step !== 4 && !ad.generating && !step2PipelineBusy && (
                <ArrowRight color="#fff" size={18} />
              )}
              {(ad.generating && ad.step === 3) || (ad.step === 2 && (step2PipelineBusy || ad.generating)) ? (
                <SpinIcon />
              ) : null}
            </LinearGradient>
          </PressableScale>
        </View>
      </Animated.View>
    </View>
  );
}

// ============================================================================
// STEP 1 — Raw text input
// ============================================================================
function Step1({ ad }) {
  return (
    <View style={styles.step}>
      <Text style={styles.stepLabel}>STEP 1 OF 3</Text>
      <Text style={styles.stepTitle}>{STEPS[0].title}</Text>
      <Text style={styles.stepSub}>
        Just type your promotion in plain words. AddX rewrites it into a polished script.
      </Text>

      <View style={styles.textArea}>
        <TextInput
          value={ad.rawText}
          onChangeText={ad.setRawText}
          placeholder="E.g. Buy 2 energy drinks, get 1 free - today only"
          placeholderTextColor={colors.textTertiary}
          multiline
          maxLength={240}
          style={styles.textInput}
          autoFocus
        />
        <View style={styles.textAreaFoot}>
          <View style={styles.aiHint}>
            <Sparkles color={colors.primary} size={14} strokeWidth={2.4} />
            <Text style={styles.aiHintText}>
              AI will rewrite this into a professional ad script
            </Text>
          </View>
          <Text style={styles.counter}>{ad.rawText.length}/240</Text>
        </View>
      </View>

      <View style={styles.suggestionsBlock}>
        <Text style={styles.label}>OR TRY ONE OF THESE</Text>
        <View style={styles.suggestionList}>
          {[
            'Buy 2 coffees, get a donut free',
            'Fill up 8 gallons, get a free car wash',
            'Cold drinks 30% off until 6 PM',
          ].map((s) => (
            <PressableScale
              key={s}
              onPress={() => ad.setRawText(s)}
              style={styles.suggestion}
              haptic="light"
            >
              <Text style={styles.suggestionText}>{s}</Text>
            </PressableScale>
          ))}
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// STEP 2 — Voice + Language
// ============================================================================
function Step2({ ad }) {
  return (
    <View style={styles.step}>
      <Text style={styles.stepLabel}>STEP 2 OF 3</Text>
      <Text style={styles.stepTitle}>{STEPS[1].title}</Text>
      <Text style={styles.stepSub}>
        Pick a tone that fits your store. Tap any card to hear a 3-second preview.
      </Text>

      <View style={{ marginHorizontal: -spacing.lg }}>
        <VoiceStylePicker
          styles={mockVoiceStyles}
          selectedId={ad.voiceStyle}
          onSelect={ad.setVoiceStyle}
          onPreview={() => {
            // ============================================
            // TODO: INTEGRATE LLM HERE
            // Function: previewVoiceClip(voiceStyle, language)
            // Returns 3-second sample audio for the chosen voice.
            // ============================================
          }}
        />
      </View>

      <Text style={[styles.label, { marginTop: spacing.lg }]}>LANGUAGE</Text>
      <View style={styles.languageGrid}>
        {mockLanguages.map((lang) => {
          const selected = ad.language === lang.id;
          return (
            <PressableScale
              key={lang.id}
              onPress={() => ad.setLanguage(lang.id)}
              haptic="light"
              style={{ marginRight: spacing.xs, marginBottom: spacing.xs }}
            >
              <View style={[styles.langPill, selected && styles.langPillActive]}>
                <Text style={[styles.langText, selected && styles.langTextActive]}>
                  {lang.label}
                </Text>
                <Text style={[styles.langNative, selected && styles.langNativeActive]}>
                  {lang.native}
                </Text>
              </View>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

// ============================================================================
// STEP 3 — Preview generated script + audio
// ============================================================================
function Step3({ ad, audio, reloadFromBackend, regenerate }) {
  const toast = useToast();

  const handleToggle = async () => {
    Speech.stop();
    if (!ad.audioUrl) {
      try {
        const storeId = await reloadFromBackend?.();
        if (!storeId) {
          toast.show('Store not ready. Open Home and pull to refresh, then try again.', { variant: 'warn' });
          return;
        }
        const scriptText = (ad.script || '').trim();
        if (!scriptText) {
          toast.show(
            'Script not ready yet — wait until the script appears above, or pull to refresh on Home and reopen this sheet.',
            { variant: 'warn' },
          );
          return;
        }
        await ad.generateVoice({ storeId, script: scriptText });
      } catch (e) {
        toast.show(e?.message || 'Could not generate audio', { variant: 'warn' });
        return;
      }
      setTimeout(() => {
        void audio.play().catch((err) => {
          toast.show(err?.message || 'Could not start playback', { variant: 'warn' });
        });
      }, 80);
      return;
    }
    await audio.toggle();
  };

  return (
    <View style={styles.step}>
      <Text style={styles.stepLabel}>STEP 3 OF 3</Text>
      <Text style={styles.stepTitle}>{STEPS[2].title}</Text>
      <Text style={styles.stepSub}>
        Here's the AI-generated script. Listen back, then save it.
      </Text>

      {ad.generating && !ad.script ? (
        <ScriptSkeleton />
      ) : (
        <Animated.View
          entering={FadeIn.duration(380)}
          style={styles.scriptCard}
        >
          {/* ============================================
              TODO: REPLACE WITH LLM API RESPONSE
              ad.script is currently filled by dummyGenerateAdScript().
              Swap that hook with real model output.
              ============================================ */}
          <View style={styles.scriptHead}>
            <View style={styles.scriptBadge}>
              <Sparkles color={colors.primary} size={12} strokeWidth={2.4} />
              <Text style={styles.scriptBadgeText}>AI SCRIPT</Text>
            </View>
            <Text style={styles.scriptDuration}>{ad.duration}</Text>
          </View>
          <Text style={styles.scriptText}>{ad.script}</Text>
          <View style={styles.scriptDivider} />
          <View style={styles.scriptFoot}>
            <View style={styles.scriptMeta}>
              <Text style={styles.scriptMetaItem}>{capitalize(ad.voiceStyle)}</Text>
              <View style={styles.scriptMetaDot} />
              <Text style={styles.scriptMetaItem}>
                {mockLanguages.find((l) => l.id === ad.language)?.label}
              </Text>
            </View>
            <PressableScale onPress={regenerate} haptic="light" style={styles.regenBtn}>
              <RefreshCw color={colors.primary} size={14} strokeWidth={2.4} />
              <Text style={styles.regenText}>Re-generate</Text>
            </PressableScale>
          </View>
        </Animated.View>
      )}

      {/* Player */}
      <View style={styles.player}>
        <PressableScale
          onPress={handleToggle}
          haptic="medium"
          scaleTo={0.94}
          disabled={ad.generating}
        >
          <LinearGradient
            colors={colors.gradientHero}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.playBtn, shadows.glowPrimary]}
          >
            {audio.playing
              ? <Pause color="#fff" size={28} strokeWidth={2.4} />
              : <Play color="#fff" size={28} strokeWidth={2.4} fill="#fff" />}
          </LinearGradient>
        </PressableScale>

        <View style={{ flex: 1, gap: 6 }}>
          <View style={styles.playerWaveRow}>
            <WaveformVisualizer playing={audio.playing} color={colors.primary} barCount={9} />
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${audio.progress * 100}%` },
              ]}
            />
          </View>
        </View>
      </View>

      <PressableScale
        onPress={() => {
          void audio.stop().catch(() => {});
          speakScriptOnDevice(ad.script, ad.language);
        }}
        haptic="light"
        scaleTo={0.98}
        disabled={ad.generating || !(ad.script || '').trim()}
      >
        <View style={styles.devicePreviewRow}>
          <Smartphone color={colors.accent} size={18} strokeWidth={2.2} />
          <Text style={styles.devicePreviewText}>
            Phone par suno (free) — device ki TTS; cloud MP3 alag hai
          </Text>
        </View>
      </PressableScale>
    </View>
  );
}

// ============================================================================
// STEP 4 — Saved confirmation
// ============================================================================
function Step4({ onAnother, onView }) {
  const scale = useSharedValue(0);
  const ringScale = useSharedValue(0);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 220, mass: 0.6 });
    ringScale.value = withTiming(2.6, { duration: 1200, easing: Easing.out(Easing.cubic) });
    ringOpacity.value = withTiming(0, { duration: 1200 });
  }, [scale, ringScale, ringOpacity]);

  const tickStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  return (
    <View style={[styles.step, { alignItems: 'center', paddingTop: spacing.xxxl }]}>
      <View style={styles.successWrap}>
        <Animated.View
          style={[
            { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: colors.success, opacity: 0.4 },
            ringStyle,
          ]}
        />
        <Animated.View style={[styles.tick, tickStyle]}>
          <Check color="#fff" size={44} strokeWidth={3.4} />
        </Animated.View>
      </View>
      <Text style={[styles.stepTitle, { textAlign: 'center', marginTop: spacing.lg }]}>
        Your ad is live
      </Text>
      <Text style={[styles.stepSub, { textAlign: 'center', maxWidth: 320 }]}>
        It'll start playing in your store on the next cycle.
      </Text>

      <View style={{ height: spacing.lg }} />

      <View style={{ width: '100%', gap: spacing.sm }}>
        <PressableScale onPress={onView} haptic="light" scaleTo={0.97}>
          <View style={styles.outlineBtn}>
            <Text style={styles.outlineBtnText}>View in library</Text>
          </View>
        </PressableScale>
        <PressableScale onPress={onAnother} haptic="light" scaleTo={0.97}>
          <View style={styles.ghostBtn}>
            <Text style={styles.ghostBtnText}>Create another</Text>
          </View>
        </PressableScale>
      </View>
    </View>
  );
}

function ScriptSkeleton() {
  return (
    <View style={[styles.scriptCard, { gap: spacing.sm }]}>
      <View style={styles.scriptHead}>
        <View style={[styles.scriptBadge, { opacity: 0.5 }]}>
          <Loader2 color={colors.primary} size={12} />
          <Text style={styles.scriptBadgeText}>GENERATING</Text>
        </View>
        <Text style={styles.scriptDuration}>—</Text>
      </View>
      <SkeleLine w="92%" />
      <SkeleLine w="100%" />
      <SkeleLine w="80%" />
      <SkeleLine w="70%" />
    </View>
  );
}

function SkeleLine({ w }) {
  return (
    <View style={{ width: w, height: 14, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.06)' }} />
  );
}

function SpinIcon() {
  const r = useSharedValue(0);
  useEffect(() => {
    r.value = withTiming(1, { duration: 9999 });
  }, [r]);
  const s = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value * 360 * 6}deg` }] }));
  return (
    <Animated.View style={[
      { width: 18, height: 18, borderRadius: 9, borderWidth: 2.4, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' },
      s,
    ]} />
  );
}

function deriveTitle(text) {
  if (!text) return 'Untitled ad';
  const trimmed = text.trim().split(/\s+/).slice(0, 5).join(' ');
  return trimmed.length < 4 ? `${trimmed} promo` : trimmed;
}
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  backdrop: { backgroundColor: '#000' },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: SHEET_H,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    overflow: 'hidden',
  },

  handleArea: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    alignItems: 'center',
  },
  handle: {
    width: 44, height: 5, borderRadius: 3,
    backgroundColor: colors.dividerStrong,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  stepIndicator: {
    flexDirection: 'row', gap: 6,
  },
  stepDot: {
    width: 28, height: 4, borderRadius: 2,
    backgroundColor: colors.divider,
  },
  stepDotFilled: { backgroundColor: colors.primary },

  step: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  stepLabel: { ...typography.label, color: colors.primary },
  stepTitle: { ...typography.h1, color: colors.textPrimary, fontSize: 26 },
  stepSub: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
  label: { ...typography.label, color: colors.textSecondary },

  textArea: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: spacing.md,
    minHeight: 160,
    gap: spacing.sm,
  },
  textInput: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 16,
    lineHeight: 24,
  },
  textAreaFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  aiHint: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  aiHintText: { ...typography.caption, color: colors.primary, flexShrink: 1 },
  counter: { ...typography.caption, color: colors.textTertiary },

  suggestionsBlock: { marginTop: spacing.lg, gap: spacing.xs },
  suggestionList: { gap: spacing.xs },
  suggestion: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  suggestionText: { ...typography.body, color: colors.textPrimary },

  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  langPillActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  langText: { ...typography.bodyMedium, color: colors.textPrimary },
  langTextActive: { color: colors.primary, fontFamily: 'Inter_600SemiBold' },
  langNative: { ...typography.caption, color: colors.textSecondary },
  langNativeActive: { color: colors.primary },

  scriptCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
    gap: spacing.sm,
  },
  scriptHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scriptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  scriptBadgeText: { ...typography.label, color: colors.primary, fontSize: 10 },
  scriptDuration: { ...typography.captionMedium, color: colors.textSecondary },
  scriptText: { ...typography.bodyMedium, color: colors.textPrimary, lineHeight: 24, fontSize: 16 },
  scriptDivider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.xs },
  scriptFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scriptMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  scriptMetaItem: { ...typography.captionMedium, color: colors.textSecondary },
  scriptMetaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.textTertiary },
  regenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  regenText: { ...typography.captionMedium, color: colors.primary, fontFamily: 'Inter_600SemiBold' },

  player: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
    marginTop: spacing.md,
  },
  playBtn: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  playerWaveRow: { height: 22, justifyContent: 'center' },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.primary },

  devicePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${colors.accent}44`,
    marginTop: spacing.sm,
  },
  devicePreviewText: {
    ...typography.captionMedium,
    color: colors.accent,
    flex: 1,
  },

  successWrap: {
    width: 110, height: 110,
    alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.lg,
  },
  tick: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: colors.success,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.glowSuccess,
  },
  outlineBtn: {
    height: 52,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  outlineBtnText: { ...typography.button, color: colors.primary },
  ghostBtn: {
    height: 48,
    alignItems: 'center', justifyContent: 'center',
  },
  ghostBtnText: { ...typography.bodyMedium, color: colors.textSecondary },

  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: 'transparent',
  },
  cta: {
    height: 58,
    borderRadius: radius.pill,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  ctaLabel: { ...typography.button, color: '#fff', fontSize: 17 },
});
