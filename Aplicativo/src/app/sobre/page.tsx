import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import estilosBotao from '@/components/Botao.module.css';
import { PaginaPublica } from '@/components/PaginaPublica';
import estilos from '@/components/PaginaPublica.module.css';

export const metadata: Metadata = {
  title: 'Sobre',
  description:
    'O que é o Portal Perfin, quem pode acessá-lo e quais dados da Conta Google ele utiliza.',
};

const USOS_GOOGLE: ReadonlyArray<{ id: string; servico: string; uso: string }> = [
  {
    id: 'perfil',
    servico: 'Perfil básico (nome, e-mail e foto)',
    uso: 'identificar quem está entrando e conferir se o e-mail está na lista de pessoas autorizadas.',
  },
  {
    id: 'agenda',
    servico: 'Google Agenda — somente leitura dos eventos',
    uso: 'mostrar as próximas reuniões no painel. O portal não cria, altera nem exclui eventos, e não guarda os eventos lidos.',
  },
  {
    id: 'drive',
    servico: 'Google Drive — somente arquivos criados pelo próprio portal',
    uso: 'gravar o relatório mensal em uma Planilha Google. O portal não tem acesso aos demais arquivos do seu Drive.',
  },
  {
    id: 'gmail',
    servico: 'Gmail — somente criação de rascunhos',
    uso: 'deixar pronto, na sua caixa de rascunhos, um e-mail com o resumo do relatório. O portal nunca envia e-mails e não lê sua caixa de entrada; o envio é sempre feito por você.',
  },
];

export default function PaginaSobre(): ReactNode {
  return (
    <PaginaPublica titulo="Portal Perfin">
      <p>
        O Portal Perfin é a central de análise do time da <strong>Perfin Infra</strong>. Ele reúne,
        em um só lugar, as informações usadas no acompanhamento mensal dos ativos de infraestrutura.
      </p>

      <h2>O que o portal oferece</h2>
      <ul>
        <li>
          Indicadores econômicos atualizados de fontes públicas: IPCA, IGP-M, dólar PTAX e FBCF.
        </li>
        <li>Relatório mensal gerado como Planilha Google e também para download em .xlsx.</li>
        <li>Lista das próximas reuniões da sua Agenda Google.</li>
        <li>Rascunho de e-mail com o resumo do relatório, criado no seu Gmail para revisão.</li>
        <li>Assistente de IA para perguntas sobre os indicadores.</li>
      </ul>

      <h2>Quem pode acessar</h2>
      <p>
        O acesso é restrito. Somente pessoas cujo e-mail foi previamente autorizado pela Perfin
        Infra conseguem entrar. Qualquer outra conta é recusada logo após o login.
      </p>

      <h2>Dados do Google que o portal usa e por quê</h2>
      <p>O login é feito com a Conta Google. O portal pede apenas as permissões abaixo:</p>
      <ul>
        {USOS_GOOGLE.map((item) => (
          <li key={item.id}>
            <strong>{item.servico}:</strong> {item.uso}
          </li>
        ))}
      </ul>
      <p className={estilos.apoio}>
        Você pode revogar essas permissões a qualquer momento em{' '}
        <a href="https://myaccount.google.com/permissions" rel="noopener noreferrer" target="_blank">
          myaccount.google.com/permissions
        </a>
        . Mais detalhes na <Link href="/privacidade">Política de Privacidade</Link> e nos{' '}
        <Link href="/termos">Termos de Uso</Link>.
      </p>

      <div className={estilos.acoes}>
        <Link href="/login" className={estilosBotao.primario}>
          Entrar
        </Link>
      </div>
    </PaginaPublica>
  );
}
