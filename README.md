# Perfin_02

Projeto Perfin composto por aplicativo (Portal Perfin), website e documentação, com backend em Supabase e hospedagem na Vercel.

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `Aplicativo/` | Portal Perfin — Next.js 16 (App Router) + TypeScript, login com Google via Supabase Auth |
| `Website/` | Código do website |
| `Documentacao/` | Documentação do projeto (ver [`configuracao.md`](Documentacao/configuracao.md)) |
| `supabase/migrations/` | Esquema do banco, RLS e funções |
| `.claude/` | Configuração do Claude Code (agents, skills, rules, hooks) — versionada |

## Configuração

O portal **não roda em localhost**: o build e os testes funcionais acontecem na Vercel. O passo a passo completo do que cadastrar no Supabase, na Vercel, no Google Cloud Console e no GitHub está em [`Documentacao/configuracao.md`](Documentacao/configuracao.md).

1. Clone o repositório:
   ```bash
   git clone https://github.com/rodrigosarti33-art/perfin_02.git
   ```
2. Copie `.env.example` para `.env` e preencha as variáveis (o `.env` não é versionado).
3. Verificação local (sem servidor), dentro de `Aplicativo/`, com o Node portátil no PATH:
   ```bash
   npm install
   npm run lint && npm run typecheck && npm test && npm run build
   ```

## Variáveis de ambiente

| Variável | Onde | Descrição |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Vercel (pública) | URL oficial do portal; única variável exposta ao navegador |
| `SUPABASE_URL` | Vercel, GitHub Actions | URL do projeto Supabase |
| `SUPABASE_PUBLISHABLE_KEY` | Vercel | Chave publicável do Supabase |
| `SUPABASE_SECRET_KEY` | Vercel, GitHub Actions | Chave secreta do Supabase (só servidor/coletor; ignora a RLS) |
| `SUPABASE_DB_URL` | só local | String de conexão Postgres, para aplicar migrations |
| `GOOGLE_CLIENT_ID` | Vercel | Client ID OAuth do Google |
| `GOOGLE_CLIENT_SECRET` | Vercel | Client secret OAuth do Google |
| `ADMIN_EMAILS` | Vercel | E-mails com acesso ao portal, separados por vírgula |
| `TOKEN_ENCRYPTION_KEY` | Vercel | 32 bytes em base64 para cifrar os refresh tokens do Google |
| `GEMINI_API_KEY` | Vercel | Chave da API do Gemini (assistente) |
| `GEMINI_MODELOS` | Vercel | Modelos do Gemini separados por vírgula, em ordem de tentativa |
| `GITHUB_REPO` | só local | URL do repositório |

Nenhum valor real vai para o repositório: o `.env.example` traz só nomes e placeholders.
