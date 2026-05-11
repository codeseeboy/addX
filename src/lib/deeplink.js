import * as Linking from 'expo-linking';
import { getDevBackendHttpBase } from './devBackendHost';

/**
 * URL Supabase puts in the magic-link email as `redirect_to`.
 * - Prefer EXPO_PUBLIC_AUTH_BRIDGE_URL (http://YOUR_PC_IP:4000) so the phone browser
 *   opens our backend page `/auth/open`, which then jumps to the native app with tokens.
 * - In Expo dev, if unset, use the same LAN host as Metro (see devBackendHost).
 * - Otherwise use Expo's deep link (exp://… in Expo Go, addx://… in dev builds).
 */
export function getAuthRedirectUrl() {
  const bridge =
    process.env.EXPO_PUBLIC_AUTH_BRIDGE_URL?.trim() || getDevBackendHttpBase();
  if (bridge) {
    const base = bridge.replace(/\/$/, '');
    return `${base}/auth/open`;
  }
  return Linking.createURL('auth/callback');
}

export function parseUrlParams(url) {
  const parsed = Linking.parse(url);
  const query = parsed.queryParams || {};

  // Some providers may return tokens in the fragment/hash. Linking.parse handles some cases,
  // but we also do a fallback parse for safety.
  const hash = url.includes('#') ? url.split('#')[1] : '';
  const hashParams = Object.fromEntries(new URLSearchParams(hash).entries());

  return { ...hashParams, ...query };
}
