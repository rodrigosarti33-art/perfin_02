import 'server-only';
import { envCifra } from '@/config/env';
import { criarClienteAdmin } from '@/servicos/supabase/admin';
import { cifrar } from './cifra';

const URL_TOKENINFO = 'https://oauth2.googleapis.com/tokeninfo';

/** Scopes que o usuário realmente concedeu (no consentimento ele pode desmarcar alguns). */
export async function consultarScopesConcedidos(accessToken: string): Promise<string | null> {
  const resposta = await fetch(URL_TOKENINFO, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ access_token: accessToken }),
    cache: 'no-store',
  });
  if (!resposta.ok) return null;
  const dados: unknown = await resposta.json();
  const scope = (dados as { scope?: unknown }).scope;
  return typeof scope === 'string' ? scope : null;
}

/** Grava o refresh token do Google cifrado (AAD = user_id). Não mexe em pasta_drive_id. */
export async function salvarRefreshToken(usuarioId: string, refreshToken: string, scopes: string | null): Promise<void> {
  const { error } = await criarClienteAdmin()
    .from('google_credenciais')
    .upsert({
      user_id: usuarioId,
      refresh_token_cifrado: cifrar(refreshToken, envCifra().chave, usuarioId),
      scopes,
      atualizado_em: new Date().toISOString(),
    });
  if (error) throw new Error(`Falha ao gravar credencial Google (${error.code ?? 'sem código'})`);
}
