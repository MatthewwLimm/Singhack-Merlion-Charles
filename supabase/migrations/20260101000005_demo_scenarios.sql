-- Demo scenario layer. Curation and storytelling ON TOP of the real data —
-- never a replacement for it. Nothing in this migration ever modifies a
-- source-data table (clients, portfolios, holdings, ...): a scenario picks
-- out which real client, which real insights/evidence, and which narrative
-- framing to present, plus (rarely) a small amount of clearly-labelled
-- hypothetical material for what-if walkthroughs.
--
-- See services/scenarios.ts for how this is composed onto getClient360().

create table if not exists demo_scenarios (
  id            uuid primary key default gen_random_uuid(),
  scenario_code text not null unique,
  name          text not null,
  description   text not null,
  client_id     text references clients (client_id) on delete restrict,
  scenario_type text not null check (scenario_type in (
                   'HIDDEN_CONCENTRATION',
                   'LIQUIDITY_CRUNCH',
                   'MARGIN_RISK',
                   'BEHAVIOURAL_MISMATCH',
                   'MANDATE_BREACH',
                   'ADVICE_RESURFACING',
                   'MARKET_EVENT_IMPACT'
                 )),
  -- The six-beat presenter walkthrough: initial_state, reveal, why_it_matters,
  -- action, personalisation, follow_up -> each a short string. Stored as one
  -- JSONB column rather than six text columns since it's read as a unit by
  -- the UI and never queried beat-by-beat.
  narrative     jsonb not null default '{}'::jsonb,
  active        boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists idx_demo_scenarios_client_id on demo_scenarios (client_id);
create index if not exists idx_demo_scenarios_active on demo_scenarios (active);

-- ---------------------------------------------------------------------------
-- scenario_overrides: for the rare case a demo needs to assert a value the
-- official data can't currently support. entity_type/entity_id/field_name
-- point at what's being overridden for display purposes; nothing here ever
-- writes back to the source table. Expected to be sparsely used — most
-- scenarios need zero rows here (see the scenario table in the design doc).
-- ---------------------------------------------------------------------------
create table if not exists scenario_overrides (
  id             uuid primary key default gen_random_uuid(),
  scenario_id    uuid not null references demo_scenarios (id) on delete cascade,
  entity_type    text not null,
  entity_id      text not null,
  field_name     text not null,
  override_value text not null,
  reason         text not null,
  created_at     timestamptz not null default now()
);

create index if not exists idx_scenario_overrides_scenario_id on scenario_overrides (scenario_id);

-- ---------------------------------------------------------------------------
-- scenario_events: simulated / hypothetical / future events for what-if
-- walkthroughs. is_hypothetical is always true in practice — this table
-- exists specifically to keep invented events out of the real event_log.
-- ---------------------------------------------------------------------------
create table if not exists scenario_events (
  id                    uuid primary key default gen_random_uuid(),
  scenario_id           uuid not null references demo_scenarios (id) on delete cascade,
  event_type            text not null,
  event_date            date not null,
  description           text not null,
  severity              text,
  transmission_channel  text,
  is_hypothetical       boolean not null default true,
  created_at            timestamptz not null default now()
);

create index if not exists idx_scenario_events_scenario_id on scenario_events (scenario_id);

-- ---------------------------------------------------------------------------
-- recommendations gets two nullable columns rather than a parallel
-- scenario_recommendations table: same CRUD, same lifecycle
-- (recommendation_events), same UI, just tagged. is_demo distinguishes
-- scenario-seeded/staged records from genuine RM-generated ones; a demo
-- reset only ever touches rows where is_demo = true.
-- ---------------------------------------------------------------------------
alter table recommendations
  add column if not exists scenario_id uuid references demo_scenarios (id) on delete set null,
  add column if not exists is_demo boolean not null default false;

create index if not exists idx_recommendations_scenario_id on recommendations (scenario_id);
create index if not exists idx_recommendations_is_demo on recommendations (is_demo);

alter table recommendation_events
  add column if not exists is_demo boolean not null default false;

create index if not exists idx_recommendation_events_is_demo on recommendation_events (is_demo);
