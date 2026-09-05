-- Source/reference schema: mirrors the official synthetic dataset in /data.
-- Business keys from the source files (CL-0001, PF-0001, ...) are preserved as
-- primary keys rather than replaced with surrogate UUIDs, per product requirements.
--
-- Wide "one column per snapshot date" fields in the source CSVs (portfolios.aum_*,
-- instruments.price_*, credit_facilities.drawn_*/collateral_market_value_*/...)
-- are normalised into *_snapshots / *_prices tables. holdings.csv and
-- market_context.csv are already long-form (one row per entity per snapshot_date)
-- and are loaded as-is.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------------
create table if not exists clients (
  client_id               text primary key,
  client_name             text not null,
  age                     integer,
  gender                  text,
  nationality             text,
  country_of_residence    text,
  tax_domicile            text,
  booking_centre          text,
  rm_id                   text,
  rm_name                 text,
  rm_desk                 text,
  base_currency           text,
  wealth_band             text,
  total_aum_usd           numeric,
  life_stage              text,
  source_of_wealth        text,
  risk_profile            text,
  risk_tolerance_score    integer,
  investment_horizon_years integer,
  liquidity_needs         text,
  objectives              text,
  client_since            date,
  kyc_review_due          date,
  pep_status               boolean,
  reporting_language      text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists idx_clients_rm_id on clients (rm_id);

-- ---------------------------------------------------------------------------
-- mandates / mandate_allocations
-- ---------------------------------------------------------------------------
create table if not exists mandates (
  mandate_code  text primary key,
  mandate_name  text not null,
  mandate_notes text
);

create table if not exists mandate_allocations (
  id                       bigint generated always as identity primary key,
  mandate_code             text not null references mandates (mandate_code) on delete restrict,
  asset_class              text not null,
  min_pct                  numeric not null,
  target_pct               numeric not null,
  max_pct                  numeric not null,
  max_single_position_pct  numeric,
  unique (mandate_code, asset_class)
);

create index if not exists idx_mandate_allocations_mandate_code on mandate_allocations (mandate_code);

-- ---------------------------------------------------------------------------
-- instruments / instrument_prices
-- ---------------------------------------------------------------------------
create table if not exists instruments (
  instrument_id               text primary key,
  instrument_name             text not null,
  asset_class                 text,
  sub_asset_class              text,
  sector                      text,
  region                      text,
  currency                    text,
  liquidity_tier              text,
  underlying_reference        text,
  sustainability_excluded     boolean,
  concentration_limit_applies boolean
);

create table if not exists instrument_prices (
  id             bigint generated always as identity primary key,
  instrument_id  text not null references instruments (instrument_id) on delete restrict,
  snapshot_date  date not null,
  price          numeric not null,
  unique (instrument_id, snapshot_date)
);

create index if not exists idx_instrument_prices_instrument_id on instrument_prices (instrument_id);
create index if not exists idx_instrument_prices_snapshot_date on instrument_prices (snapshot_date);

-- ---------------------------------------------------------------------------
-- portfolios / portfolio_snapshots
-- ---------------------------------------------------------------------------
create table if not exists portfolios (
  portfolio_id     text primary key,
  client_id        text not null references clients (client_id) on delete restrict,
  portfolio_name   text not null,
  mandate_code     text references mandates (mandate_code) on delete restrict,
  service_model    text,
  base_currency    text,
  inception_date   date,
  benchmark        text,
  aum_usd_current  numeric,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_portfolios_client_id on portfolios (client_id);
create index if not exists idx_portfolios_mandate_code on portfolios (mandate_code);

create table if not exists portfolio_snapshots (
  portfolio_id   text not null references portfolios (portfolio_id) on delete restrict,
  snapshot_date  date not null,
  aum            numeric not null,
  primary key (portfolio_id, snapshot_date)
);

create index if not exists idx_portfolio_snapshots_snapshot_date on portfolio_snapshots (snapshot_date);

-- ---------------------------------------------------------------------------
-- holdings (already a per-snapshot fact table in the source)
-- ---------------------------------------------------------------------------
create table if not exists holdings (
  id                  bigint generated always as identity primary key,
  snapshot_date       date not null,
  portfolio_id        text not null references portfolios (portfolio_id) on delete restrict,
  client_id           text not null references clients (client_id) on delete restrict,
  instrument_id       text not null references instruments (instrument_id) on delete restrict,
  quantity            numeric not null,
  price_local         numeric not null,
  market_value_local  numeric not null,
  portfolio_ccy       text not null,
  market_value_base   numeric not null,
  market_value_usd    numeric not null,
  weight_pct          numeric not null,
  avg_cost_local      numeric,
  cost_basis_base     numeric,
  unrealised_pnl_base numeric,
  unrealised_pnl_pct  numeric,
  lending_value_base  numeric,
  advance_rate_pct    numeric,
  valuation_date      date,
  acquired_date       date,
  unique (portfolio_id, instrument_id, snapshot_date)
);

create index if not exists idx_holdings_portfolio_id on holdings (portfolio_id);
create index if not exists idx_holdings_client_id on holdings (client_id);
create index if not exists idx_holdings_instrument_id on holdings (instrument_id);
create index if not exists idx_holdings_snapshot_date on holdings (snapshot_date);

-- ---------------------------------------------------------------------------
-- transactions
-- ---------------------------------------------------------------------------
create table if not exists transactions (
  transaction_id    text primary key,
  trade_date        date not null,
  settlement_date   date,
  portfolio_id      text not null references portfolios (portfolio_id) on delete restrict,
  client_id         text not null references clients (client_id) on delete restrict,
  transaction_type  text not null,
  instrument_id     text references instruments (instrument_id) on delete restrict,
  quantity          numeric,
  price_local       numeric,
  currency          text,
  amount            numeric,
  narrative         text
);

create index if not exists idx_transactions_portfolio_id on transactions (portfolio_id);
create index if not exists idx_transactions_client_id on transactions (client_id);
create index if not exists idx_transactions_instrument_id on transactions (instrument_id);
create index if not exists idx_transactions_trade_date on transactions (trade_date);

-- ---------------------------------------------------------------------------
-- credit_facilities / credit_facility_snapshots
-- ---------------------------------------------------------------------------
create table if not exists credit_facilities (
  facility_id               text primary key,
  client_id                 text not null references clients (client_id) on delete restrict,
  collateral_portfolio_id   text not null references portfolios (portfolio_id) on delete restrict,
  facility_type             text,
  facility_ccy              text,
  credit_limit              numeric,
  interest_rate_pct         numeric,
  margin_call_ltv_pct       numeric,
  utilisation_pct_current   numeric
);

create index if not exists idx_credit_facilities_client_id on credit_facilities (client_id);
create index if not exists idx_credit_facilities_collateral_portfolio_id on credit_facilities (collateral_portfolio_id);

create table if not exists credit_facility_snapshots (
  facility_id               text not null references credit_facilities (facility_id) on delete restrict,
  snapshot_date             date not null,
  drawn                     numeric,
  collateral_market_value   numeric,
  lending_value             numeric,
  ltv_pct                   numeric,
  headroom                  numeric,
  primary key (facility_id, snapshot_date)
);

create index if not exists idx_credit_facility_snapshots_snapshot_date on credit_facility_snapshots (snapshot_date);

-- ---------------------------------------------------------------------------
-- commitments
-- ---------------------------------------------------------------------------
create table if not exists commitments (
  commitment_id         text primary key,
  client_id             text not null references clients (client_id) on delete restrict,
  portfolio_id          text references portfolios (portfolio_id) on delete restrict,
  fund_name             text,
  currency              text,
  committed             numeric,
  called_to_date        numeric,
  uncalled              numeric,
  expected_call_window  text
);

create index if not exists idx_commitments_client_id on commitments (client_id);
create index if not exists idx_commitments_portfolio_id on commitments (portfolio_id);

-- ---------------------------------------------------------------------------
-- planned_cash_needs
-- ---------------------------------------------------------------------------
create table if not exists planned_cash_needs (
  need_id      text primary key,
  client_id    text not null references clients (client_id) on delete restrict,
  description  text,
  currency     text,
  amount       numeric,
  due_from     date,
  due_to       date,
  recurrence   text,
  certainty    text
);

create index if not exists idx_planned_cash_needs_client_id on planned_cash_needs (client_id);
create index if not exists idx_planned_cash_needs_due_from on planned_cash_needs (due_from);

-- ---------------------------------------------------------------------------
-- market_context (already long-form)
-- ---------------------------------------------------------------------------
create table if not exists market_context (
  id             bigint generated always as identity primary key,
  snapshot_date  date not null,
  series_id      text not null,
  series_name    text,
  category       text,
  unit           text,
  value          numeric,
  snapshot_label text,
  unique (series_id, snapshot_date)
);

create index if not exists idx_market_context_snapshot_date on market_context (snapshot_date);
create index if not exists idx_market_context_series_id on market_context (series_id);

-- ---------------------------------------------------------------------------
-- event_log (no natural key in source -> surrogate uuid)
-- ---------------------------------------------------------------------------
create table if not exists event_log (
  id                    uuid primary key default gen_random_uuid(),
  event_date            date not null,
  event_type            text,
  region                text,
  description           text not null,
  primary_transmission  text,
  severity              text,
  -- no natural key in the source file; (event_date, description) is unique
  -- in practice and gives the seed script something to upsert against.
  unique (event_date, description)
);

create index if not exists idx_event_log_event_date on event_log (event_date);
create index if not exists idx_event_log_severity on event_log (severity);

-- ---------------------------------------------------------------------------
-- rm_notes
-- ---------------------------------------------------------------------------
create table if not exists rm_notes (
  note_id    text primary key,
  client_id  text not null references clients (client_id) on delete restrict,
  note_date  date not null,
  rm_id      text,
  rm_name    text,
  channel    text,
  note       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_rm_notes_client_id on rm_notes (client_id);
create index if not exists idx_rm_notes_note_date on rm_notes (note_date);
