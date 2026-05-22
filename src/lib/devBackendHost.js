import Constants from 'expo-constants';

/**
 * In Expo dev, `expoConfig.hostUri` matches the host in Metro’s `exp://HOST:8081` — the same IP
 * the phone already uses for the JS bundle, so the Node backend should be reachable there too
 * (if Windows Firewall allows inbound on EXPO_PUBLIC_DEV_BACKEND_PORT, default 8787).
 */
export function getLanHostFromExpoDev() {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return null;
  try {
    const uri = Constants.expoConfig?.hostUri;
    if (!uri || typeof uri !== 'string') return null;
    const host = uri.split(':')[0]?.trim();
    if (!host || host === '127.0.0.1' || host === 'localhost') return null;
    return host;
  } catch {
    return null;
  }
}

/** e.g. http://192.168.0.103:8787 — no trailing slash, no /api */
export function getDevBackendHttpBase() {
  const host = getLanHostFromExpoDev();
  if (!host) return null;
  const port = process.env.EXPO_PUBLIC_DEV_BACKEND_PORT || '8787';
  return `http://${host}:${port}`;
}
