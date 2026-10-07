import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { envSupabase, envSupabaseAdmin } from '@/config/env';

/** Cliente com a chave secreta: ignora RLS. Só para operações do servidor que o usuário não pode fazer. */
export function criarClienteAdmin() {
  return createClient(envSupabase().url, envSupabaseAdmin().chaveSecreta, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
