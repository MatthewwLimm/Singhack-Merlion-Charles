-- Row Level Security.
--
-- This prototype has no authentication yet (single shared RM view, matching
-- the source dataset which has exactly one RM). Every table has RLS enabled,
-- but the policies below are intentionally permissive placeholders:
--
--  * Source/reference tables (the official dataset) are SELECT-only for the
--    anon/authenticated roles. The app never writes to them; the seed script
--    connects directly as the table owner via DATABASE_URL, which bypasses
--    RLS entirely, so no write policy is needed or granted there.
--  * Application tables (rm_notes, insights, recommendations,
--    recommendation_events) plus UPDATE on clients get open
--    SELECT/INSERT/UPDATE/DELETE policies for anon, because the browser
--    client only ever holds the anon/publishable key.
--
-- TODO(auth): once RM login exists, replace every `using (true)` /
-- `with check (true)` below with policies scoped to `auth.uid()` /
-- `rm_id = auth.jwt() ->> 'rm_id'` (or similar), and stop granting write
-- access to anon entirely.

-- ---------------------------------------------------------------------------
-- Source/reference tables: read-only for the app.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'clients', 'mandates', 'mandate_allocations', 'instruments', 'instrument_prices',
    'portfolios', 'portfolio_snapshots', 'holdings', 'transactions',
    'credit_facilities', 'credit_facility_snapshots', 'commitments',
    'planned_cash_needs', 'market_context', 'event_log'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists %I on %I;', t || '_select_all', t);
    execute format(
      'create policy %I on %I for select to anon, authenticated using (true);',
      t || '_select_all', t
    );
  end loop;
end $$;

-- clients additionally allows UPDATE (profile edits) and INSERT (admin/demo
-- client creation) from the app, but not DELETE — see services/clients.ts.
drop policy if exists clients_insert_dev on clients;
create policy clients_insert_dev on clients
  for insert to anon, authenticated with check (true);

drop policy if exists clients_update_dev on clients;
create policy clients_update_dev on clients
  for update to anon, authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- rm_notes: full CRUD from the app (dev-open policy).
-- ---------------------------------------------------------------------------
alter table rm_notes enable row level security;

drop policy if exists rm_notes_select_all on rm_notes;
create policy rm_notes_select_all on rm_notes
  for select to anon, authenticated using (true);

drop policy if exists rm_notes_insert_dev on rm_notes;
create policy rm_notes_insert_dev on rm_notes
  for insert to anon, authenticated with check (true);

drop policy if exists rm_notes_update_dev on rm_notes;
create policy rm_notes_update_dev on rm_notes
  for update to anon, authenticated using (true) with check (true);

drop policy if exists rm_notes_delete_dev on rm_notes;
create policy rm_notes_delete_dev on rm_notes
  for delete to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- insights / insight_evidence: full CRUD from the app.
-- ---------------------------------------------------------------------------
alter table insights enable row level security;

drop policy if exists insights_select_all on insights;
create policy insights_select_all on insights
  for select to anon, authenticated using (true);

drop policy if exists insights_insert_dev on insights;
create policy insights_insert_dev on insights
  for insert to anon, authenticated with check (true);

drop policy if exists insights_update_dev on insights;
create policy insights_update_dev on insights
  for update to anon, authenticated using (true) with check (true);

drop policy if exists insights_delete_dev on insights;
create policy insights_delete_dev on insights
  for delete to anon, authenticated using (true);

alter table insight_evidence enable row level security;

drop policy if exists insight_evidence_select_all on insight_evidence;
create policy insight_evidence_select_all on insight_evidence
  for select to anon, authenticated using (true);

drop policy if exists insight_evidence_insert_dev on insight_evidence;
create policy insight_evidence_insert_dev on insight_evidence
  for insert to anon, authenticated with check (true);

drop policy if exists insight_evidence_delete_dev on insight_evidence;
create policy insight_evidence_delete_dev on insight_evidence
  for delete to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- recommendations / recommendation_events: full CRUD from the app.
-- ---------------------------------------------------------------------------
alter table recommendations enable row level security;

drop policy if exists recommendations_select_all on recommendations;
create policy recommendations_select_all on recommendations
  for select to anon, authenticated using (true);

drop policy if exists recommendations_insert_dev on recommendations;
create policy recommendations_insert_dev on recommendations
  for insert to anon, authenticated with check (true);

drop policy if exists recommendations_update_dev on recommendations;
create policy recommendations_update_dev on recommendations
  for update to anon, authenticated using (true) with check (true);

alter table recommendation_events enable row level security;

drop policy if exists recommendation_events_select_all on recommendation_events;
create policy recommendation_events_select_all on recommendation_events
  for select to anon, authenticated using (true);

drop policy if exists recommendation_events_insert_dev on recommendation_events;
create policy recommendation_events_insert_dev on recommendation_events
  for insert to anon, authenticated with check (true);
