import 'server-only';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let serverClient: SupabaseClient | null | undefined;

export function getSupabaseServerClient(): SupabaseClient | null {
  if (serverClient !== undefined) return serverClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  serverClient = url && serviceKey
    ? createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;
  return serverClient;
}
