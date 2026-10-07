import type { ReactNode } from 'react';
import { EstadoCarregando } from '@/components/EstadoCarregando';

// Fallback enquanto o layout (portal) aguarda exigirAdmin(): o loading.tsx do grupo só cobre a página.
export default function CarregandoRaiz(): ReactNode {
  return <EstadoCarregando />;
}
