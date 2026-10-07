import Image from 'next/image';
import type { ReactNode } from 'react';

const LARGURA_ORIGINAL = 654;
const ALTURA_ORIGINAL = 201;

type PropsMarca = {
  largura?: number;
  prioridade?: boolean;
};

export function Marca({ largura = 180, prioridade = false }: PropsMarca): ReactNode {
  const altura = Math.round((largura * ALTURA_ORIGINAL) / LARGURA_ORIGINAL);
  return (
    <Image
      src="/marca/perfin-infra.png"
      alt="Perfin Infra"
      width={largura}
      height={altura}
      priority={prioridade}
      style={{ width: largura, height: 'auto', maxWidth: '100%' }}
    />
  );
}
