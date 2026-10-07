'use client';

import { useEffect } from 'react';

// Registra o service worker mínimo do PWA (só fornece a página offline).
// Falha de registro é ignorada: o portal funciona normalmente sem ele.
export function RegistrarServiceWorker(): null {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => undefined);
  }, []);

  return null;
}
