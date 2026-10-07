import { NextResponse, type NextRequest } from 'next/server';
import { lerAcesso } from '@/config/esquemas';
import { avaliarAcesso } from '@/dominio/acesso/admins';
import { ehRotaApi, ehRotaPublica } from '@/dominio/acesso/rotas';
import { atualizarSessao, redirecionarComCookies } from '@/servicos/supabase/proxySessao';
import { dadosAcessoDoUsuario } from '@/servicos/supabase/usuario';

// Primeira barreira (renova sessão e barra quem não é admin). Páginas, rotas e
// Server Actions revalidam no servidor com exigirAdmin(): o proxy sozinho não basta.
export async function proxy(request: NextRequest) {
  const caminho = request.nextUrl.pathname;
  try {
    // Configuração antes da renovação: um erro aqui não descarta um refresh token já rotacionado.
    const { admins } = lerAcesso(process.env);
    const { response, user } = await atualizarSessao(request);
    const admin = user ? avaliarAcesso(dadosAcessoDoUsuario(user), admins).permitido : false;

    if (ehRotaPublica(caminho)) {
      return caminho === '/login' && admin ? redirecionarComCookies(request, response, '/') : response;
    }
    if (admin) return response;
    if (ehRotaApi(caminho)) return NextResponse.json({ erro: 'não autorizado' }, { status: 401 });
    return redirecionarComCookies(request, response, user ? '/nao-autorizado' : '/login');
  } catch {
    // Configuração ausente ou Auth fora do ar: nega, sem detalhes.
    if (ehRotaPublica(caminho)) return NextResponse.next();
    if (ehRotaApi(caminho)) return NextResponse.json({ erro: 'indisponível' }, { status: 503 });
    const login = request.nextUrl.clone();
    login.pathname = '/login';
    login.search = '?erro=interno';
    return NextResponse.redirect(login);
  }
}

// Arquivos e /auth/callback excluídos só no caminho exato ($); só diretórios estáticos ficam como prefixo.
// Não criar páginas nem rotas dentro de /icones/ ou /marca/: ficariam fora do proxy.
export const config = {
  matcher: [
    '/((?!_next/static/|_next/image|icones/|marca/|auth/callback$|favicon\\.ico$|icon\\.png$|apple-icon\\.png$|manifest\\.webmanifest$|sw\\.js$|offline\\.html$).*)',
  ],
};
