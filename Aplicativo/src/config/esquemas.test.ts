import { describe, expect, it } from 'vitest';
import { lerAcesso, lerCifra, lerGemini, lerSiteUrl, lerSupabase } from './esquemas';

const CHAVE_32 = Buffer.alloc(32, 7).toString('base64');

describe('esquemas de env', () => {
  it('grupo ausente lança erro só com os nomes das variáveis', () => {
    expect(() => lerSupabase({ SUPABASE_PUBLISHABLE_KEY: 'segredo-que-nao-pode-vazar' })).toThrow(/SUPABASE_URL/);
    try {
      lerSupabase({ SUPABASE_URL: 'nao-e-url', SUPABASE_PUBLISHABLE_KEY: 'segredo-que-nao-pode-vazar' });
    } catch (e) {
      expect(String(e)).not.toContain('segredo-que-nao-pode-vazar');
      expect(String(e)).not.toContain('nao-e-url');
    }
  });

  it('grupos são independentes', () => {
    expect(() => lerGemini({})).toThrow(/GEMINI_API_KEY/);
    expect(lerSupabase({ SUPABASE_URL: 'https://x.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'k' }).url).toBe(
      'https://x.supabase.co',
    );
  });

  it('chave de cifra precisa de 32 bytes', () => {
    expect(lerCifra({ TOKEN_ENCRYPTION_KEY: CHAVE_32 }).chave).toHaveLength(32);
    expect(() => lerCifra({ TOKEN_ENCRYPTION_KEY: Buffer.alloc(16).toString('base64') })).toThrow(/32 bytes/);
  });

  it('ADMIN_EMAILS sem nenhum e-mail válido é erro', () => {
    expect(() => lerAcesso({ ADMIN_EMAILS: ' , nao-email' })).toThrow(/ADMIN_EMAILS/);
    expect(lerAcesso({ ADMIN_EMAILS: 'A@x.com' }).admins).toEqual(['a@x.com']);
  });

  it('GEMINI_MODELOS vira lista ordenada', () => {
    expect(lerGemini({ GEMINI_API_KEY: 'k', GEMINI_MODELOS: 'a, b,,c' }).modelos).toEqual(['a', 'b', 'c']);
  });

  it('site url: tira a barra final e exige http(s)', () => {
    expect(lerSiteUrl('https://portal.vercel.app/')).toBe('https://portal.vercel.app');
    expect(() => lerSiteUrl(undefined)).toThrow(/NEXT_PUBLIC_SITE_URL/);
    expect(() => lerSiteUrl('javascript:alert(1)')).toThrow();
  });
});
