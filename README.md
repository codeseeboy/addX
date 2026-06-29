# 🔊 AddX — AI In-Store Audio Ads

> AI-powered in-store audio for retail and gas stations. Type a promotion → AddX rewrites it into a polished script, voices it, and mixes it with background music to play throughout the day. Built for a US retail client (CStoreExpert).

![React Native](https://img.shields.io/badge/React%20Native-61DAFB?style=flat-square&logo=react&logoColor=black)
![Expo](https://img.shields.io/badge/Expo-000020?style=flat-square&logo=expo&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)

> The LLM service that generates the ad scripts (multi-provider routing + fallback) lives in a companion repo: [llm-backend](https://github.com/codeseeboy/llm-backend).

This repository contains the **native mobile app** (iOS + Android) built with Expo + React Native. UI is final-quality. Backend / LLM / TTS / Stripe are stubbed with clearly marked `TODO: INTEGRATE …` hooks.

---

## Run locally

```bash
cd addx
npm install            # already done in this repo
npx expo start         # then scan QR with Expo Go
```

The app boots into:

```
Splash → Onboarding (3 slides) → Login (magic-link) → Welcome Setup → Main Tabs
```

After login you can use any email — magic link is simulated. The app auto-logs you in for the demo.

---

## Tech

| Concern | Library |
| --- | --- |
| Framework | Expo SDK 54, React Native 0.81 |
| Navigation | `@react-navigation/native` v7 (Stack + Bottom Tabs) |
| Animations | `react-native-reanimated` 4 + `react-native-worklets` |
| Gestures | `react-native-gesture-handler` 2.28 |
| Iconography | `lucide-react-native` |
| Gradients | `expo-linear-gradient` |
| Haptics | `expo-haptics` |
| Blur | `expo-blur` |
| Fonts | `@expo-google-fonts/inter` |

The bundle compiles cleanly: a 5.68 MB Hermes Android bundle exported via `expo export` with zero errors.

---

## Project structure

```
src/
  components/   reusable UI (FAB, Toast, StatChip, WaveformVisualizer, …)
  data/         mockData.js — single source for all dummy data + LLM stubs
  hooks/        useStore (context state), useAudio, useAdCreation
  navigation/   AppNavigator (stack), BottomTabNavigator (custom animated bar)
  screens/      11 screens — every screen called out in the user story
  theme/        colors / typography / spacing / shadows tokens
App.js          providers + font loading
babel.config.js worklets plugin (last)
```

---

## Screens

| # | File | Purpose |
| - | --- | --- |
| 1 | `SplashScreen.jsx` | Logo reveal with pulse ring |
| 2 | `OnboardingScreen.jsx` | 3-slide swiper with parallax + animated dots |
| 3 | `LoginScreen.jsx` | Magic-link entry + envelope animation |
| 4 | `WelcomeSetupScreen.jsx` | Post-login welcome with animated checklist + sparkle field |
| 5 | `HomeScreen.jsx` | "Today" dashboard — store status, glance stats, 2x2 quick action tiles, AI suggestion card |
| 6 | `AdsScreen.jsx` | Ad library — filter chips, swipeable rows, FAB, illustrated empty state |
| 7 | `CreateAdSheet.jsx` | 4-step bottom-sheet flow with drag-down dismiss |
| 8 | `StoreSettingsScreen.jsx` | Stepper + custom segmented sliders + chip pickers |
| 9 | `SubscriptionScreen.jsx` | Trial countdown, plan card, currency toggle, Stripe hook |
| 10 | `ProfileScreen.jsx` | Avatar with gradient ring, menu rows, logout confirm sheet |
| 11 | `NowPlayingScreen.jsx` | Full-screen overlay — pulse rings, large waveform, drag-down dismiss |

---

## LLM / Backend integration points

Every place that requires real backend is explicitly marked. Search for either string:

- `TODO: INTEGRATE LLM HERE`
- `TODO: INTEGRATE STRIPE CHECKOUT`
- `TODO: REPLACE WITH MAGIC LINK FLOW`
- `TODO: REPLACE WITH LLM API RESPONSE`

The mock implementations live in `src/data/mockData.js` (`dummyGenerateAdScript`, `dummyGenerateAdVoice`, `dummySuggestAdFrequency`, `dummySmartScheduleSuggestion`). Their input/output shapes are the contract — keep the same shape when wiring real APIs and the UI doesn't need to change.

---

## Design system at a glance

```
Primary  #FF5C35   Secondary #1A1A2E   Surface  #16213E
Accent   #F5C518   Success   #2ECC71   Danger   #E74C3C

Spacing  4 / 8 / 12 / 16 / 24 / 32 / 48
Radius   8 / 12 / 16 / 24 / pill
Font     Inter (Regular / Medium / SemiBold / Bold / ExtraBold)
```

Tokens live in `src/theme/`. Don't introduce raw hex values or pixel constants in components — extend the theme instead.

---

## Mobile UX patterns implemented

- Custom animated bottom tab bar — sliding pill indicator with spring physics
- Haptic feedback on tab switch + button press + long press
- `PressableScale` wrapper used everywhere (scale-down + spring back, configurable haptic)
- Swipeable ad rows with reveal-action buttons
- Pull-to-refresh on Home
- Skeleton shimmer (linear-gradient + Reanimated translation)
- Toast notifications from bottom (custom, non-blocking)
- Drag-down-to-dismiss bottom sheet (Pan gesture + Reanimated)
- Step indicator + multi-step flow inside the create-ad sheet
- Reanimated `entering` animations (FadeInUp / FadeInRight) on lists for stagger
- Pulse rings + animated waveform bars throughout

---

## Limitations / what's intentionally stubbed

- **Audio playback** — `useAudio` is a JS-only timer that drives `progress`/`playing` for visualizers. Wire to `expo-audio` (or `expo-av`) when real assets exist.
- **Magic link** — `LoginScreen` simulates the round-trip in 1.1s and auto-authenticates.
- **Voice TTS** — `dummyGenerateAdVoice` returns a fake `mock://` URL.
- **Stripe Checkout** — opens a toast; integrate `expo-web-browser` + checkout session flow.
- **Persistence** — state is in-memory via React Context. Add `expo-secure-store` / `MMKV` when auth ships.

---

Built by **Shashikant Rajput** — [LinkedIn](https://www.linkedin.com/in/shashikant-rajput) · [Portfolio](https://ezzshashi.netlify.app)
