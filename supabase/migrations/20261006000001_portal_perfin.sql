-- Portal Perfin: schema inicial
-- Todas as tabelas com RLS ligado. Escrita só pelo servidor/coletor (chave secreta, que ignora RLS).

-- ============================================================ tabelas

create table public.indicadores (
  codigo          text primary key,
  nome            text not null,
  nome_curto      text not null,
  unidade         text not null,
  frequencia      char(1) not null check (frequencia in ('D', 'M', 'T')),
  tipo            text not null check (tipo in ('var', 'acum', 'nivel', 'fluxo')),
  categoria       text not null,
  origem          text not null,
  fonte           text not null,
  casas           smallint not null default 2 check (casas between 0 and 6),
  cor             text not null check (cor ~ '^#[0-9a-f]{6}$'),
  padrao          boolean not null default false,
  bom_quando_sobe boolean,
  ordem           smallint not null default 0
);

create table public.indicador_valores (
  indicador_codigo text not null references public.indicadores (codigo) on delete restrict,
  data             date not null,
  valor            numeric not null,
  atualizado_em    timestamptz not null default now(),
  primary key (indicador_codigo, data)
);

create table public.coletas (
  id            bigint generated always as identity primary key,
  iniciada_em   timestamptz not null default now(),
  finalizada_em timestamptz,
  status        text not null default 'executando' check (status in ('executando', 'sucesso', 'erro')),
  linhas        integer,
  mensagem      text
);

create table public.administradores (
  email           text primary key check (email = lower(email)),
  sincronizado_em timestamptz not null default now()
);

create table public.google_credenciais (
  user_id               uuid primary key references auth.users (id) on delete cascade,
  refresh_token_cifrado text not null,
  scopes                text,
  pasta_drive_id        text,
  atualizado_em         timestamptz not null default now()
);

create table public.relatorios (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  mes_referencia date not null check (extract(day from mes_referencia) = 1),
  planilha_id    text,
  planilha_url   text check (planilha_url is null or planilha_url ~ '^https://docs\.google\.com/spreadsheets/'),
  rascunho_id    text,
  criado_em      timestamptz not null default now()
);
create index relatorios_user_mes_idx on public.relatorios (user_id, mes_referencia desc);

-- ============================================================ funções

-- Admin = mesma regra do app (usuario.ts), conferida em auth.users e não só no claim do JWT:
-- nunca anônimo, e-mail confirmado, identidade Google verificada com o MESMO e-mail
-- e esse e-mail presente na tabela administradores.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
     and exists (
       select 1
         from auth.users u
         join public.administradores a on a.email = lower(u.email)
        where u.id = auth.uid()
          and u.email_confirmed_at is not null
          and exists (
            select 1 from auth.identities i
             where i.user_id = u.id
               and i.provider = 'google'
               and i.identity_data ->> 'email_verified' = 'true'
               and lower(trim(i.identity_data ->> 'email')) = lower(u.email)
          )
     );
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Substitui a lista de admins pela recebida (atômico). Lista vazia aborta: nunca apaga todos.
-- Quem saiu da lista perde também a credencial Google guardada.
create or replace function public.sincronizar_administradores(p_emails text[]) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_emails text[];
begin
  select coalesce(array_agg(distinct lower(trim(e))), '{}')
    into v_emails
    from unnest(coalesce(p_emails, '{}')) as e
   where trim(e) <> '';

  if cardinality(v_emails) = 0 then
    raise exception 'lista de administradores vazia';
  end if;

  delete from public.administradores where email <> all (v_emails);
  delete from public.google_credenciais g
   using auth.users u
   where g.user_id = u.id
     and (u.email is null or lower(u.email) <> all (v_emails));
  insert into public.administradores (email, sincronizado_em)
    select unnest(v_emails), now()
  on conflict (email) do update set sincronizado_em = excluded.sincronizado_em;
end;
$$;
revoke execute on function public.sincronizar_administradores(text[]) from public, anon, authenticated;
grant execute on function public.sincronizar_administradores(text[]) to service_role;

-- ============================================================ RLS + grants

alter table public.indicadores        enable row level security;
alter table public.indicador_valores  enable row level security;
alter table public.coletas            enable row level security;
alter table public.administradores    enable row level security;
alter table public.google_credenciais enable row level security;
alter table public.relatorios         enable row level security;

revoke all on public.indicadores, public.indicador_valores, public.coletas,
              public.administradores, public.google_credenciais, public.relatorios
  from anon, authenticated;

grant select on public.indicadores, public.indicador_valores, public.coletas, public.administradores
  to authenticated;
-- relatorios: id, user_id e criado_em ficam só com os defaults (gen_random_uuid(), auth.uid(), now()).
grant select on public.relatorios to authenticated;
grant insert (mes_referencia, planilha_id, planilha_url, rascunho_id) on public.relatorios to authenticated;
grant update (planilha_id, planilha_url, rascunho_id) on public.relatorios to authenticated;

grant all on public.indicadores, public.indicador_valores, public.coletas,
             public.administradores, public.google_credenciais, public.relatorios
  to service_role;

-- Objetos futuros não ficam expostos por padrão: cada fase concede grants e liga RLS explicitamente.
-- (Não mexe nos padrões de service_role.)
alter default privileges for role postgres in schema public revoke all on tables    from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated;
-- EXECUTE para PUBLIC é padrão global do Postgres: um revoke por schema não o remove.
alter default privileges for role postgres revoke execute on functions from public;

create policy "admins leem indicadores" on public.indicadores
  for select to authenticated using ((select public.is_admin()));

create policy "admins leem valores" on public.indicador_valores
  for select to authenticated using ((select public.is_admin()));

create policy "admins leem coletas" on public.coletas
  for select to authenticated using ((select public.is_admin()));

create policy "cada um le a propria linha" on public.administradores
  for select to authenticated
  using ((select public.is_admin()) and email = lower((select auth.jwt()) ->> 'email'));

-- google_credenciais: sem policy de propósito (só o servidor, com a chave secreta).

create policy "dono le seus relatorios" on public.relatorios
  for select to authenticated
  using (user_id = (select auth.uid()) and (select public.is_admin()));

create policy "dono cria seus relatorios" on public.relatorios
  for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.is_admin()));

create policy "dono atualiza seus relatorios" on public.relatorios
  for update to authenticated
  using (user_id = (select auth.uid()) and (select public.is_admin()))
  with check (user_id = (select auth.uid()) and (select public.is_admin()));

-- ============================================================ seed do catálogo (porta de catalogo.js)

insert into public.indicadores
  (codigo, nome, nome_curto, unidade, frequencia, tipo, categoria, origem, fonte, casas, cor, padrao, bom_quando_sobe, ordem)
values
  ('IPCA_acum_12m_%', 'IPCA – acumulado em 12 meses', 'IPCA 12m', '%', 'M', 'acum', 'Inflação', 'BCB/SGS',
   'BCB/SGS série 433 (IBGE) · acumulado calculado', 2, '#e5484d', true, false, 1),
  ('IPCA_var_mensal_%', 'IPCA – variação mensal', 'IPCA mensal', '%', 'M', 'var', 'Inflação', 'BCB/SGS',
   'BCB/SGS série 433 (IBGE)', 2, '#f5a3a5', false, false, 2),
  ('IGPM_acum_12m_%', 'IGP-M – acumulado em 12 meses', 'IGP-M 12m', '%', 'M', 'acum', 'Inflação', 'BCB/SGS',
   'BCB/SGS série 189 (FGV) · acumulado calculado', 2, '#f59e0b', true, false, 3),
  ('IGPM_var_mensal_%', 'IGP-M – variação mensal', 'IGP-M mensal', '%', 'M', 'var', 'Inflação', 'BCB/SGS',
   'BCB/SGS série 189 (FGV)', 2, '#fcd27b', false, false, 4),
  ('BRL_USD_PTAX_venda', 'Dólar × Real – PTAX venda', 'Dólar PTAX', 'R$/US$', 'D', 'nivel', 'Câmbio', 'BCB/SGS',
   'BCB/SGS série 1', 4, '#12a594', true, null, 5),
  ('FBCF_trimestre_R$_mi', 'FBCF – investimento trimestral', 'FBCF trimestral', 'R$ mi', 'T', 'fluxo', 'Investimento', 'IBGE/SIDRA',
   'IBGE/SIDRA tabela 1846 (Contas Nacionais Trimestrais)', 0, '#6e56cf', true, true, 6),
  ('FBCF_mensal_aprox_R$_mi', 'FBCF – mensal aproximada (trimestre ÷ 3)', 'FBCF mensal (aprox.)', 'R$ mi', 'M', 'fluxo', 'Investimento', 'IBGE/SIDRA',
   'IBGE/SIDRA tabela 1846 · aproximação', 0, '#b4a5f0', false, true, 7)
on conflict (codigo) do update set
  nome = excluded.nome, nome_curto = excluded.nome_curto, unidade = excluded.unidade,
  frequencia = excluded.frequencia, tipo = excluded.tipo, categoria = excluded.categoria,
  origem = excluded.origem, fonte = excluded.fonte, casas = excluded.casas, cor = excluded.cor,
  padrao = excluded.padrao, bom_quando_sobe = excluded.bom_quando_sobe, ordem = excluded.ordem;
