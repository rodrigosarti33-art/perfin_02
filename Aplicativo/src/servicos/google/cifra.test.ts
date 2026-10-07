import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { cifrar, decifrar } from './cifra';

const chave = randomBytes(32);
const usuario = '6b7c2f0e-0000-4000-8000-000000000001';

describe('cifra AES-256-GCM', () => {
  it('ida e volta', () => {
    const pacote = cifrar('1//refresh-token', chave, usuario);
    expect(pacote.startsWith('v1.')).toBe(true);
    expect(pacote).not.toContain('refresh-token');
    expect(decifrar(pacote, chave, usuario)).toBe('1//refresh-token');
  });

  it('IV diferente a cada chamada', () => {
    expect(cifrar('x', chave, usuario)).not.toBe(cifrar('x', chave, usuario));
  });

  it('falha com AAD de outro usuário', () => {
    const pacote = cifrar('segredo', chave, usuario);
    expect(() => decifrar(pacote, chave, 'outro-usuario')).toThrow();
  });

  it('falha com chave errada', () => {
    const pacote = cifrar('segredo', chave, usuario);
    expect(() => decifrar(pacote, randomBytes(32), usuario)).toThrow();
  });

  it('falha com conteúdo adulterado', () => {
    const [v, iv, tag, dados] = cifrar('segredo', chave, usuario).split('.');
    const adulterado = Buffer.from(dados!, 'base64url');
    adulterado[0] = adulterado[0]! ^ 1;
    expect(() => decifrar([v, iv, tag, adulterado.toString('base64url')].join('.'), chave, usuario)).toThrow();
  });

  it('falha com formato inválido', () => {
    expect(() => decifrar('lixo', chave, usuario)).toThrow(/Formato/);
    expect(() => decifrar('v2.a.b.c', chave, usuario)).toThrow(/Formato/);
  });
});
