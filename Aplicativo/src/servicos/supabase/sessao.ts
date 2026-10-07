import 'server-only';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { envAcesso } from '@/config/env';
import { avaliarAcesso } from '@/dominio/acesso/admins';
import { sincronizarSeMudou } from '@/servicos/acesso/administradores';
import { criarClienteServidor } from './servidor';
import { dadosAcessoDoUsuario } from './usuario';

/**
 * Exige um administrador autenticado. Chamar em TODA page, Route Handler e Server Action protegida.
 * Usa getUser() (valida o token no servidor de Auth), nunca getSession().
 */
export const exigirAdmin = cache(async () => {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { admins } = envAcesso();
  const acesso = avaliarAcesso(dadosAcessoDoUsuario(user), admins);
  if (!acesso.permitido) redirect('/nao-autorizado');
  // Mantém a tabela do RLS alinhada a ADMIN_EMAILS mesmo sem novo login de admin.
  await sincronizarSeMudou(admins);

  return { supabase, usuarioId: user.id, email: acesso.email, nome: nomeDoUsuario(user.user_metadata) };
});

function nomeDoUsuario(metadados: Record<string, unknown> | undefined): string | null {
  const nome = metadados?.full_name ?? metadados?.name;
  return typeof nome === 'string' && nome.trim() ? nome.trim() : null;
}
