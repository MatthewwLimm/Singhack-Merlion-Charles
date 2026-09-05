import type { Client } from "@/lib/supabase/types"
import { getClientById } from "./clients"
import { getClientCreditFacilities, type CreditFacilityWithSnapshots } from "./credit"
import type { InsightWithEvidence } from "./insights"
import { getInsights } from "./insights"
import { getMandate, getMandateAllocations, getClientHoldings, getClientPortfolios } from "./portfolios"
import { getClientCommitments, getClientPlannedCashNeeds } from "./planning"
import { getClientNotes } from "./notes"
import { getRecommendations } from "./recommendations"
import { getClientTransactions } from "./transactions"
import type {
  Commitment,
  HoldingWithInstrument,
  Mandate,
  MandateAllocation,
  PlannedCashNeed,
  Portfolio,
  Recommendation,
  RmNote,
  Transaction,
} from "@/lib/supabase/types"

export interface Client360 {
  client: Client
  portfolios: Portfolio[]
  holdings: HoldingWithInstrument[]
  transactions: Transaction[]
  mandate: Mandate | null
  mandateAllocations: MandateAllocation[]
  creditFacilities: CreditFacilityWithSnapshots[]
  commitments: Commitment[]
  plannedCashNeeds: PlannedCashNeed[]
  rmNotes: RmNote[]
  insights: InsightWithEvidence[]
  recommendations: Recommendation[]
}

/**
 * Single aggregator for the Client 360 screen. Reads from many tables (as
 * expected — Client 360 is a product feature, not a database table) and
 * assembles them into one object. Queries run in parallel; the only
 * sequencing is the mandate lookup, which depends on the client's primary
 * (first) portfolio's mandate_code.
 */
export async function getClient360(clientId: string): Promise<Client360 | null> {
  const client = await getClientById(clientId)
  if (!client) return null

  const [portfolios, holdings, transactions, creditFacilities, commitments, plannedCashNeeds, rmNotes, insights, recommendations] =
    await Promise.all([
      getClientPortfolios(clientId),
      getClientHoldings(clientId),
      getClientTransactions(clientId),
      getClientCreditFacilities(clientId),
      getClientCommitments(clientId),
      getClientPlannedCashNeeds(clientId),
      getClientNotes(clientId),
      getInsights(clientId),
      getRecommendations(clientId),
    ])

  const primaryMandateCode = portfolios[0]?.mandate_code ?? null
  const [mandate, mandateAllocations] = primaryMandateCode
    ? await Promise.all([getMandate(primaryMandateCode), getMandateAllocations(primaryMandateCode)])
    : [null, []]

  return {
    client,
    portfolios,
    holdings,
    transactions,
    mandate,
    mandateAllocations,
    creditFacilities,
    commitments,
    plannedCashNeeds,
    rmNotes,
    insights,
    recommendations,
  }
}
