# Arquitetura da Fase 2 do Portal Perfin: coletor, workflow e painel de indicadores

> Sobre a pergunta "no ultracode é mais rápido?": não há nada no repositório nem no plano que permita compará-lo. Esta análise trata só da Fase 2.

## 1. Impacto da mudança
- **Coleta.** Hoje a coleta é manual e gera só o CSV. Passa a rodar todo dia útil no GitHub Actions e também grava em `public.indicador_valores`, na frequência nativa de cada série, registrando cada execução em `public.coletas`. Sem as variáveis do Supabase, o script se comporta como hoje e grava só o CSV.
- **Painel.** A rota `/` (grupo `(portal)`) passa a mostrar o painel. Os filtros ficam na URL e são validados no servidor. A consulta usa a sessão do usuário, então o RLS `is_admin()` vale. A agregação é feita no domínio em TS puro, com gráficos por unidade e cards de último valor.
- **Mudanças de comportamento em relação ao painel antigo:**
  - A frequência trimestral passa de `Q` para `T`.
  - O filtro "PTAX só dias úteis" deixa de existir, porque o banco só guarda dias úteis. O resultado é igual ao padrão antigo (`diasUteis=true`).
  - Os atalhos de período passam a partir de "hoje" no fuso de São Paulo. No painel antigo o `dataMax` do CSV já era hoje, então o resultado é o mesmo.
  - Correlação, tabela unificada, exportação CSV e catálogo ficam fora desta fase. Portá-los agora criaria código sem uso; a tabela unificada volta na Fase 6, junto com o assistente.

## 2. Arquivos

**Coleta (raiz `C:\Repositorios\Perfin_02`)**

| Ação | Caminho | Motivo |
|---|---|---|
| criar | `coleta\atualizar_indicadores_macro.py` | Cópia da versão em `Indicadores Macro\`. O `main()` é reorganizado para calcular os dicionários uma vez e alimentar dois gravadores: o CSV (byte a byte igual ao atual) e o banco. |
| criar | `coleta\gravacao_supabase.py` | Só stdlib. Faz a montagem das linhas longas, o upsert em lotes e o registro em `coletas`. Fica separado para cada arquivo ter menos de 400 linhas. |
| criar | `coleta\test_series.py` | `unittest` da stdlib, sem rede: montagem das linhas, datas e arredondamento. |
| criar | `coleta\README.md` | Como rodar, variáveis de ambiente e o que vai para o banco. |
| criar | `.github\workflows\coleta-indicadores.yml` | Agendamento diário e disparo manual. |
| alterar | `.gitignore` (raiz) | Ignorar `coleta/indicadores_macro_brasil.csv`. Precisa de decisão, ver dúvida D3. |

**App (`C:\Repositorios\Perfin_02\Aplicativo`)**

| Ação | Caminho | Motivo |
|---|---|---|
| alterar | `package.json` / `package-lock.json` | `chart.js` e `react-chartjs-2` com versão exata (seção 6) |
| criar | `src\dominio\indicadores\tipos.ts` | Tipos `Frequencia = 'D'\|'M'\|'T'`, `Granularidade = Frequencia\|'A'`, `TipoSerie`, `Indicador`, `Ponto`, `PontoAgregado`, `Filtros`, `Estatisticas` |
| criar | `src\dominio\indicadores\periodos.ts` | `chavePeriodo`, `inicioPeriodo`, `fimPeriodo`, `rotuloPeriodo`, `addMeses`, `timestampUTC`, `hojeEmSaoPaulo(agora)`, `marcasEixo(min, max)` e `rotuloEixo`. Todos em UTC. |
| criar | `src\dominio\indicadores\formatacao.ts` | `fmtNum`, `fmtValor`, `fmtData` (Intl pt-BR) |
| criar | `src\dominio\indicadores\agregacao.ts` | `filtrarPontos`, `granularidadeEfetiva`, `agregar` (var/acum/nivel/fluxo, com a marcação de "parcial") |
| criar | `src\dominio\indicadores\estatisticas.ts` | `estatisticas`, `variacao` (p.p. ou %), `classeVariacao` (bom/ruim/neutro) |
| criar | `src\dominio\indicadores\catalogo.ts` | `TITULO_UNIDADE`, `NOME_FREQ`, schema zod da linha de `indicadores` e conversão de snake_case para camelCase |
| criar | `src\dominio\indicadores\filtros.ts` | Schema zod dos searchParams, `resolverFiltros(sp, catalogo, hoje)`, `paraQuery(filtros)` |
| criar | `src\dominio\indicadores\painel.ts` | `montarPainel(catalogo, valores, filtros)`: devolve os itens (indicador, pontos agregados, estatísticas) e os grupos por unidade |
| criar | `src\dominio\indicadores\*.test.ts` | Um teste por módulo (seção 8) |
| criar | `src\servicos\indicadores\consultas.ts` | Arquivo `server-only`. Funções `lerCatalogo`, `lerValores` (paginada), `lerUltimaColeta`, com zod nas linhas e erro genérico |
| criar | `src\app\(portal)\page.tsx` | Server Component. Faz `await searchParams`, chama `exigirAdmin()` e `resolverFiltros`, e envolve os dados em `<Suspense key={query}>` |
| criar | `src\app\(portal)\loading.tsx`, `error.tsx` | O `error.tsx` é `'use client'` e recebe as props `{ error, retry }`; `retry` está estável desde a 16.3, conforme a documentação local |
| criar | `src\app\(portal)\page.module.css` | Estilo da página |
| criar | `src\components\painel\Filtros.tsx` + `.module.css` | Server Component com `next/form` (GET). Atalhos e granularidade são `next/link`. Não precisa de `"use client"`. |
| criar | `src\components\painel\PainelIndicadores.tsx` | Server Component assíncrono: consulta, monta o painel e trata o estado vazio |
| criar | `src\components\painel\CardsResumo.tsx`, `CardIndicador.tsx` + css | Cards (Server Components). Números com `--fonte-numero`. |
| criar | `src\components\painel\GraficoUnidade.tsx` + css | `'use client'`, o único componente cliente. Faz o registro do Chart.js, o modo `porData` e os callbacks de tooltip. |
| criar | `src\components\painel\configGrafico.ts` | Módulo cliente sem JSX: monta os datasets (barra para var/fluxo, linha para os demais) e as opções |
| criar | `src\components\painel\EstadoVazio.tsx`, `AtualizadoEm.tsx` | Estado vazio e o "atualizado em" vindo de `coletas` |
| remover/mover | `src\app\page.tsx` | **Conflita com `(portal)\page.tsx`**: as duas resolvem para `/` e o build quebra. |

## 3. Formato dos dados: do CSV para o banco

Regras gerais:
- Uma linha por (`indicador_codigo`, `data`).
- **Não existe linha com valor nulo.** Mês ou trimestre ainda não divulgado simplesmente não tem linha.
- O valor é arredondado com as mesmas casas do CSV, para o banco bater com o CSV.

| Coluna do CSV | Linhas no banco | `data` | Valor |
|---|---|---|---|
| `IGPM_var_mensal_%` / `IPCA_var_mensal_%` | uma por mês com dado, a partir de 2010-01 | dia 1 do mês | `round(v, 2)` |
| `IGPM_acum_12m_%` / `IPCA_acum_12m_%` | só meses com os 12 anteriores completos | dia 1 | `round(v, 2)` |
| `BRL_USD_PTAX_venda` | **só dias úteis** (chaves do dict `ptax` ≥ data inicial); o preenchimento de fim de semana fica só no CSV | o próprio dia | `round(v, 4)` |
| `FBCF_trimestre_R$_mi` | um por trimestre publicado com início ≥ data inicial | 1º dia do trimestre (01/01, 01/04, 01/07, 01/10), frequência `T` | `round(v, 0)` |
| `FBCF_mensal_aprox_R$_mi` | os 3 meses de cada trimestre publicado | dia 1 de cada mês | `round(tri/3, 0)` |
| `Data`, `Dia`, `Mes`, `Ano`, `PTAX_dia_util` | não vão para o banco | — | — |

Volume estimado: cerca de 5,2 mil linhas no total (PTAX ≈ 4,1 mil; cada série mensal ≈ 200; FBCF T ≈ 66; FBCF M ≈ 198).

Upsert:
- Requisição: `POST {SUPABASE_URL}/rest/v1/indicador_valores?on_conflict=indicador_codigo,data`.
- Cabeçalhos: `Prefer: resolution=merge-duplicates,return=minimal` e `apikey: <secret>`.
- Lotes de 1.000.
- Todos os objetos do lote precisam ter as mesmas chaves e **incluir `atualizado_em`** em ISO UTC. Sem isso, o merge não atualiza o carimbo, porque o default só vale no insert.

Registro em `coletas`:
- No início: `POST /rest/v1/coletas` com `Prefer: return=representation` para obter o `id`.
- No fim: `PATCH /rest/v1/coletas?id=eq.<id>` com `status`, `finalizada_em`, `linhas` e `mensagem` (sanitizada, até 500 caracteres).

## 4. Contrato dos filtros (searchParams)

| Parâmetro | Valores | Padrão | Regra |
|---|---|---|---|
| `periodo` | `12m` \| `36m` \| `5a` \| `tudo` | `5a` | O início é `addMeses(início do mês de hoje, -11 / -35 / -59)`; `tudo` começa em `DATA_MINIMA`. O fim é hoje. |
| `ini`, `fim` | `AAAA-MM-DD` com data de calendário válida | ausentes | Se houver pelo menos um, sobrescrevem `periodo`, que vira nulo. São limitados a `[2010-01-01, hoje em SP]`. Se `ini > fim`, os dois são trocados. |
| `ind` | parâmetro repetido (`?ind=A&ind=B`), no máximo 20, regex `^[A-Za-z0-9_%$]{1,60}$` | os do catálogo com `padrao=true` | Depois do regex, é **cruzado com os códigos do catálogo lido do banco** (lista permitida). Se `ind` estiver presente mas nada sobrar, a tela mostra o estado vazio "nenhum indicador". |
| `gran` | `D` \| `M` \| `T` \| `A` | `M` | Nunca fica mais fina que a frequência da série (`granularidadeEfetiva`) |
| `agreg` | `media` \| `fim` | `media` | Só se aplica a `nivel` |

- O tipo de entrada é `string | string[] | undefined`, normalizado antes do zod.
- Valor inválido cai no padrão via `.catch()` e não gera página de erro.
- As URLs são sempre montadas por `paraQuery` com `URLSearchParams`, que codifica `%` como `%25` e `$` como `%24`.

## 5. Riscos e dúvidas

**Limite de 1.000 linhas do PostgREST.** A PTAX com `tudo` passa de 4 mil linhas.
- `lerValores` faz uma consulta por indicador, todas em `Promise.all`, com `.eq('indicador_codigo', c).gte('data', inicioPeriodo(ini, freq)).lte('data', fim).order('data').range()` em laço até vir menos de 1.000.
- Teto de 20 páginas; acima disso, lança erro (falha fechada).
- O início da consulta é recuado para o início do período da série, para o mês ou trimestre que contém `ini` entrar, como em `filtrarPontos`.

**Fuso horário.**
- A Vercel e o runner do Actions rodam em UTC.
- No app, "hoje" vem de `hojeEmSaoPaulo()`, que usa `Intl` com `timeZone: 'America/Sao_Paulo'`.
- Datas circulam como strings ISO. O eixo do gráfico usa `Date.UTC` e getters UTC; nunca `new Date('AAAA-MM-DD')` com formatação local, que causaria diferença de hidratação e erro de um dia.
- No workflow, definir `TZ: America/Sao_Paulo` para o `date.today()` do Python.

**`%` e `$` nos códigos.**
- Um `%` solto digitado à mão na URL não deve quebrar a página, porque o `URLSearchParams` é tolerante. Mesmo assim, há lista permitida e regex.
- Nunca concatenar código em filtro PostgREST: usar `.eq()`.

**Gráfico sem adapter de datas.** O `graficos.js` usa `type: 'time'`, que exige adapter.
- Usar eixo `linear` com timestamps UTC.
- Gerar as marcas com `afterBuildTicks` a partir de `marcasEixo` (início de ano, mês ou dia, conforme o intervalo).
- O modo `porData` exige ampliar o tipo `InteractionModeMap` do chart.js, sem `any`.
- As funções de callback não podem vir do servidor: o servidor passa só dados serializáveis.

**Python só com stdlib.**
- `urllib.request` com JSON. Em `HTTPError`, registrar status e corpo truncado, nunca os cabeçalhos.
- Usar um User-Agent próprio nas chamadas ao Supabase (`perfin-coleta/1.0`). O `Mozilla/5.0` herdado do script pode ser tratado como navegador, e o Supabase recusa chave secreta vinda de navegador.
- Mandar a chave só no `apikey`, porque `sb_secret_…` não é JWT. Confirmar na primeira execução.

**Segredos no GitHub.**
- `SUPABASE_URL` e `SUPABASE_SECRET_KEY` ficam em Actions secrets, cadastrados por você.
- Workflow com `permissions: contents: read`, sem gatilho `pull_request`, `concurrency` e `timeout-minutes: 15`, e actions fixadas em versão (de preferência por SHA).
- Nunca usar `echo` das variáveis.

**Falha parcial.** Se a gravação parar num lote do meio, o banco fica parcialmente atualizado. O upsert é idempotente, então a próxima execução corrige. Mesmo assim:
- `coletas` registra `erro` e o processo sai com código 1; o GitHub manda e-mail.
- Antes de gravar, abortar se alguma série vier com 0 linhas ou com valor fora de uma faixa plausível.

**Fontes.** O BCB/SGS pode ficar lento ou bloquear IPs de nuvem estrangeira, e o runner do Actions roda nos EUA. As tentativas automáticas existem, mas, se falhar de forma recorrente, a saída é um runner próprio. O cron agendado só roda na branch padrão e pode atrasar.

**RLS silencioso.** Se `is_admin()` falhar (por exemplo, `administradores` não sincronizada), as consultas voltam com 0 linhas e o painel parece apenas vazio. Tratar catálogo vazio como erro de acesso, com mensagem genérica.

**Volume para o cliente.** Granularidade `D` com `tudo` manda cerca de 4 mil pontos ao gráfico, uns 100 KB, o que é aceitável. Ativar o plugin de decimation do Chart.js com `parsing: false`.

**Dúvidas a responder antes de implementar:**
- **D1:** a Fase 1 de interface está pronta (`(portal)/layout.tsx`, `/login`, `/nao-autorizado`, layout raiz com fontes, `lang="pt-BR"`, `/marca/perfin-infra.png`)? Hoje o `layout.tsx` ainda é o padrão do create-next-app e não há grupo `(portal)`.
- **D2:** a migration já foi aplicada no Supabase? A chave estrangeira exige o catálogo antes da primeira coleta.
- **D3:** o CSV em `coleta/` vai para o git ou é publicado como artifact do Actions? A sugestão é ignorá-lo no git e publicá-lo como artifact por 7 dias.
- **D4:** as cores do catálogo (`#e5484d` etc.) não seguem a paleta Perfin. A proposta é uma migration nova (`20261007000001_cores_perfin.sql`) com `update indicadores set cor = …` na paleta primária. Não se deve editar a migration já aplicada.
- **D5:** existe uma contradição na tarefa: "NÃO instale dependências novas" contra o plano aprovado, que inclui chart.js e react-chartjs-2. Proponho que essas duas sejam a única exceção.

## 6. Versões de chart.js e react-chartjs-2
- **`chart.js@4.5.1`** (no mínimo 4.5.0) e **`react-chartjs-2@5.3.0`**, a primeira versão com peer dependency `react ^19`.
- Instalar com `npm install --save-exact chart.js@4.5.1 react-chartjs-2@5.3.0`.
- Antes, confirmar com `npm view chart.js@4 version` e `npm view react-chartjs-2 peerDependencies`. Eu não consegui consultar o registro daqui; se houver patch mais novo na mesma linha 4.x/5.x, fixar nele.
- Nenhum adapter de datas.

## 7. Plano passo a passo

| # | Passo | Verificação |
|---|---|---|
| 0 | Responder D1 a D5 e remover ou mover o `src\app\page.tsx` | — |
| 1 | Copiar o script para `coleta\` sem alterações | Rodar o novo e o antigo no mesmo dia: CSVs idênticos (`fc /b`). Validação da skill: todas as checagens OK. |
| 2 | Reorganizar o `main()` e criar `gravacao_supabase.py` (`montar_linhas`, `upsert_lotes`, `registrar_coleta`); exigir as duas variáveis juntas (só uma presente = erro) | `python -m unittest coleta.test_series` passa. Sem variáveis, o CSV continua idêntico ao do passo 1. |
| 3 | Workflow: `schedule: '0 13 * * 1-5'` (10h BRT) e `workflow_dispatch`, `setup-python` 3.12, `env: TZ`, secrets | Você cadastra os secrets e roda o disparo manual. O log não mostra a chave. `coletas` tem uma linha `sucesso`. Conferir a contagem por série com SQL (`select indicador_codigo, count(*), min(data), max(data) … group by 1`) contra os volumes da seção 3. |
| 4 | Segunda execução manual | Mesmas contagens (idempotente) e `atualizado_em` avançou |
| 5 | Domínio TS: tipos, períodos, formatação, agregação, estatísticas, catálogo, filtros e painel, com testes | `npx vitest run` e `npx tsc --noEmit` |
| 6 | Instalar as duas bibliotecas fixadas | `npm ls chart.js react-chartjs-2` sem avisos de peer dependency |
| 7 | `servicos\indicadores\consultas.ts` | `tsc`; revisão: só `.eq`/`.gte`/`.lte`/`.range`, zod em toda linha |
| 8 | Página, `loading.tsx`, `error.tsx`, componentes e CSS com a identidade Perfin | `npm run lint`, `tsc`, `npm run build`. Grep sem `console.log`, `any` ou `dangerouslySetInnerHTML`. Só `GraficoUnidade` tem `"use client"`. |
| 9 | Deploy na Vercel | Navegador: padrão 5a/M. `?ind=IPCA_acum_12m_%25` funciona; `%` cru não quebra. `gran=D&periodo=tudo` mostra a PTAX desde 04/01/2010, o que prova a paginação. Valores conferem com BCB/IBGE. URL inválida cai no padrão. Usuário não admin não vê dados. |

## 8. Testes vitest do domínio
- **`periodos.test.ts`**:
  - `chavePeriodo` e `inicioPeriodo`/`fimPeriodo` para D/M/T/A, incluindo 29/02/2024 e o fim do T4 em 31/12.
  - Rótulos `mar/2024` e `1º tri/2024`.
  - `addMeses` atravessando a virada de ano.
  - `hojeEmSaoPaulo(new Date('2026-1006T02:00:00Z'))` devolve `'2026-10-05'`.
  - `marcasEixo` por faixa de intervalo.
- **`formatacao.test.ts`**: `4,50%`, `R$ 5,1234`, `R$ 123.456 mi`, nulo e `NaN` viram `–`.
- **`agregacao.test.ts`**:
  - `var` composto: 0,5 três vezes dá 1,5075.
  - `parcial` quando há menos de 3 meses no T ou menos de 12 no A.
  - `acum` pega o último valor.
  - `nivel` por média ou por fim de período.
  - `fluxo`: a soma dos 3 meses de FBCF mensal dá o valor trimestral.
  - Granularidade `D` sobre série mensal continua M; `M` sobre `T` continua T.
  - `filtrarPontos` com `ini` no meio do mês inclui o mês.
- **`estatisticas.test.ts`**:
  - `variacao` em p.p. para `%` e em % para os demais; base zero devolve nulo.
  - Mínimo, máximo, média e anterior corretos.
  - `acumuladoPeriodo` só para `var`.
  - `classeVariacao` com `bomQuandoSobe` true, false e null.
- **`filtros.test.ts`**:
  - Tudo vazio dá os padrões.
  - Valor inválido em cada campo cai no padrão.
  - Os atalhos de período a partir de um "hoje" fixo.
  - `ini`/`fim` sobrescrevem o atalho; datas trocadas são invertidas; datas fora da faixa são limitadas; `2024-02-30` é rejeitada.
  - `ind` como string ou como array, código desconhecido descartado, limite de 20.
  - Os códigos com `%` e `$` fazem a ida e volta por `paraQuery` e `URLSearchParams`.
- **`painel.test.ts`**:
  - Agrupamento por unidade na ordem do catálogo.
  - Indicador sem pontos vira card "sem dados" e fica fora dos gráficos.
  - Caso de referência pequeno, com valores conferidos contra o `analise.js` antigo nos mesmos dados.
- **`catalogo.test.ts`**: linha do banco convertida para `Indicador`; frequência fora de D/M/T e cor inválida são rejeitadas.