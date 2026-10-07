import type { User, UserIdentity } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const atualizarSessao = vi.fn();

vi.mock('@/servicos/supabase/proxySessao', async (original) => ({
  ...(await original<typeof import('@/servicos/supabase/proxySessao')>()),
  atualizarSessao: (...args: unknown[]) => atualizarSessao(...args),
}));

const { proxy, config } = await import('./proxy');

const BASE = 'https://portal.exemplo.com';

function google(email: string, verificado: boolean): UserIdentity {
  return {
    id: 'g',
    identity_id: 'gid',
    user_id: 'u1',
    provider: 'google',
    identity_data: { email, email_verified: verificado },
  };
}

function usuario(email: string, verificado = true): User {
  return {
    id: 'u1',
    aud: 'authenticated',
    app_metadata: {},
    user_metadata: {},
    created_at: '2026-01-01T00:00:00Z',
    email,
    email_confirmed_at: '2026-01-01T00:00:00Z',
    identities: [google(email, verificado)],
  };
}

function sessao(user: User | null, cookies: Array<[string, string]> = []): void {
  atualizarSessao.mockImplementation(async (request: NextRequest) => {
    const response = NextResponse.next({ request });
    cookies.forEach(([nome, valor]) => response.cookies.set(nome, valor));
    return { response, user };
  });
}

async function chamar(caminho: string): Promise<Response> {
  return proxy(new NextRequest(`${BASE}${caminho}`));
}

function destino(resposta: Response): string | null {
  const local = resposta.headers.get('location');
  return local ? new URL(local).pathname + new URL(local).search : null;
}

function passou(resposta: Response): boolean {
  return resposta.headers.get('x-middleware-next') === '1';
}

beforeEach(() => {
  vi.stubEnv('ADMIN_EMAILS', 'ana@perfin.com');
  atualizarSessao.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('proxy — anônimo', () => {
  beforeEach(() => sessao(null));

  it.each(['/', '/relatorios', '/relatorios/2026-10', '/loginx', '/sobre/x'])('%s redireciona para /login', async (caminho) => {
    expect(destino(await chamar(caminho))).toBe('/login');
  });

  it('descarta a query string no redirect (sem "next" => sem open redirect)', async () => {
    expect(destino(await chamar('/relatorios?next=https://mal.com'))).toBe('/login');
  });

  it.each(['/login', '/nao-autorizado', '/privacidade', '/termos', '/sobre'])('%s passa', async (caminho) => {
    expect(passou(await chamar(caminho))).toBe(true);
  });

  it('API responde 401 JSON, sem redirect', async () => {
    const r = await chamar('/api/assistente');
    expect(r.status).toBe(401);
    expect(r.headers.get('location')).toBeNull();
    expect(await r.json()).toEqual({ erro: 'não autorizado' });
  });
});

describe('proxy — logado', () => {
  it('admin verificado passa em rota protegida e API', async () => {
    sessao(usuario('ANA@perfin.com'));
    expect(passou(await chamar('/'))).toBe(true);
    expect(passou(await chamar('/api/assistente'))).toBe(true);
  });

  it('admin em /login vai para /', async () => {
    sessao(usuario('ana@perfin.com'));
    expect(destino(await chamar('/login'))).toBe('/');
  });

  it('admin em /nao-autorizado continua lá (sem loop)', async () => {
    sessao(usuario('ana@perfin.com'));
    expect(passou(await chamar('/nao-autorizado'))).toBe(true);
  });

  it('não admin vai para /nao-autorizado e recebe 401 na API', async () => {
    sessao(usuario('intruso@perfin.com'));
    expect(destino(await chamar('/'))).toBe('/nao-autorizado');
    expect((await chamar('/api/x')).status).toBe(401);
    expect(passou(await chamar('/nao-autorizado'))).toBe(true);
    expect(passou(await chamar('/login'))).toBe(true);
  });

  it('admin com e-mail não verificado no Google é barrado', async () => {
    sessao(usuario('ana@perfin.com', false));
    expect(destino(await chamar('/'))).toBe('/nao-autorizado');
  });

  it('redirect preserva os cookies de sessão renovados', async () => {
    sessao(null, [['sb-token', 'novo']]);
    const r = await chamar('/');
    expect(destino(r)).toBe('/login');
    expect(r.headers.get('set-cookie') ?? '').toContain('sb-token=novo');
  });
});

describe('proxy — falha fechada', () => {
  it('ADMIN_EMAILS ausente: logado em rota protegida vai para /login?erro=interno', async () => {
    vi.stubEnv('ADMIN_EMAILS', '');
    sessao(usuario('ana@perfin.com'));
    expect(destino(await chamar('/'))).toBe('/login?erro=interno');
    expect((await chamar('/api/x')).status).toBe(503);
    expect(passou(await chamar('/login'))).toBe(true);
  });

  it('Auth fora do ar: protegida => /login?erro=interno, API => 503, pública passa', async () => {
    atualizarSessao.mockRejectedValue(new Error('rede'));
    expect(destino(await chamar('/relatorios?x=1'))).toBe('/login?erro=interno');
    const api = await chamar('/api/x');
    expect(api.status).toBe(503);
    expect(await api.json()).toEqual({ erro: 'indisponível' });
    expect(passou(await chamar('/login'))).toBe(true);
  });
});

describe('proxy — matcher', () => {
  // Aproximação do que o Next faz: o padrão precisa casar o caminho inteiro.
  const padrao = new RegExp(`^${config.matcher[0]}$`);
  const roda = (caminho: string): boolean => padrao.test(caminho);

  it.each(['/', '/login', '/relatorios', '/api/assistente', '/nao-autorizado', '/auth', '/marcas'])(
    'proxy roda em %s',
    (caminho) => expect(roda(caminho)).toBe(true),
  );

  it.each([
    '/_next/static/chunk.js',
    '/_next/image',
    '/auth/callback',
    '/favicon.ico',
    '/icon.png',
    '/apple-icon.png',
    '/manifest.webmanifest',
    '/sw.js',
    '/offline.html',
    '/icones/icone-192.png',
    '/marca/perfin-infra.png',
  ])('proxy NÃO roda em %s (estático/callback)', (caminho) => expect(roda(caminho)).toBe(false));

  // Exclusões ancoradas: rotas futuras que só COMEÇAM com esses nomes continuam passando pelo proxy.
  it.each([
    '/auth/callback-admin',
    '/auth/callbackx/painel',
    '/auth/callback/x',
    '/sw.jsx',
    '/offline.html2',
    '/favicon.icoX',
    '/faviconXico',
    '/icon.png2',
    '/iconXpng',
  ])(
    'proxy deveria rodar em %s',
    (caminho) => expect(roda(caminho)).toBe(true),
  );
});
