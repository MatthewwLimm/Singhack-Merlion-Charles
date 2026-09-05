// Imports the official dataset (/data/*.csv + rm_notes.json) into Supabase.
// Idempotent: safe to re-run, rows are upserted by their natural key.
// Order matters — parent tables load before the children that reference them.
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { parse } from "csv-parse/sync"
import { sql } from "./db"
import { int, isoDate, meltDateColumns, num, str, ynBool } from "./lib/parse"
import { printReport, upsertBatch, type SeedReport } from "./lib/upsert"

const DATA_DIR = resolve(process.cwd(), "data")

function readCsv(filename: string): Record<string, string>[] {
  const raw = readFileSync(resolve(DATA_DIR, filename), "utf8")
  return parse(raw, { columns: true, skip_empty_lines: true, trim: true })
}

async function main() {
  const reports: SeedReport[] = []
  const run = async <T extends Record<string, unknown>>(
    table: string,
    rows: T[],
    columns: string[],
    conflictCols: string[],
  ) => {
    const report = await upsertBatch(sql, table, rows, columns, conflictCols)
    reports.push(report)
    printReport(report)
  }

  console.log("Seeding from", DATA_DIR)

  // -------------------------------------------------------------------
  // clients
  // -------------------------------------------------------------------
  const clientsCsv = readCsv("clients.csv")
  await run(
    "clients",
    clientsCsv.map((r) => ({
      client_id: r.client_id,
      client_name: r.client_name,
      age: int(r.age),
      gender: str(r.gender),
      nationality: str(r.nationality),
      country_of_residence: str(r.country_of_residence),
      tax_domicile: str(r.tax_domicile),
      booking_centre: str(r.booking_centre),
      rm_id: str(r.rm_id),
      rm_name: str(r.rm_name),
      rm_desk: str(r.rm_desk),
      base_currency: str(r.base_currency),
      wealth_band: str(r.wealth_band),
      total_aum_usd: num(r.total_aum_usd),
      life_stage: str(r.life_stage),
      source_of_wealth: str(r.source_of_wealth),
      risk_profile: str(r.risk_profile),
      risk_tolerance_score: int(r.risk_tolerance_score),
      investment_horizon_years: int(r.investment_horizon_years),
      liquidity_needs: str(r.liquidity_needs),
      objectives: str(r.objectives),
      client_since: isoDate(r.client_since),
      kyc_review_due: isoDate(r.kyc_review_due),
      pep_status: ynBool(r.pep_status),
      reporting_language: str(r.reporting_language),
    })),
    [
      "client_id", "client_name", "age", "gender", "nationality", "country_of_residence",
      "tax_domicile", "booking_centre", "rm_id", "rm_name", "rm_desk", "base_currency",
      "wealth_band", "total_aum_usd", "life_stage", "source_of_wealth", "risk_profile",
      "risk_tolerance_score", "investment_horizon_years", "liquidity_needs", "objectives",
      "client_since", "kyc_review_due", "pep_status", "reporting_language",
    ],
    ["client_id"],
  )

  // -------------------------------------------------------------------
  // mandates + mandate_allocations
  // -------------------------------------------------------------------
  const mandatesCsv = readCsv("mandates.csv")
  const mandatesByCode = new Map<string, { mandate_code: string; mandate_name: string; mandate_notes: string | null }>()
  for (const r of mandatesCsv) {
    if (!mandatesByCode.has(r.mandate_code)) {
      mandatesByCode.set(r.mandate_code, {
        mandate_code: r.mandate_code,
        mandate_name: r.mandate_name,
        mandate_notes: str(r.mandate_notes),
      })
    }
  }
  await run(
    "mandates",
    [...mandatesByCode.values()],
    ["mandate_code", "mandate_name", "mandate_notes"],
    ["mandate_code"],
  )

  await run(
    "mandate_allocations",
    mandatesCsv.map((r) => ({
      mandate_code: r.mandate_code,
      asset_class: r.asset_class,
      min_pct: num(r.min_pct),
      target_pct: num(r.target_pct),
      max_pct: num(r.max_pct),
      max_single_position_pct: num(r.max_single_position_pct),
    })),
    ["mandate_code", "asset_class", "min_pct", "target_pct", "max_pct", "max_single_position_pct"],
    ["mandate_code", "asset_class"],
  )

  // -------------------------------------------------------------------
  // instruments + instrument_prices
  // -------------------------------------------------------------------
  const instrumentsCsv = readCsv("instruments.csv")
  await run(
    "instruments",
    instrumentsCsv.map((r) => ({
      instrument_id: r.instrument_id,
      instrument_name: r.instrument_name,
      asset_class: str(r.asset_class),
      sub_asset_class: str(r.sub_asset_class),
      sector: str(r.sector),
      region: str(r.region),
      currency: str(r.currency),
      liquidity_tier: str(r.liquidity_tier),
      underlying_reference: str(r.underlying_reference),
      sustainability_excluded: ynBool(r.sustainability_excluded),
      concentration_limit_applies: ynBool(r.concentration_limit_applies),
    })),
    [
      "instrument_id", "instrument_name", "asset_class", "sub_asset_class", "sector", "region",
      "currency", "liquidity_tier", "underlying_reference", "sustainability_excluded",
      "concentration_limit_applies",
    ],
    ["instrument_id"],
  )

  const instrumentPriceRows: Record<string, unknown>[] = []
  for (const r of instrumentsCsv) {
    const prices = meltDateColumns(r, "price")
    for (const [snapshot_date, price] of Object.entries(prices)) {
      if (price !== null) instrumentPriceRows.push({ instrument_id: r.instrument_id, snapshot_date, price })
    }
  }
  await run(
    "instrument_prices",
    instrumentPriceRows,
    ["instrument_id", "snapshot_date", "price"],
    ["instrument_id", "snapshot_date"],
  )

  // -------------------------------------------------------------------
  // portfolios + portfolio_snapshots
  // -------------------------------------------------------------------
  const portfoliosCsv = readCsv("portfolios.csv")
  await run(
    "portfolios",
    portfoliosCsv.map((r) => ({
      portfolio_id: r.portfolio_id,
      client_id: r.client_id,
      portfolio_name: r.portfolio_name,
      mandate_code: str(r.mandate_code),
      service_model: str(r.service_model),
      base_currency: str(r.base_currency),
      inception_date: isoDate(r.inception_date),
      benchmark: str(r.benchmark),
      aum_usd_current: num(r.aum_usd_current),
    })),
    [
      "portfolio_id", "client_id", "portfolio_name", "mandate_code", "service_model",
      "base_currency", "inception_date", "benchmark", "aum_usd_current",
    ],
    ["portfolio_id"],
  )

  const portfolioSnapshotRows: Record<string, unknown>[] = []
  for (const r of portfoliosCsv) {
    const aums = meltDateColumns(r, "aum")
    for (const [snapshot_date, aum] of Object.entries(aums)) {
      if (aum !== null) portfolioSnapshotRows.push({ portfolio_id: r.portfolio_id, snapshot_date, aum })
    }
  }
  await run(
    "portfolio_snapshots",
    portfolioSnapshotRows,
    ["portfolio_id", "snapshot_date", "aum"],
    ["portfolio_id", "snapshot_date"],
  )

  // -------------------------------------------------------------------
  // holdings (already long-form in the source)
  // -------------------------------------------------------------------
  const holdingsCsv = readCsv("holdings.csv")
  await run(
    "holdings",
    holdingsCsv.map((r) => ({
      snapshot_date: r.snapshot_date,
      portfolio_id: r.portfolio_id,
      client_id: r.client_id,
      instrument_id: r.instrument_id,
      quantity: num(r.quantity),
      price_local: num(r.price_local),
      market_value_local: num(r.market_value_local),
      portfolio_ccy: str(r.portfolio_ccy),
      market_value_base: num(r.market_value_base),
      market_value_usd: num(r.market_value_usd),
      weight_pct: num(r.weight_pct),
      avg_cost_local: num(r.avg_cost_local),
      cost_basis_base: num(r.cost_basis_base),
      unrealised_pnl_base: num(r.unrealised_pnl_base),
      unrealised_pnl_pct: num(r.unrealised_pnl_pct),
      lending_value_base: num(r.lending_value_base),
      advance_rate_pct: num(r.advance_rate_pct),
      valuation_date: isoDate(r.valuation_date),
      acquired_date: isoDate(r.acquired_date),
    })),
    [
      "snapshot_date", "portfolio_id", "client_id", "instrument_id", "quantity", "price_local",
      "market_value_local", "portfolio_ccy", "market_value_base", "market_value_usd", "weight_pct",
      "avg_cost_local", "cost_basis_base", "unrealised_pnl_base", "unrealised_pnl_pct",
      "lending_value_base", "advance_rate_pct", "valuation_date", "acquired_date",
    ],
    ["portfolio_id", "instrument_id", "snapshot_date"],
  )

  // -------------------------------------------------------------------
  // transactions
  // -------------------------------------------------------------------
  const transactionsCsv = readCsv("transactions.csv")
  await run(
    "transactions",
    transactionsCsv.map((r) => ({
      transaction_id: r.transaction_id,
      trade_date: isoDate(r.trade_date),
      settlement_date: isoDate(r.settlement_date),
      portfolio_id: r.portfolio_id,
      client_id: r.client_id,
      transaction_type: r.transaction_type,
      instrument_id: str(r.instrument_id),
      quantity: num(r.quantity),
      price_local: num(r.price_local),
      currency: str(r.currency),
      amount: num(r.amount),
      narrative: str(r.narrative),
    })),
    [
      "transaction_id", "trade_date", "settlement_date", "portfolio_id", "client_id",
      "transaction_type", "instrument_id", "quantity", "price_local", "currency", "amount", "narrative",
    ],
    ["transaction_id"],
  )

  // -------------------------------------------------------------------
  // credit_facilities + credit_facility_snapshots
  // -------------------------------------------------------------------
  const creditCsv = readCsv("credit_facilities.csv")
  await run(
    "credit_facilities",
    creditCsv.map((r) => ({
      facility_id: r.facility_id,
      client_id: r.client_id,
      collateral_portfolio_id: r.collateral_portfolio_id,
      facility_type: str(r.facility_type),
      facility_ccy: str(r.facility_ccy),
      credit_limit: num(r.credit_limit),
      interest_rate_pct: num(r.interest_rate_pct),
      margin_call_ltv_pct: num(r.margin_call_ltv_pct),
      utilisation_pct_current: num(r.utilisation_pct_current),
    })),
    [
      "facility_id", "client_id", "collateral_portfolio_id", "facility_type", "facility_ccy",
      "credit_limit", "interest_rate_pct", "margin_call_ltv_pct", "utilisation_pct_current",
    ],
    ["facility_id"],
  )

  const creditSnapshotRows: Record<string, unknown>[] = []
  for (const r of creditCsv) {
    const drawn = meltDateColumns(r, "drawn")
    const collateral = meltDateColumns(r, "collateral_market_value")
    const lending = meltDateColumns(r, "lending_value")
    const ltv = meltDateColumns(r, "ltv_pct")
    const headroom = meltDateColumns(r, "headroom")
    for (const snapshot_date of Object.keys(drawn)) {
      creditSnapshotRows.push({
        facility_id: r.facility_id,
        snapshot_date,
        drawn: drawn[snapshot_date],
        collateral_market_value: collateral[snapshot_date] ?? null,
        lending_value: lending[snapshot_date] ?? null,
        ltv_pct: ltv[snapshot_date] ?? null,
        headroom: headroom[snapshot_date] ?? null,
      })
    }
  }
  await run(
    "credit_facility_snapshots",
    creditSnapshotRows,
    ["facility_id", "snapshot_date", "drawn", "collateral_market_value", "lending_value", "ltv_pct", "headroom"],
    ["facility_id", "snapshot_date"],
  )

  // -------------------------------------------------------------------
  // commitments
  // -------------------------------------------------------------------
  const commitmentsCsv = readCsv("commitments.csv")
  await run(
    "commitments",
    commitmentsCsv.map((r) => ({
      commitment_id: r.commitment_id,
      client_id: r.client_id,
      portfolio_id: str(r.portfolio_id),
      fund_name: str(r.fund_name),
      currency: str(r.currency),
      committed: num(r.committed),
      called_to_date: num(r.called_to_date),
      uncalled: num(r.uncalled),
      expected_call_window: str(r.expected_call_window),
    })),
    [
      "commitment_id", "client_id", "portfolio_id", "fund_name", "currency", "committed",
      "called_to_date", "uncalled", "expected_call_window",
    ],
    ["commitment_id"],
  )

  // -------------------------------------------------------------------
  // planned_cash_needs
  // -------------------------------------------------------------------
  const cashNeedsCsv = readCsv("planned_cash_needs.csv")
  await run(
    "planned_cash_needs",
    cashNeedsCsv.map((r) => ({
      need_id: r.need_id,
      client_id: r.client_id,
      description: str(r.description),
      currency: str(r.currency),
      amount: num(r.amount),
      due_from: isoDate(r.due_from),
      due_to: isoDate(r.due_to),
      recurrence: str(r.recurrence),
      certainty: str(r.certainty),
    })),
    ["need_id", "client_id", "description", "currency", "amount", "due_from", "due_to", "recurrence", "certainty"],
    ["need_id"],
  )

  // -------------------------------------------------------------------
  // market_context (already long-form)
  // -------------------------------------------------------------------
  const marketCsv = readCsv("market_context.csv")
  await run(
    "market_context",
    marketCsv.map((r) => ({
      snapshot_date: r.snapshot_date,
      series_id: r.series_id,
      series_name: str(r.series_name),
      category: str(r.category),
      unit: str(r.unit),
      value: num(r.value),
      snapshot_label: str(r.snapshot_label),
    })),
    ["snapshot_date", "series_id", "series_name", "category", "unit", "value", "snapshot_label"],
    ["series_id", "snapshot_date"],
  )

  // -------------------------------------------------------------------
  // event_log (no natural key -> upsert on (event_date, description))
  // -------------------------------------------------------------------
  const eventsCsv = readCsv("event_log.csv")
  await run(
    "event_log",
    eventsCsv.map((r) => ({
      event_date: r.event_date,
      event_type: str(r.event_type),
      region: str(r.region),
      description: r.description,
      primary_transmission: str(r.primary_transmission),
      severity: str(r.severity),
    })),
    ["event_date", "event_type", "region", "description", "primary_transmission", "severity"],
    ["event_date", "description"],
  )

  // -------------------------------------------------------------------
  // rm_notes.json
  // -------------------------------------------------------------------
  const rmNotes = JSON.parse(readFileSync(resolve(DATA_DIR, "rm_notes.json"), "utf8")) as {
    note_id: string
    client_id: string
    note_date: string
    rm_id: string
    rm_name: string
    channel: string
    note: string
  }[]
  await run(
    "rm_notes",
    rmNotes.map((n) => ({
      note_id: n.note_id,
      client_id: n.client_id,
      note_date: n.note_date,
      rm_id: n.rm_id,
      rm_name: n.rm_name,
      channel: n.channel,
      note: n.note,
    })),
    ["note_id", "client_id", "note_date", "rm_id", "rm_name", "channel", "note"],
    ["note_id"],
  )

  // -------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------
  const totalFailures = reports.reduce((acc, r) => acc + r.failures.length, 0)
  console.log("\n" + "=".repeat(60))
  console.log(`Seed complete. ${reports.length} tables processed, ${totalFailures} row failures.`)
  if (totalFailures > 0) {
    console.log("Review the ✗ lines above for details.")
    process.exitCode = 1
  }

  await sql.end()
}

main().catch((err) => {
  console.error("Seed script failed:", err)
  process.exitCode = 1
})
