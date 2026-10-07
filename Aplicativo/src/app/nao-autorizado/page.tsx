import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { sair } from '@/app/acoesSessao';
import estilosBotao from '@/components/Botao.module.css';
import { PaginaPublica } from '@/components/PaginaPublica';
import estilos from '@/components/PaginaPublica.module.css';

export const metadata: Metadata = {
  title: 'Acesso não autorizado',
};

export default function PaginaNaoAutorizado(): ReactNode {
  return (
    <PaginaPublica titulo="Acesso não autorizado" estreito>
      <p>O e-mail usado para entrar não está na lista de administradores do Portal Perfin.</p>
      <p className={estilos.apoio}>
        Se você precisa de acesso, procure o responsável pelo portal na Perfin Infra.
      </p>
      <form action={sair} className={estilos.acoes}>
        <button type="submit" className={`${estilosBotao.secundario} ${estilosBotao.larguraTotal}`}>
          Entrar com outra conta
        </button>
      </form>
    </PaginaPublica>
  );
}
