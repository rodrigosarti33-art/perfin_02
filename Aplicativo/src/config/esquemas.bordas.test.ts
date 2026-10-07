import { describe, expect, it } from 'vitest';
import { lerAcesso, lerCifra, lerGemini, lerGoogle, lerSiteUrl, lerSupabase, lerSupabaseAdmin } from './esquemas';

const SEGREDO = 'segredo-que-nao-pode-vazar-123';

function mensagem(f: () => unknown): string {
  try {
    f();
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
  throw new Error('esperava erro');
}

describe('lerSiteUrl — bordas', () => {
  it.each([
    ['https://portal.vercel.app', 'https://portal.vercel.app'],
    ['https://portal.vercel.app/', 'https://portal.vercel.app'],
    ['https://portal.vercel.app///', 'https://portal.vercel.app'],
    ['  https://portal.vercel.app/  ', 'https://portal.vercel.app'],
    ['http://localhost:3000/', 'http://localhost:3000'],
  ])('%s => %s', (bruto, esperado) => expect(lerSiteUrl(bruto)).toBe(esperado));

  it.each(['', '   ', 'portal.vercel.app', 'ftp://portal.vercel.app', 'https://', 'https:portal.vercel.app', 'data:text/html,x'])(
    'rejeita %j',
    (bruto) => expect(() => lerSiteUrl(bruto)).toThrow(/NEXT_PUBLIC_SITE_URL/),
  );

  it('mensagem não ecoa o valor recebido', () => {
    expect(mensagem(() => lerSiteUrl(`javascript:${SEGREDO}`))).not.toContain(SEGREDO);
  });

  // A URL base é concatenada com "/auth/callback": query, fragmento e credenciais são recusados
  // e um caminho é descartado (fica só a origem).
  it('deveria rejeitar query string', () => {
    expect(() => lerSiteUrl('https://portal.vercel.app?a=1')).toThrow();
  });

  it('deveria rejeitar fragmento', () => {
    expect(() => lerSiteUrl('https://portal.vercel.app#x')).toThrow();
  });

  it('deveria rejeitar usuário/senha embutidos', () => {
    expect(() => lerSiteUrl('https://u:p@portal.vercel.app')).toThrow();
  });

  it('deveria devolver só a origem (sem caminho)', () => {
    expect(lerSiteUrl('https://portal.vercel.app/app/')).toBe('https://portal.vercel.app');
  });
});

describe('lerSupabase — bordas', () => {
  it('erro lista os dois nomes quando ambos faltam', () => {
    const msg = mensagem(() => lerSupabase({}));
    expect(msg).toContain('SUPABASE_URL');
    expect(msg).toContain('SUPABASE_PUBLISHABLE_KEY');
  });

  it('chave só de espaços é ausente', () => {
    expect(() => lerSupabase({ SUPABASE_URL: 'https://x.supabase.co', SUPABASE_PUBLISHABLE_KEY: '   ' })).toThrow(
      /SUPABASE_PUBLISHABLE_KEY/,
    );
  });

  it('chave tem espaços removidos', () => {
    expect(lerSupabase({ SUPABASE_URL: 'https://x.supabase.co', SUPABASE_PUBLISHABLE_KEY: ' k \n' }).chavePublica).toBe('k');
  });

  it('não carrega variáveis de outros grupos', () => {
    const v = lerSupabase({ SUPABASE_URL: 'https://x.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'k', SUPABASE_SECRET_KEY: SEGREDO });
    expect(JSON.stringify(v)).not.toContain(SEGREDO);
  });

  it.each(['ftp://x.supabase.co', 'javascript:alert(1)', 'mailto:a@b.c', 'https:x.supabase.co'])(
    'SUPABASE_URL exige http(s): rejeita %j',
    (SUPABASE_URL) => {
      expect(() => lerSupabase({ SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY: 'k' })).toThrow(
        'Configuração Supabase inválida ou ausente: SUPABASE_URL',
      );
    },
  );

  it('SUPABASE_URL aceita http local e https', () => {
    expect(lerSupabase({ SUPABASE_URL: 'http://127.0.0.1:54321', SUPABASE_PUBLISHABLE_KEY: 'k' }).url).toBe(
      'http://127.0.0.1:54321',
    );
    expect(lerSupabase({ SUPABASE_URL: 'https://abc.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'k' }).url).toBe(
      'https://abc.supabase.co',
    );
  });
});

describe('demais grupos — mensagens sem valores', () => {
  it('Supabase admin, Google e Gemini acusam só os nomes', () => {
    expect(mensagem(() => lerSupabaseAdmin({ SUPABASE_SECRET_KEY: ' ' }))).toMatch(/SUPABASE_SECRET_KEY/);
    const g = mensagem(() => lerGoogle({ GOOGLE_CLIENT_ID: SEGREDO }));
    expect(g).toMatch(/GOOGLE_CLIENT_SECRET/);
    expect(g).not.toContain(SEGREDO);
    expect(mensagem(() => lerGemini({ GEMINI_API_KEY: SEGREDO, GEMINI_MODELOS: ' , ,' }))).not.toContain(SEGREDO);
  });

  it('Gemini: só vírgulas em GEMINI_MODELOS é erro', () => {
    expect(() => lerGemini({ GEMINI_API_KEY: 'k', GEMINI_MODELOS: ' , ,' })).toThrow(/GEMINI_MODELOS/);
  });
});

describe('lerAcesso — bordas', () => {
  it('normaliza e remove duplicados', () => {
    expect(lerAcesso({ ADMIN_EMAILS: ' A@x.com, a@x.com ,B@x.com' }).admins).toEqual(['a@x.com', 'b@x.com']);
  });

  it.each([undefined, '', '   ', ',,,', 'a@x.com; b@x.com'])('ADMIN_EMAILS=%j é erro (falha fechada)', (ADMIN_EMAILS) => {
    expect(() => lerAcesso({ ADMIN_EMAILS })).toThrow(/ADMIN_EMAILS/);
  });

  it('mensagem não ecoa a lista', () => {
    expect(mensagem(() => lerAcesso({ ADMIN_EMAILS: SEGREDO }))).not.toContain(SEGREDO);
  });

  it.each(['"ana@x.com"', 'a@x.com, b@x.com; c@x.com', 'a@x.com, Ana <ana@x.com>'])(
    'item recusado no meio da lista é erro, não descarte silencioso: %j',
    (ADMIN_EMAILS) => {
      expect(() => lerAcesso({ ADMIN_EMAILS })).toThrow(/ADMIN_EMAILS/);
    },
  );
});

describe('lerCifra — bordas', () => {
  const b32 = Buffer.alloc(32, 7);

  it('aceita base64 com e sem padding e com espaços nas pontas', () => {
    expect(lerCifra({ TOKEN_ENCRYPTION_KEY: b32.toString('base64') }).chave.equals(b32)).toBe(true);
    expect(lerCifra({ TOKEN_ENCRYPTION_KEY: b32.toString('base64').replace(/=+$/, '') }).chave.equals(b32)).toBe(true);
    expect(lerCifra({ TOKEN_ENCRYPTION_KEY: `  ${b32.toString('base64')}\n` }).chave.equals(b32)).toBe(true);
  });

  it.each([1, 16, 24, 31, 33, 48, 64])('rejeita chave de %i bytes', (n) => {
    expect(() => lerCifra({ TOKEN_ENCRYPTION_KEY: Buffer.alloc(n, 1).toString('base64') })).toThrow(/32 bytes/);
  });

  it('rejeita chave em hex (64 caracteres decodificados como base64 = 48 bytes)', () => {
    expect(() => lerCifra({ TOKEN_ENCRYPTION_KEY: b32.toString('hex') })).toThrow(/32 bytes/);
  });

  it('ausente é erro e a mensagem não ecoa o valor', () => {
    expect(() => lerCifra({})).toThrow(/TOKEN_ENCRYPTION_KEY/);
    expect(mensagem(() => lerCifra({ TOKEN_ENCRYPTION_KEY: SEGREDO }))).not.toContain(SEGREDO);
  });

  // Defeito: Buffer.from(…, 'base64') ignora caracteres inválidos; chave colada com lixo é aceita.
  it.fails('deveria rejeitar chave com caracteres fora do base64', () => {
    const k = b32.toString('base64');
    expect(() => lerCifra({ TOKEN_ENCRYPTION_KEY: `${k.slice(0, 20)}!!!${k.slice(20)}` })).toThrow();
  });
});
