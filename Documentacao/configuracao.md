# Configuração do Portal Perfin

Guia passo a passo do que precisa ser cadastrado fora do código para o portal funcionar. O portal **não roda em localhost**: tudo é testado na URL da Vercel.

Convenções usadas abaixo (substitua pelos valores reais, que **nunca** vão para o repositório):

| Marcador | Significado |
|---|---|
| `<url-vercel>` | URL oficial do portal, sem barra final (ex.: `https://<seu-projeto>.vercel.app` ou o domínio próprio) |
| `<project-ref>` | identificador do projeto Supabase (aparece em `https://<project-ref>.supabase.co`) |

Ordem recomendada: **Supabase (a) → Vercel (b) → Google (c) → GitHub (d) → testes (e)**. Como a URL da Vercel só existe depois do primeiro deploy, alguns campos são preenchidos em uma segunda passada (indicado em cada passo).

---

## (a) Supabase

1. **Aplicar a migration.** Abra *SQL Editor › New query*, cole o conteúdo inteiro de `supabase/migrations/20261006000001_portal_perfin.sql` e clique em *Run*. Ela cria as tabelas, liga a RLS em todas, cria `is_admin()` e `sincronizar_administradores()` e carrega o catálogo de indicadores.
   - Alternativa: aplicar a partir da sua máquina usando `SUPABASE_DB_URL` (essa variável fica só local e não vai para a Vercel).
2. **Criar a chave secreta.** *Project Settings › API Keys › Secret keys › Create new secret key*. O valor vai em `SUPABASE_SECRET_KEY` (Vercel e GitHub Actions). Ela ignora a RLS: nunca a exponha no navegador nem em variável `NEXT_PUBLIC_*`.
3. **Ativar o provedor Google.** *Authentication › Sign In / Providers › Google*: ativar e colar o *Client ID* e o *Client Secret* do cliente OAuth do Google (os mesmos de `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`).
4. **URL Configuration** (segunda passada, com a URL da Vercel em mãos). *Authentication › URL Configuration*:
   - *Site URL* = `<url-vercel>`
   - *Redirect URLs* = `<url-vercel>/auth/callback`
5. **Desligar os outros logins — obrigatório.** Em *Authentication › Sign In / Providers*:
   - desativar o provedor **Email** (login por e-mail/senha);
   - desativar **Allow anonymous sign-ins**;
   - desativar o provedor **Phone** e qualquer outro além do Google;
   - manter **Confirm email** ligado e o vínculo manual de identidades (*manual linking*) desligado.

   Motivo: defesa em profundidade. A RLS (`is_admin()`) já exige e-mail confirmado e uma identidade Google verificada com o mesmo e-mail, mas outros logins abririam caminhos para obter um JWT que não passou pelo Google.
6. **Remover um administrador.** Além de tirar o e-mail de `ADMIN_EMAILS` e fazer o redeploy:
   - a tabela `administradores` é ressincronizada na primeira página protegida acessada por um admin depois do deploy (e em todo login), e a credencial Google guardada de quem saiu é apagada junto;
   - encerre as sessões da pessoa no Supabase (*Authentication › Users › usuário › Sign out* ou remover o usuário). Sem isso, o refresh token dela continua válido até a ressincronização acima acontecer.

---

## (b) Vercel

1. **Importar o repositório** do GitHub (*Add New › Project*).
2. **Root Directory** = `Aplicativo`. Framework: Next.js (detectado). A versão do Node vem de `engines.node` (`24.x`) no `package.json`; confira em *Settings › Build and Deployment › Node.js Version*.
3. **Variáveis de ambiente** (*Settings › Environment Variables*). Só nomes aqui; valores no `.env` local / cofre de senhas:

   | Variável | Pública? |
   |---|---|
   | `NEXT_PUBLIC_SITE_URL` | **sim** (única que vai ao navegador) |
   | `SUPABASE_URL` | não |
   | `SUPABASE_PUBLISHABLE_KEY` | não |
   | `SUPABASE_SECRET_KEY` | não |
   | `GOOGLE_CLIENT_ID` | não |
   | `GOOGLE_CLIENT_SECRET` | não |
   | `ADMIN_EMAILS` | não |
   | `TOKEN_ENCRYPTION_KEY` | não |
   | `GEMINI_API_KEY` | não |
   | `GEMINI_MODELOS` | não |

   Não vão para a Vercel: `SUPABASE_DB_URL` e `GITHUB_REPO`.
   Para gerar `TOKEN_ENCRYPTION_KEY` (32 bytes em base64), veja o comando comentado no `.env.example`. Trocar essa chave invalida os tokens do Google já gravados (os usuários apenas refazem o login).
4. **Definir `NEXT_PUBLIC_SITE_URL` e redeployar.** Após o primeiro deploy, copie a URL de produção, grave-a em `NEXT_PUBLIC_SITE_URL` (sem barra final) e faça **Redeploy**: variáveis `NEXT_PUBLIC_*` são embutidas no build, então só valem após um novo build.
5. **Login só na URL oficial.** O login usa PKCE: o cookie do verificador é criado no domínio onde o login começou, e o retorno vai sempre para `NEXT_PUBLIC_SITE_URL`. Por isso **deploys de preview não fazem login** — teste sempre na URL de produção.

---

## (c) Google Cloud Console

Use o projeto onde está o cliente OAuth (`GOOGLE_CLIENT_ID`).

1. **Ativar as APIs** (*APIs e serviços › Biblioteca*): Google Calendar API, Google Drive API, Google Sheets API e Gmail API.
2. **Cliente OAuth do tipo Aplicativo da Web** (*Google Auth Platform › Clientes*):
   - *Origens JavaScript autorizadas* = `<url-vercel>`
   - *URIs de redirecionamento autorizados* = `https://<project-ref>.supabase.co/auth/v1/callback` (o Google devolve para o Supabase, que depois redireciona para `<url-vercel>/auth/callback`).
3. **Branding** (*Google Auth Platform › Branding*): nome "Portal Perfin", e-mail de suporte, logo, domínios autorizados e os links:
   - página inicial: `<url-vercel>/sobre`
   - política de privacidade: `<url-vercel>/privacidade`
   - termos de serviço: `<url-vercel>/termos`
4. **Acesso a dados** (*Google Auth Platform › Acesso a dados*): adicionar os 6 scopes que o portal pede (os mesmos de `src/servicos/google/escopos.ts`):

   | Scope | Uso no portal | Classificação |
   |---|---|---|
   | `openid` | login | não sensível |
   | `email` | login | não sensível |
   | `profile` | login | não sensível |
   | `https://www.googleapis.com/auth/calendar.events.readonly` | listar as próximas reuniões | sensível |
   | `https://www.googleapis.com/auth/drive.file` | criar a planilha do relatório e exportar `.xlsx` (só arquivos criados pelo app) | não sensível |
   | `https://www.googleapis.com/auth/gmail.compose` | criar rascunho com anexo (o portal nunca envia) | **restrito** |

5. **Público** (*Google Auth Platform › Público*): tipo **Externo**, status **Teste** até a verificação sair. Cadastre como *usuários de teste* todos os e-mails de `ADMIN_EMAILS`.
   - Em modo Teste a autorização expira em 7 dias: o usuário só precisa entrar de novo (o portal pede novo login quando a renovação falha).

### Requisitos para publicar em produção (verificação do Google)

- **Domínio próprio verificado** no Google Search Console (`*.vercel.app` não pode ser verificado como seu). Ex.: um subdomínio da empresa apontado para a Vercel. Ao trocar de domínio, atualize `NEXT_PUBLIC_SITE_URL` (e redeploy), a URL Configuration do Supabase, as origens do cliente OAuth e os links de Branding.
- **Vídeo** demonstrando o uso de cada scope sensível/restrito, enviado no pedido de verificação (prazo de dias a semanas).
- **Avaliação de segurança CASA anual** por laboratório terceiro (paga), exigida pelo scope restrito `gmail.compose`.

---

## (d) GitHub Actions (fase 2 — coletor de indicadores)

Em *Settings › Secrets and variables › Actions › New repository secret*, crie:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`

O workflow do coletor grava os indicadores no Supabase com essa chave. Nenhum outro segredo vai para o GitHub.

---

## (e) Checklist de teste na URL da Vercel

- [ ] `<url-vercel>/login` abre com o botão "Entrar com Google".
- [ ] `/sobre`, `/privacidade` e `/termos` abrem sem login.
- [ ] Um e-mail de `ADMIN_EMAILS` entra e chega ao portal; a tela de consentimento lista os scopes esperados.
- [ ] Uma conta fora de `ADMIN_EMAILS` vê "acesso não autorizado" e fica deslogada.
- [ ] Sem login, qualquer página do portal redireciona para `/login`.
- [ ] "Sair" encerra a sessão e volta para `/login`.
- [ ] No Supabase, a tabela `administradores` reflete `ADMIN_EMAILS` após um login ou após a primeira página do portal aberta depois de um redeploy (inclusive remoções).
- [ ] Com a chave publicável e **sem sessão**, consultas REST às tabelas retornam 0 linhas; `google_credenciais` nunca retorna nada ao cliente.
- [ ] No DevTools (aba Network e fontes), nenhuma chave privada aparece em bundle ou resposta.
- [ ] Tentativa de login em um deploy de preview não funciona (esperado: login só na URL oficial).
