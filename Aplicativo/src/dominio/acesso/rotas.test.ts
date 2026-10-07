import { describe, expect, it } from 'vitest';
import { ehRotaApi, ehRotaPublica } from './rotas';

describe('ehRotaPublica', () => {
  it.each(['/login', '/login/', '/nao-autorizado', '/privacidade', '/termos', '/sobre', '/auth/callback'])(
    '%s é pública',
    (caminho) => expect(ehRotaPublica(caminho)).toBe(true),
  );

  it.each(['/', '/loginx', '/login/extra', '/relatorios', '/api/assistente', '/auth/callback2'])(
    '%s é protegida',
    (caminho) => expect(ehRotaPublica(caminho)).toBe(false),
  );
});

describe('ehRotaApi', () => {
  it('reconhece /api e subrotas', () => {
    expect(ehRotaApi('/api')).toBe(true);
    expect(ehRotaApi('/api/assistente')).toBe(true);
    expect(ehRotaApi('/apix')).toBe(false);
  });
});
