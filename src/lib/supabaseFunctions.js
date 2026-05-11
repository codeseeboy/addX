import { apiClient } from './apiClient';

export async function generateAdScript({ rawText, voiceStyle, language }) {
  return await apiClient.post('/ai/generate-script', { rawText, voiceStyle, language });
}

export async function generateAdVoice({ script, voiceStyle, language, storeId, adId }) {
  return await apiClient.post('/ai/generate-voice', { script, voiceStyle, language, storeId, adId });
}

export async function createCheckoutSession({ storeId, priceId, successUrl, cancelUrl }) {
  return await apiClient.post('/billing/create-checkout-session', {
    storeId,
    priceId,
    successUrl,
    cancelUrl,
  });
}

export async function sendMagicLink({ email, emailRedirectTo }) {
  return await apiClient.post('/auth/magic-link', { email, emailRedirectTo });
}

