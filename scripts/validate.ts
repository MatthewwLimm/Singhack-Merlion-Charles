// Post-seed validation: row counts vs source files, plus explicit orphan
// checks for every FK relationship. Exits non-zero if anything is wrong.
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { parse } from "csv-parse/sync"
import { sql } from "./db"

const DATA_DIR = resolve(process.cwd(), "data")

function csvRowCount(filename: string): number {
  const raw = readFileSync(resolve(DATA_DIR, filename), "utf8")
  return (parse(raw, { columns: true, skip_empty_lines: true, trim: true }) as unknown[]).length
}

async function main() {
  let ok = true

  console.log("Row counts: table vs source file")
  const countChecks: [string, string][] = [
    ["clients", "clients.csv"],
    ["portfolios", "portfolios.csv"],
    ["instruments", "instruments.csv"],
    ["holdings", "holdings.csv"],
    ["transactions", "transactions.csv"],
    ["credit_facilities", "credit_facilities.csv"],
    ["commitments", "commitments.csv"],
    ["planned_cash_needs", "planned_cash_needs.csv"],
    ["market_context", "market_context.csv"],
    ["event_log", "event_log.csv"],
  ]
  for (const [table, file] of countChecks) {
    const expected = csvRowCount(file)
    const [{ count }] = await sql`select count(*)::int as count from ${sql(table)}`
    const match = count === expected
    if (!match) ok = false
    console.log(`  ${match ? "✓" : "✗"} ${table.padEnd(24)} db=${count} source=${expected}`)
  }
  const rmNotes = JSON.parse(readFileSync(resolve(DATA_DIR, "rm_notes.json"), "utf8")) as unknown[]
  const [{ count: noteCount }] = await sql`select count(*)::int as count from rm_notes`
  const notesMatch = noteCount === rmNotes.length
  if (!notesMatch) ok = false
  console.log(`  ${notesMatch ? "✓" : "✗"} rm_notes                 db=${noteCount} source=${rmNotes.length}`)

  console.log("\nOrphan checks (should all be 0)")
  const orphanChecks: [string, string][] = [
    ["portfolios missing client", `select count(*)::int as n from portfolios p left join clients c on c.client_id = p.client_id where c.client_id is null`],
    ["portfolios missing mandate", `select count(*)::int as n from portfolios p left join mandates m on m.mandate_code = p.mandate_code where p.mandate_code is not null and m.mandate_code is null`],
    ["holdings missing portfolio", `select count(*)::int as n from holdings h left join portfolios p on p.portfolio_id = h.portfolio_id where p.portfolio_id is null`],
    ["holdings missing client", `select count(*)::int as n from holdings h left join clients c on c.client_id = h.client_id where c.client_id is null`],
    ["holdings missing instrument", `select count(*)::int as n from holdings h left join instruments i on i.instrument_id = h.instrument_id where i.instrument_id is null`],
    ["transactions missing portfolio", `select count(*)::int as n from transactions t left join portfolios p on p.portfolio_id = t.portfolio_id where p.portfolio_id is null`],
    ["transactions missing client", `select count(*)::int as n from transactions t left join clients c on c.client_id = t.client_id where c.client_id is null`],
    ["transactions with unresolved instrument", `select count(*)::int as n from transactions t left join instruments i on i.instrument_id = t.instrument_id where t.instrument_id is not null and i.instrument_id is null`],
    ["credit_facilities missing client", `select count(*)::int as n from credit_facilities f left join clients c on c.client_id = f.client_id where c.client_id is null`],
    ["credit_facilities missing collateral portfolio", `select count(*)::int as n from credit_facilities f left join portfolios p on p.portfolio_id = f.collateral_portfolio_id where p.portfolio_id is null`],
    ["commitments missing client", `select count(*)::int as n from commitments co left join clients c on c.client_id = co.client_id where c.client_id is null`],
    ["planned_cash_needs missing client", `select count(*)::int as n from planned_cash_needs pc left join clients c on c.client_id = pc.client_id where c.client_id is null`],
    ["rm_notes missing client", `select count(*)::int as n from rm_notes rn left join clients c on c.client_id = rn.client_id where c.client_id is null`],
    ["clients without any portfolio", `select count(*)::int as n from clients c left join portfolios p on p.client_id = c.client_id where p.portfolio_id is null`],
  ]
  for (const [label, query] of orphanChecks) {
    const [{ n }] = await sql.unsafe(query)
    const pass = n === 0
    if (!pass) ok = false
    console.log(`  ${pass ? "✓" : "✗"} ${label}: ${n}`)
  }

  console.log("\n" + (ok ? "✓ All checks passed." : "✗ Some checks failed — see above."))
  process.exitCode = ok ? 0 : 1
  await sql.end()
}

main().catch((err) => {
  console.error("Validation script failed:", err)
  process.exitCode = 1
})
