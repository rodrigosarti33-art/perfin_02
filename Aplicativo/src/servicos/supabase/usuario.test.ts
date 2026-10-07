import type { User, UserIdentity } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { dadosAcessoDoUsuario } from './usuario';

function identidade(provider: string, dados: Record<string, unknown>): UserIdentity {
  return {
    id: `${provider}-1`,
    identity_id: `${provider}-id`,
    user_id: 'u1',
    provider,
    identity_data: dados,
    created_at: '2026-01-01T00:00:00Z',
    last_sign_in_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

function usuario(parcial: Partial<User>): User {
  return {
    id: 'u1',
    aud: 'authenticated',
    app_metadata: {},
    user_metadata: {},
    created_at: '2026-01-01T00:00:00Z',
    email: 'ana@perfin.com',
    email_confirmed_at: '2026-01-01T00:00:00Z',
    identities: [identidade('google', { email: 'ana@perfin.com', email_verified: true })],
    ...parcial,
  };
}

describe('dadosAcessoDoUsuario', () => {
  it('Google verificado + Supabase confirmado => verificado', () => {
    expect(dadosAcessoDoUsuario(usuario({}))).toEqual({ email: 'ana@perfin.com', emailVerificado: true });
  });

  it('Google sem o campo email_verified => não verificado (falha fechada)', () => {
    const u = usuario({ identities: [identidade('google', { email: 'ana@perfin.com' })] });
    expect(dadosAcessoDoUsuario(u).emailVerificado).toBe(false);
  });

  it('Google com email_verified=false => não verificado', () => {
    const u = usuario({ identities: [identidade('google', { email: 'ana@perfin.com', email_verified: false })] });
    expect(dadosAcessoDoUsuario(u).emailVerificado).toBe(false);
  });

  it('sem email_confirmed_at => não verificado', () => {
    expect(dadosAcessoDoUsuario(usuario({ email_confirmed_at: undefined })).emailVerificado).toBe(false);
  });

  it('sem identidade Google (ex.: e-mail/senha ou outro provedor) => não verificado', () => {
    expect(dadosAcessoDoUsuario(usuario({ identities: [identidade('email', { email_verified: true })] })).emailVerificado).toBe(
      false,
    );
    expect(dadosAcessoDoUsuario(usuario({ identities: [] })).emailVerificado).toBe(false);
    expect(dadosAcessoDoUsuario(usuario({ identities: undefined })).emailVerificado).toBe(false);
  });

  it('sem e-mail repassa ausência', () => {
    expect(dadosAcessoDoUsuario(usuario({ email: undefined })).email).toBeUndefined();
  });

  it('email_verified="false" (string) => não verificado', () => {
    const u = usuario({ identities: [identidade('google', { email: 'ana@perfin.com', email_verified: 'false' })] });
    expect(dadosAcessoDoUsuario(u).emailVerificado).toBe(false);
  });

  it('e-mail da identidade Google diferente do e-mail do usuário => não verificado', () => {
    const u = usuario({
      email: 'ana@perfin.com',
      identities: [identidade('google', { email: 'outra@gmail.com', email_verified: true })],
    });
    expect(dadosAcessoDoUsuario(u).emailVerificado).toBe(false);
  });

  it('mesmo e-mail com caixa e espaços diferentes => verificado', () => {
    const u = usuario({
      email: ' Ana@Perfin.com',
      identities: [identidade('google', { email: 'ANA@perfin.com ', email_verified: true })],
    });
    expect(dadosAcessoDoUsuario(u).emailVerificado).toBe(true);
  });
});
