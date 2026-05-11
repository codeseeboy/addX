// =============================================================================
// AddX Mock Data Layer
// =============================================================================
// All data here is dummy. When the backend ships, replace functions in
// /src/hooks/* with real API calls — the shape of these objects defines
// the contract.
// =============================================================================

export const mockStore = {
  id: 'store_001',
  name: 'Hudson Fuel & Market',
  type: 'gas_station',
  location: 'Austin, TX',
  status: 'live', // 'live' | 'offline' | 'paused'
  lastHeartbeat: '2 min ago',
  subscription: 'trial', // 'trial' | 'pro' | 'expired'
  trialDaysLeft: 5,
  trialTotalDays: 7,
  ownerName: 'Rachel Hudson',
  ownerEmail: 'rachel@hudsonfuel.com',
  device: {
    name: 'Front Counter Display',
    model: 'iPad Air',
    lastSeen: 'just now',
    connected: true,
    battery: 87,
  },
};

export const mockAds = [
  {
    id: 'ad_001',
    title: 'Energy Drink Deal',
    rawText: 'Buy 2 energy drinks, get 1 free',
    script:
      "Hey there! Big deal today only — pick up any 2 energy drinks and grab a third one absolutely free. Don't miss this one, it's today only!",
    voiceStyle: 'Energetic',
    language: 'English',
    duration: '18s',
    status: 'active',
    playsToday: 8,
    totalPlays: 142,
    createdAt: '2026-04-22',
  },
  {
    id: 'ad_002',
    title: 'Coffee + Sandwich Combo',
    rawText: 'Coffee plus any breakfast sandwich, only $4.99',
    script:
      'Need a quick boost? Grab any breakfast sandwich with a hot coffee for just $4.99. Fresh, fast, and right up front.',
    voiceStyle: 'Friendly',
    language: 'English',
    duration: '15s',
    status: 'active',
    playsToday: 6,
    totalPlays: 89,
    createdAt: '2026-04-20',
  },
  {
    id: 'ad_003',
    title: 'Fuel Loyalty Reward',
    rawText: 'Fill up 8 gallons and get a free car wash',
    script:
      'Fill up 8 gallons or more today and your car wash is on us. Drive in clean, drive out cleaner.',
    voiceStyle: 'Professional',
    language: 'English',
    duration: '20s',
    status: 'active',
    playsToday: 4,
    totalPlays: 56,
    createdAt: '2026-04-18',
  },
  {
    id: 'ad_004',
    title: 'Weekend Snack Sale',
    rawText: 'All chips and snack bags are 20 percent off this weekend',
    script:
      "It's snack time. All chips and snack bags are twenty percent off this weekend only. Stock up before they're gone.",
    voiceStyle: 'Casual',
    language: 'English',
    duration: '16s',
    status: 'paused',
    playsToday: 0,
    totalPlays: 34,
    createdAt: '2026-04-15',
  },
  {
    id: 'ad_005',
    title: 'New Arrival: Cold Brew',
    rawText: 'Try our new cold brew, available now',
    script:
      "Cold brew is here — smooth, strong, and freshly chilled. Available at the counter. One sip and you'll be back tomorrow.",
    voiceStyle: 'Bold',
    language: 'English',
    duration: '14s',
    status: 'draft',
    playsToday: 0,
    totalPlays: 0,
    createdAt: '2026-04-26',
  },
  {
    id: 'ad_006',
    title: 'Stay Hydrated',
    rawText: 'Buy any 2 water bottles get one free',
    script:
      "Beat the heat — pick up any two bottles of water and the third one's on the house. Limited time only.",
    voiceStyle: 'Friendly',
    language: 'English',
    duration: '17s',
    status: 'active',
    playsToday: 6,
    totalPlays: 71,
    createdAt: '2026-04-12',
  },
];

export const mockStats = {
  adsPlayedToday: 24,
  songsPlayedToday: 187,
  uptimePercent: 98,
  hoursLive: 9.2,
  currentlyPlaying: {
    type: 'song',                  // 'song' | 'ad'
    name: 'Summer Vibes — Lo-fi Mix',
    artist: 'Chill Lab',
    progress: 0.42,
  },
  nextAdIn: 3,
  weeklyTrend: [12, 18, 14, 22, 19, 24, 24], // last 7 days
};

export const mockVoiceStyles = [
  { id: 'friendly', label: 'Friendly', description: 'Warm and welcoming', icon: 'Smile' },
  { id: 'energetic', label: 'Energetic', description: 'High energy, fast pace', icon: 'Zap' },
  { id: 'professional', label: 'Professional', description: 'Clear and confident', icon: 'Briefcase' },
  { id: 'casual', label: 'Casual', description: 'Relaxed conversation', icon: 'Coffee' },
  { id: 'bold', label: 'Bold', description: 'Loud and attention grabbing', icon: 'Flame' },
];

export const mockLanguages = [
  { id: 'en', label: 'English', native: 'English' },
  { id: 'es', label: 'Spanish', native: 'Español' },
  { id: 'fr', label: 'French', native: 'Français' },
  { id: 'pt', label: 'Portuguese', native: 'Português' },
];

export const mockStoreTypes = [
  { id: 'gas_station', label: 'Gas Station', icon: 'Fuel' },
  { id: 'convenience', label: 'Convenience', icon: 'ShoppingBag' },
  { id: 'retail', label: 'Retail', icon: 'Store' },
  { id: 'cafe', label: 'Café', icon: 'Coffee' },
];

export const mockSettings = {
  adFrequency: 1,
  musicVolume: 0.7,
  adVolume: 0.85,
  defaultVoiceStyle: 'energetic',
  defaultLanguage: 'en',
  autoSchedule: true,
};

export const mockSetupChecklist = [
  { id: 'name_store', label: 'Name your store', done: true },
  { id: 'first_ad', label: 'Create your first ad', done: false },
  { id: 'start_playing', label: 'Start playing', done: false },
];

// Recent activity feed (used on Home + Profile)
export const mockActivity = [
  { id: 1, type: 'ad_played', title: 'Energy Drink Deal', time: '2 min ago' },
  { id: 2, type: 'song', title: 'Sunset Drive - Indie Pop', time: '4 min ago' },
  { id: 3, type: 'ad_played', title: 'Coffee + Sandwich Combo', time: '11 min ago' },
  { id: 4, type: 'song', title: 'Lo-Fi Summer Hour', time: '14 min ago' },
];

// =============================================================================
// LLM HOOK STUBS — replace these with real API calls when backend is wired.
// Keep the input/output shape; UI relies on it.
// =============================================================================

// ============================================
// TODO: INTEGRATE LLM HERE
// Function: generateAdScript(rawText, voiceStyle, language)
// Input: { rawText: string, voiceStyle: string, language: string }
// Expected Output: { script: string, duration: string }
// Replace dummyGenerateAdScript() with real API call
// ============================================
export const dummyGenerateAdScript = async ({ rawText, voiceStyle = 'Energetic', language = 'English' }) => {
  await new Promise((r) => setTimeout(r, 1100)); // fake latency
  const intros = {
    Energetic: 'Hey there! Big deal today only —',
    Friendly: 'Hi friends, quick heads up —',
    Professional: 'Attention valued customers —',
    Casual: 'Yo, real quick —',
    Bold: 'Listen up!',
  };
  const outros = {
    Energetic: "Don't miss out, come check it out now!",
    Friendly: 'See you at the counter!',
    Professional: 'Thank you for shopping with us.',
    Casual: 'Catch you in there.',
    Bold: 'Move fast — they go quick.',
  };
  const intro = intros[voiceStyle] || intros.Energetic;
  const outro = outros[voiceStyle] || outros.Energetic;
  const script = `${intro} ${rawText}. ${outro}`;
  const wordCount = script.split(/\s+/).length;
  const duration = `${Math.max(8, Math.round(wordCount / 2.6))}s`;
  return { script, duration };
};

// ============================================
// TODO: INTEGRATE LLM HERE
// Function: generateAdVoice(script, voiceStyle, language)
// Input: { script: string, voiceStyle: string, language: string }
// Expected Output: { audioUrl: string, durationMs: number }
// Replace dummyGenerateAdVoice() with TTS API (ElevenLabs / OpenAI).
// ============================================
export const dummyGenerateAdVoice = async ({ script }) => {
  await new Promise((r) => setTimeout(r, 1400));
  return {
    audioUrl: 'mock://generated-ad.mp3',
    durationMs: Math.max(8000, script.length * 60),
  };
};

// ============================================
// TODO: INTEGRATE LLM HERE
// Function: suggestAdFrequency(storeContext)
// Input: { storeType, footTraffic, recentEngagement }
// Expected Output: { suggestedEveryXSongs: number, reason: string }
// Used on Store Settings to surface AI-recommended ad cadence.
// ============================================
export const dummySuggestAdFrequency = async () => {
  await new Promise((r) => setTimeout(r, 600));
  return {
    suggestedEveryXSongs: 4,
    reason: 'Most gas stations see best engagement at 1 ad per 4 songs during evening hours.',
  };
};

// ============================================
// TODO: INTEGRATE LLM HERE
// Function: smartScheduleSuggestion(adLibrary, currentHour)
// Input: { ads: Ad[], currentHour: number }
// Expected Output: { adId: string, reason: string }
// Used on Home for "play this next" smart suggestions.
// ============================================
export const dummySmartScheduleSuggestion = async () => {
  await new Promise((r) => setTimeout(r, 400));
  return {
    adId: 'ad_001',
    reason: 'Energy drinks sell best between 2pm and 6pm.',
  };
};
