# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Estado atual
Portal Perfin em `Aplicativo/`: Next.js 16.4 (App Router, pasta `src/`) + TypeScript strict, login só Google via Supabase Auth (`@supabase/ssr`), hospedado na Vercel (Root Directory `Aplicativo`, Node 24.x). `Website/` ainda vazio.
- **Nunca roda em localhost**: não use `next dev` nem `next start`; todo teste funcional é na URL da Vercel.
- URL pública só via `NEXT_PUBLIC_SITE_URL` (única variável pública). Variáveis e cadastros: `Documentacao/configuracao.md`.
- `cacheComponents` está desligado de propósito em `next.config.ts` — não religar.
- O antigo `middleware.ts` agora é `src/proxy.ts` (Next 16). Docs desta versão: `Aplicativo/node_modules/next/dist/docs/`.
- Não ler/editar `.env*` (exceto `.env.example`) nem `dados_perfin.txt` (segredos).

## Comandos
O Node é portátil e fica fora do PATH. Dentro de `Aplicativo/`:
- Bash: `export PATH="$(cygpath "$LOCALAPPDATA")/nodejs/node-v24.19.0-win-x64:$PATH"`
- PowerShell: `$env:Path = "$env:LOCALAPPDATA\nodejs\node-v24.19.0-win-x64;" + $env:Path`

Depois: `npm run lint` · `npm run typecheck` · `npm test` (vitest, `src/**/*.test.ts`) · `npm run build`. Teste único: `npx vitest run src/caminho/arquivo.test.ts`.

## Aplicativo/src
- `config/` — env validado por grupo com zod (`esquemas.ts` puro; `env.ts` server-only; `envPublico.ts` para `NEXT_PUBLIC_SITE_URL`). Erros citam só nomes, nunca valores.
- `dominio/` — regras de negócio puras e testáveis (sem React, sem I/O).
- `servicos/` — integrações server-only: Supabase (`servidor`, `admin`, `sessao`, `proxySessao`), Google (tokens cifrados AES-256-GCM, APIs por `fetch`), Gemini.
- `app/` — rotas (App Router), Server Actions e Route Handlers. `components/` — um componente por arquivo, CSS Modules.
- `testes/stubs/` — substitutos usados só pelo vitest (ex.: `server-only`).
- Migrations SQL em `supabase/migrations/` (aplicadas no SQL Editor do Supabase).

## Regras de acesso
- Fonte de verdade: `ADMIN_EMAILS`. O callback (`app/auth/callback`) desloga não-admins (→ `/nao-autorizado`) e ressincroniza a tabela `administradores`.
- **Toda** page, Route Handler e Server Action protegida chama `exigirAdmin()` (`servicos/supabase/sessao.ts`); o proxy não basta.
- RLS em todas as tabelas via `is_admin()`; `google_credenciais` não tem policies (só o servidor com a chave secreta acessa).
- Login por e-mail/senha e anônimo ficam desligados no Supabase (a RLS confia no e-mail do JWT).

## Estrutura
- `Aplicativo/` — Portal Perfin (Next.js)
- `Website/` — código do website
- `Documentacao/` — documentação do projeto (`configuracao.md`: variáveis e cadastros)
- `supabase/migrations/` — esquema do banco, RLS e funções
- `.claude/rules/` — regras permanentes do projeto (carregadas automaticamente, como este arquivo): `geral.md`, `architecture.md`, `security.md` e `react-nextjs.md` (esta só ao trabalhar em arquivos React/Next)
- `.claude/agents/` — subagentes (`<nome>.md` com frontmatter `name`, `description`, `tools`)
- `.claude/skills/` — processos reutilizáveis (`<nome>/SKILL.md` com frontmatter `name`, `description`)
- `.claude/settings.json` + `.claude/hooks/` — hooks que rodam obrigatoriamente em eventos

## Subagentes
| Agente | Papel | Altera arquivos? |
|---|---|---|
| `architect` | impacto, arquivos envolvidos, riscos, plano de implementação | não (só leitura) |
| `frontend` | implementa em React/Next.js | sim; backend/banco só se necessário |
| `tester` | edge cases, regressões, erros de estado, comportamento inesperado | só arquivos de teste |
| `reviewer` | code review: bugs, duplicação, segurança, complexidade, código morto | não (só leitura) |

## Skills
- `/feature <descrição>` — fluxo architect → implementação → tester → reviewer.

## Hooks
- `PreToolUse` em `Edit|Write|MultiEdit|NotebookEdit` → `.claude/hooks/proteger_arquivos.py`: bloqueia alterações em `.env*` (exceto `.env.example`/`.sample`/`.template`), `*.pem`, `*.key`, `*.pfx`, `*.p12`, `id_rsa*`, `id_ed25519*`. Requer `python` no PATH.
