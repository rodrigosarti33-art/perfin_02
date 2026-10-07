import type { ReactNode } from 'react';
import estilos from '@/components/Estados.module.css';

export function EstadoCarregando(): ReactNode {
  return (
    <div className={estilos.estado} role="status" aria-busy="true" aria-live="polite">
      <span className={estilos.indicador} aria-hidden="true" />
      <p className={estilos.mensagem}>Carregando…</p>
    </div>
  );
}
