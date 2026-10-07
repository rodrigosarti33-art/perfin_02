// Sem cliente Supabase no navegador: o cookie de sessão fica inacessível ao JavaScript da página.
export const OPCOES_COOKIE = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
} as const;
