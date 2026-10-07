import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const raiz = (caminho: string): string => fileURLToPath(new URL(caminho, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': raiz('./src'),
      'server-only': raiz('./src/testes/stubs/server-only.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
