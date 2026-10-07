// Regra de acesso ao portal: só e-mails verificados presentes na lista de administradores.
// Falha fechada: lista vazia, e-mail ausente ou não verificado => acesso negado.

// Recusa aspas, "<>", ";" e "," dentro do item: são sinais de configuração colada errado.
const FORMATO_EMAIL = /^[^\s@"'<>;,]+@[^\s@"'<>;,]+\.[^\s@"'<>;,]+$/;

export type DadosAcesso = {
  email: string | null | undefined;
  emailVerificado: boolean;
};

export type ResultadoAcesso =
  | { permitido: true; email: string }
  | { permitido: false; motivo: 'sem-email' | 'email-nao-verificado' | 'lista-vazia' | 'nao-admin' };

export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** "a@x.com, B@x.com" -> ["a@x.com", "b@x.com"]; ignora vazios, duplicados e itens que não são e-mail. */
export function parsearListaAdmins(bruto: string | null | undefined): string[] {
  const emails = (bruto ?? '')
    .split(',')
    .map(normalizarEmail)
    .filter((email) => FORMATO_EMAIL.test(email));
  return [...new Set(emails)];
}

/** Quantos itens não vazios da lista foram recusados (só a contagem: nunca expõe o conteúdo). */
export function itensAdminInvalidos(bruto: string | null | undefined): number {
  return (bruto ?? '')
    .split(',')
    .map(normalizarEmail)
    .filter((item) => item !== '' && !FORMATO_EMAIL.test(item)).length;
}

export function avaliarAcesso(dados: DadosAcesso, admins: readonly string[]): ResultadoAcesso {
  if (!dados.email) return { permitido: false, motivo: 'sem-email' };
  if (!dados.emailVerificado) return { permitido: false, motivo: 'email-nao-verificado' };
  if (admins.length === 0) return { permitido: false, motivo: 'lista-vazia' };
  const email = normalizarEmail(dados.email);
  return admins.includes(email) ? { permitido: true, email } : { permitido: false, motivo: 'nao-admin' };
}
