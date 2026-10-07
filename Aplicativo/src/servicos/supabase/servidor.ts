import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { envSupabase } from '@/config/env';
import { OPCOES_COOKIE } from './opcoesCookie';

/** Cliente com a sessão do usuário (RLS se aplica). */
export async function criarClienteServidor() {
  // cookies() antes do env: torna a rota dinâmica e evita ler env privada no prerender.
  const loja = await cookies();
  const { url, chavePublica } = envSupabase();
  return createServerClient(url, chavePublica, {
    cookieOptions: OPCOES_COOKIE,
    cookies: {
      getAll: () => loja.getAll(),
      setAll: (lista) => {
        try {
          lista.forEach(({ name, value, options }) => loja.set(name, value, { ...options, ...OPCOES_COOKIE }));
        } catch {
          // Server Components não gravam cookies; o proxy renova a sessão.
        }
      },
    },
  });
}
