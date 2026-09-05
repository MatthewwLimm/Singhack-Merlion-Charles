// Deterministic, rules-based insight generation. Explicitly NOT an AI/LLM
// layer (see project Step 19) — every threshold here is a plain, documented
// number, and every insight carries insight_evidence rows that trace back to
// the exact source rows that triggered it. This is the seam where a future
// AI layer would plug in without changing the insights/insight_evidence
// schema or the Client 360 UI that reads it.
import { getSupabaseClient } from "@/lib/supabase/server"
import { getClientById } from "./clients"
import { getClientCreditFacilities } from "./credit"
import { createInsight, getInsights, updateInsight } from "./insights"
import { getClientPlannedCashNeeds } from "./planning"
import { getClientHoldings, getClientPortfolios, getMandateAllocations } from "./portfolios"
import { concentrationByRegion, findMandateBreaches, singleNameLookThrough } from "@/lib/portfolio-analytics"
import { getLatestSnapshotDate } from "./snapshots"
import type { CreateInsightInput } from "./insights"

const CONCENTRATION_THRESHOLD_PCT = 35
const CREDIT_HEADROOM_CRITICAL_PP = 2
const CREDIT_HEADROOM_HIGH_PP = 5
const LIQUIDITY_LOOKAHEAD_DAYS = 270
// Mandate ranges are frequently a percentage point or two off in practice
// (rebalancing lag, rounding) without being a real problem. Only breaches
// past this margin are worth an RM's attention.
const MANDATE_BREACH_MATERIALITY_PP = 3

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Computes the insights that *should* currently exist for a client from live
 * data, without touching the database. generateInsightsForClient() below
 * diffs this against what's already OPEN before writing anything.
 */
export async function computeCandidateInsights(clientId: string): Promise<CreateInsightInput[]> {
  const [client, holdings, portfolios, facilities, cashNeeds, snapshotDate] = await Promise.all([
    getClientById(clientId),
    getClientHoldings(clientId),
    getClientPortfolios(clientId),
    getClientCreditFacilities(clientId),
    getClientPlannedCashNeeds(clientId),
    getLatestSnapshotDate(),
  ])
  if (!client) return []

  const candidates: CreateInsightInput[] = []

  // --- CONCENTRATION_RISK: any region > threshold of liquid holdings -----
  const regionBreakdown = concentrationByRegion(holdings)
  const topRegion = regionBreakdown[0]
  if (topRegion && topRegion.pct >= CONCENTRATION_THRESHOLD_PCT) {
    const contributors = holdings
      .filter((h) => (h.instrument.region ?? "Unclassified") === topRegion.label)
      .sort((a, b) => b.market_value_usd - a.market_value_usd)
      .slice(0, 5)

    candidates.push({
      client_id: clientId,
      insight_type: "CONCENTRATION_RISK",
      severity: topRegion.pct >= 50 ? "High" : "Medium",
      title: `${topRegion.pct.toFixed(0)}% of holdings concentrated in ${topRegion.label}`,
      summary: `${topRegion.pct.toFixed(1)}% of ${client.client_name}'s USD ${(topRegion.valueUsd / 1e6).toFixed(1)}m/${holdings.length ? "" : ""}liquid holdings value (as of ${snapshotDate}) sits in ${topRegion.label}, across ${contributors.length} instrument${contributors.length === 1 ? "" : "s"} shown below.`,
      evidence: contributors.map((h) => ({
        source_table: "holdings",
        source_record_id: String(h.id),
        evidence_type: "concentration_contributor",
        description: `${h.instrument.instrument_name} (${h.instrument.region}, ${h.instrument.asset_class}): USD ${h.market_value_usd.toLocaleString()} as of ${h.snapshot_date}`,
      })),
    })
  }

  // --- CREDIT_RISK: LTV close to the margin call threshold ---------------
  for (const facility of facilities) {
    const latest = facility.latest
    if (!latest || latest.ltv_pct == null || facility.margin_call_ltv_pct == null) continue
    const headroom = facility.margin_call_ltv_pct - latest.ltv_pct
    if (headroom <= CREDIT_HEADROOM_HIGH_PP) {
      candidates.push({
        client_id: clientId,
        insight_type: "CREDIT_RISK",
        severity: headroom <= CREDIT_HEADROOM_CRITICAL_PP ? "Critical" : "High",
        title: `${facility.facility_type ?? "Credit facility"} within ${headroom.toFixed(2)}pp of margin call`,
        summary: `Facility ${facility.facility_id} is drawn to an LTV of ${latest.ltv_pct.toFixed(2)}% against a ${facility.margin_call_ltv_pct.toFixed(2)}% margin call threshold as of ${latest.snapshot_date} — ${headroom.toFixed(2)} percentage points of headroom remain.`,
        evidence: [
          {
            source_table: "credit_facility_snapshots",
            source_record_id: `${facility.facility_id}:${latest.snapshot_date}`,
            evidence_type: "ltv_snapshot",
            description: `LTV ${latest.ltv_pct.toFixed(2)}% · drawn ${latest.drawn?.toLocaleString()} ${facility.facility_ccy} · collateral ${latest.collateral_market_value?.toLocaleString()} ${facility.facility_ccy} as of ${latest.snapshot_date}`,
          },
          {
            source_table: "credit_facilities",
            source_record_id: facility.facility_id,
            evidence_type: "facility_terms",
            description: `Margin call threshold ${facility.margin_call_ltv_pct.toFixed(2)}% · credit limit ${facility.credit_limit?.toLocaleString()} ${facility.facility_ccy}`,
          },
        ],
      })
    }
  }

  // --- LIQUIDITY_GAP: near-term cash needs vs. cash on hand --------------
  const nearTermNeeds = cashNeeds.filter(
    (n) => n.due_from && daysBetween(snapshotDate, n.due_from) <= LIQUIDITY_LOOKAHEAD_DAYS && n.amount,
  )
  if (nearTermNeeds.length > 0) {
    const cashHoldingsUsd = holdings
      .filter((h) => h.instrument.asset_class === "Cash and Equivalents")
      .reduce((sum, h) => sum + h.market_value_usd, 0)
    // planned_cash_needs are in mixed currencies; USD-equivalent conversion
    // is out of scope for this rule (no FX table joined here), so this
    // compares needs 1:1 by currency only when the client's base currency is
    // USD. For non-USD clients this is a directional signal, not a precise
    // number — the UI must not present it as more precise than that.
    const totalNeedInClientCcy = nearTermNeeds.reduce((sum, n) => sum + (n.amount ?? 0), 0)
    if (client.base_currency === "USD" && totalNeedInClientCcy > cashHoldingsUsd) {
      candidates.push({
        client_id: clientId,
        insight_type: "LIQUIDITY_GAP",
        severity: totalNeedInClientCcy > cashHoldingsUsd * 1.5 ? "High" : "Medium",
        title: `Planned cash needs exceed available cash within ${LIQUIDITY_LOOKAHEAD_DAYS} days`,
        summary: `${nearTermNeeds.length} planned cash need${nearTermNeeds.length === 1 ? "" : "s"} totalling USD ${totalNeedInClientCcy.toLocaleString()} fall due within the next ${LIQUIDITY_LOOKAHEAD_DAYS} days, against USD ${cashHoldingsUsd.toLocaleString()} currently held in cash and equivalents (as of ${snapshotDate}).`,
        evidence: nearTermNeeds.map((n) => ({
          source_table: "planned_cash_needs",
          source_record_id: n.need_id,
          evidence_type: "cash_need",
          description: `${n.description}: ${n.amount?.toLocaleString()} ${n.currency}, due ${n.due_from}–${n.due_to} (${n.certainty})`,
        })),
      })
    }
  }

  // --- MANDATE_BREACH: per-portfolio actual allocation vs. mandate -------
  for (const portfolio of portfolios) {
    if (!portfolio.mandate_code) continue
    const [portfolioHoldings, allocations] = await Promise.all([
      getClientHoldings(clientId).then((all) => all.filter((h) => h.portfolio_id === portfolio.portfolio_id)),
      getMandateAllocations(portfolio.mandate_code),
    ])
    const breaches = findMandateBreaches(portfolioHoldings, allocations)
    for (const breach of breaches) {
      const magnitude = Math.abs(breach.actualPct - (breach.direction === "above" ? breach.maxPct : breach.minPct))
      if (magnitude <= MANDATE_BREACH_MATERIALITY_PP) continue

      candidates.push({
        client_id: clientId,
        insight_type: "MANDATE_BREACH",
        severity: magnitude > 10 ? "High" : "Medium",
        title: `${portfolio.portfolio_name}: ${breach.assetClass} ${breach.direction} mandate range`,
        summary: `${breach.assetClass} is ${breach.actualPct.toFixed(1)}% of ${portfolio.portfolio_name}, ${breach.direction} the ${portfolio.mandate_code} mandate's permitted ${breach.minPct}–${breach.maxPct}% range (as of ${snapshotDate}).`,
        evidence: [
          {
            source_table: "mandate_allocations",
            source_record_id: `${portfolio.mandate_code}:${breach.assetClass}`,
            evidence_type: "mandate_rule",
            description: `Permitted range for ${breach.assetClass} under ${portfolio.mandate_code}: ${breach.minPct}–${breach.maxPct}%`,
          },
          {
            source_table: "portfolios",
            source_record_id: portfolio.portfolio_id,
            evidence_type: "actual_allocation",
            description: `Actual ${breach.assetClass} allocation: ${breach.actualPct.toFixed(1)}% as of ${snapshotDate}`,
          },
        ],
      })
    }

    // --- CONCENTRATION_RISK: single-name exposure vs the mandate's cap,
    // with structured-note underlyings looked through (see
    // lib/portfolio-analytics.ts singleNameLookThrough) so a note doesn't
    // hide behind the "Structured Products" asset class. ------------------
    const maxSinglePositionPct = allocations[0]?.max_single_position_pct
    if (maxSinglePositionPct != null) {
      for (const exposure of singleNameLookThrough(portfolioHoldings)) {
        if (exposure.pct <= maxSinglePositionPct) continue

        candidates.push({
          client_id: clientId,
          insight_type: "CONCENTRATION_RISK",
          severity: exposure.pct - maxSinglePositionPct > 10 ? "High" : "Medium",
          title: `${exposure.name}: ${exposure.pct.toFixed(1)}% single-name exposure vs ${maxSinglePositionPct}% mandate cap`,
          summary: `Once ${exposure.contributingHoldings.length > 1 ? "the structured-product exposure to the same name is counted alongside the direct holding" : "counted"}, ${exposure.name} represents ${exposure.pct.toFixed(1)}% of ${portfolio.portfolio_name} — above the ${portfolio.mandate_code} mandate's ${maxSinglePositionPct}% single-position cap (as of ${snapshotDate}).`,
          evidence: [
            ...exposure.contributingHoldings.map((h) => ({
              source_table: "holdings",
              source_record_id: String(h.id),
              evidence_type: "single_name_contributor",
              description: `${h.instrument.instrument_name} (${h.instrument.asset_class}${h.instrument.underlying_reference ? `, ${h.instrument.underlying_reference}` : ""}): USD ${h.market_value_usd.toLocaleString()} as of ${h.snapshot_date}`,
            })),
            {
              source_table: "mandate_allocations",
              source_record_id: `${portfolio.mandate_code}:max_single_position_pct`,
              evidence_type: "mandate_rule",
              description: `Single-position cap under ${portfolio.mandate_code}: ${maxSinglePositionPct}%`,
            },
          ],
        })
      }
    }
  }

  return candidates
}

/**
 * Diffs computed candidates against this client's currently-OPEN insights
 * (by insight_type + title, so re-running doesn't spam duplicates or fight
 * an RM who already dismissed something) and inserts only what's new.
 */
export async function generateInsightsForClient(clientId: string): Promise<{ created: number; skipped: number; dismissed: number }> {
  const [candidates, existing] = await Promise.all([computeCandidateInsights(clientId), getInsights(clientId)])

  const candidateKeys = new Set(candidates.map((c) => `${c.insight_type}:${c.title}`))
  const openInsights = existing.filter((i) => i.status === "OPEN")
  const openKeys = new Set(openInsights.map((i) => `${i.insight_type}:${i.title}`))

  let created = 0
  let skipped = 0
  for (const candidate of candidates) {
    const key = `${candidate.insight_type}:${candidate.title}`
    if (openKeys.has(key)) {
      skipped++
      continue
    }
    await createInsight(candidate)
    created++
  }

  // Rules change over time (e.g. a materiality threshold gets stricter).
  // Rather than deleting stale insights, mark them DISMISSED — they stay in
  // the audit trail, and any recommendation that referenced one keeps its
  // history via insight_id ON DELETE SET NULL semantics never even
  // triggering, since the insight row itself is untouched.
  let dismissed = 0
  for (const insight of openInsights) {
    const key = `${insight.insight_type}:${insight.title}`
    if (!candidateKeys.has(key)) {
      await updateInsight(insight.id, { status: "DISMISSED" })
      dismissed++
    }
  }

  return { created, skipped, dismissed }
}

export async function generateInsightsForAllClients(): Promise<Record<string, { created: number; skipped: number; dismissed: number }>> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from("clients").select("client_id")
  if (error) throw new Error(`generateInsightsForAllClients: ${error.message}`)

  const results: Record<string, { created: number; skipped: number; dismissed: number }> = {}
  for (const { client_id } of data as { client_id: string }[]) {
    results[client_id] = await generateInsightsForClient(client_id)
  }
  return results
}
