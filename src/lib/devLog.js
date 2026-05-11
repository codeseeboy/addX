const enabled =
  (typeof __DEV__ !== 'undefined' && __DEV__) ||
  process.env.EXPO_PUBLIC_APP_LOGS === '1';

export function appLog(tag, message, extra) {
  if (!enabled) return;
  const prefix = `[AddX ${tag}] ${message}`;
  if (extra !== undefined) {
    // eslint-disable-next-line no-console
    console.log(prefix, extra);
  } else {
    // eslint-disable-next-line no-console
    console.log(prefix);
  }
}
