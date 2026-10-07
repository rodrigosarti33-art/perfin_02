import { describe, expect, it } from 'vitest';
import { avaliarAcesso, parsearListaAdmins } from './admins';

describe('parsearListaAdmins', () => {
  it('normaliza espaços e maiúsculas e remove duplicados', () => {
    expect(parsearListaAdmins(' Ana@Perfin.com , ana@perfin.com,bia@x.com ')).toEqual(['ana@perfin.com', 'bia@x.com']);
  });

  it('ignora itens vazios e inválidos', () => {
    expect(parsearListaAdmins('ana@perfin.com,,nao-e-email, @x.com')).toEqual(['ana@perfin.com']);
  });

  it('lista ausente vira vazia', () => {
    expect(parsearListaAdmins(undefined)).toEqual([]);
    expect(parsearListaAdmins('')).toEqual([]);
  });
});

describe('avaliarAcesso', () => {
  const admins = ['ana@perfin.com'];

  it('permite admin verificado, sem diferenciar maiúsculas', () => {
    expect(avaliarAcesso({ email: 'ANA@perfin.com', emailVerificado: true }, admins)).toEqual({
      permitido: true,
      email: 'ana@perfin.com',
    });
  });

  it('nega quem não está na lista', () => {
    expect(avaliarAcesso({ email: 'outro@perfin.com', emailVerificado: true }, admins)).toEqual({
      permitido: false,
      motivo: 'nao-admin',
    });
  });

  it('nega e-mail não verificado mesmo sendo admin', () => {
    expect(avaliarAcesso({ email: 'ana@perfin.com', emailVerificado: false }, admins).permitido).toBe(false);
  });

  it('nega sem e-mail', () => {
    expect(avaliarAcesso({ email: null, emailVerificado: true }, admins)).toEqual({ permitido: false, motivo: 'sem-email' });
  });

  it('falha fechada com lista vazia', () => {
    expect(avaliarAcesso({ email: 'ana@perfin.com', emailVerificado: true }, [])).toEqual({
      permitido: false,
      motivo: 'lista-vazia',
    });
  });
});
