// Seeds the 7 curated demo scenarios (see README / the scenario design doc)
// onto real clients already in the database. Idempotent: upserts by
// scenario_code, and only ever inserts is_demo=true rows for the one
// scenario (ADVICE_RESURFACING) that needs staged history.
//
// Uses the direct DATABASE_URL connection (like scripts/seed.ts), not the
// app's anon-key service layer — demo_scenarios is intentionally read-only
// from the app (see the RLS policies), the same treatment as source data.
//
// This script asserts NOTHING about source data — every client_id, note
// reference, and number below is a pointer into data already imported by
// `pnpm db:seed`. Run `pnpm db:seed` and `pnpm db:insights` first.
import { sql } from "./db"

interface ScenarioSeed {
  scenario_code: string
  name: string
  description: string
  client_id: string
  scenario_type: string
  sort_order: number
  narrative: Record<string, string>
}

const SCENARIOS: ScenarioSeed[] = [
  {
    scenario_code: "HIDDEN_CONCENTRATION",
    name: "Hidden Concentration",
    description: "A portfolio that looks diversified by asset class hides a single-name and sector concentration once structured-note underlyings are looked through.",
    client_id: "CL-0013",
    scenario_type: "HIDDEN_CONCENTRATION",
    sort_order: 1,
    narrative: {
      initial_state: "Zhang Meiling's Advisory Growth Portfolio spans Equity, Fixed Income, Alternatives and Structured Products — a normal-looking spread across five asset classes, nothing flagged at a glance.",
      reveal: "Look through the Equity-Linked Note and it references the same name she already holds directly: Helios Cloud Systems. Counted together, that single name is 22.5% of the portfolio — against a 15% single-position cap. Zoom out further and Information Technology as a theme (fund + two single stocks + the note) is close to 57% of her holdings.",
      why_it_matters: "The concentration isn't visible on a standard asset-class breakdown because the note sits under \"Structured Products,\" not \"Equity.\" A technology drawdown would hit the direct stock and the note at the same time — the portfolio has less real diversification than it appears to.",
      action: "Raise the single-position breach and the technology theme concentration together, and propose a way to reduce single-name risk without a wholesale technology exit.",
      personalisation: "RM note N-017: she sees drawdowns as buying opportunities and was dismissive when single-name exposure was raised before — she believes she understands the sector better than the bank. Don't lead with \"sell technology.\" Frame it as protecting optionality and borrowing capacity while keeping her strategic tech view intact.",
      follow_up: "If she declines, the position should stay visible in the Advice Ledger rather than close out — her credit facility (currently comfortable at 20% LTV) is the thing to watch if the concentration keeps growing.",
    },
  },
  {
    scenario_code: "LIQUIDITY_CRUNCH",
    name: "Liquidity Crunch",
    description: "A confirmed HKD 60m obligation is due within 9 months, and most of what looks like a large portfolio turns out not to be quickly sellable.",
    client_id: "CL-0014",
    scenario_type: "LIQUIDITY_CRUNCH",
    sort_order: 2,
    narrative: {
      initial_state: "Lau Chi Ming's relationship value is HKD 184m across two portfolios — on paper, a HKD 60m obligation should be easy to fund.",
      reveal: "A confirmed planned cash need (Mid-Levels redevelopment equity contribution, HKD 60m, due Nov 2026–Jun 2027) sits against a portfolio where direct property, structured notes and pledged collateral make up most of the value. What's actually liquid on short notice is a much smaller slice.",
      why_it_matters: "RM note N-019, after reviewing what's sellable: \"he was surprised how little of it is liquid.\" The same collateral securing his Lombard facility is also the thing he'd need to liquidate — selling it to fund the obligation would also move his LTV, which is already within 0.6pp of the margin-call threshold.",
      action: "Quantify the shortfall precisely (confirmed need vs. genuinely liquid assets) and lay out funding options before the obligation is due, not after.",
      personalisation: "N-018: he remains convinced Hong Kong property turns this year, and has already drawn further on the facility to meet accumulator settlements rather than sell. Present the liquidity gap and the credit headroom together as one decision, not two separate problems.",
      follow_up: "Track against the Jun 2027 due date. If the facility LTV crosses the margin-call line before the property obligation is funded, this becomes a Margin Risk situation on top of a Liquidity one.",
    },
  },
  {
    scenario_code: "MARGIN_RISK",
    name: "Margin / Credit Risk",
    description: "A real market event (the June tech selloff) moved a client's collateral value enough to breach the margin-call LTV — traceable date to date.",
    client_id: "CL-0002",
    scenario_type: "MARGIN_RISK",
    sort_order: 3,
    narrative: {
      initial_state: "Ravi Chandrasekaran's Lombard facility (CF-0001) sat comfortably in the low-60s% LTV through Q1 2026, well inside its 75% margin-call threshold.",
      reveal: "By 30 Jun 2026 the LTV had jumped to 75.64% — briefly through the margin-call line — the same window as the 5 Jun megacap technology selloff (~USD 2 trillion, transmission tagged \"collateralised lending\" in the event log). His collateral is concentrated in exactly that complex: US Technology Leaders Fund, Meridian Semiconductor, Helios Cloud Systems direct and via note.",
      why_it_matters: "RM note N-004, the same week: he was \"agitated about the drop in his technology holdings... and the effect on his collateral value,\" then drew a further USD 1.7m against the facility to fund a pre-IPO secondary — increasing utilisation right as headroom was thinnest. Current LTV is 73.71%, still only 1.29pp from margin call.",
      action: "Review collateral composition and funding headroom now, before the next tech-sector move, rather than reactively during one.",
      personalisation: "He's mid-\"pre-liquidity event\" — avoiding selling any listed position before his secondary sale process closes (expected Q4 2026), which rules out the obvious fix of trimming the technology collateral itself. Frame options around collateral diversification or a facility limit review, not liquidation.",
      follow_up: "Watch the facility LTV against future market-event dates in the event log — this is the cleanest real event → holdings → collateral → LTV chain in the book and worth revisiting whenever a tech-sector event lands.",
    },
  },
  {
    scenario_code: "BEHAVIOURAL_MISMATCH",
    name: "Behavioural Personalisation",
    description: "Two clients with a similar portfolio problem — equity concentration above what suits their stated risk approach — need opposite communication styles.",
    client_id: "CL-0013",
    scenario_type: "BEHAVIOURAL_MISMATCH",
    sort_order: 4,
    narrative: {
      initial_state: "Two open concentration/mandate signals, same underlying shape: equity exposure running ahead of what each client's stated profile implies.",
      reveal: "Zhang Meiling (CL-0013, Growth, single-name tech concentration): RM note N-017 — sees drawdowns as buying opportunities, dismissed the single-name flag, believes she understands the sector better than the bank. Margarethe Voss-Brenner (CL-0003, Conservative, recently inherited, equity above her mandate's range): RM notes N-005/N-006 — still grieving, \"does not understand what is in the portfolio,\" asked for \"something safe and boring.\"",
      why_it_matters: "The same recommendation delivered the same way would land badly for one of them either way — Zhang would disengage from anything that sounds like \"reduce risk,\" Voss-Brenner would be overwhelmed by anything that sounds like an urgent pitch.",
      action: "Two different opening frames for structurally similar portfolio issues.",
      personalisation: "Zhang: lead with protecting optionality and borrowing capacity, present as risk-management for a view she already holds, not a call to sell. Voss-Brenner: slow down, lead with education and control (\"understand together before changing anything\"), avoid technical framing, respect that she asked not to make changes yet.",
      follow_up: "Neither gets the same cadence either — Zhang tolerates (and expects) proactive contact; Voss-Brenner's file should note a lighter-touch, patience-first follow-up rhythm.",
    },
  },
  {
    scenario_code: "MANDATE_BREACH",
    name: "Mandate / Suitability",
    description: "Two commodity-mandate breaches, same asset class, different real cause — one client-directed, one undiscussed drift — needing different handling.",
    client_id: "CL-0007",
    scenario_type: "MANDATE_BREACH",
    sort_order: 5,
    narrative: {
      initial_state: "Two clients on a Balanced mandate (10% commodities ceiling), both materially over it in gold.",
      reveal: "Alistair Pemberton-Hale (CL-0007): 18.9% in gold, and RM note N-010 records that he explicitly instructed the purchase — \"already above the mandate's commodity ceiling before it.\" Elena Marchetti-Wong (CL-0018): gold is now a large overweight that RM note N-024 describes as \"originally sized as a 5% hedge... now materially larger... she has not sold any\" — price appreciation drift, never revisited.",
      why_it_matters: "Same breach type, same asset class, two different classifications: one is a recorded, client-directed decision (a waiver candidate); the other is undiscussed drift that the client may not even realise has happened.",
      action: "Alistair: document the instruction as a formal waiver rather than treat it as an open breach. Elena: this needs an actual conversation — the position has outgrown its original purpose without her noticing.",
      personalisation: "Alistair: confident, monetary-repricing thesis, wants more not less — engage with his view directly. Elena: she's \"pleased\" with a position she hasn't revisited — this is a rebalancing conversation, not a warning.",
      follow_up: "Track both at the next portfolio review; Elena's is the one to prioritise since it's the one nobody has actually discussed with her yet.",
    },
  },
  {
    scenario_code: "ADVICE_RESURFACING",
    name: "Advice Resurfacing",
    description: "A deployment plan deferred twice, exactly as the RM notes describe, with the condition (excess cash) still true today — demonstrating real follow-through.",
    client_id: "CL-0009",
    scenario_type: "ADVICE_RESURFACING",
    sort_order: 6,
    narrative: {
      initial_state: "Andreas Lindqvist has been sitting on excess cash since his 2024 business sale — his Post-Sale Deployment Portfolio is still above its mandate's cash ceiling today.",
      reveal: "RM note N-013: \"second attempt at a deployment plan... agreed the allocation in principle in October 2024 and again in June 2025 but has not executed... waiting for a better entry point.\" Two real deferrals, same reason, and the condition that triggered the advice — excess cash — is still true.",
      why_it_matters: "This isn't a new problem needing a new recommendation; it's the same advice that should never have gone quiet. Treating it as fresh loses the context that he's deferred it twice already.",
      action: "Resurface the existing recommendation rather than draft a new one — the Advice Ledger carries the full history, so the RM opens the conversation already knowing what didn't work last time.",
      personalisation: "\"Waiting for a better entry point\" is the pattern to name directly — show him what the wait has cost, as the RM planned to, rather than re-pitching the same allocation cold.",
      follow_up: "This is the live demonstration of Follow Through: click Resurface on the existing recommendation and it moves back into the Action Queue with its full CREATED → deferred → deferred → resurfaced history intact.",
    },
  },
  {
    scenario_code: "MARKET_EVENT_IMPACT",
    name: "Market Event Impact",
    description: "The Strait of Hormuz closure, traced through to the specific clients, holdings and businesses it actually touches — not a generic \"oil moved\" alert.",
    client_id: "CL-0001",
    scenario_type: "MARKET_EVENT_IMPACT",
    sort_order: 7,
    narrative: {
      initial_state: "2026-03-04, event log: \"Strait of Hormuz effectively closed. Brent surges past USD 120... force majeure on all exports.\" Severity: Severe. Transmission: Energy, LNG, shipping, Gulf credit, airlines.",
      reveal: "Matched against real holdings and RM notes, not a generic sector tag: Hartono Wijaya Kusuma (CL-0001) holds Bara Nusantara Energy — 98% of one portfolio — and subscribed an energy FCN the same week the rally started (N-002). Abdullah Al-Mansoori (CL-0019) runs Gulf logistics and marine chartering personally, holds shipping and energy positions, and his own note says his operating business \"benefits from the same conditions\" as the market move (N-025). Kim Do-Yoon (CL-0015) asked for \"the most aggressive way to express a view that the Middle East situation gets worse\" and subscribed the same day (N-020).",
      why_it_matters: "Three clients, three different exposure paths to the same event — inherited family energy business, an operating business in the affected region, and a deliberate tactical bet. A single \"oil moved\" alert would treat them identically; they need three different conversations.",
      action: "Rank by real exposure size and type, not just sector tag, and route each to the right conversation: risk management for the concentrated inheritance, opportunity confirmation for the correlated operating business, position review for the tactical trade.",
      personalisation: "CL-0001 is early in taking over family treasury duties and explicitly wants this sleeve kept separate from the mine — frame as protecting that separation, not questioning the family business. CL-0019 already sees the correlation himself — validate it and discuss hedging the concentration it creates, don't just tell him what he already knows.",
      follow_up: "CL-0019's own note (N-026) asks what happens to his portfolio if the Strait reopens and normalises — flagged in the system as an open, unmodelled question. The scenario includes exactly one hypothetical projection answering it, clearly labelled as such.",
    },
  },
]

async function main() {
  console.log("Seeding demo scenarios...\n")

  const scenarioIds: Record<string, string> = {}
  for (const s of SCENARIOS) {
    const [row] = await sql<{ id: string }[]>`
      insert into demo_scenarios (scenario_code, name, description, client_id, scenario_type, narrative, sort_order)
      values (${s.scenario_code}, ${s.name}, ${s.description}, ${s.client_id}, ${s.scenario_type}, ${sql.json(s.narrative)}, ${s.sort_order})
      on conflict (scenario_code) do update set
        name = excluded.name,
        description = excluded.description,
        client_id = excluded.client_id,
        scenario_type = excluded.scenario_type,
        narrative = excluded.narrative,
        sort_order = excluded.sort_order
      returning id
    `
    scenarioIds[s.scenario_code] = row.id
    console.log(`  ✓ ${s.scenario_code} -> ${s.client_id}`)
  }

  // -------------------------------------------------------------------
  // ADVICE_RESURFACING: stage the two real-but-unstructured deferrals
  // from RM note N-013 as recommendation_events (is_demo = true, clearly
  // attributed to the note), and set the current recommendation to
  // DEFERRED so the "Resurface" action is a genuine, live click during
  // the demo rather than a pre-baked state.
  // -------------------------------------------------------------------
  const [cashRec] = await sql<{ id: string }[]>`
    select id from recommendations
    where client_id = 'CL-0009' and title ilike '%Cash and Equivalents above mandate range%'
    limit 1
  `

  if (cashRec) {
    const recId = cashRec.id
    const resurfacingScenarioId = scenarioIds["ADVICE_RESURFACING"]

    await sql`update recommendations set scenario_id = ${resurfacingScenarioId} where id = ${recId}`

    const existingDeferrals = await sql<{ id: string }[]>`
      select id from recommendation_events where recommendation_id = ${recId} and is_demo = true
    `

    if (existingDeferrals.length === 0) {
      // created_at is deliberately NOT backdated to Oct 2024 / Jun 2025 —
      // the recommendation row's own created_at is a true system fact (when
      // it was entered into Continuum) and backdating an event before its
      // parent would make the timeline display out of order. The historical
      // framing lives in the note text instead, which is honest about being
      // derived from RM note N-013 rather than a literal source record.
      await sql`
        insert into recommendation_events (recommendation_id, event_type, notes, created_by, is_demo)
        values
          (${recId}, 'CLIENT_DEFERRED', 'Client originally agreed this allocation in principle in October 2024 but did not execute — wanted to wait for a better entry point. (Derived from RM note N-013; no structured event existed in the source data for this date, so it is staged here rather than backdated.)', 'Priscilla Ong', true),
          (${recId}, 'CLIENT_DEFERRED', 'Second attempt in June 2025 — client re-agreed in principle, still waiting for a better entry point. (Derived from RM note N-013.)', 'Priscilla Ong', true)
      `
      console.log("  ✓ ADVICE_RESURFACING: staged 2 historical deferral events on the real cash-deployment recommendation")
    } else {
      console.log("  · ADVICE_RESURFACING: historical deferral events already staged")
    }

    await sql`update recommendations set status = 'DEFERRED' where id = ${recId}`
  } else {
    console.warn("  ! Could not find CL-0009's cash-deployment recommendation — run `pnpm db:recommendations` first.")
  }

  // -------------------------------------------------------------------
  // MARKET_EVENT_IMPACT: the one genuinely hypothetical data point across
  // all 7 scenarios — answering CL-0019's own real question (RM note
  // N-026: "asked what happens ... if the Strait reopens ... we have not
  // modelled this"). is_hypothetical = true throughout.
  // -------------------------------------------------------------------
  const existingHypothetical = await sql<{ id: string }[]>`
    select id from scenario_events where scenario_id = ${scenarioIds["MARKET_EVENT_IMPACT"]} and is_hypothetical = true
  `

  if (existingHypothetical.length === 0) {
    await sql`
      insert into scenario_events (scenario_id, event_type, event_date, description, severity, transmission_channel, is_hypothetical)
      values (
        ${scenarioIds["MARKET_EVENT_IMPACT"]},
        'Hypothetical',
        '2027-01-01',
        ${"What if the Strait of Hormuz reopens and energy/shipping prices normalise? Answering CL-0019's own question from RM note N-026 (\"we have not modelled this\"): his shipping and energy-linked positions, sized for the current elevated-rate environment, would be expected to give back a meaningful share of their gains, while his operating business's own margins would likely normalise in parallel — the portfolio and the business are correlated in both directions, not just the upside."},
        'Medium',
        'Energy, shipping, Gulf credit — reversal case',
        true
      )
    `
    console.log("  ✓ MARKET_EVENT_IMPACT: seeded 1 hypothetical what-if event (answers CL-0019's real N-026 question)")
  } else {
    console.log("  · MARKET_EVENT_IMPACT: hypothetical event already seeded")
  }

  console.log("\n✓ Scenario seed complete.")
  await sql.end()
}

main().catch((err) => {
  console.error("seed-scenarios failed:", err)
  process.exitCode = 1
})
