import type { User, UserIdentity } from '@supabase/supabase-js';
import { normalizarEmail, type DadosAcesso } from '@/dominio/acesso/admins';

/** A identidade é do Google, o Google marcou o e-mail como verificado e é o MESMO e-mail principal. */
function googleConfirmaEmail(identidade: UserIdentity, email: string): boolean {
  const dados = identidade.identity_data ?? {};
  const verificado = dados.email_verified === true || dados.email_verified === 'true';
  const emailGoogle = typeof dados.email === 'string' ? normalizarEmail(dados.email) : null;
  return identidade.provider === 'google' && verificado && emailGoogle === email;
}

/** E-mail verificado = Supabase confirmou e uma identidade Google verificada tem o mesmo e-mail. */
export function dadosAcessoDoUsuario(usuario: User): DadosAcesso {
  const email = usuario.email ? normalizarEmail(usuario.email) : null;
  const vinculado = email !== null && (usuario.identities ?? []).some((identidade) => googleConfirmaEmail(identidade, email));
  return { email: usuario.email, emailVerificado: Boolean(usuario.email_confirmed_at) && vinculado };
}
