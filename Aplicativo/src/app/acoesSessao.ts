'use server';

import { redirect } from 'next/navigation';
import { obterSiteUrl } from '@/config/envPublico';
import { ESCOPOS_GOOGLE } from '@/servicos/google/escopos';
import { criarClienteServidor } from '@/servicos/supabase/servidor';

export async function entrarComGoogle(): Promise<void> {
  let destino = '/login?erro=interno';
  try {
    const supabase = await criarClienteServidor();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${obterSiteUrl()}/auth/callback`,
        scopes: ESCOPOS_GOOGLE.join(' '),
        queryParams: { access_type: 'offline', prompt: 'consent select_account' },
      },
    });
    if (!error && data.url) destino = data.url;
  } catch (erro) {
    console.error('[entrarComGoogle]', erro instanceof Error ? erro.message : 'erro desconhecido');
  }
  redirect(destino);
}

export async function sair(): Promise<void> {
  try {
    const supabase = await criarClienteServidor();
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) console.error('[sair]', error.message);
  } catch (erro) {
    console.error('[sair]', erro instanceof Error ? erro.message : 'erro desconhecido');
  }
  redirect('/login');
}
