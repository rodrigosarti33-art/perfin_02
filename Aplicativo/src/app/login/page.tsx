import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { z } from 'zod';
import { entrarComGoogle } from '@/app/acoesSessao';
import estilosBotao from '@/components/Botao.module.css';
import { PaginaPublica } from '@/components/PaginaPublica';
import estilos from '@/components/PaginaPublica.module.css';

export const metadata: Metadata = {
  title: 'Entrar',
};

const esquemaErro = z.enum(['oauth', 'sessao', 'interno']);
type CodigoErro = z.infer<typeof esquemaErro>;

const MENSAGENS_ERRO: Record<CodigoErro, string> = {
  oauth: 'Não foi possível concluir o login com o Google. Tente novamente.',
  sessao: 'Sua sessão não pôde ser iniciada ou expirou. Entre novamente.',
  interno: 'Ocorreu um erro inesperado. Tente novamente em alguns instantes.',
};

type PropsPaginaLogin = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function mensagemDoErro(valor: string | string[] | undefined): string | null {
  const resultado = esquemaErro.safeParse(valor);
  return resultado.success ? MENSAGENS_ERRO[resultado.data] : null;
}

export default async function PaginaLogin({ searchParams }: PropsPaginaLogin): Promise<ReactNode> {
  const { erro } = await searchParams;
  const mensagem = mensagemDoErro(erro);

  return (
    <PaginaPublica titulo="Portal Perfin" estreito>
      {mensagem ? (
        <p className={estilos.erro} role="alert">
          {mensagem}
        </p>
      ) : null}
      <p>Central de análise do time Perfin Infra.</p>
      <p className={estilos.apoio}>
        O acesso é restrito: somente e-mails autorizados conseguem entrar.
      </p>
      <form action={entrarComGoogle} className={estilos.acoes}>
        <button type="submit" className={`${estilosBotao.primario} ${estilosBotao.larguraTotal}`}>
          Entrar com Google
        </button>
      </form>
    </PaginaPublica>
  );
}
