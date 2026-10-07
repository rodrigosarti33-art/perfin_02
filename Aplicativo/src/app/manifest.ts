import type { MetadataRoute } from 'next';

// Manifesto do PWA, servido pelo Next em /manifest.webmanifest.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Portal Perfin',
    short_name: 'Perfin',
    description: 'Portal interno da Perfin Infra para acompanhamento das investidas.',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    lang: 'pt-BR',
    background_color: '#ffffff',
    theme_color: '#004c88',
    icons: [
      { src: '/icones/icone-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icones/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icones/icone-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
