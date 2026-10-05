# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Estado atual
Repositório ainda sem código: `Aplicativo/`, `Website/` e `Documentacao/` estão vazias. Não há stack, build, lint ou testes definidos — atualize este arquivo quando forem adicionados.

## Estrutura
- `Aplicativo/` — código do aplicativo
- `Website/` — código do website
- `Documentacao/` — documentação do projeto
- `.claude/rules/` — regras permanentes do projeto (carregadas automaticamente, como este arquivo)
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
