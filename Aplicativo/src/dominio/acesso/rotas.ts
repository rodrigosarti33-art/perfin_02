// Rotas acessíveis sem login. Todo o resto exige administrador.
const ROTAS_PUBLICAS = new Set(['/login', '/nao-autorizado', '/privacidade', '/termos', '/sobre', '/auth/callback']);

export function ehRotaPublica(caminho: string): boolean {
  const semBarraFinal = caminho.length > 1 ? caminho.replace(/\/+$/, '') : caminho;
  return ROTAS_PUBLICAS.has(semBarraFinal);
}

export function ehRotaApi(caminho: string): boolean {
  return caminho === '/api' || caminho.startsWith('/api/');
}
