-- RLS policies restrict *rows*; Postgres still requires a table-level GRANT
-- before a role can run the operation at all. Supabase's dashboard-driven
-- flows apply these automatically; this migration applies them explicitly
-- since these tables were created via a direct SQL migration instead.

grant usage on schema public to anon, authenticated;

-- Source/reference tables: read-only for the app.
grant select on
  clients, mandates, mandate_allocations, instruments, instrument_prices,
  portfolios, portfolio_snapshots, holdings, transactions,
  credit_facilities, credit_facility_snapshots, commitments,
  planned_cash_needs, market_context, event_log
to anon, authenticated;

-- clients: additionally updatable/insertable (see clients_update_dev /
-- clients_insert_dev policies), never deletable from the app.
grant insert, update on clients to anon, authenticated;

-- Application tables: full CRUD surface matches the RLS policies in
-- 20260101000003_rls_policies.sql.
grant select, insert, update, delete on rm_notes to anon, authenticated;
grant select, insert, update, delete on insights to anon, authenticated;
grant select, insert, delete on insight_evidence to anon, authenticated;
grant select, insert, update on recommendations to anon, authenticated;
grant select, insert on recommendation_events to anon, authenticated;

-- Every application table's primary key is a generated uuid; sequences
-- backing bigint identity columns (holdings, instrument_prices, ...) need no
-- grant since inserts go through the table, not the sequence, directly.
