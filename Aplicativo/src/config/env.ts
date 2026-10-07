import 'server-only';
import { lerAcesso, lerCifra, lerGemini, lerGoogle, lerSupabase, lerSupabaseAdmin } from './esquemas';

// Cada grupo é validado na primeira chamada: variável ausente só derruba quem precisa dela.
function memo<T>(ler: () => T): () => T {
  let valor: T | undefined;
  return () => (valor ??= ler());
}

export const envSupabase = memo(() => lerSupabase(process.env));
export const envSupabaseAdmin = memo(() => lerSupabaseAdmin(process.env));
export const envGoogle = memo(() => lerGoogle(process.env));
export const envAcesso = memo(() => lerAcesso(process.env));
export const envCifra = memo(() => lerCifra(process.env));
export const envGemini = memo(() => lerGemini(process.env));
