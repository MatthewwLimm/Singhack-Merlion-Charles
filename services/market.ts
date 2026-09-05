import { getSupabaseClient } from "@/lib/supabase/server"
import type { EventLogRow, MarketContextRow } from "@/lib/supabase/types"

export async function getRecentEvents(limit = 10): Promise<EventLogRow[]> {
  const { data, error } = await getSupabaseClient()
    .from("event_log")
    .select("*")
    .order("event_date", { ascending: false })
    .limit(limit)

  if (error) throw new Error(`getRecentEvents: ${error.message}`)
  return data as EventLogRow[]
}

export async function getMarketSeries(seriesId: string): Promise<MarketContextRow[]> {
  const { data, error } = await getSupabaseClient()
    .from("market_context")
    .select("*")
    .eq("series_id", seriesId)
    .order("snapshot_date", { ascending: true })

  if (error) throw new Error(`getMarketSeries(${seriesId}): ${error.message}`)
  return data as MarketContextRow[]
}
