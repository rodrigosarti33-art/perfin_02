import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Lato, Montserrat, Roboto_Slab } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { RegistrarServiceWorker } from '@/components/RegistrarServiceWorker';
import './globals.css';

const fonteTitulo = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--fonte-titulo',
});

const fonteCorpo = Lato({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--fonte-corpo',
});

const fonteNumero = Roboto_Slab({
  subsets: ['latin'],
  display: 'swap',
  variable: '--fonte-numero',
});

export const metadata: Metadata = {
  title: { default: 'Portal Perfin', template: '%s · Portal Perfin' },
  description:
    'Central de análise do time Perfin Infra: indicadores econômicos, relatório mensal, agenda e assistente de IA.',
  applicationName: 'Portal Perfin',
  appleWebApp: { capable: true, title: 'Portal Perfin', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  themeColor: '#004c88',
};

type PropsLayoutRaiz = Readonly<{ children: ReactNode }>;

export default function LayoutRaiz({ children }: PropsLayoutRaiz): ReactNode {
  const classesFontes = `${fonteTitulo.variable} ${fonteCorpo.variable} ${fonteNumero.variable}`;
  return (
    <html lang="pt-BR" className={classesFontes}>
      <body>
        {children}
        <RegistrarServiceWorker />
        <Analytics />
      </body>
    </html>
  );
}
