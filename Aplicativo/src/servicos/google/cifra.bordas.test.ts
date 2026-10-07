import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { cifrar, decifrar } from './cifra';

const chave = randomBytes(32);
const usuario = '6b7c2f0e-0000-4000-8000-000000000001';

type Partes = [string, Buffer, Buffer, Buffer];

function partes(pacote: string): Partes {
  const [v, iv, tag, dados] = pacote.split('.');
  return [v!, Buffer.from(iv!, 'base64url'), Buffer.from(tag!, 'base64url'), Buffer.from(dados!, 'base64url')];
}

function montar(v: string, iv: Buffer, tag: Buffer, dados: Buffer): string {
  return [v, iv.toString('base64url'), tag.toString('base64url'), dados.toString('base64url')].join('.');
}

describe('cifra — bordas', () => {
  it('formato: v1 + IV 12 bytes + tag 16 bytes, só caracteres base64url', () => {
    const pacote = cifrar('abc', chave, usuario);
    expect(pacote).toMatch(/^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    const [, iv, tag] = partes(pacote);
    expect(iv).toHaveLength(12);
    expect(tag).toHaveLength(16);
  });

  it.each(['', 'á é ç ñ 😀', `1//${'x'.repeat(5000)}`, 'com.pontos.e.barras/=+'])('ida e volta %#', (texto) => {
    expect(decifrar(cifrar(texto, chave, usuario), chave, usuario)).toBe(texto);
  });

  it('AAD vazio funciona, mas não cruza com AAD diferente', () => {
    const pacote = cifrar('x', chave, '');
    expect(decifrar(pacote, chave, '')).toBe('x');
    expect(() => decifrar(pacote, chave, usuario)).toThrow();
    expect(() => decifrar(cifrar('x', chave, usuario), chave, '')).toThrow();
  });

  it('AAD sensível a caixa e espaço', () => {
    const pacote = cifrar('x', chave, usuario);
    expect(() => decifrar(pacote, chave, usuario.toUpperCase())).toThrow();
    expect(() => decifrar(pacote, chave, ` ${usuario}`)).toThrow();
  });

  it.each([0, 16, 24, 31, 33, 64])('chave de %i bytes falha ao cifrar', (n) => {
    expect(() => cifrar('x', randomBytes(n), usuario)).toThrow();
  });

  it('chave de tamanho errado falha ao decifrar', () => {
    const pacote = cifrar('x', chave, usuario);
    expect(() => decifrar(pacote, chave.subarray(0, 16), usuario)).toThrow();
  });

  it('inverter qualquer bit do IV, da tag ou do cifrado falha', () => {
    const [v, iv, tag, dados] = partes(cifrar('refresh-token-bem-longo', chave, usuario));
    const alvos: Array<[Buffer, (b: Buffer) => string]> = [
      [iv, (b) => montar(v, b, tag, dados)],
      [tag, (b) => montar(v, iv, b, dados)],
      [dados, (b) => montar(v, iv, tag, b)],
    ];
    for (const [alvo, refazer] of alvos) {
      for (let i = 0; i < alvo.length; i++) {
        const copia = Buffer.from(alvo);
        copia[i] = copia[i]! ^ 0x80;
        expect(() => decifrar(refazer(copia), chave, usuario)).toThrow();
      }
    }
  });

  it('truncar, estender ou esvaziar o cifrado falha', () => {
    const [v, iv, tag, dados] = partes(cifrar('segredo', chave, usuario));
    expect(() => decifrar(montar(v, iv, tag, dados.subarray(0, dados.length - 1)), chave, usuario)).toThrow();
    expect(() => decifrar(montar(v, iv, tag, Buffer.concat([dados, Buffer.from([0])])), chave, usuario)).toThrow();
    expect(() => decifrar(montar(v, iv, tag, Buffer.alloc(0)), chave, usuario)).toThrow();
  });

  it('trocar cifrado entre dois pacotes do mesmo usuário falha', () => {
    const [v, iv, tag] = partes(cifrar('aaaaaaa', chave, usuario));
    const [, , , dadosB] = partes(cifrar('bbbbbbb', chave, usuario));
    expect(() => decifrar(montar(v, iv, tag, dadosB), chave, usuario)).toThrow();
  });

  it('tag truncada é formato inválido, sem chegar ao GCM', () => {
    const [v, iv, tag, dados] = partes(cifrar('segredo', chave, usuario));
    expect(() => decifrar(montar(v, iv, tag.subarray(0, 12), dados), chave, usuario)).toThrow(/Formato/);
    expect(() => decifrar(montar(v, iv, tag.subarray(0, 4), dados), chave, usuario)).toThrow(/Formato/);
  });

  it('IV de tamanho errado é formato inválido', () => {
    const [v, iv, tag, dados] = partes(cifrar('segredo', chave, usuario));
    expect(() => decifrar(montar(v, iv.subarray(0, 8), tag, dados), chave, usuario)).toThrow(/Formato/);
    expect(() => decifrar(montar(v, Buffer.concat([iv, iv]), tag, dados), chave, usuario)).toThrow(/Formato/);
  });

  it.each(['', '...', 'v1', 'v1.a.b', 'v1.a.b.c.d', 'V1.a.b.c', ' v1.a.b.c'])('pacote malformado %j', (p) => {
    expect(() => decifrar(p, chave, usuario)).toThrow(/Formato/);
  });

  it('trocar a versão de um pacote válido falha', () => {
    const pacote = cifrar('segredo', chave, usuario);
    expect(() => decifrar(pacote.replace(/^v1/, 'v2'), chave, usuario)).toThrow(/Formato/);
  });

  it('erro não contém o texto claro', () => {
    const pacote = cifrar('texto-claro-secreto', chave, usuario);
    let texto = '';
    try {
      decifrar(pacote, randomBytes(32), usuario);
    } catch (e) {
      texto = String(e);
    }
    expect(texto).not.toBe('');
    expect(texto).not.toContain('texto-claro-secreto');
  });

  it.each(['!', '==', '+', '/'])('rejeita pacote com %j fora do base64url estrito', (lixo) => {
    const [v, iv, tag, dados] = cifrar('segredo', chave, usuario).split('.');
    expect(() => decifrar([v, iv, `${tag}${lixo}`, dados].join('.'), chave, usuario)).toThrow(/Formato/);
  });

  it('texto vazio (parte cifrada vazia) continua decifrando', () => {
    expect(decifrar(cifrar('', chave, usuario), chave, usuario)).toBe('');
  });
});
