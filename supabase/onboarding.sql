-- Post-sale onboarding state machine (docs/onboarding-plano.md).
--
-- One row per plan. The sweep in src/services/onboarding.ts reads every row whose
-- estado <> 'concluido' every ONBOARDING_CRON tick. The "sent at" timestamps double
-- as the retry mechanism: null means "send on the next sweep".
--
-- The unique (seufisio_cliente_id, plano_id) is required by the upsert in
-- registerOnboarding().

create table if not exists public.client_onboarding (
  id                       bigserial primary key,
  seufisio_cliente_id      integer     not null,
  plano_id                 integer     not null,
  estado                   text        not null default 'cadastro_pendente',
  telefone                 text,
  link_cadastro            text,
  link_cadastro_enviado_em timestamptz,
  tentativas_cadastro      integer     not null default 0,
  cadastro_completo_em     timestamptz,
  contrato_cliente_id      integer,
  contrato_termo_id        integer,
  contratos_enviados_em    timestamptz,
  tentativas_contrato      integer     not null default 0,
  contratos_assinados_em   timestamptz,
  ultimo_erro              text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint client_onboarding_estado_check
    check (estado in ('cadastro_pendente', 'contrato_pendente', 'concluido')),
  constraint client_onboarding_cliente_plano_key
    unique (seufisio_cliente_id, plano_id)
);

-- The sweep only ever scans the unfinished rows.
create index if not exists client_onboarding_pendentes_idx
  on public.client_onboarding (estado)
  where estado <> 'concluido';

-- Every WhatsApp attempt, sent or failed. Separate from notification_log, which is
-- specific to class reminders (it carries atendimento_id and class_start).
create table if not exists public.onboarding_log (
  id                  bigserial primary key,
  seufisio_cliente_id integer     not null,
  plano_id            integer,
  tipo                text        not null,
  phone               text,
  status              text        not null,
  provider_response   jsonb,
  created_at          timestamptz not null default now(),
  constraint onboarding_log_tipo_check
    check (tipo in ('cadastro', 'cadastro_reenvio', 'contratos', 'assinatura_reenvio', 'concluido')),
  constraint onboarding_log_status_check
    check (status in ('sent', 'failed'))
);

create index if not exists onboarding_log_cliente_idx
  on public.onboarding_log (seufisio_cliente_id, created_at desc);

-- The proxy connects with the service role, which bypasses RLS. Enabling it with no
-- policies keeps anon/authenticated keys locked out.
alter table public.client_onboarding enable row level security;
alter table public.onboarding_log     enable row level security;
