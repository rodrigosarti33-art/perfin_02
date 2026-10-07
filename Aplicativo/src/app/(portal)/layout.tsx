import Link from 'next/link';
import type { ReactNode } from 'react';
import { sair } from '@/app/acoesSessao';
import { Marca } from '@/components/Marca';
import { exigirAdmin } from '@/servicos/supabase/sessao';
import estilos from './layout.module.css';

type ItemNavegacao = {
  rotulo: string;
  href: string;
};

const ITENS_NAVEGACAO: readonly ItemNavegacao[] = [{ rotulo: 'Painel', href: '/' }];

export default async function LayoutPortal({ children }: LayoutProps<'/'>): Promise<ReactNode> {
  const { nome, email } = await exigirAdmin();

  return (
    <div className={estilos.casca}>
      <header className={estilos.cabecalho}>
        <div className={estilos.faixa} aria-hidden="true" />
        <div className={estilos.barra}>
          <Link href="/" className={estilos.logo} aria-label="Portal Perfin — página inicial">
            <Marca largura={140} prioridade />
          </Link>

          <nav className={estilos.navegacao} aria-label="Navegação principal">
            <ul className={estilos.listaNavegacao}>
              {ITENS_NAVEGACAO.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={estilos.linkNavegacao}>
                    {item.rotulo}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className={estilos.usuario}>
            <div className={estilos.identificacao}>
              {nome ? <span className={estilos.nome}>{nome}</span> : null}
              <span className={estilos.email}>{email}</span>
            </div>
            <form action={sair}>
              <button type="submit" className={estilos.botaoSair}>
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className={estilos.conteudo}>{children}</main>
    </div>
  );
}
