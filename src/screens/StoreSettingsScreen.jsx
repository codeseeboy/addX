import React, { useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronRight,
  Megaphone,
  Minus,
  Music2,
  Plus,
  Sparkles,
  Tablet,
} from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { colors, radius, spacing, typography, motion } from '../theme';
import { useStore } from '../hooks/useStore';
import {
  mockLanguages,
  mockStoreTypes,
  mockVoiceStyles,
} from '../data/mockData';
import PressableScale from '../components/PressableScale';
import { useToast } from '../components/Toast';

export default function StoreSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { store, settings, updateStore, updateSettings } = useStore();
  const toast = useToast();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.label}>YOUR STORE</Text>
        <Text style={styles.title}>Store settings</Text>
        <Text style={styles.subtitle}>Tune your audio, ad cadence, and devices.</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* PLAYBACK */}
        <Section label="Playback">
          <View style={styles.row}>
            <RowHead
              icon={Megaphone}
              tint={colors.primary}
              title="Ad frequency"
              subtitle={`Every ${settings.adFrequency} songs`}
            />
            <Stepper
              value={settings.adFrequency}
              min={1}
              max={20}
              onChange={(v) => updateSettings({ adFrequency: v })}
            />
          </View>
          <Divider />

          {/* AI suggestion — LLM hook */}
          <View style={styles.aiSuggest}>
            <View style={styles.aiSuggestHead}>
              <Sparkles color={colors.accent} size={14} />
              <Text style={styles.aiSuggestLabel}>AI SUGGESTION</Text>
            </View>
            {/* ============================================
                TODO: INTEGRATE LLM HERE
                Function: suggestAdFrequency(storeContext)
                Replace this static copy with model output.
                ============================================ */}
            <Text style={styles.aiSuggestText}>
              Stations like yours see the best engagement at one ad every four
              songs during the evening rush.
            </Text>
          </View>
          <Divider />

          <SliderRow
            label="Music volume"
            icon={Music2}
            tint={colors.accent}
            value={settings.musicVolume}
            onChange={(v) => updateSettings({ musicVolume: v })}
          />
          <Divider />
          <SliderRow
            label="Ad volume"
            icon={Megaphone}
            tint={colors.primary}
            value={settings.adVolume}
            onChange={(v) => updateSettings({ adVolume: v })}
          />
        </Section>

        {/* VOICE PREFERENCES */}
        <Section label="Voice preferences">
          <Text style={styles.subLabel}>Default voice style</Text>
          <View style={styles.chipWrap}>
            {mockVoiceStyles.map((v) => {
              const sel = settings.defaultVoiceStyle === v.id;
              return (
                <PressableScale
                  key={v.id}
                  onPress={() => updateSettings({ defaultVoiceStyle: v.id })}
                  haptic="light"
                  style={{ marginRight: 6, marginBottom: 6 }}
                >
                  <View style={[styles.smallChip, sel && styles.smallChipActive]}>
                    <Text style={[styles.smallChipText, sel && styles.smallChipTextActive]}>
                      {v.label}
                    </Text>
                  </View>
                </PressableScale>
              );
            })}
          </View>

          <View style={{ height: spacing.md }} />

          <Text style={styles.subLabel}>Default language</Text>
          <View style={styles.chipWrap}>
            {mockLanguages.map((l) => {
              const sel = settings.defaultLanguage === l.id;
              return (
                <PressableScale
                  key={l.id}
                  onPress={() => updateSettings({ defaultLanguage: l.id })}
                  haptic="light"
                  style={{ marginRight: 6, marginBottom: 6 }}
                >
                  <View style={[styles.smallChip, sel && styles.smallChipActive]}>
                    <Text style={[styles.smallChipText, sel && styles.smallChipTextActive]}>
                      {l.label}
                    </Text>
                  </View>
                </PressableScale>
              );
            })}
          </View>
        </Section>

        {/* STORE INFO */}
        <Section label="Store info">
          <InlineEdit
            label="Store name"
            value={store.name}
            onChange={(v) => updateStore({ name: v })}
          />
          <Divider />
          <Text style={[styles.subLabel, { paddingHorizontal: spacing.md, paddingTop: spacing.sm }]}>
            Store type
          </Text>
          <View style={[styles.chipWrap, { paddingHorizontal: spacing.md }]}>
            {mockStoreTypes.map((t) => {
              const sel = store.type === t.id;
              return (
                <PressableScale
                  key={t.id}
                  onPress={() => {
                    updateStore({ type: t.id });
                    toast.show(`Store type set to ${t.label}`, { variant: 'success' });
                  }}
                  haptic="light"
                  style={{ marginRight: 6, marginBottom: 6 }}
                >
                  <View style={[styles.smallChip, sel && styles.smallChipActive]}>
                    <Text style={[styles.smallChipText, sel && styles.smallChipTextActive]}>
                      {t.label}
                    </Text>
                  </View>
                </PressableScale>
              );
            })}
          </View>
          <Divider />
          <InlineEdit
            label="Location"
            value={store.location}
            onChange={(v) => updateStore({ location: v })}
          />
        </Section>

        {/* DEVICES */}
        <Section label="Devices">
          <View style={styles.row}>
            <RowHead
              icon={Tablet}
              tint={store.device.connected ? colors.success : colors.danger}
              title={store.device.name}
              subtitle={`${store.device.model} · last seen ${store.device.lastSeen}`}
            />
            <View style={styles.deviceStatus}>
              <View
                style={[
                  styles.deviceDot,
                  { backgroundColor: store.device.connected ? colors.success : colors.danger },
                ]}
              />
              <Text style={styles.deviceStatusText}>
                {store.device.connected ? 'Connected' : 'Offline'}
              </Text>
            </View>
          </View>
          <Divider />
          <PressableScale style={styles.linkRow} hitSlop={4} haptic="light">
            <Text style={styles.linkRowText}>Pair another device</Text>
            <ChevronRight color={colors.textSecondary} size={18} />
          </PressableScale>
        </Section>
      </ScrollView>
    </View>
  );
}

// =============================================================================
// Section primitives
// =============================================================================

function Section({ label, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label.toUpperCase()}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function RowHead({ icon: Icon, tint, title, subtitle }) {
  return (
    <View style={styles.rowHead}>
      <View style={[styles.rowIcon, { backgroundColor: tint + '20' }]}>
        <Icon color={tint} size={18} strokeWidth={2.4} />
      </View>
      <View style={{ flexShrink: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{subtitle}</Text>
      </View>
    </View>
  );
}

function Stepper({ value, min, max, onChange }) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <View style={styles.stepper}>
      <PressableScale onPress={dec} hitSlop={6} haptic="light" style={styles.stepBtn}>
        <Minus color={colors.textPrimary} size={16} strokeWidth={2.6} />
      </PressableScale>
      <Animated.Text
        key={value}
        entering={FadeIn.duration(motion.duration.fast)}
        style={styles.stepValue}
      >
        {value}
      </Animated.Text>
      <PressableScale onPress={inc} hitSlop={6} haptic="light" style={styles.stepBtn}>
        <Plus color={colors.textPrimary} size={16} strokeWidth={2.6} />
      </PressableScale>
    </View>
  );
}

function SliderRow({ label, icon: Icon, tint, value, onChange }) {
  // Simple custom slider — 11 segments tappable.
  const segs = 10;
  const filled = Math.round(value * segs);
  return (
    <View style={styles.sliderRow}>
      <View style={[styles.rowIcon, { backgroundColor: tint + '20' }]}>
        <Icon color={tint} size={18} strokeWidth={2.4} />
      </View>
      <View style={{ flex: 1, gap: 8 }}>
        <View style={styles.sliderHeader}>
          <Text style={styles.rowTitle}>{label}</Text>
          <Text style={[styles.rowSub, { color: tint }]}>{Math.round(value * 100)}%</Text>
        </View>
        <View style={styles.segments}>
          {Array.from({ length: segs }).map((_, i) => {
            const active = i < filled;
            return (
              <PressableScale
                key={i}
                onPress={() => onChange((i + 1) / segs)}
                hitSlop={6}
                haptic="light"
                style={{ flex: 1 }}
              >
                <View
                  style={[
                    styles.seg,
                    { backgroundColor: active ? tint : colors.divider },
                  ]}
                />
              </PressableScale>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function InlineEdit({ label, value, onChange }) {
  const [text, setText] = useState(value);
  return (
    <View style={styles.inlineEdit}>
      <Text style={styles.inlineLabel}>{label}</Text>
      <TextInput
        value={text}
        onChangeText={setText}
        onEndEditing={() => onChange(text)}
        style={styles.inlineInput}
        placeholderTextColor={colors.textTertiary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.secondary },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  label: { ...typography.label, color: colors.textSecondary },
  title: { ...typography.display, fontSize: 30, color: colors.textPrimary, marginTop: 2 },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },

  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.divider,
    overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.md },
  subLabel: {
    ...typography.label,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  rowIcon: {
    width: 40, height: 40, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  rowTitle: { ...typography.bodyMedium, color: colors.textPrimary, fontFamily: 'Inter_600SemiBold' },
  rowSub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  stepBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  stepValue: {
    minWidth: 28,
    textAlign: 'center',
    color: colors.textPrimary,
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },

  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  segments: { flexDirection: 'row', gap: 3 },
  seg: { flex: 1, height: 6, borderRadius: 3 },

  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  smallChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  smallChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  smallChipText: { ...typography.captionMedium, color: colors.textPrimary },
  smallChipTextActive: { color: colors.primary, fontFamily: 'Inter_600SemiBold' },

  inlineEdit: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 4,
  },
  inlineLabel: { ...typography.label, color: colors.textSecondary },
  inlineInput: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    paddingVertical: 6,
    fontSize: 16,
  },

  deviceStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deviceDot: { width: 8, height: 8, borderRadius: 4 },
  deviceStatusText: { ...typography.captionMedium, color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' },

  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  linkRowText: { ...typography.bodyMedium, color: colors.primary, fontFamily: 'Inter_600SemiBold' },

  aiSuggest: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: 4,
  },
  aiSuggestHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiSuggestLabel: { ...typography.label, color: colors.accent, fontSize: 10 },
  aiSuggestText: { ...typography.caption, color: colors.textPrimary, lineHeight: 18 },
});
