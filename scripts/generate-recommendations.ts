// Seeds one draft recommendation per open Critical/High severity insight —
// the starting state an RM would find in the Action Queue. Deterministic
// templating from the insight fields, not AI-generated. Idempotent: skips
// insights that already have a recommendation attached.
import "dotenv/config"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

const envLocalPath = resolve(process.cwd(), ".env.local")
if (existsSync(envLocalPath)) {
  for (const line of readFileSync(envLocalPath, "utf8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2]
  }
}

const NEXT_ACTION_BY_TYPE: Record<string, string> = {
  CREDIT_RISK: "Arrange an immediate credit review and identify additional collateral or liquid assets before headroom is exhausted.",
  CONCENTRATION_RISK: "Discuss diversification options to reduce the concentrated exposure.",
  MANDATE_BREACH: "Begin a suitability and mandate review to bring the portfolio back within range.",
  LIQUIDITY_GAP: "Review the liquidity plan against upcoming cash needs and identify a funding source.",
  BEHAVIOURAL_SIGNAL: "Review recent RM notes and adjust communication approach before next contact.",
  LIFE_EVENT: "Plan the portfolio and liquidity position around the upcoming life event.",
  MARKET_EVENT_IMPACT: "Assess portfolio impact of the recent market event and discuss with the client.",
}

async function main() {
  const { getSupabaseClient } = await import("../lib/supabase/server")
  const { createRecommendation } = await import("../services/recommendations")
  const supabase = getSupabaseClient()

  const { data: insights, error } = await supabase
    .from("insights")
    .select("*")
    .eq("status", "OPEN")
    .in("severity", ["Critical", "High"])

  if (error) throw new Error(`fetch insights: ${error.message}`)

  const { data: existing, error: existingError } = await supabase
    .from("recommendations")
    .select("insight_id")
    .not("insight_id", "is", null)
  if (existingError) throw new Error(`fetch existing recommendations: ${existingError.message}`)
  const alreadyCovered = new Set((existing as { insight_id: string | null }[]).map((r) => r.insight_id))

  let created = 0
  let skipped = 0

  for (const insight of insights as { id: string; client_id: string; insight_type: string; severity: string; title: string; summary: string }[]) {
    if (alreadyCovered.has(insight.id)) {
      skipped++
      continue
    }

    await createRecommendation({
      client_id: insight.client_id,
      insight_id: insight.id,
      title: insight.title,
      recommendation: NEXT_ACTION_BY_TYPE[insight.insight_type] ?? "Review this signal with the client.",
      rationale: insight.summary,
      priority: insight.severity === "Critical" ? "Urgent" : "High",
      created_by: "Priscilla Ong",
    })
    created++
  }

  console.log(`✓ Done. ${created} recommendations created, ${skipped} insights already had one.`)
}

main().catch((err) => {
  console.error("generate-recommendations failed:", err)
  process.exitCode = 1
})
