// Small, dependency-free parsing helpers for turning raw CSV strings into
// the types the schema expects. Every helper treats "" as a genuine null
// rather than coercing it to 0 / false / "" — the source dataset uses blank
// cells deliberately (e.g. a fee transaction has no instrument_id).

export function str(v: string | undefined): string | null {
  if (v === undefined) return null
  const trimmed = v.trim()
  return trimmed === "" ? null : trimmed
}

export function num(v: string | undefined): number | null {
  const s = str(v)
  if (s === null) return null
  const n = Number(s)
  if (Number.isNaN(n)) throw new Error(`Expected a number, got "${v}"`)
  return n
}

export function int(v: string | undefined): number | null {
  const n = num(v)
  return n === null ? null : Math.trunc(n)
}

// Dates in the source are always plain YYYY-MM-DD; keep as a string and let
// postgres.js / Postgres cast it to `date`.
export function isoDate(v: string | undefined): string | null {
  return str(v)
}

export function ynBool(v: string | undefined): boolean | null {
  const s = str(v)
  if (s === null) return null
  if (s.toUpperCase() === "Y" || s.toLowerCase() === "yes") return true
  if (s.toUpperCase() === "N" || s.toLowerCase() === "no") return false
  throw new Error(`Expected Y/N or Yes/No, got "${v}"`)
}

/**
 * Pulls every `${prefix}_YYYY-MM-DD` column off a wide CSV row into a
 * { [date]: numericValue } map, e.g. instruments.csv's price_2025-12-31,
 * price_2026-02-27, ... -> instrument_prices rows.
 */
export function meltDateColumns(
  row: Record<string, string>,
  prefix: string,
): Record<string, number | null> {
  const out: Record<string, number | null> = {}
  const re = new RegExp(`^${prefix}_(\\d{4}-\\d{2}-\\d{2})$`)
  for (const [key, value] of Object.entries(row)) {
    const match = key.match(re)
    if (match) out[match[1]] = num(value)
  }
  return out
}
