import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { lerSupabase } from '@/config/esquemas';
import { OPCOES_COOKIE } from './opcoesCookie';

// Usado só pelo proxy: renova a sessão e devolve o usuário validado no servidor de Auth.
export async function atualizarSessao(request: NextRequest) {
  const { url, chavePublica } = lerSupabase(process.env);
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, chavePublica, {
    cookieOptions: OPCOES_COOKIE,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (lista) => {
        lista.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        lista.forEach(({ name, value, options }) => response.cookies.set(name, value, { ...options, ...OPCOES_COOKIE }));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { response, user };
}

/** Redirect que preserva os cookies renovados (senão o usuário perde a sessão). */
export function redirecionarComCookies(request: NextRequest, origem: NextResponse, caminho: string) {
  const destino = request.nextUrl.clone();
  destino.pathname = caminho;
  destino.search = '';
  const redirect = NextResponse.redirect(destino);
  origem.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
