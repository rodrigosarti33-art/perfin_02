import type { Session } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { envAcesso } from '@/config/env';
import { obterSiteUrl } from '@/config/envPublico';
import { avaliarAcesso } from '@/dominio/acesso/admins';
import { sincronizarAdministradores } from '@/servicos/acesso/administradores';
import { consultarScopesConcedidos, salvarRefreshToken } from '@/servicos/google/tokens';
import { criarClienteServidor } from '@/servicos/supabase/servidor';
import { dadosAcessoDoUsuario } from '@/servicos/supabase/usuario';

type ClienteServidor = Awaited<ReturnType<typeof criarClienteServidor>>;

// Retorno do OAuth. Redirects sempre para a URL oficial e destinos fixos (sem "next": evita open redirect).
export async function GET(request: NextRequest) {
  const site = obterSiteUrl();
  const ir = (caminho: string) => NextResponse.redirect(`${site}${caminho}`);

  const code = request.nextUrl.searchParams.get('code');
  if (!code || request.nextUrl.searchParams.has('error')) return ir('/login?erro=oauth');

  // Configuração lida antes de criar a sessão: se for inválida, nenhum cookie é gravado.
  let admins: readonly string[];
  try {
    admins = envAcesso().admins;
  } catch {
    return ir('/login?erro=interno');
  }

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.session) return ir('/login?erro=sessao');

  if (!avaliarAcesso(dadosAcessoDoUsuario(data.user), admins).permitido) {
    await supabase.auth.signOut({ scope: 'local' });
    return ir('/nao-autorizado');
  }

  try {
    await sincronizarAdministradores(admins);
  } catch (erro) {
    console.error('[auth/callback]', erro instanceof Error ? erro.message : 'erro desconhecido');
    await descartarSessao(supabase);
    return ir('/login?erro=interno');
  }

  await guardarCredencialGoogle(data.user.id, data.session);
  // Regrava a sessão sem provider_token/provider_refresh_token no cookie; se falhar, falha fechado.
  const { error: erroRenovacao } = await supabase.auth.refreshSession();
  if (erroRenovacao) {
    console.error('[auth/callback] falha ao renovar sessão', erroRenovacao.code ?? 'sem código');
    await descartarSessao(supabase);
    return ir('/login?erro=sessao');
  }
  return ir('/');
}

// Garante que nenhum cookie sb-* com credenciais do Google sobreviva: com erro de rede,
// o signOut local pode retornar sem limpar a sessão.
async function descartarSessao(supabase: ClienteServidor): Promise<void> {
  await supabase.auth.signOut({ scope: 'local' });
  const loja = await cookies();
  for (const cookie of loja.getAll()) {
    if (cookie.name.startsWith('sb-')) loja.delete(cookie.name);
  }
}

// Falha aqui não impede o login: Agenda/Drive/Gmail pedem reconexão quando forem usados.
async function guardarCredencialGoogle(usuarioId: string, sessao: Session) {
  if (!sessao.provider_refresh_token) return;
  try {
    const scopes = sessao.provider_token ? await consultarScopesConcedidos(sessao.provider_token) : null;
    await salvarRefreshToken(usuarioId, sessao.provider_refresh_token, scopes);
  } catch (erro) {
    console.error('[auth/callback]', erro instanceof Error ? erro.message : 'erro desconhecido');
  }
}
