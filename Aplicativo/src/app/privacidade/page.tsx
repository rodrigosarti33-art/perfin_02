import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { PaginaPublica } from '@/components/PaginaPublica';
import estilos from '@/components/PaginaPublica.module.css';

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description: 'Como o Portal Perfin trata dados pessoais e dados recebidos das APIs do Google.',
};

type SecaoPolitica = {
  id: string;
  titulo: string;
  paragrafos?: ReadonlyArray<string>;
  itens?: ReadonlyArray<string>;
  link?: { href: string; rotulo: string };
};

const SECOES: ReadonlyArray<SecaoPolitica> = [
  {
    id: 'controlador',
    titulo: '1. Quem é o controlador',
    paragrafos: [
      'O Portal Perfin é operado por [RAZÃO SOCIAL], inscrita no CNPJ sob o nº [CNPJ], com sede em [ENDEREÇO] ("Perfin Infra"), que atua como controladora dos dados pessoais tratados no portal.',
      'O encarregado pelo tratamento de dados pessoais pode ser contatado pelo e-mail [E-MAIL DE CONTATO DO ENCARREGADO].',
    ],
  },
  {
    id: 'dados',
    titulo: '2. Dados tratados',
    paragrafos: ['O portal é de uso interno e trata somente os dados necessários ao seu funcionamento:'],
    itens: [
      'Nome, e-mail e foto do perfil da Conta Google, recebidos no login.',
      'Token de acesso do Google, guardado de forma cifrada, para que o portal execute as ações que você pedir.',
      'Eventos da Agenda Google, lidos sob demanda para exibir as próximas reuniões. Os eventos não são armazenados pelo portal.',
      'Arquivos do Google Drive criados pelo próprio portal (relatório mensal em Planilha Google). O portal não acessa outros arquivos do seu Drive.',
      'Rascunhos de e-mail criados no Gmail a seu pedido. O portal não lê sua caixa de entrada e não envia e-mails.',
      'Perguntas feitas ao assistente de IA e dados de indicadores econômicos, enviados ao Google Gemini para gerar as respostas. Não são enviados dados pessoais nesse processo.',
      'Registros técnicos mínimos de acesso, necessários à segurança do serviço.',
    ],
  },
  {
    id: 'finalidades',
    titulo: '3. Finalidades',
    itens: [
      'Autenticar o usuário e verificar se o e-mail está autorizado.',
      'Exibir indicadores econômicos e as próximas reuniões da Agenda.',
      'Gerar o relatório mensal e o rascunho de e-mail com o resumo.',
      'Responder às perguntas feitas ao assistente de IA.',
      'Manter a segurança e a integridade do portal.',
    ],
  },
  {
    id: 'base-legal',
    titulo: '4. Base legal',
    paragrafos: [
      'O tratamento se apoia no legítimo interesse da Perfin Infra em fornecer ferramentas de trabalho ao seu time (art. 7º, IX, da Lei nº 13.709/2018 — LGPD) e na execução das atividades que o próprio usuário solicita no portal. O acesso aos serviços do Google depende do consentimento dado por você na tela de autorização do Google, que pode ser revogado a qualquer momento.',
    ],
  },
  {
    id: 'compartilhamento',
    titulo: '5. Compartilhamento',
    paragrafos: [
      'Os dados não são vendidos nem cedidos a terceiros para publicidade. São utilizados apenas os seguintes operadores, estritamente para o funcionamento do portal:',
    ],
    itens: [
      'Supabase — autenticação e banco de dados.',
      'Vercel — hospedagem da aplicação.',
      'Google — login, Agenda, Drive, Gmail e o modelo de IA Gemini.',
    ],
  },
  {
    id: 'uso-limitado',
    titulo: '6. Uso Limitado',
    paragrafos: [
      'O uso e a transferência, pelo Portal Perfin, de informações recebidas das APIs do Google para qualquer outro aplicativo seguem a Política de Dados do Usuário dos Serviços de API do Google, incluindo os requisitos de Uso Limitado.',
      'Esses dados são usados apenas para oferecer as funcionalidades visíveis ao usuário descritas nesta política; não são usados para publicidade, não são vendidos e não são lidos por pessoas, salvo com seu consentimento expresso, quando necessário por segurança ou para cumprir a lei.',
    ],
    link: {
      href: 'https://developers.google.com/terms/api-services-user-data-policy',
      rotulo: 'Política de Dados do Usuário dos Serviços de API do Google',
    },
  },
  {
    id: 'retencao',
    titulo: '7. Retenção e exclusão',
    paragrafos: [
      'Os dados de perfil e o token cifrado são mantidos enquanto o usuário tiver acesso autorizado ao portal. Eventos da Agenda não são armazenados. Arquivos criados no Drive e rascunhos do Gmail ficam na sua própria Conta Google e podem ser apagados por você.',
      'Você pode revogar o acesso do portal à sua Conta Google a qualquer momento em myaccount.google.com/permissions. Quando o acesso é revogado, o token guardado perde a validade. A exclusão dos dados guardados pelo portal pode ser solicitada ao encarregado.',
    ],
  },
  {
    id: 'direitos',
    titulo: '8. Direitos do titular',
    paragrafos: [
      'Nos termos da LGPD, você pode solicitar confirmação do tratamento, acesso, correção, anonimização, bloqueio ou eliminação de dados, informação sobre compartilhamento e revogação do consentimento. Os pedidos devem ser enviados ao encarregado pelo e-mail [E-MAIL DE CONTATO DO ENCARREGADO].',
    ],
  },
  {
    id: 'seguranca',
    titulo: '9. Segurança',
    paragrafos: [
      'O portal adota medidas técnicas e administrativas para proteger os dados: conexão cifrada (HTTPS), token do Google guardado cifrado, acesso restrito a e-mails autorizados, regras de acesso no banco de dados e permissões do Google limitadas ao mínimo necessário.',
    ],
  },
  {
    id: 'alteracoes',
    titulo: '10. Alterações desta política',
    paragrafos: [
      'Esta política pode ser atualizada. A versão vigente estará sempre disponível nesta página. Vigência: [DATA DE VIGÊNCIA].',
    ],
  },
];

export default function PaginaPrivacidade(): ReactNode {
  return (
    <PaginaPublica
      titulo="Política de Privacidade"
      aviso="Rascunho — revisar com o jurídico antes de publicar"
    >
      {SECOES.map((secao) => (
        <section key={secao.id} aria-labelledby={`secao-${secao.id}`}>
          <h2 id={`secao-${secao.id}`}>{secao.titulo}</h2>
          {secao.paragrafos?.map((texto) => <p key={texto}>{texto}</p>)}
          {secao.itens ? (
            <ul>
              {secao.itens.map((texto) => (
                <li key={texto}>{texto}</li>
              ))}
            </ul>
          ) : null}
          {secao.link ? (
            <p className={estilos.apoio}>
              Consulte a{' '}
              <a href={secao.link.href} rel="noopener noreferrer" target="_blank">
                {secao.link.rotulo}
              </a>
              .
            </p>
          ) : null}
        </section>
      ))}
    </PaginaPublica>
  );
}
