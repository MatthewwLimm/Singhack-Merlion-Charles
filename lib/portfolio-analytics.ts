// Pure, deterministic calculations over already-fetched holdings data. No DB
// access here on purpose — these are reused by both the Client 360 UI and
// the rules-based insight generator (services/insight-rules.ts), and are
// easy to unit-test in isolation.
import type { HoldingWithInstrument } from "@/lib/supabase/types"

export function totalValueUsd(holdings: HoldingWithInstrument[]): number {
  return holdings.reduce((sum, h) => sum + h.market_value_usd, 0)
}

export interface Breakdown {
  label: string
  valueUsd: number
  pct: number
}

function groupBy(holdings: HoldingWithInstrument[], key: (h: HoldingWithInstrument) => string | null): Breakdown[] {
  const total = totalValueUsd(holdings)
  const buckets = new Map<string, number>()
  for (const h of holdings) {
    const label = key(h) ?? "Unclassified"
    buckets.set(label, (buckets.get(label) ?? 0) + h.market_value_usd)
  }
  return [...buckets.entries()]
    .map(([label, valueUsd]) => ({ label, valueUsd, pct: total > 0 ? (valueUsd / total) * 100 : 0 }))
    .sort((a, b) => b.valueUsd - a.valueUsd)
}

export function allocationByAssetClass(holdings: HoldingWithInstrument[]): Breakdown[] {
  return groupBy(holdings, (h) => h.instrument.asset_class)
}

export function concentrationByRegion(holdings: HoldingWithInstrument[]): Breakdown[] {
  return groupBy(holdings, (h) => h.instrument.region)
}

export function concentrationBySector(holdings: HoldingWithInstrument[]): Breakdown[] {
  return groupBy(holdings, (h) => h.instrument.sector)
}

export function topHoldings(holdings: HoldingWithInstrument[], n = 6): HoldingWithInstrument[] {
  return [...holdings].sort((a, b) => b.market_value_usd - a.market_value_usd).slice(0, n)
}

export interface SingleNameExposure {
  name: string
  lookThroughValueUsd: number
  pct: number
  contributingHoldings: HoldingWithInstrument[]
}

/**
 * Attributes structured-product value back to its underlying name when that
 * name is identifiable, so a single-underlying note doesn't hide behind the
 * "Structured Products" asset class. `underlying_reference` is free text
 * (e.g. "Single underlying: Helios Cloud Systems Inc") — matched against the
 * instrument names already present in this client's own holdings, which is
 * the correct scope for this check: look-through only matters if the client
 * is also (or instead) exposed to that name directly elsewhere in this same
 * portfolio. Multi-name "worst-of" baskets are left attributed to
 * themselves — attributing a basket's value to one of several names would
 * overstate that name's real exposure.
 */
export function singleNameLookThrough(holdings: HoldingWithInstrument[]): SingleNameExposure[] {
  const total = totalValueUsd(holdings)
  const namesInPortfolio = [...new Set(holdings.map((h) => h.instrument.instrument_name))]
  const buckets = new Map<string, { valueUsd: number; holdings: HoldingWithInstrument[] }>()

  for (const h of holdings) {
    let name = h.instrument.instrument_name
    const ref = h.instrument.underlying_reference
    if (ref && !ref.toLowerCase().includes("basket") && !ref.toLowerCase().includes("worst-of")) {
      const matched = namesInPortfolio.find((n) => n !== h.instrument.instrument_name && ref.includes(n))
      if (matched) name = matched
    }
    const entry = buckets.get(name) ?? { valueUsd: 0, holdings: [] }
    entry.valueUsd += h.market_value_usd
    entry.holdings.push(h)
    buckets.set(name, entry)
  }

  return [...buckets.entries()]
    .map(([name, { valueUsd, holdings: hs }]) => ({
      name,
      lookThroughValueUsd: valueUsd,
      pct: total > 0 ? (valueUsd / total) * 100 : 0,
      contributingHoldings: hs,
    }))
    .filter((e) => e.contributingHoldings.length > 1)
    .sort((a, b) => b.lookThroughValueUsd - a.lookThroughValueUsd)
}

export interface MandateBreach {
  assetClass: string
  actualPct: number
  minPct: number
  maxPct: number
  direction: "above" | "below"
}

/** Compares a client's actual allocation against their mandate's permitted ranges. */
export function findMandateBreaches(
  holdings: HoldingWithInstrument[],
  allocations: { asset_class: string; min_pct: number; max_pct: number }[],
): MandateBreach[] {
  const actual = allocationByAssetClass(holdings)
  const actualByClass = new Map(actual.map((b) => [b.label, b.pct]))
  const breaches: MandateBreach[] = []

  for (const rule of allocations) {
    const actualPct = actualByClass.get(rule.asset_class) ?? 0
    if (actualPct > rule.max_pct) {
      breaches.push({ assetClass: rule.asset_class, actualPct, minPct: rule.min_pct, maxPct: rule.max_pct, direction: "above" })
    } else if (actualPct < rule.min_pct) {
      breaches.push({ assetClass: rule.asset_class, actualPct, minPct: rule.min_pct, maxPct: rule.max_pct, direction: "below" })
    }
  }

  return breaches
}
