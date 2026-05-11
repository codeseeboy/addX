import { createClient } from '@supabase/supabase-js';
import { getPublicEnv } from './env';

const { supabaseUrl, supabaseAnonKey, hasSupabaseConfig } = getPublicEnv();
export { hasSupabaseConfig };

// Keep app booting even when env vars are missing. In that case we use a
// harmless placeholder client; auth/data calls should be gated by hasSupabaseConfig.
const resolvedUrl = hasSupabaseConfig ? supabaseUrl : 'https://placeholder.local';
const resolvedAnonKey = hasSupabaseConfig ? supabaseAnonKey : 'placeholder-anon-key';

export const supabase = createClient(resolvedUrl, resolvedAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // handled manually via Linking callback
  },
});

