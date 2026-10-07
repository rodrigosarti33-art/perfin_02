import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { exigirAdmin } from '@/servicos/supabase/sessao';
import estilos from './page.module.css';

export const metadata: Metadata = {
  title: 'Painel',
};

export default async function PaginaPainel(): Promise<ReactNode> {
  const { nome } = await exigirAdmin();
  const primeiroNome = nome?.split(' ')[0];

  return (
    <div className={estilos.pagina}>
      <header className={estilos.topo}>
        <p className={estilos.sobretitulo}>Painel</p>
        <h1 className={estilos.titulo}>{primeiroNome ? `Olá, ${primeiroNome}` : 'Olá'}</h1>
        <p className={estilos.apoio}>Bem-vindo ao Portal Perfin.</p>
      </header>

      <section className={estilos.cartao} aria-labelledby="titulo-indicadores">
        <h2 id="titulo-indicadores" className={estilos.tituloCartao}>
          Painel de indicadores
        </h2>
        <p className={estilos.textoCartao}>
          O painel de indicadores chega na próxima etapa. Por enquanto, seu acesso está configurado e pronto para uso.
        </p>
      </section>
    </div>
  );
}
