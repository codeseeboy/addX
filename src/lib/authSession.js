import { supabase } from './supabase';
import { parseUrlParams } from './deeplink';

export async function handleIncomingAuthUrl(url) {
  if (!url) return { handled: false };

  const params = parseUrlParams(url);

  // PKCE flow (recommended by Supabase): ?code=...
  if (params.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return { handled: true, session: data.session };
  }

  // Implicit flow fallback: #access_token=...&refresh_token=...
  if (params.access_token && params.refresh_token) {
    const { data, error } = await supabase.auth.setSession({
      access_token: String(params.access_token),
      refresh_token: String(params.refresh_token),
    });
    if (error) throw error;
    return { handled: true, session: data.session };
  }

  return { handled: false };
}

