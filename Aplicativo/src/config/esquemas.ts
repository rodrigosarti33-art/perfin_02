// Leitura e validação das variáveis de ambiente, por grupo e sob demanda.
// Puro (sem server-only) para poder ser testado e usado no proxy.
// Erros listam só os NOMES das variáveis com problema, nunca os valores.
import { z } from 'zod';
import { itensAdminInvalidos, parsearListaAdmins } from '@/dominio/acesso/admins';

export type FonteEnv = Record<string, string | undefined>;

const texto = z.string().trim().min(1);

function validar<T extends z.ZodRawShape>(grupo: string, forma: T, fonte: FonteEnv): z.infer<z.ZodObject<T>> {
  const valores = Object.fromEntries(Object.keys(forma).map((nome) => [nome, fonte[nome]]));
  const resultado = z.object(forma).safeParse(valores);
  if (!resultado.success) {
    const nomes = [...new Set(resultado.error.issues.map((issue) => String(issue.path[0])))];
    throw new Error(`Configuração ${grupo} inválida ou ausente: ${nomes.join(', ')}`);
  }
  return resultado.data;
}

export function lerSupabase(fonte: FonteEnv) {
  const v = validar('Supabase', { SUPABASE_URL: z.url({ protocol: /^https?$/ }), SUPABASE_PUBLISHABLE_KEY: texto }, fonte);
  return { url: v.SUPABASE_URL, chavePublica: v.SUPABASE_PUBLISHABLE_KEY };
}

export function lerSupabaseAdmin(fonte: FonteEnv) {
  return { chaveSecreta: validar('Supabase admin', { SUPABASE_SECRET_KEY: texto }, fonte).SUPABASE_SECRET_KEY };
}

export function lerGoogle(fonte: FonteEnv) {
  const v = validar('Google', { GOOGLE_CLIENT_ID: texto, GOOGLE_CLIENT_SECRET: texto }, fonte);
  return { clientId: v.GOOGLE_CLIENT_ID, clientSecret: v.GOOGLE_CLIENT_SECRET };
}

export function lerAcesso(fonte: FonteEnv) {
  const v = validar('de acesso', { ADMIN_EMAILS: texto }, fonte);
  const admins = parsearListaAdmins(v.ADMIN_EMAILS);
  if (admins.length === 0 || itensAdminInvalidos(v.ADMIN_EMAILS) > 0) throw new Error('Configuração de acesso inválida ou ausente: ADMIN_EMAILS');
  return { admins };
}

export function lerCifra(fonte: FonteEnv) {
  const v = validar('de cifra', { TOKEN_ENCRYPTION_KEY: texto }, fonte);
  const chave = Buffer.from(v.TOKEN_ENCRYPTION_KEY, 'base64');
  if (chave.length !== 32) throw new Error('Configuração de cifra inválida: TOKEN_ENCRYPTION_KEY (precisa de 32 bytes em base64)');
  return { chave };
}

export function lerGemini(fonte: FonteEnv) {
  const v = validar('Gemini', { GEMINI_API_KEY: texto, GEMINI_MODELOS: texto }, fonte);
  const modelos = v.GEMINI_MODELOS.split(',').map((m) => m.trim()).filter(Boolean);
  if (modelos.length === 0) throw new Error('Configuração Gemini inválida ou ausente: GEMINI_MODELOS');
  return { chave: v.GEMINI_API_KEY, modelos };
}

/** NEXT_PUBLIC_SITE_URL normalizada para a origem (sem caminho, query, fragmento ou credenciais). */
export function lerSiteUrl(bruto: string | undefined): string {
  const resultado = z.url({ protocol: /^https?$/ }).safeParse(bruto?.trim());
  if (!resultado.success) throw new Error('Configuração inválida ou ausente: NEXT_PUBLIC_SITE_URL');
  const url = new URL(resultado.data);
  if (url.search || url.hash || url.username || url.password) {
    throw new Error('Configuração inválida: NEXT_PUBLIC_SITE_URL (use só a origem, sem query, fragmento ou credenciais)');
  }
  return url.origin;
}
