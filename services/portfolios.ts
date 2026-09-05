import { getSupabaseClient } from "@/lib/supabase/server"
import type { Holding, HoldingWithInstrument, Mandate, MandateAllocation, Portfolio, PortfolioSnapshot } from "@/lib/supabase/types"
import { getLatestSnapshotDate } from "./snapshots"

export async function getClientPortfolios(clientId: string): Promise<Portfolio[]> {
  const { data, error } = await getSupabaseClient()
    .from("portfolios")
    .select("*")
    .eq("client_id", clientId)
    .order("portfolio_id", { ascending: true })

  if (error) throw new Error(`getClientPortfolios(${clientId}): ${error.message}`)
  return data as Portfolio[]
}

export async function getPortfolioSnapshots(portfolioId: string): Promise<PortfolioSnapshot[]> {
  const { data, error } = await getSupabaseClient()
    .from("portfolio_snapshots")
    .select("*")
    .eq("portfolio_id", portfolioId)
    .order("snapshot_date", { ascending: true })

  if (error) throw new Error(`getPortfolioSnapshots(${portfolioId}): ${error.message}`)
  return data as PortfolioSnapshot[]
}

/**
 * Every holding across every portfolio a client owns, at a given snapshot
 * date (defaults to the latest available), joined with its instrument.
 */
export async function getClientHoldings(clientId: string, snapshotDate?: string): Promise<HoldingWithInstrument[]> {
  const date = snapshotDate ?? (await getLatestSnapshotDate())

  const { data, error } = await getSupabaseClient()
    .from("holdings")
    .select("*, instrument:instruments(*)")
    .eq("client_id", clientId)
    .eq("snapshot_date", date)
    .order("market_value_usd", { ascending: false })

  if (error) throw new Error(`getClientHoldings(${clientId}): ${error.message}`)
  return data as unknown as HoldingWithInstrument[]
}

export async function getPortfolioHoldings(portfolioId: string, snapshotDate?: string): Promise<HoldingWithInstrument[]> {
  const date = snapshotDate ?? (await getLatestSnapshotDate())

  const { data, error } = await getSupabaseClient()
    .from("holdings")
    .select("*, instrument:instruments(*)")
    .eq("portfolio_id", portfolioId)
    .eq("snapshot_date", date)
    .order("market_value_usd", { ascending: false })

  if (error) throw new Error(`getPortfolioHoldings(${portfolioId}): ${error.message}`)
  return data as unknown as HoldingWithInstrument[]
}

export async function getMandate(mandateCode: string): Promise<Mandate | null> {
  const { data, error } = await getSupabaseClient()
    .from("mandates")
    .select("*")
    .eq("mandate_code", mandateCode)
    .maybeSingle()

  if (error) throw new Error(`getMandate(${mandateCode}): ${error.message}`)
  return data as Mandate | null
}

export async function getMandateAllocations(mandateCode: string): Promise<MandateAllocation[]> {
  const { data, error } = await getSupabaseClient()
    .from("mandate_allocations")
    .select("*")
    .eq("mandate_code", mandateCode)

  if (error) throw new Error(`getMandateAllocations(${mandateCode}): ${error.message}`)
  return data as MandateAllocation[]
}

export async function getAllMandateAllocations(): Promise<MandateAllocation[]> {
  const { data, error } = await getSupabaseClient().from("mandate_allocations").select("*")
  if (error) throw new Error(`getAllMandateAllocations: ${error.message}`)
  return data as MandateAllocation[]
}
