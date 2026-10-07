// Service worker mínimo do Portal Perfin.
// Segurança: NUNCA guarda páginas, respostas de API ou dados do portal em cache
// (são protegidos e por usuário). Só a página offline estática é pré-carregada.
const CACHE_OFFLINE = 'perfin-offline-v1';
const PAGINA_OFFLINE = '/offline.html';

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE_OFFLINE)
      .then((cache) => cache.add(new Request(PAGINA_OFFLINE, { cache: 'reload' })))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((nome) => nome !== CACHE_OFFLINE).map((nome) => caches.delete(nome))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (evento) => {
  if (evento.request.mode !== 'navigate') return;
  evento.respondWith(
    fetch(evento.request).catch(() =>
      caches.match(PAGINA_OFFLINE, { cacheName: CACHE_OFFLINE }).then((resposta) => resposta || Response.error()),
    ),
  );
});
