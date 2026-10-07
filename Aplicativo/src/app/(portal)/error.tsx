'use client';

import type { ReactNode } from 'react';
import { EstadoErro } from '@/components/EstadoErro';

type PropsErro = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function ErroPortal({ retry }: PropsErro): ReactNode {
  return <EstadoErro aoTentarDeNovo={() => retry()} />;
}
