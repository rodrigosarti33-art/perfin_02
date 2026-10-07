import Link from 'next/link';
import type { ReactNode } from 'react';
import { Marca } from '@/components/Marca';
import estilos from '@/components/PaginaPublica.module.css';

type PropsPaginaPublica = {
  titulo: string;
  children: ReactNode;
  estreito?: boolean;
  aviso?: string;
};

const LINKS_RODAPE: ReadonlyArray<{ href: string; rotulo: string }> = [
  { href: '/sobre', rotulo: 'Sobre' },
  { href: '/privacidade', rotulo: 'Privacidade' },
  { href: '/termos', rotulo: 'Termos de uso' },
];

export function PaginaPublica({
  titulo,
  children,
  estreito = false,
  aviso,
}: PropsPaginaPublica): ReactNode {
  const classeCartao = estreito ? `${estilos.cartao} ${estilos.estreito}` : estilos.cartao;
  return (
    <div className={estilos.moldura}>
      <main className={classeCartao}>
        <div className={estilos.marca}>
          <Link href="/sobre" aria-label="Portal Perfin — sobre o portal">
            <Marca largura={estreito ? 170 : 190} prioridade />
          </Link>
        </div>
        {aviso ? (
          <p className={estilos.aviso} role="note">
            {aviso}
          </p>
        ) : null}
        <h1 className={estilos.titulo}>{titulo}</h1>
        <div className={estilos.conteudo}>{children}</div>
      </main>
      <footer className={estilos.rodape}>
        <nav aria-label="Informações do portal">
          <ul className={estilos.links}>
            {LINKS_RODAPE.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.rotulo}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className={estilos.direitos}>Portal Perfin · Perfin Infra</p>
      </footer>
    </div>
  );
}
