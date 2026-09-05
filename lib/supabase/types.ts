// Row types matching supabase/migrations/*.sql. Hand-written against the
// schema this project defines (no live codegen available in this
// environment — no Supabase CLI/Docker). A `Database` type is assembled at
// the bottom of this file from these Row types so `createClient<Database>`
// gets real Insert/Update typing instead of supabase-js's `never` default.
// If the Supabase CLI becomes available later, `supabase gen types
// typescript` can replace this file outright.

export type Client = {
  client_id: string
  client_name: string
  age: number | null
  gender: string | null
  nationality: string | null
  country_of_residence: string | null
  tax_domicile: string | null
  booking_centre: string | null
  rm_id: string | null
  rm_name: string | null
  rm_desk: string | null
  base_currency: string | null
  wealth_band: string | null
  total_aum_usd: number | null
  life_stage: string | null
  source_of_wealth: string | null
  risk_profile: string | null
  risk_tolerance_score: number | null
  investment_horizon_years: number | null
  liquidity_needs: string | null
  objectives: string | null
  client_since: string | null
  kyc_review_due: string | null
  pep_status: boolean | null
  reporting_language: string | null
  created_at: string
  updated_at: string
}

export type Mandate = {
  mandate_code: string
  mandate_name: string
  mandate_notes: string | null
}

export type MandateAllocation = {
  id: number
  mandate_code: string
  asset_class: string
  min_pct: number
  target_pct: number
  max_pct: number
  max_single_position_pct: number | null
}

export type Instrument = {
  instrument_id: string
  instrument_name: string
  asset_class: string | null
  sub_asset_class: string | null
  sector: string | null
  region: string | null
  currency: string | null
  liquidity_tier: string | null
  underlying_reference: string | null
  sustainability_excluded: boolean | null
  concentration_limit_applies: boolean | null
}

export type InstrumentPrice = {
  id: number
  instrument_id: string
  snapshot_date: string
  price: number
}

export type Portfolio = {
  portfolio_id: string
  client_id: string
  portfolio_name: string
  mandate_code: string | null
  service_model: string | null
  base_currency: string | null
  inception_date: string | null
  benchmark: string | null
  aum_usd_current: number | null
  created_at: string
  updated_at: string
}

export type PortfolioSnapshot = {
  portfolio_id: string
  snapshot_date: string
  aum: number
}

export type Holding = {
  id: number
  snapshot_date: string
  portfolio_id: string
  client_id: string
  instrument_id: string
  quantity: number
  price_local: number
  market_value_local: number
  portfolio_ccy: string
  market_value_base: number
  market_value_usd: number
  weight_pct: number
  avg_cost_local: number | null
  cost_basis_base: number | null
  unrealised_pnl_base: number | null
  unrealised_pnl_pct: number | null
  lending_value_base: number | null
  advance_rate_pct: number | null
  valuation_date: string | null
  acquired_date: string | null
}

/** Holding joined with its instrument's descriptive fields — the common shape the UI wants. */
export type HoldingWithInstrument = Holding & {
  instrument: Instrument
}

export type Transaction = {
  transaction_id: string
  trade_date: string
  settlement_date: string | null
  portfolio_id: string
  client_id: string
  transaction_type: string
  instrument_id: string | null
  quantity: number | null
  price_local: number | null
  currency: string | null
  amount: number | null
  narrative: string | null
}

export type CreditFacility = {
  facility_id: string
  client_id: string
  collateral_portfolio_id: string
  facility_type: string | null
  facility_ccy: string | null
  credit_limit: number | null
  interest_rate_pct: number | null
  margin_call_ltv_pct: number | null
  utilisation_pct_current: number | null
}

export type CreditFacilitySnapshot = {
  facility_id: string
  snapshot_date: string
  drawn: number | null
  collateral_market_value: number | null
  lending_value: number | null
  ltv_pct: number | null
  headroom: number | null
}

export type Commitment = {
  commitment_id: string
  client_id: string
  portfolio_id: string | null
  fund_name: string | null
  currency: string | null
  committed: number | null
  called_to_date: number | null
  uncalled: number | null
  expected_call_window: string | null
}

export type PlannedCashNeed = {
  need_id: string
  client_id: string
  description: string | null
  currency: string | null
  amount: number | null
  due_from: string | null
  due_to: string | null
  recurrence: string | null
  certainty: string | null
}

export type MarketContextRow = {
  id: number
  snapshot_date: string
  series_id: string
  series_name: string | null
  category: string | null
  unit: string | null
  value: number | null
  snapshot_label: string | null
}

export type EventLogRow = {
  id: string
  event_date: string
  event_type: string | null
  region: string | null
  description: string
  primary_transmission: string | null
  severity: string | null
}

export type RmNote = {
  note_id: string
  client_id: string
  note_date: string
  rm_id: string | null
  rm_name: string | null
  channel: string | null
  note: string
  created_at: string
  updated_at: string
}

export type InsightType =
  | "CONCENTRATION_RISK"
  | "LIQUIDITY_GAP"
  | "MANDATE_BREACH"
  | "CREDIT_RISK"
  | "BEHAVIOURAL_SIGNAL"
  | "LIFE_EVENT"
  | "MARKET_EVENT_IMPACT"

export type InsightSeverity = "Low" | "Medium" | "High" | "Critical"
export type InsightStatus = "OPEN" | "IN_REVIEW" | "RESOLVED" | "DISMISSED"

export type Insight = {
  id: string
  client_id: string
  insight_type: InsightType
  severity: InsightSeverity
  title: string
  summary: string
  status: InsightStatus
  created_at: string
  updated_at: string
}

export type InsightEvidence = {
  id: string
  insight_id: string
  source_table: string
  source_record_id: string
  evidence_type: string | null
  description: string
  created_at: string
}

export type RecommendationPriority = "Low" | "Medium" | "High" | "Urgent"
export type RecommendationStatus =
  | "DRAFT"
  | "READY_FOR_REVIEW"
  | "APPROVED"
  | "SENT"
  | "ACCEPTED"
  | "REJECTED"
  | "DEFERRED"
  | "CLOSED"

export type Recommendation = {
  id: string
  client_id: string
  insight_id: string | null
  title: string
  recommendation: string
  rationale: string | null
  priority: RecommendationPriority
  status: RecommendationStatus
  created_at: string
  updated_at: string
  scenario_id: string | null
  is_demo: boolean
}

export type RecommendationEventType =
  | "CREATED"
  | "RM_REVIEWED"
  | "APPROVED"
  | "SENT"
  | "CLIENT_ACCEPTED"
  | "CLIENT_REJECTED"
  | "CLIENT_DEFERRED"
  | "RESURFACED"
  | "COMPLETED"
  | "NOTE"

export type RecommendationEvent = {
  id: string
  recommendation_id: string
  event_type: RecommendationEventType
  notes: string | null
  created_at: string
  created_by: string | null
  is_demo: boolean
}

// ---------------------------------------------------------------------------
// Demo scenario layer (supabase/migrations/20260101000005_demo_scenarios.sql)
// ---------------------------------------------------------------------------
export type ScenarioType =
  | "HIDDEN_CONCENTRATION"
  | "LIQUIDITY_CRUNCH"
  | "MARGIN_RISK"
  | "BEHAVIOURAL_MISMATCH"
  | "MANDATE_BREACH"
  | "ADVICE_RESURFACING"
  | "MARKET_EVENT_IMPACT"

export type DemoScenarioRow = {
  id: string
  scenario_code: string
  name: string
  description: string
  client_id: string | null
  scenario_type: ScenarioType
  narrative: Record<string, unknown>
  active: boolean
  sort_order: number
  created_at: string
}

export type ScenarioOverride = {
  id: string
  scenario_id: string
  entity_type: string
  entity_id: string
  field_name: string
  override_value: string
  reason: string
  created_at: string
}

export type ScenarioEventRow = {
  id: string
  scenario_id: string
  event_type: string
  event_date: string
  description: string
  severity: string | null
  transmission_channel: string | null
  is_hypothetical: boolean
  created_at: string
}

// ---------------------------------------------------------------------------
// Database: minimal Insert/Update shapes so createClient<Database> gives the
// service layer real (not `never`) argument types for .insert()/.update().
// A generic helper keeps each block to one line instead of three.
// ---------------------------------------------------------------------------
type Table<Row, OmitOnInsert extends keyof Row = never> = {
  Row: Row
  Insert: Omit<Row, OmitOnInsert> & Partial<Pick<Row, OmitOnInsert>>
  Update: Partial<Row>
  Relationships: []
}

export type Database = {
  // Newer @supabase/supabase-js versions key their createClient<Database>
  // generic resolution off this marker (present in real `supabase gen
  // types` output); without it the client silently falls back to an
  // untyped builder and every .insert()/.update() argument resolves to
  // `never`.
  __InternalSupabase: { PostgrestVersion: string }
  public: {
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Tables: {
      clients: Table<Client, "created_at" | "updated_at">
      mandates: Table<Mandate>
      mandate_allocations: Table<MandateAllocation, "id">
      instruments: Table<Instrument>
      instrument_prices: Table<InstrumentPrice, "id">
      portfolios: Table<Portfolio, "created_at" | "updated_at">
      portfolio_snapshots: Table<PortfolioSnapshot>
      holdings: Table<Holding, "id">
      transactions: Table<Transaction>
      credit_facilities: Table<CreditFacility>
      credit_facility_snapshots: Table<CreditFacilitySnapshot>
      commitments: Table<Commitment>
      planned_cash_needs: Table<PlannedCashNeed>
      market_context: Table<MarketContextRow, "id">
      event_log: Table<EventLogRow, "id">
      rm_notes: Table<RmNote, "created_at" | "updated_at">
      insights: Table<Insight, "id" | "created_at" | "updated_at" | "status">
      insight_evidence: Table<InsightEvidence, "id" | "created_at">
      recommendations: Table<
        Recommendation,
        "id" | "created_at" | "updated_at" | "status" | "priority" | "scenario_id" | "is_demo"
      >
      recommendation_events: Table<RecommendationEvent, "id" | "created_at" | "is_demo">
      demo_scenarios: Table<DemoScenarioRow, "id" | "active" | "sort_order" | "created_at">
      scenario_overrides: Table<ScenarioOverride, "id" | "created_at">
      scenario_events: Table<ScenarioEventRow, "id" | "is_hypothetical" | "created_at">
    }
  }
}
