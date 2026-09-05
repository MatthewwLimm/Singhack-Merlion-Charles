// Demo scenario layer — curation ON TOP of getClient360(), never a
// replacement for it. See supabase/migrations/20260101000005_demo_scenarios.sql
// for the schema and scripts/seed-scenarios.ts for what's seeded.
//
//   getClient360(clientId)          <- always real Supabase data, unchanged
//         |
//   applyScenarioToClient360(...)   <- adds narrative + hypothetical events,
//         |                            never mutates the real data it received
//   ScenarioClient360               <- what the UI renders in demo mode
import { getSupabaseClient } from "@/lib/supabase/server"
import { getClient360, type Client360 } from "./client360"
import type { DemoScenarioRow, ScenarioEventRow } from "@/lib/supabase/types"

export interface ScenarioNarrative {
  initial_state?: string
  reveal?: string
  why_it_matters?: string
  action?: string
  personalisation?: string
  follow_up?: string
}

/** DemoScenarioRow with `narrative` narrowed from the raw jsonb to its known shape. */
export type DemoScenario = Omit<DemoScenarioRow, "narrative"> & { narrative: ScenarioNarrative }
export type ScenarioEvent = ScenarioEventRow

export async function getDemoScenarios(): Promise<DemoScenario[]> {
  const { data, error } = await getSupabaseClient()
    .from("demo_scenarios")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true })

  if (error) throw new Error(`getDemoScenarios: ${error.message}`)
  return data as unknown as DemoScenario[]
}

export async function getDemoScenario(scenarioCode: string): Promise<DemoScenario | null> {
  const { data, error } = await getSupabaseClient()
    .from("demo_scenarios")
    .select("*")
    .eq("scenario_code", scenarioCode)
    .maybeSingle()

  if (error) throw new Error(`getDemoScenario(${scenarioCode}): ${error.message}`)
  return data as unknown as DemoScenario | null
}

export async function getScenarioEvents(scenarioId: string): Promise<ScenarioEvent[]> {
  const { data, error } = await getSupabaseClient()
    .from("scenario_events")
    .select("*")
    .eq("scenario_id", scenarioId)
    .order("event_date", { ascending: true })

  if (error) throw new Error(`getScenarioEvents(${scenarioId}): ${error.message}`)
  return data as unknown as ScenarioEvent[]
}

export interface ScenarioClient360 {
  scenario: DemoScenario
  hypotheticalEvents: ScenarioEvent[]
  client360: Client360
}

/**
 * Composes a scenario onto the real Client 360 data for its client. Never
 * mutates `client360` — a scenario is metadata (narrative + optional
 * clearly-flagged hypothetical events) laid over unmodified real data, so
 * viewing the same client without `?scenario=` shows exactly the same
 * underlying facts.
 */
export async function getScenarioClient360(scenarioCode: string): Promise<ScenarioClient360 | null> {
  const scenario = await getDemoScenario(scenarioCode)
  if (!scenario || !scenario.client_id) return null

  const [client360, hypotheticalEvents] = await Promise.all([
    getClient360(scenario.client_id),
    getScenarioEvents(scenario.id),
  ])
  if (!client360) return null

  return { scenario, hypotheticalEvents, client360 }
}

/**
 * Undoes only what a scenario staged for itself: any recommendation whose
 * `scenario_id` points here loses its `is_demo`-flagged events, and any
 * fully-synthetic (`is_demo = true`) recommendation is removed outright.
 * Real recommendations that merely carry a `scenario_id` tag are never
 * deleted, only cleaned of their staged events.
 *
 * Enforced at the DB level too (see the *_delete_demo_only RLS policies):
 * even a bug here cannot delete a non-demo row. Never touches clients,
 * portfolios, holdings, real rm_notes, or any other source-data table.
 *
 * ADVICE_RESURFACING is a special case: its real recommendation was staged
 * into a DEFERRED state with two synthetic historical events so the demo
 * has something to resurface. Reset re-stages that same starting state so
 * the walkthrough can be replayed.
 */
export async function resetScenario(scenarioCode: string): Promise<{ deletedEvents: number; deletedRecommendations: number }> {
  const scenario = await getDemoScenario(scenarioCode)
  if (!scenario) throw new Error(`resetScenario: unknown scenario "${scenarioCode}"`)

  const supabase = getSupabaseClient()

  const { data: scenarioRecs, error: findError } = await supabase
    .from("recommendations")
    .select("id, is_demo")
    .eq("scenario_id", scenario.id)
  if (findError) throw new Error(`resetScenario find: ${findError.message}`)

  const recIds = (scenarioRecs as { id: string; is_demo: boolean }[]).map((r) => r.id)
  const demoRecIds = (scenarioRecs as { id: string; is_demo: boolean }[]).filter((r) => r.is_demo).map((r) => r.id)

  let deletedEvents = 0
  if (recIds.length > 0) {
    const { data: deletedEventRows, error: eventsError } = await supabase
      .from("recommendation_events")
      .delete()
      .in("recommendation_id", recIds)
      .eq("is_demo", true)
      .select("id")
    if (eventsError) throw new Error(`resetScenario events: ${eventsError.message}`)
    deletedEvents = (deletedEventRows as { id: string }[]).length
  }

  let deletedRecommendations = 0
  if (demoRecIds.length > 0) {
    const { data: deletedRecRows, error: recError } = await supabase
      .from("recommendations")
      .delete()
      .in("id", demoRecIds)
      .eq("is_demo", true)
      .select("id")
    if (recError) throw new Error(`resetScenario recommendations: ${recError.message}`)
    deletedRecommendations = (deletedRecRows as { id: string }[]).length
  }

  if (scenario.scenario_type === "ADVICE_RESURFACING") {
    const { data: realRec } = await supabase
      .from("recommendations")
      .select("id")
      .eq("scenario_id", scenario.id)
      .eq("is_demo", false)
      .maybeSingle()

    if (realRec) {
      const recId = (realRec as { id: string }).id
      // created_at intentionally not backdated — see scripts/seed-scenarios.ts
      // for why (the historical Oct 2024 / Jun 2025 framing lives in the
      // note text so the timeline stays in true chronological order).
      await supabase
        .from("recommendation_events")
        .insert([
          {
            recommendation_id: recId,
            event_type: "CLIENT_DEFERRED",
            notes: "Client originally agreed this allocation in principle in October 2024 but did not execute — wanted to wait for a better entry point. (Derived from RM note N-013.)",
            created_by: "Priscilla Ong",
            is_demo: true,
          },
          {
            recommendation_id: recId,
            event_type: "CLIENT_DEFERRED",
            notes: "Second attempt in June 2025 — client re-agreed in principle, still waiting for a better entry point. (Derived from RM note N-013.)",
            created_by: "Priscilla Ong",
            is_demo: true,
          },
        ])
      await supabase.from("recommendations").update({ status: "DEFERRED" }).eq("id", recId)
    }
  }

  return { deletedEvents, deletedRecommendations }
}
