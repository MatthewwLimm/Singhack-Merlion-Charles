import { getSupabaseClient } from "@/lib/supabase/server"

/**
 * The dataset carries five fixed snapshot dates (2025-12-31, 2026-02-27,
 * 2026-03-31, 2026-06-30, 2026-08-26) shared across holdings, portfolio
 * AUM, instrument prices, credit facility snapshots and market context.
 * Rather than hardcoding "the latest date" anywhere in the app, this reads
 * it from the data itself so the UI stays correct if the dataset grows a
 * new snapshot.
 */
let cachedLatest: string | null = null

export async function getLatestSnapshotDate(): Promise<string> {
  if (cachedLatest) return cachedLatest

  const { data, error } = await getSupabaseClient()
    .from("holdings")
    .select("snapshot_date")
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(`getLatestSnapshotDate: ${error.message}`)
  if (!data) throw new Error("getLatestSnapshotDate: no holdings rows found")

  cachedLatest = data.snapshot_date as string
  return cachedLatest
}

export async function getAllSnapshotDates(): Promise<string[]> {
  const { data, error } = await getSupabaseClient()
    .from("holdings")
    .select("snapshot_date")
    .order("snapshot_date", { ascending: true })

  if (error) throw new Error(`getAllSnapshotDates: ${error.message}`)
  return [...new Set((data as { snapshot_date: string }[]).map((r) => r.snapshot_date))]
}
