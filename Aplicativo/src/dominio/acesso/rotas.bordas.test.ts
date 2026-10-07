import { describe, expect, it } from 'vitest';
import { ehRotaApi, ehRotaPublica } from './rotas';

describe('ehRotaPublica — bordas', () => {
  it.each(['/login//', '/sobre///', '/termos/', '/auth/callback/'])('%s (barras finais) é pública', (caminho) => {
    expect(ehRotaPublica(caminho)).toBe(true);
  });

  it.each([
    '',
    '/',
    '//',
    '/loginx',
    '/login-admin',
    '/xlogin',
    '/LOGIN',
    '/Sobre',
    '/sobre/../',
    '/sobre/..',
    '/sobre/../relatorios',
    '/sobre/./',
    '/login/.',
    '/%6Cogin',
    '/login%2F',
    '/login?x=1',
    '/login#x',
    'login',
    '/auth',
    '/auth/',
    '/auth/callbackx',
    '/auth/callback/extra',
    '/privacidade.json',
    '/termos/../api/assistente',
  ])('%j é protegida (falha fechada)', (caminho) => {
    expect(ehRotaPublica(caminho)).toBe(false);
  });
});

describe('ehRotaApi — bordas', () => {
  it.each(['/api', '/api/', '/api/a/b', '/api//x'])('%s é API', (caminho) => expect(ehRotaApi(caminho)).toBe(true));

  it.each(['/apix', '/apis/x', '/x/api', '', '/', 'api/x'])('%j não é API', (caminho) =>
    expect(ehRotaApi(caminho)).toBe(false),
  );

  it('/API (maiúsculas) não é tratada como API (caminho diferencia caixa)', () => {
    expect(ehRotaApi('/API/assistente')).toBe(false);
  });
});
