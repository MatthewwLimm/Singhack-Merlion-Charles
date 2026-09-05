// Runs the deterministic rules engine (services/insight-rules.ts) once for
// every client and persists the results into insights/insight_evidence.
// Not run automatically on every page load — insights have their own
// status lifecycle (OPEN/IN_REVIEW/RESOLVED/DISMISSED) that an RM manages,
// so regenerating on every request would fight their dismissals. Re-run
// this manually (`npm run db:insights`) after the underlying data changes.
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

async function main() {
  const { generateInsightsForAllClients } = await import("../services/insight-rules")
  console.log("Generating rules-based insights for every client...\n")
  const results = await generateInsightsForAllClients()

  let totalCreated = 0
  let totalSkipped = 0
  let totalDismissed = 0
  for (const [clientId, { created, skipped, dismissed }] of Object.entries(results)) {
    console.log(`  ${clientId}: +${created} new, ${skipped} already open, ${dismissed} dismissed as stale`)
    totalCreated += created
    totalSkipped += skipped
    totalDismissed += dismissed
  }

  console.log(`\n✓ Done. ${totalCreated} created, ${totalSkipped} already existed, ${totalDismissed} dismissed as stale.`)
}

main().catch((err) => {
  console.error("generate-insights failed:", err)
  process.exitCode = 1
})
