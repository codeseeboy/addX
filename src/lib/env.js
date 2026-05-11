export function getPublicEnv() {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

  return { supabaseUrl, supabaseAnonKey, hasSupabaseConfig };
}

