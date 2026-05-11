/**
 * Audio cache
 *
 * Dev note:
 * expo-file-system v54 deprecated some legacy methods. To keep playback stable
 * right now, we avoid filesystem caching entirely and stream the remote URL.
 *
 * Later, if needed, we can re-add caching using the new filesystem API.
 */

export async function getCachedAudioUri({ cacheKey, remoteUri }) {
  if (!remoteUri) throw new Error('remoteUri is required');
  // Keep it simple: return remote URI so expo-av can stream it.
  // (cacheKey is kept for future enhancement, but not used for now)
  return String(remoteUri);
}

