-- Application-generated schema: information the product itself creates
-- (as opposed to the official source dataset). Uses uuid primary keys since
-- these rows have no natural business key from an upstream system.

-- ---------------------------------------------------------------------------
-- insights
-- ---------------------------------------------------------------------------
create table if not exists insights (
  id            uuid primary key default gen_random_uuid(),
  client_id     text not null references clients (client_id) on delete restrict,
  insight_type  text not null check (insight_type in (
                   'CONCENTRATION_RISK',
                   'LIQUIDITY_GAP',
                   'MANDATE_BREACH',
                   'CREDIT_RISK',
                   'BEHAVIOURAL_SIGNAL',
                   'LIFE_EVENT',
                   'MARKET_EVENT_IMPACT'
                 )),
  severity      text not null check (severity in ('Low', 'Medium', 'High', 'Critical')),
  title         text not null,
  summary       text not null,
  status        text not null default 'OPEN' check (status in (
                   'OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED'
                 )),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_insights_client_id on insights (client_id);
create index if not exists idx_insights_status on insights (status);
create index if not exists idx_insights_insight_type on insights (insight_type);

-- ---------------------------------------------------------------------------
-- insight_evidence
-- Every generated insight must be explainable back to source data. Deleting
-- an insight deletes its evidence (the evidence has no meaning on its own);
-- evidence never deletes the source record it points to (source_record_id is
-- a plain text reference, not a foreign key, since it can point at any table).
-- ---------------------------------------------------------------------------
create table if not exists insight_evidence (
  id                uuid primary key default gen_random_uuid(),
  insight_id        uuid not null references insights (id) on delete cascade,
  source_table      text not null,
  source_record_id  text not null,
  evidence_type     text,
  description       text not null,
  created_at        timestamptz not null default now()
);

create index if not exists idx_insight_evidence_insight_id on insight_evidence (insight_id);

-- ---------------------------------------------------------------------------
-- recommendations
-- insight_id is nullable + ON DELETE SET NULL: a recommendation must survive
-- even if the insight that originally triggered it is later removed, because
-- recommendation_events is the audit trail for FOLLOW THROUGH.
-- ---------------------------------------------------------------------------
create table if not exists recommendations (
  id              uuid primary key default gen_random_uuid(),
  client_id       text not null references clients (client_id) on delete restrict,
  insight_id      uuid references insights (id) on delete set null,
  title           text not null,
  recommendation  text not null,
  rationale       text,
  priority        text not null default 'Medium' check (priority in ('Low', 'Medium', 'High', 'Urgent')),
  status          text not null default 'DRAFT' check (status in (
                     'DRAFT', 'READY_FOR_REVIEW', 'APPROVED', 'SENT',
                     'ACCEPTED', 'REJECTED', 'DEFERRED', 'CLOSED'
                   )),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_recommendations_client_id on recommendations (client_id);
create index if not exists idx_recommendations_insight_id on recommendations (insight_id);
create index if not exists idx_recommendations_status on recommendations (status);

-- ---------------------------------------------------------------------------
-- recommendation_events
-- The advice lifecycle / audit trail. Cascades with its parent recommendation
-- since an event has no independent meaning.
-- ---------------------------------------------------------------------------
create table if not exists recommendation_events (
  id                  uuid primary key default gen_random_uuid(),
  recommendation_id   uuid not null references recommendations (id) on delete cascade,
  event_type          text not null check (event_type in (
                         'CREATED', 'RM_REVIEWED', 'APPROVED', 'SENT',
                         'CLIENT_ACCEPTED', 'CLIENT_REJECTED', 'CLIENT_DEFERRED',
                         'RESURFACED', 'COMPLETED', 'NOTE'
                       )),
  notes               text,
  created_at          timestamptz not null default now(),
  created_by          text
);

create index if not exists idx_recommendation_events_recommendation_id on recommendation_events (recommendation_id);
create index if not exists idx_recommendation_events_event_type on recommendation_events (event_type);

-- Keep recommendations.updated_at current whenever the row changes.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_recommendations_updated_at on recommendations;
create trigger trg_recommendations_updated_at
  before update on recommendations
  for each row execute function set_updated_at();

drop trigger if exists trg_insights_updated_at on insights;
create trigger trg_insights_updated_at
  before update on insights
  for each row execute function set_updated_at();

drop trigger if exists trg_rm_notes_updated_at on rm_notes;
create trigger trg_rm_notes_updated_at
  before update on rm_notes
  for each row execute function set_updated_at();

drop trigger if exists trg_clients_updated_at on clients;
create trigger trg_clients_updated_at
  before update on clients
  for each row execute function set_updated_at();

drop trigger if exists trg_portfolios_updated_at on portfolios;
create trigger trg_portfolios_updated_at
  before update on portfolios
  for each row execute function set_updated_at();
