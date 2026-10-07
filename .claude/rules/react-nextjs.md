---
paths:
  - "**/*.tsx"
  - "**/*.jsx"
  - "**/app/**"
  - "**/components/**"
  - "**/hooks/**"
---

# Regras de React / Next.js

## Estrutura
- Usar TypeScript. Evitar `any`; tipar props e retornos.
- Um componente por arquivo, com uma única responsabilidade. Nomes em PascalCase; hooks começam com `use`.
- Lógica de interface reaproveitável vai para hooks customizados; lógica de negócio vai para a camada de domínio (ver `architecture.md`).

## Server x Client Components (App Router)
- Server Components por padrão.
- Usar `"use client"` só quando precisar de estado, efeitos, eventos ou APIs do navegador, e no componente mais baixo possível da árvore.

## Estado e efeitos
- Manter o estado o mais local possível; subir para o pai ou contexto só quando for compartilhado.
- Não duplicar estado: o que pode ser calculado a partir de props/estado deve ser calculado, não guardado.
- `useEffect` só para sincronizar com algo externo (assinaturas, timers, APIs do navegador), sempre com cleanup quando necessário e com a lista de dependências correta. Não silenciar o lint de dependências.

## Dados
- Buscar dados no servidor (Server Components, Server Actions ou Route Handlers), não em `useEffect`, salvo necessidade real.
- Toda tela que carrega dados trata os estados de carregando, erro e vazio (`loading.tsx`, `error.tsx` ou equivalente).
- Validar entradas no servidor. Validação no formulário é só conveniência para o usuário.

## Segurança
- Seguir `security.md`. Lembrete: só variáveis `NEXT_PUBLIC_*` chegam ao navegador, e nelas nada sensível.
- Não usar `dangerouslySetInnerHTML` com conteúdo vindo de usuário ou de fora.

## Listas, acessibilidade e desempenho
- `key` estável e única em listas (id do item, não o índice).
- HTML semântico (`button` para ações, `a`/`Link` para navegação), `label` em campos, `alt` em imagens, tudo navegável pelo teclado.
- Usar `next/image` e `next/link`. Não usar `useMemo`/`useCallback`/`memo` sem um problema de desempenho real.

## Estilo e limpeza
- Seguir o padrão de estilização já adotado no projeto; não misturar abordagens.
- Não deixar `console.log`, código comentado ou componentes sem uso.
