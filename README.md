# Perfin_02

Projeto Perfin composto por aplicativo, website e documentação, com backend em Supabase.

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `Aplicativo/` | Código do aplicativo |
| `Website/` | Código do website |
| `Documentacao/` | Documentação do projeto |
| `.claude/` | Configuração do Claude Code (agents, skills, rules, hooks) — versionada |

## Configuração

1. Clone o repositório:
   ```bash
   git clone https://github.com/rodrigosarti33-art/perfin_02.git
   ```
2. Copie `.env.example` para `.env` e preencha as variáveis do Supabase.
3. Vincule o Supabase (requer a [Supabase CLI](https://supabase.com/docs/guides/cli)):
   ```bash
   supabase login
   supabase link --project-ref <project-ref>
   ```

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_PUBLISHABLE_KEY` | Chave pública (publishable) do Supabase |
| `SUPABASE_DB_URL` | String de conexão Postgres |
| `GITHUB_REPO` | URL do repositório |

O arquivo `.env` não é versionado.
