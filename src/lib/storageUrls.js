import { supabase } from './supabase';

const DEFAULT_BUCKET = 'ad-audio';

/**
 * Public URL for an object stored in Supabase Storage (bucket must be public).
 */
export function getAdAudioPublicUrl(audioPath, bucket = DEFAULT_BUCKET) {
  if (!audioPath || typeof audioPath !== 'string') return null;
  const { data } = supabase.storage.from(bucket).getPublicUrl(audioPath);
  return data?.publicUrl || null;
}
