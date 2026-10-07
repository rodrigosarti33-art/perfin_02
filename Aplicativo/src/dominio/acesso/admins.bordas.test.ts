import { describe, expect, it } from 'vitest';
import { avaliarAcesso, itensAdminInvalidos, normalizarEmail, parsearListaAdmins } from './admins';

describe('normalizarEmail', () => {
  it('remove espaços (inclusive tab/quebra de linha) e baixa a caixa', () => {
    expect(normalizarEmail('\t  Ana.Silva@PERFIN.com.BR \r\n')).toBe('ana.silva@perfin.com.br');
  });
});

describe('parsearListaAdmins — bordas', () => {
  it('remove duplicados que só diferem por caixa/espaço, preservando a ordem da 1ª ocorrência', () => {
    expect(parsearListaAdmins('B@x.com, a@x.com ,b@X.COM,  A@x.com')).toEqual(['b@x.com', 'a@x.com']);
  });

  it('descarta lixo: vírgulas soltas, só espaços, sem domínio, sem TLD, dois @', () => {
    expect(parsearListaAdmins(',, ,ana,ana@,@x.com,ana@x,a@@x.com,a@b@c.com,ok@x.com,')).toEqual(['ok@x.com']);
  });

  it('aceita \\r final (env editada no Windows)', () => {
    expect(parsearListaAdmins('a@x.com,b@x.com\r')).toEqual(['a@x.com', 'b@x.com']);
  });

  it('só a vírgula é separador: ";" e quebra de linha invalidam os itens (falha fechada)', () => {
    expect(parsearListaAdmins('a@x.com; b@x.com')).toEqual([]);
    expect(parsearListaAdmins('a@x.com\nb@x.com')).toEqual([]);
  });

  it('formato "Nome <email>" é descartado', () => {
    expect(parsearListaAdmins('Ana <ana@x.com>')).toEqual([]);
  });

  it('e-mail entre aspas é recusado (não vira um "admin" que nunca casa)', () => {
    expect(parsearListaAdmins('"ana@x.com"')).toEqual([]);
    expect(parsearListaAdmins("'ana@x.com'")).toEqual([]);
  });
});

describe('itensAdminInvalidos', () => {
  it('conta só itens não vazios recusados', () => {
    expect(itensAdminInvalidos('a@x.com, ,b@x.com,')).toBe(0);
    expect(itensAdminInvalidos('a@x.com, b@x.com; c@x.com')).toBe(1);
    expect(itensAdminInvalidos('"ana@x.com",Ana <a@x.com>')).toBe(2);
    expect(itensAdminInvalidos(undefined)).toBe(0);
  });
});

describe('avaliarAcesso — bordas', () => {
  const admins = parsearListaAdmins('ana@perfin.com');

  it('e-mail com espaços e maiúsculas de admin verificado é permitido e devolvido normalizado', () => {
    expect(avaliarAcesso({ email: '  ANA@Perfin.Com ', emailVerificado: true }, admins)).toEqual({
      permitido: true,
      email: 'ana@perfin.com',
    });
  });

  it('e-mail vazio ou undefined => sem-email', () => {
    expect(avaliarAcesso({ email: '', emailVerificado: true }, admins)).toEqual({ permitido: false, motivo: 'sem-email' });
    expect(avaliarAcesso({ email: undefined, emailVerificado: true }, admins)).toEqual({
      permitido: false,
      motivo: 'sem-email',
    });
  });

  it('e-mail só de espaços é negado', () => {
    expect(avaliarAcesso({ email: '   ', emailVerificado: true }, admins).permitido).toBe(false);
  });

  it('não verificado tem motivo próprio, antes de checar a lista', () => {
    expect(avaliarAcesso({ email: 'ana@perfin.com', emailVerificado: false }, admins)).toEqual({
      permitido: false,
      motivo: 'email-nao-verificado',
    });
    expect(avaliarAcesso({ email: 'ana@perfin.com', emailVerificado: false }, [])).toEqual({
      permitido: false,
      motivo: 'email-nao-verificado',
    });
  });

  it('não aceita prefixo/sufixo/subdomínio parecido', () => {
    for (const email of ['ana@perfin.com.br', 'xana@perfin.com', 'ana@sub.perfin.com', 'ana@perfin.co']) {
      expect(avaliarAcesso({ email, emailVerificado: true }, admins).permitido).toBe(false);
    }
  });

  it('não normaliza variantes do Gmail (pontos/+tag): só e-mail idêntico entra', () => {
    const lista = parsearListaAdmins('ana.silva@gmail.com');
    expect(avaliarAcesso({ email: 'anasilva@gmail.com', emailVerificado: true }, lista).permitido).toBe(false);
    expect(avaliarAcesso({ email: 'ana.silva+x@gmail.com', emailVerificado: true }, lista).permitido).toBe(false);
  });
});
