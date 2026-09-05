import type { Sql } from "postgres"

export interface SeedReport {
  table: string
  attempted: number
  upserted: number
  failures: { row: unknown; error: string }[]
}

/**
 * Batched, idempotent upsert. Column names and conflict targets are always
 * literal arrays defined in this codebase (never derived from CSV cell
 * values), so building the identifier list with template interpolation here
 * is safe.
 */
export async function upsertBatch<T extends Record<string, unknown>>(
  sql: Sql,
  table: string,
  rows: T[],
  columns: string[],
  conflictCols: string[],
  { chunkSize = 500 }: { chunkSize?: number } = {},
): Promise<SeedReport> {
  const report: SeedReport = { table, attempted: rows.length, upserted: 0, failures: [] }
  if (rows.length === 0) return report

  const updatable = columns.filter((c) => !conflictCols.includes(c))
  const updateSet = updatable.map((c) => `"${c}" = excluded."${c}"`).join(", ")
  const conflictTarget = conflictCols.map((c) => `"${c}"`).join(", ")

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    try {
      const valuesFragment = sql(chunk as Record<string, unknown>[], ...columns)
      if (updatable.length > 0) {
        await sql`
          insert into ${sql(table)} ${valuesFragment}
          on conflict (${sql.unsafe(conflictTarget)}) do update set ${sql.unsafe(updateSet)}
        `
      } else {
        await sql`
          insert into ${sql(table)} ${valuesFragment}
          on conflict (${sql.unsafe(conflictTarget)}) do nothing
        `
      }
      report.upserted += chunk.length
    } catch (err) {
      // Fall back to row-by-row for this chunk so one bad row doesn't hide
      // the rest, and we can report exactly which rows failed and why.
      for (const row of chunk) {
        try {
          const valuesFragment = sql([row] as Record<string, unknown>[], ...columns)
          if (updatable.length > 0) {
            await sql`
              insert into ${sql(table)} ${valuesFragment}
              on conflict (${sql.unsafe(conflictTarget)}) do update set ${sql.unsafe(updateSet)}
            `
          } else {
            await sql`
              insert into ${sql(table)} ${valuesFragment}
              on conflict (${sql.unsafe(conflictTarget)}) do nothing
            `
          }
          report.upserted += 1
        } catch (rowErr) {
          report.failures.push({ row, error: rowErr instanceof Error ? rowErr.message : String(rowErr) })
        }
      }
    }
  }

  return report
}

export function printReport(report: SeedReport) {
  const status = report.failures.length ? "⚠" : "✓"
  console.log(
    `  ${status} ${report.table.padEnd(28)} ${String(report.upserted).padStart(5)} / ${String(report.attempted).padStart(5)} upserted`,
  )
  for (const f of report.failures.slice(0, 10)) {
    console.log(`      ✗ ${f.error} — row: ${JSON.stringify(f.row).slice(0, 200)}`)
  }
  if (report.failures.length > 10) {
    console.log(`      ... and ${report.failures.length - 10} more failures`)
  }
}
