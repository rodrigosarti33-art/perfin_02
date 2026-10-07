import 'server-only';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

// AES-256-GCM. Formato: v1.<iv>.<tag>.<cifrado> (base64url).
// O AAD (ex.: user_id) amarra o cifrado ao dono: copiado para outro usuário, não decifra.
const VERSAO = 'v1';
const ALGORITMO = 'aes-256-gcm';
const BASE64URL = /^[A-Za-z0-9_-]*$/;

export function cifrar(texto: string, chave: Buffer, aad: string): string {
  const iv = randomBytes(12);
  const cifra = createCipheriv(ALGORITMO, chave, iv);
  cifra.setAAD(Buffer.from(aad, 'utf8'));
  const cifrado = Buffer.concat([cifra.update(texto, 'utf8'), cifra.final()]);
  return [VERSAO, iv, cifra.getAuthTag(), cifrado].map((p) => (typeof p === 'string' ? p : p.toString('base64url'))).join('.');
}

export function decifrar(pacote: string, chave: Buffer, aad: string): string {
  const partes = pacote.split('.');
  if (partes.length !== 4 || partes[0] !== VERSAO || !partes.slice(1).every((p) => BASE64URL.test(p))) {
    throw new Error('Formato de cifrado inválido');
  }
  const [, iv, tag, cifrado] = partes.map((p) => Buffer.from(p, 'base64url'));
  if (!iv || iv.length !== 12 || !tag || tag.length !== 16 || !cifrado) throw new Error('Formato de cifrado inválido');
  const decifra = createDecipheriv(ALGORITMO, chave, iv);
  decifra.setAAD(Buffer.from(aad, 'utf8'));
  decifra.setAuthTag(tag);
  return Buffer.concat([decifra.update(cifrado), decifra.final()]).toString('utf8');
}
