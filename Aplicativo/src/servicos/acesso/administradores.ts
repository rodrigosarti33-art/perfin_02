import 'server-only';
import { criarClienteAdmin } from '@/servicos/supabase/admin';

/** Espelha ADMIN_EMAILS na tabela usada pelo RLS (upsert + remoção dos que saíram, numa transação). */
export async function sincronizarAdministradores(admins: readonly string[]): Promise<void> {
  const { error } = await criarClienteAdmin().rpc('sincronizar_administradores', { p_emails: [...admins] });
  if (error) throw new Error(`Falha ao sincronizar administradores (${error.code ?? 'sem código'})`);
}

// Última lista sincronizada por esta instância: cada nova instância (ex.: após um redeploy que
// mudou ADMIN_EMAILS) sincroniza na primeira requisição protegida, sem RPC nas seguintes.
let ultimaListaSincronizada: string | null = null;

/** Sincroniza só quando a lista mudou desde a última sincronização bem-sucedida. Falha propaga (fechado). */
export async function sincronizarSeMudou(admins: readonly string[]): Promise<void> {
  const chave = [...admins].sort().join(',');
  if (chave === ultimaListaSincronizada) return;
  await sincronizarAdministradores(admins);
  ultimaListaSincronizada = chave;
}
