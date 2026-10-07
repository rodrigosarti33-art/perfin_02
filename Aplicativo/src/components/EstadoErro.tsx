'use client';

import type { ReactNode } from 'react';
import estilos from '@/components/Estados.module.css';

type PropsEstadoErro = {
  aoTentarDeNovo: () => void;
};

export function EstadoErro({ aoTentarDeNovo }: PropsEstadoErro): ReactNode {
  return (
    <div className={estilos.estado} role="alert">
      <h1 className={estilos.titulo}>Algo deu errado</h1>
      <p className={estilos.mensagem}>Não foi possível carregar esta página. Tente novamente em instantes.</p>
      <button type="button" className={estilos.botao} onClick={aoTentarDeNovo}>
        Tentar de novo
      </button>
    </div>
  );
}
