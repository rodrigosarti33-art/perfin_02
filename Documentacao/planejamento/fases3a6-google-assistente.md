Sobre a sua pergunta: o ganho de velocidade real aqui vem de rodar fases em paralelo. A seção 6 mostra o que pode ir junto sem dois agentes mexerem no mesmo arquivo. Não sei dizer se o "ultracode" em si é mais rápido.

# Portal Perfin: arquitetura das fases 3 a 6

## 0. O que já existe no código e o que falta

- **Fases 1 e 2 estão incompletas.** Não existem `app/login`, `app/nao-autorizado`, `app/(portal)/layout.tsx` nem `src/dominio/indicadores/*`. `src/app/page.tsx` ainda é o "Hello world" inicial.
  - A fase 6 depende do domínio da fase 2: esquema zod dos filtros, agregação, estatísticas e a consulta a `indicador_valores`.
  - As fases 3 e 4 precisam do layout do portal para pôr os itens de menu.
- **Proteção das rotas.** `exigirAdmin()` em `C:\Repositorios\Perfin_02\Aplicativo\src\servicos\supabase\sessao.ts` usa `redirect()`. Isso funciona em página, Server Action e Route Handler GET. O proxy já devolve 401 em `/api/*` para quem não é admin, mas mesmo assim toda rota e toda action precisam chamar `exigirAdmin()`.
- **Testes.** `C:\Repositorios\Perfin_02\Aplicativo\vitest.config.mts` só roda `src/**/*.test.ts`, em ambiente node, com `server-only` substituído por um stub. Não há jsdom: componentes não são testáveis, então toda lógica testável precisa ficar em TS puro.
- **Cookie.** `C:\Repositorios\Perfin_02\Aplicativo\src\servicos\supabase\opcoesCookie.ts` define o cookie como `httpOnly` e `sameSite=lax`. Não há cliente Supabase no navegador.
- **`tokens.ts`.** `C:\Repositorios\Perfin_02\Aplicativo\src\servicos\google\tokens.ts` só grava o token. Não existe leitura nem renovação, e isso precisa ser criado em arquivo novo para não reescrever o existente.

## 1. Base comum (fazer antes das fases 3 a 6, em sequência)

**Arquivos novos** (caminhos a partir de `C:\Repositorios\Perfin_02\Aplicativo\src\`):
- `servicos/google/erros.ts` + teste. Puro.
  - Classe `ErroGoogle` com os tipos `'sem_credencial' | 'reconectar' | 'escopo' | 'cota' | 'tempo' | 'indisponivel' | 'nao_encontrado' | 'config'`.
  - Função `classificarFalha(status, corpoJson)` que converte a resposta HTTP no tipo.
- `servicos/google/http.ts` + teste. Função `chamarGoogle<T>(token, url, init, esquemaZod, { timeoutMs })`.
  - Timeout com `AbortSignal.timeout` (15 s; 30 s na exportação).
  - No máximo 1 nova tentativa em 429 e 503, respeitando `Retry-After` com teto de 3 s.
  - Valida a resposta com zod e usa `cache: 'no-store'`.
  - Nunca põe o token nem os cabeçalhos em mensagens de erro.
- `servicos/google/acessoGoogle.ts` (server-only). Função `obterAccessToken(usuarioId, escopo)`, com `cache()` do React para valer uma vez por requisição. Passos:
  1. Lê `google_credenciais` com `criarClienteAdmin()`, sempre com `.eq('user_id', usuarioId)`.
  2. Decifra com `decifrar(..., envCifra().chave, usuarioId)`.
  3. Chama **`POST https://oauth2.googleapis.com/token`** (form-urlencoded) com `grant_type=refresh_token`, `refresh_token`, `client_id` e `client_secret` de `envGoogle()`. Usa os campos `access_token`, `expires_in` e `scope` da resposta.
  4. Confere o escopo pelo `scope` dessa resposta, que é mais confiável que a coluna `scopes`.
  5. O access token nunca é persistido.
- `servicos/google/credenciais.ts` (server-only). Funções `lerPastaDrive(usuarioId)`, `salvarPastaDrive(usuarioId, id)` e `apagarCredencial(usuarioId)`, todas pelo cliente admin filtrando por `user_id`.
- `components/AvisoReconectarGoogle.tsx`. Server Component com um `<form action={entrarComGoogle}>`, que já pede `prompt=consent`.
- Constantes nomeadas por escopo (`ESCOPO_CALENDARIO`, `ESCOPO_DRIVE`, `ESCOPO_GMAIL`), acrescentadas ao fim de `servicos/google/escopos.ts` sem mudar o que já existe.

**Tratamento de erros, igual em todas as fases:**

| Situação | Detecção | Ação |
|---|---|---|
| Sem linha em `google_credenciais` | consulta vazia | `sem_credencial`: mostrar `AvisoReconectarGoogle` |
| Token revogado ou expirado (modo Teste: 7 dias) | 400 `{"error":"invalid_grant"}` no endpoint de token | `apagarCredencial` e depois `reconectar` |
| Falha ao decifrar (chave trocada ou dado corrompido) | exceção em `decifrar` | `apagarCredencial` e depois `reconectar` |
| Escopo não concedido | `scope` sem o escopo pedido, ou 403 com reason `insufficientPermissions` / `ACCESS_TOKEN_SCOPE_INSUFFICIENT` | `escopo`: aviso específico + reconexão |
| `invalid_client` / 401 no endpoint de token | config errada | `config`: mensagem genérica |
| 401 numa API depois de renovar | token inválido | `reconectar` |
| 429, ou 403 com `rateLimitExceeded` / `userRateLimitExceeded` | status/reason | `cota`: uma nova tentativa e depois "tente em instantes" |
| 5xx / `AbortError` | | `indisponivel` / `tempo` |

**Formato dos retornos.**
- Server Actions devolvem `{ ok: true, ... } | { ok: false, motivo: TipoErro }`, nunca lançam exceção para a interface.
- Páginas mapeiam `ErroGoogle` para um estado de tela e deixam o resto para o `error.tsx`.
- Logs só com `tipo` e `status`.

## 2. Fase 3: relatório do mês

**Impacto:** nova rota `/relatorios` com a lista de relatórios e o formulário do mês; uma Server Action que cria a planilha; e o download do `.xlsx`.

**Arquivos novos:**
- `dominio/relatorio/mesReferencia.ts` + teste.
  - Converte `'AAAA-MM'` e valida o intervalo: de 2010-01 até o último mês fechado.
  - O "último mês fechado" é calculado no fuso **America/Sao_Paulo**, não em UTC (que é o fuso da Vercel).
  - Gera o intervalo de consulta: de mês−13 até o fim do mês, mais o trimestre do FBCF.
- `dominio/relatorio/resumoMensal.ts` + teste.
  - Entrada: linhas `{codigo, data, valor}`. Saída: tipo `ResumoMensal`.
  - IPCA e IGP-M: mensal, 12 meses, e mês anterior com a diferença em p.p.
  - PTAX: média, fim, mínimo, máximo, número de dias, e variação da média contra o mês anterior.
  - FBCF: valor do trimestre, ou `null`.
  - `faltantes: string[]` lista o que não veio.
- `dominio/relatorio/planilha.ts` + teste. Converte `ResumoMensal` em uma matriz de células (números como `number`) e na descrição da formatação (faixas de cabeçalho, número de casas).
- `servicos/relatorio/dadosRelatorio.ts`. Consulta `indicador_valores` com o cliente da sessão (RLS ativa): `.in()` e `.gte/.lte`.
- `servicos/google/drive.ts`. Funções `garantirPasta`, `moverParaPasta`, `exportarXlsx` e `apagarArquivo`, a última só para limpar planilha órfã.
- `servicos/google/planilhas.ts`. Funções `criarPlanilha`, `gravarValores` e `formatar`.
- `servicos/relatorio/gerarRelatorio.ts`. Orquestra o fluxo: consulta → resumo → pasta → planilha → valores → formato → insert em `relatorios`. Se o insert falhar, tenta `apagarArquivo` (melhor esforço).
- `app/(portal)/relatorios/{page.tsx, loading.tsx, error.tsx, acoes.ts}`.
  - `acoes.ts` contém `gerarRelatorio(formData)`, que chama `exigirAdmin` e valida o mês com zod.
  - Defina `export const maxDuration = 60` na `page.tsx`.
- `app/api/relatorios/[id]/xlsx/route.ts`.
- Componentes: `FormularioRelatorio.tsx` (client, só pelo `useActionState`), `ListaRelatorios.tsx`, `BotoesRelatorio.tsx`.

**Chamadas REST:**

| Etapa | Método e URL | Campos |
|---|---|---|
| Conferir a pasta | `GET https://www.googleapis.com/drive/v3/files/{pastaId}?fields=id,trashed` | 404 ou `trashed=true` → criar de novo |
| Criar a pasta | `POST https://www.googleapis.com/drive/v3/files?fields=id` | `{name:"Portal Perfin – Relatórios", mimeType:"application/vnd.google-apps.folder"}` |
| Criar a planilha | `POST https://sheets.googleapis.com/v4/spreadsheets` | `properties{title, locale:"pt_BR", timeZone:"America/Sao_Paulo"}`, `sheets[{properties{sheetId:0, title:"Resumo", gridProperties{frozenRowCount:1}}}]` → `spreadsheetId`, `spreadsheetUrl` |
| Mover para a pasta | `PATCH https://www.googleapis.com/drive/v3/files/{id}?addParents={pasta}&removeParents=root&fields=id` | — |
| Gravar os valores | `POST https://sheets.googleapis.com/v4/spreadsheets/{id}/values:batchUpdate` | `{valueInputOption:"RAW", data:[{range:"Resumo!A1", values}]}` |
| Formatar | `POST https://sheets.googleapis.com/v4/spreadsheets/{id}:batchUpdate` | `repeatCell` (cabeçalho #004C88, texto branco, negrito), `repeatCell` com `numberFormat`, `autoResizeDimensions` |
| Exportar o `.xlsx` | `GET https://www.googleapis.com/drive/v3/files/{id}/export?mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | limite de 10 MB; repassar o `body` como stream |

**Segurança:**
- **IDOR no download.** A rota segue esta ordem:
  1. `await params`.
  2. Valida o id com `z.uuid()`.
  3. Chama `exigirAdmin()`.
  4. Faz `select planilha_id` com o cliente **da sessão**, com `.eq('id', id).eq('user_id', usuarioId).maybeSingle()`.
  5. Responde **404 igual** para "não existe" e "é de outro usuário".
  6. Usa o access token **do usuário atual**. Com `drive.file`, ele nem enxerga arquivos de outra pessoa (segunda camada de defesa).
- **Cabeçalhos da resposta:** `Content-Type` do xlsx, `Content-Disposition: attachment; filename="relatorio-perfin-AAAA-MM.xlsx"` (montado no servidor), `Cache-Control: private, no-store` e `X-Content-Type-Options: nosniff`.
- **`planilha_id` não é confiável.** A policy de update deixa o dono alterar qualquer coluna. Antes de usar o valor numa URL, validar com `/^[A-Za-z0-9_-]{10,200}$/`. O link "Abrir no Sheets" deve ser montado a partir do id (`https://docs.google.com/spreadsheets/d/{id}/edit`), sem renderizar `planilha_url` direto num `href`.
- **Server Action.** Chamar `exigirAdmin()` dentro dela, sem receber `user_id` do cliente. O `insert` usa o default `auth.uid()`.

## 3. Fase 4: agenda

**Arquivos novos:**
- `dominio/agenda/eventos.ts` + teste.
  - Normaliza os eventos: `start.dateTime` ou `start.date` para eventos de dia inteiro.
  - Descarta `status=cancelled`.
  - Extrai o link do Meet de `hangoutLink` ou de `conferenceData.entryPoints[entryPointType=video]`. **Só aceita `https://meet.google.com/...`**.
  - Formata em pt-BR no fuso de São Paulo.
- `servicos/google/calendario.ts`.
- `app/(portal)/agenda/{page.tsx, loading.tsx, error.tsx}`, `components/ListaReunioes.tsx` e `components/ItemReuniao.tsx`.

**Chamada REST:** `GET https://www.googleapis.com/calendar/v3/calendars/primary/events`, com:
- `timeMin` = agora e `timeMax` = agora + 14 dias, ambos em ISO;
- `singleEvents=true`, `orderBy=startTime`, `maxResults=10`, `timeZone=America/Sao_Paulo`;
- `fields=items(id,status,summary,start,end,hangoutLink,htmlLink,conferenceData/entryPoints(entryPointType,uri))`.

**Segurança:** título e local vêm de quem convidou, então são texto não confiável. Renderizar só como texto e não exibir `description`. `htmlLink` só é aceito se começar com `https://www.google.com/calendar`.

**Estados da tela:** carregando, erro, vazio ("Nenhuma reunião nos próximos 14 dias") e reconectar.

## 4. Fase 5: rascunho no Gmail

**Arquivos novos:**
- `servicos/google/mime.ts` + teste. Puro, sem server-only.
  - Assinatura: `montarMime({ para?, assunto, corpo, anexo: { nome, tipo, conteudo: Uint8Array } }): string`.
  - Linhas terminando em CRLF e `MIME-Version: 1.0`.
  - Fronteira aleatória (`randomUUID`), conferindo que ela não aparece em nenhuma parte.
  - Corpo em `text/plain; charset=UTF-8` com `Content-Transfer-Encoding: base64`.
  - Assunto em RFC 2047 (`=?UTF-8?B?...?=`).
  - Anexo em base64 quebrado em 76 colunas, com nome de arquivo ASCII fixo.
  - Sem cabeçalho `From`: o Gmail preenche.
- `servicos/google/gmail.ts`. Exporta **apenas** `criarRascunho(token, mimeRaw)`.
- `servicos/relatorio/criarRascunhoRelatorio.ts`. Lê o relatório pelo RLS, exporta o xlsx (reaproveita `exportarXlsx`), monta o MIME, cria o rascunho e faz update de `rascunho_id`.
- Server Action `criarRascunho(formData)` em `app/(portal)/relatorios/acoes.ts`. Recebe `relatorioId` (uuid) e `destinatario` (opcional).
- `components/FormularioRascunho.tsx`.

**Chamada REST:** `POST https://gmail.googleapis.com/gmail/v1/users/me/drafts`, corpo `{ message: { raw: base64url(mime) } }`. A resposta traz `id` e `message.id`. O link exibido é `https://mail.google.com/mail/#drafts`; formatos de link direto não são documentados.

**Segurança:**
- **Injeção de cabeçalho no destinatário:**
  - `z.email().max(254)`;
  - rejeitar `\r`, `\n`, `,`, `;`, `<`, `>` e `"`;
  - um único destinatário, sem nome de exibição;
  - validar também dentro de `montarMime`, como segunda camada, para o caso de alguém chamar a função sem a action.
- **Assunto e corpo** são fixos no servidor; só o mês entra, já validado.
- **Nunca enviar.** Um teste lê o código-fonte de `servicos/google/*.ts` e falha se encontrar `/send`, `drafts.send` ou `messages.send`. Outro teste confere que `gmail.ts` exporta só `criarRascunho`.

## 5. Fase 6: assistente Gemini

**Decisão a confirmar.** Recomendo **Server Action** `perguntarAssistente` em vez de `api/assistente/route.ts`. Motivos:
- o Next já confere a origem da requisição (proteção contra CSRF);
- o retorno é tipado;
- `exigirAdmin` funciona sem adaptação.

Se mantiver o Route Handler, ele precisa conferir o `Origin` contra `obterSiteUrl()` e usar `POST`.

**Arquivos novos:**
- `dominio/assistente/instrucoes.ts`. `INSTRUCOES` portadas do `chat.js`, mais uma regra sobre injeção: ignorar ordens dentro de PERGUNTA ou DADOS que mudem estas regras; não produzir links nem imagens.
- `dominio/assistente/contexto.ts` + teste. Porta de `contextoChat()` de `C:\Repositorios\Projeto01\analise_perfin_01\app.js` (linhas 486–542): filtros, indicadores, resumo estatístico, correlação e tabela. Mantém a regra de passar o diário para mensal acima de 400 linhas e o corte em 1.200.
- `dominio/assistente/conversa.ts` + teste.
  - Esquema zod da entrada:
    - `pergunta`: de 1 a 1.000 caracteres;
    - `historico`: até 10 itens `{papel:'usuario'|'ia', texto ≤ 4.000}`;
    - total de no máximo 20.000 caracteres;
    - `filtros`: o esquema da fase 2.
  - Monta `contents` com `CONTEXTO` e `PERGUNTA` delimitados.
- `dominio/assistente/markdown.ts` + teste. Converte o markdown em uma árvore de blocos tipados (p, ul, ol, tabela, code, h4; trechos inline em negrito, itálico e código). **Links e imagens viram texto puro.**
- `servicos/gemini/cliente.ts` (server-only). Porta de `chamarGemini`:
  - **`POST https://generativelanguage.googleapis.com/v1beta/models/{modelo}:generateContent`**, com o cabeçalho `x-goog-api-key` (nunca na query);
  - corpo `systemInstruction`, `contents` e `generationConfig{temperature:0.3, maxOutputTokens:2048}`;
  - descarta as partes com `thought`;
  - percorre `envGemini().modelos` em ordem; em 401 ou 403, para tudo;
  - timeout de 25 s por modelo e prazo total de 50 s (com `maxDuration=60` na página);
  - mensagem de erro do Gemini cortada e **não** repassada como veio ao cliente.
- `app/(portal)/acoesAssistente.ts`. Passos: `exigirAdmin` → zod → consulta da fase 2 com o cliente da sessão → agregação → contexto → Gemini. Retorna `{ok, texto, modelo} | {ok:false, motivo}`.
- Componentes: `ChatAssistente.tsx` (client), `MarkdownSeguro.tsx` (renderiza a árvore como elementos React, sem `dangerouslySetInnerHTML`) e `MensagemChat.tsx`.

**Riscos de segurança:**
- **Prompt injection pela pergunta.** O impacto fica limitado à resposta do próprio usuário, porque a IA não tem ferramentas e o markdown não renderiza links nem imagens (o que impede vazar dados por URL).
- **Histórico forjado.** As mensagens `ia` do histórico vêm do cliente e podem ser inventadas. Tratar como não confiável, só limitar o tamanho.
- **Sem limite por usuário.** Não há limite de requisições por usuário. Em memória não funciona na Vercel (várias instâncias). Fazer direito exige uma tabela nova, a ser decidida.

## 6. Paralelismo sem conflito de arquivos

1. **Sequencial primeiro:** a base comum da seção 1, e as fases 1 e 2 terminadas (layout do portal com menu, esquema de filtros, `consultarValores`).
2. **Depois, em paralelo:**
   - **Agente A, fase 3:** `dominio/relatorio/*`, `drive.ts`, `planilhas.ts`, `servicos/relatorio/{dadosRelatorio,gerarRelatorio}.ts`, `app/(portal)/relatorios/*` e `app/api/relatorios/*`.
   - **Agente B, fase 4:** `dominio/agenda/*`, `calendario.ts`, `app/(portal)/agenda/*`, `ListaReunioes` e `ItemReuniao`.
   - **Agente C, fase 5 sem a interface:** `mime.ts` + teste, `gmail.ts` e o teste de "nunca enviar".
   - **Agente D, fase 6:** `dominio/assistente/*`, `servicos/gemini/cliente.ts`, `acoesAssistente.ts`, `ChatAssistente`, `MarkdownSeguro` e `MensagemChat`.
3. **Pontos de conflito, a integrar em sequência:**
   - `relatorios/acoes.ts` e `BotoesRelatorio.tsx` (fases 3 e 5): o rascunho entra depois da fase 3;
   - `drive.ts` `exportarXlsx` (fases 3 e 5): a fase 3 é a dona;
   - `(portal)/page.tsx` (fases 2 e 6): só para encaixar o chat;
   - menu no `(portal)/layout.tsx` (fases 3 e 4).

## 7. Testes (vitest, `.test.ts`)

- **mesReferencia:** virada de ano; 1º dia do mês às 00:30 no horário de Brasília (03:30Z); rejeição de mês futuro e de antes de 2010.
- **resumoMensal:** mês completo; mês sem PTAX; mês 1 (o anterior é dezembro); FBCF de trimestre aberto; `faltantes` preenchido.
- **planilha:** dimensões e tipos numéricos.
- **erros:** classificação de `invalid_grant`, `insufficientPermissions`, 429, `userRateLimitExceeded`, 5xx e `AbortError`.
- **http:** com `fetch` simulado via `vi.stubGlobal`: nova tentativa com `Retry-After`, timeout, e resposta inválida no zod vira erro.
- **acessoGoogle:** com Supabase e `fetch` simulados: `invalid_grant` apaga a credencial; escopo ausente; a mensagem de erro nunca contém o token.
- **eventos:** dia inteiro; cancelado; Meet válido ou malicioso (`javascript:` e `https://evil`).
- **mime:** CRLF; RFC 2047 com acentos; destinatário com `\r\nBcc:` é rejeitado; a fronteira não aparece no conteúdo; anexo em base64 que volta ao original; teste de que nada do código tem "send".
- **conversa:** limites de tamanho e de quantidade; papel inválido.
- **contexto:** equivalência com `contextoChat` nos mesmos dados; cortes de 400 e 1.200 linhas.
- **markdown:** `<script>` vira texto; links e imagens viram texto; tabela; bloco de código.
- **gemini cliente:** fallback; parada em 401/403; resposta vazia passa para o próximo modelo; a chave não aparece no erro.

## 8. Plano passo a passo

1. Base comum: `erros.ts`, `http.ts`, `acessoGoogle.ts` e `credenciais.ts` com testes, mais as constantes de escopo e `AvisoReconectarGoogle`. Verificar com `npm test` e `npm run typecheck`.
2. Fechar as pendências das fases 1 e 2 que as próximas usam: layout do portal, filtros e `consultarValores`.
3. Fases 3 (só domínio, depois serviços), 4, 5 (`mime` e `gmail`) e 6 (só domínio), em paralelo. Cada uma com `npm test`.
4. Fase 3: serviços, actions, página e download. Verificar com lint, typecheck e `npm run build`.
5. Fase 4: página. Mesma verificação.
6. Fase 5: integrar o rascunho na página de relatórios.
7. Fase 6: action, chat e encaixe no painel.
8. Teste na Vercel:
   - planilha criada dentro da pasta, e o xlsx abre;
   - acessar `/api/relatorios/<id de outro usuário>/xlsx` dá 404;
   - a agenda lista as reuniões;
   - o rascunho aparece em Rascunhos e não em Enviados;
   - o assistente recusa pergunta fora do filtro;
   - depois de revogar o acesso em myaccount.google.com, aparece "Reconectar".

## 9. Dúvidas antes de implementar

1. **Relatório repetido para o mesmo mês:** reaproveitar o existente ou criar um novo e manter o histórico? Uma restrição `unique(user_id, mes_referencia)` exige uma migration nova.
2. **Assistente:** pode ser Server Action em vez de `api/assistente/route.ts` (é um desvio do plano aprovado)?
3. **Limite de uso do Gemini por usuário:** criar uma tabela de contagem ou aceitar só os limites de tamanho?
4. **Destinatário do rascunho:** restringir ao domínio `perfininfra.com.br`?
5. **Em `invalid_grant`:** apagar a linha de `google_credenciais` (como proposto) ou só marcar?