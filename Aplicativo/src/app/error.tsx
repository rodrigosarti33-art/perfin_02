'use client';

import type { ReactNode } from 'react';
import { EstadoErro } from '@/components/EstadoErro';

type PropsErro = {
  error: Error & { digest?: string };
  retry: () => void;
};

// Fica acima de (portal)/layout.tsx: captura erros do layout do portal (ex.: exigirAdmin) e das páginas públicas.
export default function ErroRaiz({ retry }: PropsErro): ReactNode {
  return <EstadoErro aoTentarDeNovo={() => retry()} />;
}
