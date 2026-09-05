-- RLS + grants for the scenario layer.
--
-- demo_scenarios / scenario_overrides / scenario_events are curated
-- configuration: seeded via scripts/seed-scenarios.ts (direct DB connection,
-- bypasses RLS), read-only from the app — the same treatment as the source
-- tables, since nothing in the UI creates a new scenario at runtime.
--
-- The reset-demo Server Action needs to delete scenario-seeded
-- recommendations/events without ever being able to touch a real one. Rather
-- than trust the application code alone, the DELETE policies below enforce
-- `is_demo = true` at the database level, so even a bug in the reset action
-- can't delete a genuine RM-created record.

do $$
declare
  t text;
begin
  foreach t in array array['demo_scenarios', 'scenario_overrides', 'scenario_events']
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists %I on %I;', t || '_select_all', t);
    execute format(
      'create policy %I on %I for select to anon, authenticated using (true);',
      t || '_select_all', t
    );
  end loop;
end $$;

grant select on demo_scenarios, scenario_overrides, scenario_events to anon, authenticated;

-- Demo-scoped deletes on the two lifecycle tables, enforced at the DB level.
drop policy if exists recommendations_delete_demo_only on recommendations;
create policy recommendations_delete_demo_only on recommendations
  for delete to anon, authenticated using (is_demo = true);

grant delete on recommendations to anon, authenticated;

drop policy if exists recommendation_events_delete_demo_only on recommendation_events;
create policy recommendation_events_delete_demo_only on recommendation_events
  for delete to anon, authenticated using (is_demo = true);

grant delete on recommendation_events to anon, authenticated;
