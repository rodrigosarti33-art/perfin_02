import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { PaginaPublica } from '@/components/PaginaPublica';

export const metadata: Metadata = {
  title: 'Termos de Uso',
  description: 'Condições de uso do Portal Perfin, de acesso restrito ao time Perfin Infra.',
};

type SecaoTermos = {
  id: string;
  titulo: string;
  paragrafos: ReadonlyArray<string>;
};

const SECOES: ReadonlyArray<SecaoTermos> = [
  {
    id: 'partes',
    titulo: '1. Sobre estes termos',
    paragrafos: [
      'Estes Termos de Uso regulam o acesso ao Portal Perfin, ferramenta interna disponibilizada por [RAZÃO SOCIAL], inscrita no CNPJ sob o nº [CNPJ], com sede em [ENDEREÇO] ("Perfin Infra").',
      'Ao entrar no portal, o usuário declara ter lido e aceito estes termos e a Política de Privacidade.',
    ],
  },
  {
    id: 'acesso',
    titulo: '2. Acesso restrito',
    paragrafos: [
      'O portal é de uso interno e exclusivo de administradores autorizados pela Perfin Infra. O acesso é pessoal e intransferível, feito com a Conta Google do próprio usuário.',
      'A Perfin Infra pode conceder, suspender ou remover autorizações a qualquer momento, sem aviso prévio.',
    ],
  },
  {
    id: 'dados-publicos',
    titulo: '3. Dados de fontes públicas',
    paragrafos: [
      'Os indicadores econômicos exibidos (como IPCA, IGP-M, dólar PTAX e FBCF) são obtidos de fontes públicas, como Banco Central do Brasil (BCB), IBGE e FGV. A Perfin Infra não garante a exatidão, a completude nem a disponibilidade contínua desses dados, que podem ser revisados pelas fontes originais.',
      'As respostas do assistente de IA são geradas automaticamente e podem conter imprecisões. Confira as informações antes de usá-las.',
    ],
  },
  {
    id: 'investimento',
    titulo: '4. Não é recomendação de investimento',
    paragrafos: [
      'Nenhum conteúdo do portal, incluindo relatórios, indicadores e respostas do assistente de IA, constitui recomendação de investimento, oferta ou aconselhamento financeiro, jurídico ou contábil.',
    ],
  },
  {
    id: 'emails',
    titulo: '5. Rascunhos de e-mail',
    paragrafos: [
      'O portal apenas cria rascunhos no Gmail do usuário e nunca envia mensagens. O usuário é integralmente responsável por revisar, editar e decidir enviar os e-mails a partir desses rascunhos, bem como pelo seu conteúdo e destinatários.',
    ],
  },
  {
    id: 'uso-adequado',
    titulo: '6. Uso adequado',
    paragrafos: [
      'O usuário se compromete a usar o portal apenas para fins profissionais ligados às atividades da Perfin Infra, a não tentar burlar os controles de acesso e a manter a confidencialidade das informações internas a que tiver acesso.',
    ],
  },
  {
    id: 'alteracoes',
    titulo: '7. Alterações',
    paragrafos: [
      'Estes termos podem ser atualizados. A versão vigente estará sempre disponível nesta página. Vigência: [DATA DE VIGÊNCIA].',
    ],
  },
  {
    id: 'foro',
    titulo: '8. Lei aplicável e foro',
    paragrafos: [
      'Estes termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca da sede da Perfin Infra, em [ENDEREÇO], para dirimir eventuais controvérsias.',
      'Dúvidas podem ser enviadas para [E-MAIL DE CONTATO DO ENCARREGADO].',
    ],
  },
];

export default function PaginaTermos(): ReactNode {
  return (
    <PaginaPublica titulo="Termos de Uso" aviso="Rascunho — revisar com o jurídico antes de publicar">
      {SECOES.map((secao) => (
        <section key={secao.id} aria-labelledby={`secao-${secao.id}`}>
          <h2 id={`secao-${secao.id}`}>{secao.titulo}</h2>
          {secao.paragrafos.map((texto) => (
            <p key={texto}>{texto}</p>
          ))}
        </section>
      ))}
    </PaginaPublica>
  );
}
